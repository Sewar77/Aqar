import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";

import type { Prisma } from "../../../../../../generated/prisma/client";
import { propertyCreateDetailsSchema } from "@/modules/properties/create/property-create.validation";


type Context = {
  params: Promise<{
    id: string;
  }>;
};

const idSchema = z.guid();

const dateSchema = z.string().datetime({ offset: true });

const patchSchema = z
  .object({
    expectedUpdatedAt: dateSchema,

    title: z.string().trim().min(3).max(200).optional(),

    description: z.string().trim().max(10000).nullable().optional(),

    internalNotes: z.string().trim().max(10000).nullable().optional(),

    address: z.string().trim().max(500).nullable().optional(),

    latitude: z.number().min(-90).max(90).nullable().optional(),

    longitude: z.number().min(-180).max(180).nullable().optional(),

    areaValue: z.number().positive().nullable().optional(),

    areaUnit: z.enum(["SQUARE_METER", "DUNUM", "OTHER"]).nullable().optional(),

    areaUnitLabel: z.string().trim().max(60).nullable().optional(),

    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),

    details: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

const deleteSchema = z
  .object({
    confirm: z.literal(true),
    confirmTitle: z.string().min(1),

    expectedUpdatedAt: dateSchema,

    expectedContactsCount: z.number().int().min(0),

    expectedOfferingsCount: z.number().int().min(0),

    expectedPhotosCount: z.number().int().min(0),

    expectedChildPropertiesCount: z.number().int().min(0),
  })
  .strict();

function respondError(error: unknown) {
  if (error instanceof ZodError) {
    return Response.json(
      {
        success: false,
        message:
          error.issues
            .slice(0, 3)
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("، ") || "المدخلات غير صحيحة",

        errors: error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2025"
  ) {
    return Response.json(
      {
        success: false,
        message: "تغيّرت بيانات العقار. حدّثي الصفحة وأعيدي المراجعة.",
      },
      { status: 409 },
    );
  }

  console.error("Property details manage error:", error);

  return Response.json(
    {
      success: false,
      message: "تعذّر تنفيذ العملية. تحقّقي من العقار قبل إعادة المحاولة.",
    },
    { status: 500 },
  );
}

function productionGuard() {
  // Replace with an authenticated ADMIN session
  // before enabling production mutations.
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      {
        success: false,
        message:
          "إدارة العقارات غير متاحة في الإنتاج قبل تفعيل تسجيل الدخول وصلاحيات المدير",
      },
      { status: 403 },
    );
  }

  return null;
}

// PATCH /api/properties/:id/manage
export async function PATCH(request: Request, context: Context) {
  const blocked = productionGuard();

  if (blocked) return blocked;

  try {
    const { id } = await context.params;

    idSchema.parse(id);

    const input = patchSchema.parse(await request.json());

    const existing = await prisma.property.findUnique({
      where: { id },

      select: {
        id: true,
        status: true,
        updatedAt: true,
        areaValue: true,
        areaUnit: true,
        areaUnitLabel: true,
      },
    });

    if (!existing) {
      return Response.json(
        {
          success: false,
          message: "العقار غير موجود",
        },
        { status: 404 },
      );
    }

    // Prevent editing a stale copy of the property.
    if (existing.updatedAt.getTime() !== Date.parse(input.expectedUpdatedAt)) {
      return Response.json(
        {
          success: false,
          message: "تغيّر العقار منذ فتح الصفحة. حدّثي الصفحة قبل التعديل.",
        },
        { status: 409 },
      );
    }

    const areaValue =
      input.areaValue === undefined
        ? existing.areaValue == null
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
      return Response.json(
        {
          success: false,
          message: "المساحة ووحدتها مطلوبتان معًا",
        },
        { status: 400 },
      );
    }

    if (areaUnit === "OTHER" && !areaUnitLabel) {
      return Response.json(
        {
          success: false,
          message: "اكتبي اسم وحدة المساحة",
        },
        { status: 400 },
      );
    }

    if (input.details !== undefined) {
      const json = JSON.stringify(input.details);

      if (json.length > 50000) {
        return Response.json(
          {
            success: false,
            message: "تفاصيل العقار كبيرة جدًا",
          },
          { status: 400 },
        );
      }

      // New-form details use the new validator.
      // Older JSON remains readable and editable.
      if (
        "locationDetails" in input.details &&
        "areas" in input.details &&
        "features" in input.details
      ) {
        propertyCreateDetailsSchema.parse(input.details);
      }
    }

    const data: Prisma.PropertyUncheckedUpdateInput = {};

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

    if (input.status !== undefined) {
      data.status = input.status;
    }

    if (input.details !== undefined) {
      data.details = input.details as Prisma.InputJsonValue;
    }

    if (input.areaValue !== undefined || input.areaUnit !== undefined) {
      data.areaInSquareMeters =
        areaValue == null
          ? null
          : areaUnit === "SQUARE_METER"
            ? areaValue
            : areaUnit === "DUNUM"
              ? areaValue * 1000
              : null;
    }

    if (Object.keys(data).length === 0) {
      return Response.json(
        {
          success: false,
          message: "لا توجد تغييرات للحفظ",
        },
        { status: 400 },
      );
    }

    // Batch transaction avoids long interactive
    // transactions on Neon.
    const [updated] = await prisma.$transaction([
      prisma.property.update({
        where: {
          id,
          updatedAt: existing.updatedAt,
        },

        data,

        select: {
          id: true,
          updatedAt: true,
        },
      }),

      prisma.propertyEvent.create({
        data: {
          propertyId: id,

          eventType:
            input.status !== undefined && input.status !== existing.status
              ? "STATUS_CHANGED"
              : "UPDATED",

          title:
            input.status !== undefined && input.status !== existing.status
              ? "تم تغيير حالة العقار"
              : "تم تعديل معلومات العقار",

          description:
            input.status !== undefined && input.status !== existing.status
              ? `${existing.status} → ${input.status}`
              : null,
        },
      }),
    ]);

    return Response.json({
      success: true,
      message: "تم تحديث العقار بنجاح",
      data: updated,
    });
  } catch (error) {
    return respondError(error);
  }
}

