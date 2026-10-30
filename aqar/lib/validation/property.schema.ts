import { z } from "zod";

export const createPropertySchema = z.object({
  title: z.string().trim().min(3).max(150),

  description: z.string().trim().optional(),

  typeId: z.string().uuid(),

  city: z.string().trim().min(2),

  address: z.string().trim().optional(),

  latitude: z.number().min(-90).max(90).optional(),

  longitude: z.number().min(-180).max(180).optional(),

  areaValue: z.number().positive().optional(),

  areaUnit: z.enum(["SQUARE_METER", "DUNUM", "OTHER"]).optional(),

  areaUnitLabel: z.string().optional(),

  transactionType: z.enum(["SALE", "RENT"]),

  ownerPrice: z.number().positive(),

  advertisedPrice: z.number().positive(),

  rentalPeriod: z
    .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "OTHER"])
    .optional(),

  allowNegotiation: z.boolean().default(true),

  contact: z.object({
    fullName: z.string().trim().min(2),
    phone: z.string().trim().min(5),
    alternativePhone: z.string().trim().optional(),
    role: z.enum(["OWNER", "CO_OWNER", "AUTHORIZED_REPRESENTATIVE"]),
  }),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
