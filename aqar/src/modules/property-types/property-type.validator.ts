import { z } from "zod";

export const createPropertyTypeSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .regex(
        /^[A-Z][A-Z0-9_]*$/,
        "الكود يجب أن يحتوي على أحرف إنجليزية كبيرة وأرقام وشرطة سفلية فقط",
      ),

    nameAr: z
      .string()
      .trim()
      .min(2, "اسم النوع يجب أن يكون حرفين على الأقل")
      .max(120),

    nameEn: z.string().trim().max(120).nullable().optional(),
  })
  .strict();

export const updatePropertyTypeSchema = z
  .object({
    nameAr: z.string().trim().min(2).max(120).optional(),
    nameEn: z.string().trim().max(120).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "يجب إرسال حقل واحد على الأقل للتعديل",
  );

export const propertyTypeListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),

  isActive: z
    .enum(["true", "false"])
    .transform((value) => (value === undefined ? undefined : value === "true"))
    .optional(),
});
