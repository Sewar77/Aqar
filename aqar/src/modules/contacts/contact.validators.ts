import { z } from "zod";
import { paginationQueryFields } from "@/lib/pagination";
function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

const phoneSchema = z
  .string()
  .trim()
  .transform((value) => normalizeDigits(value).replace(/[\s().-]/g, ""))
  .refine((value) => /^\+?[0-9]+$/.test(value), "رقم الهاتف غير صالح")
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }, "رقم الهاتف يجب أن يحتوي على 7 إلى 15 رقمًا");

const optionalPhoneSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  phoneSchema.nullable().optional(),
);

const notesSchema = z
  .string()
  .trim()
  .max(2000, "الملاحظات طويلة جدًا")
  .nullable()
  .optional();

export const contactIdSchema = z.guid();

export const createContactSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "الاسم يجب أن يحتوي على حرفين على الأقل")
      .max(150, "الاسم طويل جدًا")
      .transform((value) => value.replace(/\s+/g, " ")),

    phone: phoneSchema,
    alternativePhone: optionalPhoneSchema,
    notes: notesSchema,
  })
  .strict();

export const updateContactSchema = createContactSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "يجب إدخال تعديل واحد على الأقل",
  );

export const contactListQuerySchema = z
  .object({
    search: z.string().trim().max(150).optional(),

    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),

    ...paginationQueryFields,
  })
  .strict();

export const deleteContactSchema = z
  .object({
    confirm: z.literal(true),
    confirmName: z.string().trim(),
    deleteRelatedProperties: z.literal(true),

    expectedPropertyIds: z
      .array(z.guid())
      .max(5000)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "قائمة العقارات تحتوي على تكرار",
      ),
  })
  .strict();