// DELETE /api/properties/:id/manage
export async function DELETE(request: Request, context: Context) {
  const blocked = productionGuard();

  if (blocked) return blocked;

  try {
    const { id } = await context.params;

    idSchema.parse(id);

    const input = deleteSchema.parse(await request.json());

    // A single conditional PostgreSQL DELETE.
    // If the user-confirmed snapshot changed,
    // no property is deleted.
    const deleted = await prisma.$queryRaw<{ id: string }[]>`
        DELETE FROM public.properties AS p

        WHERE
          p.id = ${id}::uuid

          AND p.title =
            ${input.confirmTitle}::text

          AND date_trunc(
            'milliseconds',
            p.updated_at
          ) =
          date_trunc(
            'milliseconds',
            ${input.expectedUpdatedAt}::timestamptz
          )

          AND (
            SELECT count(*)
            FROM public.property_contacts AS pc
            WHERE pc.property_id = p.id
          ) = ${input.expectedContactsCount}::integer

          AND (
            SELECT count(*)
            FROM public.property_offerings AS po
            WHERE po.property_id = p.id
          ) = ${input.expectedOfferingsCount}::integer

          AND (
            SELECT count(*)
            FROM public.property_photos AS ph
            WHERE ph.property_id = p.id
          ) = ${input.expectedPhotosCount}::integer

          AND (
            SELECT count(*)
            FROM public.properties AS child
            WHERE child.parent_property_id = p.id
          ) = ${input.expectedChildPropertiesCount}::integer

        RETURNING p.id
      `;

    if (!deleted.length) {
      return Response.json(
        {
          success: false,
          message:
            "لم يتم حذف أي عقار؛ ربما تغيّر الاسم أو البيانات المرتبطة. حدّثي الصفحة وراجعي التأكيد.",
        },
        { status: 409 },
      );
    }

    return Response.json({
      success: true,
      message:
        "تم حذف العقار وسجلاته التابعة من قاعدة البيانات. ملفات Cloudinary تحتاج مراجعة منفصلة.",
    });
  } catch (error) {
    return respondError(error);
  }
}
