import type { Prisma } from "../../../generated/prisma/client";

import { prisma } from "../../lib/prisma";
import { PropertyHttpError } from "./property.error";

import type {
  UpdatePropertyInput,
  UpdateOfferingInput,
} from "./properties.types";

function asObject(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function areaInSquareMeters(
  value: number | null,
  unit: string | null,
): number | null {
  if (value === null || unit === null) return null;

  if (unit === "SQUARE_METER") return value;
  if (unit === "DUNUM") return value * 1000;

  return null;
}

export const propertyEditService = {
  async updateBasic(id: string, input: UpdatePropertyInput) {
    const existing = await prisma.property.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new PropertyHttpError("العقار غير موجود", 404);
    }

    // Complex relationship changes continue using
    // the original property service.
    if (input.contacts !== undefined || input.parentPropertyId !== undefined) {
      throw new PropertyHttpError(
        "هذا المسار مخصص لتعديل البيانات الأساسية",
        400,
      );
    }

    // Validate a changed property type.
    if (input.typeId !== undefined && input.typeId !== existing.typeId) {
      const type = await prisma.propertyType.findUnique({
        where: { id: input.typeId },
        select: { isActive: true },
      });

      if (!type?.isActive) {
        throw new PropertyHttpError("نوع العقار غير موجود أو غير نشط", 400);
      }
    }

    let locationId: string | undefined;

    if (input.location !== undefined) {
      if (!("existingId" in input.location)) {
        throw new PropertyHttpError(
          "إضافة منطقة جديدة من هذا النموذج غير مدعومة",
          400,
        );
      }

      locationId = input.location.existingId;

      if (locationId !== existing.locationId) {
        const location = await prisma.location.findUnique({
          where: { id: locationId },
          select: { isActive: true },
        });

        if (!location?.isActive) {
          throw new PropertyHttpError("المنطقة غير موجودة أو غير نشطة", 400);
        }
      }
    }

    // The current editor only changes extras:
    // basinNumber, parcelNumber, etc.
    // Do not silently overwrite type-specific details.
    if (input.details !== undefined) {
      const current = asObject(existing.details);
      const next = asObject(input.details);

      const keys = new Set([...Object.keys(current), ...Object.keys(next)]);

      for (const key of keys) {
        if (key === "extras") continue;

        if (JSON.stringify(current[key]) !== JSON.stringify(next[key])) {
          throw new PropertyHttpError(
            "لا يمكن تغيير التفاصيل الخاصة بنوع العقار من هذا النموذج",
            400,
          );
        }
      }
    }

    // Avoid reclassifying a property while it still
    // contains details for another property type.
    if (input.typeId !== undefined && input.typeId !== existing.typeId) {
      const savedDetails = asObject(existing.details);

      if (Object.keys(savedDetails).some((key) => key !== "extras")) {
        throw new PropertyHttpError(
          "راجعي تفاصيل العقار الخاصة بنوعه قبل تغيير نوع العقار",
          400,
        );
      }
    }

    const areaValue =
      input.areaValue === undefined
        ? existing.areaValue === null
          ? null
          : Number(existing.areaValue)
        : input.areaValue;

    const areaUnit =
      input.areaUnit === undefined ? existing.areaUnit : input.areaUnit;

    const areaUnitLabel =
      input.areaUnitLabel === undefined
        ? existing.areaUnitLabel
        : input.areaUnitLabel;

    if ((areaValue === null) !== (areaUnit === null)) {
      throw new PropertyHttpError("يجب تحديد المساحة ووحدتها معًا", 400);
    }

    if (areaUnit === "OTHER" && !areaUnitLabel?.trim()) {
      throw new PropertyHttpError("اسم وحدة المساحة مطلوب", 400);
    }

    const data: Prisma.PropertyUpdateInput = {};

    if (input.title !== undefined) {
      data.title = input.title;
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    if (input.internalNotes !== undefined) {
      data.internalNotes = input.internalNotes;
    }

    if (input.address !== undefined) {
      data.address = input.address;
    }

    if (input.latitude !== undefined) {
      data.latitude = input.latitude;
    }

    if (input.longitude !== undefined) {
      data.longitude = input.longitude;
    }

    if (input.areaValue !== undefined) {
      data.areaValue = input.areaValue;
    }

    if (input.areaUnit !== undefined) {
      data.areaUnit = input.areaUnit;
    }

    if (input.areaUnitLabel !== undefined) {
      data.areaUnitLabel = input.areaUnitLabel;
    }

    if (input.areaValue !== undefined || input.areaUnit !== undefined) {
      data.areaInSquareMeters = areaInSquareMeters(areaValue, areaUnit);
    }

    if (input.status !== undefined) {
      data.status = input.status;
    }

    if (input.typeId !== undefined) {
      data.type = {
        connect: { id: input.typeId },
      };
    }

    if (locationId !== undefined) {
      data.location = {
        connect: { id: locationId },
      };
    }

    if (input.details !== undefined) {
      data.details = input.details as Prisma.InputJsonValue;
    }

    const events: Prisma.PropertyEventCreateWithoutPropertyInput[] = [
      {
        eventType: "UPDATED",
        title: "تم تحديث بيانات العقار",
      },
    ];

    if (input.status !== undefined && input.status !== existing.status) {
      events.push({
        eventType: "STATUS_CHANGED",
        title: "تم تغيير حالة العقار",
        description: `${existing.status} → ${input.status}`,
      });
    }

    // The property update and events are atomic.
    // No interactive transaction callback.
    const updated = await prisma.property.update({
      where: { id },
      data: {
        ...data,
        events: {
          create: events,
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      },
    });

    return updated;
  },

  async updateOffering(
    propertyId: string,
    offeringId: string,
    input: UpdateOfferingInput,
  ) {
    const old = await prisma.propertyOffering.findFirst({
      where: {
        id: offeringId,
        propertyId,
      },
    });

    if (!old) {
      throw new PropertyHttpError("عرض العقار غير موجود", 404);
    }

    const rentalPeriod =
      input.rentalPeriod === undefined ? old.rentalPeriod : input.rentalPeriod;

    if (old.transactionType === "RENT" && !rentalPeriod) {
      throw new PropertyHttpError("فترة الإيجار مطلوبة", 400);
    }

    if (old.transactionType === "SALE" && rentalPeriod) {
      throw new PropertyHttpError("عرض البيع لا يحتاج فترة إيجار", 400);
    }

    const nextStatus = input.status ?? old.status;

    if (nextStatus === "SOLD" && old.transactionType !== "SALE") {
      throw new PropertyHttpError("لا يمكن تسجيل بيع لعرض إيجار", 400);
    }

    if (nextStatus === "RENTED" && old.transactionType !== "RENT") {
      throw new PropertyHttpError("لا يمكن تسجيل تأجير لعرض بيع", 400);
    }

    const finalPrice =
      input.finalPrice === undefined ? old.finalPrice : input.finalPrice;

    const closed = nextStatus === "SOLD" || nextStatus === "RENTED";

    if (closed && (finalPrice === null || Number(finalPrice) <= 0)) {
      throw new PropertyHttpError("السعر النهائي مطلوب لإتمام الصفقة", 400);
    }

    const data: Prisma.PropertyOfferingUpdateWithoutPropertyInput = {};

    if (input.ownerPrice !== undefined) {
      data.ownerPrice = input.ownerPrice;
    }

    if (input.advertisedPrice !== undefined) {
      data.advertisedPrice = input.advertisedPrice;
    }

    if (input.finalPrice !== undefined) {
      data.finalPrice = input.finalPrice;
    }

    if (input.rentalPeriod !== undefined) {
      data.rentalPeriod = input.rentalPeriod;
    }

    if (input.allowNegotiation !== undefined) {
      data.allowNegotiation = input.allowNegotiation;
    }

    if (input.notes !== undefined) {
      data.notes = input.notes;
    }

    if (input.status !== undefined) {
      data.status = input.status;

      data.closedAt = closed ? (old.closedAt ?? new Date()) : null;
    }

    const priceChanged =
      (input.ownerPrice !== undefined &&
        Number(old.ownerPrice) !== input.ownerPrice) ||
      (input.advertisedPrice !== undefined &&
        Number(old.advertisedPrice) !== input.advertisedPrice);

    const statusChanged =
      input.status !== undefined && input.status !== old.status;

    const events: Prisma.PropertyEventCreateWithoutPropertyInput[] = [];

    if (priceChanged) {
      events.push({
        eventType: "PRICE_CHANGED",
        title: "تم تعديل سعر العقار",
        description: "تم تحديث أسعار العرض",
        oldPrice: old.advertisedPrice,
        newPrice: input.advertisedPrice ?? old.advertisedPrice,
      });
    }

    if (statusChanged) {
      events.push({
        eventType: "STATUS_CHANGED",
        title: "تم تغيير حالة العرض",
        description: `${old.status} → ${nextStatus}`,
      });
    }

    // Update the related offering and create its
    // audit events in ONE nested write.
    const result = await prisma.property.update({
      where: { id: propertyId },
      data: {
        offerings: {
          update: {
            where: { id: offeringId },
            data,
          },
        },
        ...(events.length > 0
          ? {
              events: {
                create: events,
              },
            }
          : {}),
      },
      select: {
        offerings: {
          where: { id: offeringId },
          take: 1,
        },
      },
    });

    const updated = result.offerings[0];

    if (!updated) {
      throw new PropertyHttpError("تعذّر العثور على العرض بعد تحديثه", 404);
    }

    return updated;
  },
};
