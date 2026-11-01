import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .min(7, "رقم الهاتف قصير جدًا")
  .max(25, "رقم الهاتف طويل جدًا")
  .regex(/^\+?[0-9][0-9\s().-]*$/, "صيغة رقم الهاتف غير صحيحة");

export const createContactSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "الاسم يجب أن يكون حرفين على الأقل")
      .max(150, "الاسم طويل جدًا"),

    phone: phoneSchema,

    alternativePhone: phoneSchema.nullable().optional(),

    email: z.email("البريد الإلكتروني غير صالح").trim().nullable().optional(),

    notes: z
      .string()
      .trim()
      .max(2000, "الملاحظات طويلة جدًا")
      .nullable()
      .optional(),
  })
  .strict();

export const updateContactSchema = createContactSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "يجب إرسال حقل واحد على الأقل للتعديل",
  );

export const contactListQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),
});
