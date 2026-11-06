import { prisma } from "@/lib/prisma";

import type { PropertyCreateInput } from "./property-create.validation";
import { Prisma } from "../../../../generated/prisma/browser";

export class PropertyCreateError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = "PropertyCreateError";
  }
}

type Tx = Prisma.TransactionClient;

function formatPhone(value: string) {
  const converted = value
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/[\s().-]/g, "");

  if (!/^\+?[0-9]{7,15}$/.test(converted)) {
    throw new PropertyCreateError("رقم الهاتف غير صحيح");
  }

  return converted;
}

async function resolveLocation(tx: Tx, input: PropertyCreateInput["location"]) {
  if ("existingId" in input) {
    const row = await tx.location.findUnique({
      where: { id: input.existingId },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!row?.isActive) {
      throw new PropertyCreateError("المنطقة غير موجودة أو مؤرشفة");
    }

    return row.id;
  }

  const duplicated = await tx.$queryRaw<{ id: string }[]>`
    SELECT id
    FROM public.locations
    WHERE public.aqar_normalize_location_name(name_ar)
      = public.aqar_normalize_location_name(
        ${input.new.nameAr}::text
      )
    LIMIT 1
  `;

  if (duplicated.length) {
    throw new PropertyCreateError(
      "المنطقة مسجلة مسبقًا، اختاريها من القائمة",
      409,
    );
  }

  const created = await tx.location.create({
    data: {
      nameAr: input.new.nameAr,
    },
  });

  return created.id;
}

async function resolveContact(
  tx: Tx,
  reference: PropertyCreateInput["contacts"][number]["contact"],
) {
  if ("existingId" in reference) {
    const contact = await tx.contact.findUnique({
      where: { id: reference.existingId },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!contact?.isActive) {
      throw new PropertyCreateError("جهة الاتصال غير موجودة أو مؤرشفة");
    }

    return contact.id;
  }

  const phone = formatPhone(reference.new.phone);

  const alternativePhone = reference.new.alternativePhone
    ? formatPhone(reference.new.alternativePhone)
    : null;

  if (alternativePhone === phone) {
    throw new PropertyCreateError("رقم الهاتف الإضافي مطابق للرقم الأساسي");
  }

  const duplicated = await tx.$queryRaw<{ id: string }[]>`
    SELECT id
    FROM public.contacts
    WHERE public.aqar_normalize_phone(phone)
      = public.aqar_normalize_phone(${phone}::text)
    LIMIT 1
  `;

  if (duplicated.length) {
    throw new PropertyCreateError(
      "رقم المالك مسجل مسبقًا، اختاريه من القائمة",
      409,
    );
  }

  const created = await tx.contact.create({
    data: {
      fullName: reference.new.fullName,
      phone,
      alternativePhone,
      notes: reference.new.notes ?? null,
    },
    select: {
      id: true,
    },
  });

  return created.id;
}

export const propertyCreateService = {
  async create(input: PropertyCreateInput): Promise<{ id: string }> {
    // All database writes use one transaction.
    // Do not automatically retry after connection errors.
    return prisma.$transaction(
      async (tx) => {
        const type = await tx.propertyType.findUnique({
          where: { id: input.typeId },
          select: {
            code: true,
            isActive: true,
          },
        });

        if (!type?.isActive) {
          throw new PropertyCreateError("نوع العقار غير موجود أو غير نشط");
        }

        const code = type.code.toUpperCase();
        const details = input.details;

        if (
          code === "BUILDING" &&
          input.status === "ACTIVE" &&
          (!details.apartmentCount ||
            details.apartments.length !== details.apartmentCount)
        ) {
          throw new PropertyCreateError(
            "أدخلي عدد الشقق وتفاصيل مساحة كل شقة قبل تفعيل العمارة",
          );
        }

        if (
          code !== "BUILDING" &&
          code !== "OTHER" &&
          details.apartments.length > 0
        ) {
          throw new PropertyCreateError(
            "تفاصيل شقق العمارة غير مناسبة لنوع العقار",
          );
        }

        if (
          !["HOUSE", "APARTMENT", "BUILDING", "COMMERCIAL", "OTHER"].includes(
            code,
          ) &&
          details.roomDetails.length > 0
        ) {
          throw new PropertyCreateError("تفاصيل الغرف غير مناسبة لنوع العقار");
        }

        const locationId = await resolveLocation(tx, input.location);

        const sequence = await tx.propertyCodeCounter.create({
          data: {},
        });

        const propertyCode = `AQ-${String(sequence.id).padStart(5, "0")}`;

        const property = await tx.property.create({
          data: {
            propertyCode,
            title: input.title,
            description: input.description ?? null,
            internalNotes: input.internalNotes ?? null,

            typeId: input.typeId,
            locationId,

            address: input.address ?? null,
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,

            areaValue: input.areaValue,
            areaUnit: input.areaUnit,
            areaUnitLabel: input.areaUnitLabel ?? null,

            areaInSquareMeters:
              input.areaUnit === "SQUARE_METER"
                ? input.areaValue
                : input.areaUnit === "DUNUM"
                  ? input.areaValue * 1000
                  : null,

            status: input.status,
            details: input.details as Prisma.InputJsonValue,
          },
          select: {
            id: true,
          },
        });

        const links = new Set<string>();

        for (const link of input.contacts) {
          const contactId = await resolveContact(tx, link.contact);

          const key = `${contactId}:${link.role}`;

          if (links.has(key)) {
            throw new PropertyCreateError("تم اختيار نفس المالك والدور مرتين");
          }

          links.add(key);

          await tx.propertyContact.create({
            data: {
              propertyId: property.id,
              contactId,
              role: link.role,
              isPrimary: link.isPrimary,
              canSharePhone: link.canSharePhone,
            },
          });
        }

        for (const offer of input.offerings) {
          const isClosed = offer.status === "SOLD" || offer.status === "RENTED";

          await tx.propertyOffering.create({
            data: {
              propertyId: property.id,
              transactionType: offer.transactionType,

              ownerPrice: offer.ownerPrice,
              advertisedPrice: offer.advertisedPrice,

              finalPrice: isClosed ? offer.finalPrice : null,

              currency: "JOD",

              rentalPeriod:
                offer.transactionType === "RENT" ? offer.rentalPeriod : null,

              allowNegotiation: offer.allowNegotiation,
              status: offer.status,
              closedAt: isClosed ? new Date() : null,
              notes: offer.notes ?? null,
            },
          });
        }

        await tx.propertyEvent.create({
          data: {
            propertyId: property.id,
            eventType: "CREATED",
            title: "تم تسجيل العقار",
          },
        });

        return {
          id: property.id,
        };
      },
      {
        maxWait: 15000,
        timeout: 45000,
      },
    );
  },
};
