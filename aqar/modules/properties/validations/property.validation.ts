import { z } from "zod";

export const createPropertySchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().optional(),

  typeId: z.string().uuid(),
  parentPropertyId: z.string().uuid().nullable().optional(),

  city: z.string().trim().min(1),
  address: z.string().trim().optional(),

  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),

  areaValue: z.number().positive().nullable().optional(),
  areaUnit: z.enum(["SQUARE_METER", "DUNUM", "OTHER"]).nullable().optional(),
  areaUnitLabel: z.string().trim().nullable().optional(),

  initialContact: z.object({
    fullName: z.string().trim().min(2),
    phone: z.string().trim().min(5),
    role: z.enum(["OWNER", "CO_OWNER", "AUTHORIZED_REPRESENTATIVE"]),
    isPrimary: z.boolean().optional().default(true),
    canSharePhone: z.boolean().optional().default(false),
  }),

  offering: z.object({
    transactionType: z.enum(["SALE", "RENT"]),
    ownerPrice: z.number().positive(),
    advertisedPrice: z.number().positive(),
    currency: z.string().trim().min(1).default("JOD"),
    rentalPeriod: z
      .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "OTHER"])
      .nullable()
      .optional(),
    allowNegotiation: z.boolean().default(true),
  }),
});

export const updatePropertySchema = z.object({
  title: z.string().trim().min(3).max(150).optional(),
  description: z.string().trim().nullable().optional(),

  typeId: z.string().uuid().optional(),
  parentPropertyId: z.string().uuid().nullable().optional(),

  city: z.string().trim().min(1).optional(),
  address: z.string().trim().nullable().optional(),

  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),

  areaValue: z.number().positive().nullable().optional(),
  areaUnit: z.enum(["SQUARE_METER", "DUNUM", "OTHER"]).nullable().optional(),
  areaUnitLabel: z.string().trim().nullable().optional(),
});

export const propertyIdSchema = z.string().uuid();
