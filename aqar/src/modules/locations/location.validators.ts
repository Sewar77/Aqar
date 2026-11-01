import { z } from "zod";

export const createLocationSchema = z.object({
  nameAr: z
    .string()
    .trim()
    .min(2, "اسم المنطقة يجب أن يكون حرفين على الأقل")
    .max(120, "اسم المنطقة طويل جدًا"),

  nameEn: z.string().trim().max(120).nullable().optional(),
});

export const updateLocationSchema = createLocationSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "يجب إرسال حقل واحد على الأقل للتعديل",
  );

export const locationListQuerySchema = z.object({
  search: z.string().trim().optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
});
