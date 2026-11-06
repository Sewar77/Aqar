import { z } from "zod";
import { paginationQueryFields } from "@/lib/pagination";
export const locationNameSchema = z
  .string()
  .trim()
  .min(2, "اسم المنطقة يجب أن يتكون من حرفين على الأقل")
  .max(120, "اسم المنطقة يجب ألا يتجاوز 120 حرفًا")
  .refine(
    (value) => /[\u0621-\u063A\u0641-\u064A\u066E-\u06D3]/u.test(value),
    "اسم المنطقة يجب أن يحتوي على أحرف عربية",
  )
  .refine(
    (value) => !/[A-Za-z]/u.test(value),
    "اسم المنطقة يجب أن يكون بالعربية فقط",
  )
  .transform((value) => value.replace(/\s+/gu, " ").trim());

export const locationIdSchema = z.guid("معرّف المنطقة غير صالح");

export const createLocationSchema = z
  .object({
    nameAr: locationNameSchema,
  })
  .strict();

export const updateLocationSchema = z
  .object({
    nameAr: locationNameSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(
    (value) => value.nameAr !== undefined || value.isActive !== undefined,
    "يجب إرسال حقل واحد على الأقل للتعديل",
  );

export const locationListQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),

    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),

    ...paginationQueryFields,
  })
  .strict();
export const deleteLocationSchema = z
  .object({
    confirm: z.literal(true),
    confirmName: z.string().trim().min(1),
    deleteRelatedProperties: z.literal(true),
    expectedPropertyCount: z.number().int().min(0),
  })
  .strict();
