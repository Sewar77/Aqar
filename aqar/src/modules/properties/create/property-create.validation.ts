import { z } from "zod";

const uuid = z.guid();
const optionalText = (max = 2000) => z.string().trim().max(max).optional();

const positive = z.number().positive();
const nonnegative = z.number().nonnegative();
const count = z.number().int().min(0).max(1000);
const status = z.enum(["DRAFT", "ACTIVE"]);

const roomSchema = z
  .object({
    nameAr: z.string().trim().min(1).max(80),
    count: z.number().int().min(1).max(200),
    areaSqm: positive.nullable().optional(),
    description: optionalText(600),
  })
  .strict();

const apartmentSchema = z
  .object({
    label: z.string().trim().min(1).max(100),
    areaSqm: positive,
    bedrooms: count,
    bathrooms: count,
    description: optionalText(600),
  })
  .strict();

const floorAreaSchema = z
  .object({
    floor: z.number().int().min(-5).max(200),
    areaSqm: positive,
  })
  .strict();

export const propertyCreateDetailsSchema = z
  .object({
    locationDetails: z
      .object({
        basinName: optionalText(150),
        basinNumber: optionalText(80),
        parcelNumber: optionalText(80),
        googleMapsUrl: z
          .union([z.url().startsWith("https://"), z.literal("")])
          .optional(),
        directions: optionalText(1000),
        landmarks: optionalText(1000),
        nearbyServices: optionalText(1000),
      })
      .strict(),

    areas: z
      .object({
        landAreaSqm: positive.optional(),
        buildingAreaSqm: positive.optional(),
        gardenAreaSqm: nonnegative.optional(),
        roofAreaSqm: nonnegative.optional(),
        frontageMeters: nonnegative.optional(),
        cultivatedAreaSqm: nonnegative.optional(),
      })
      .strict(),

    features: z.array(z.string().trim().min(1).max(90)).max(80),

    rooms: count.optional(),
    bedrooms: count.optional(),
    bathrooms: count.optional(),
    livingRooms: count.optional(),
    kitchens: count.optional(),
    floorNumber: z.number().int().min(-5).max(200).optional(),
    totalFloors: count.optional(),
    apartmentCount: z.number().int().min(0).max(100).optional(),
    buildingAgeYears: count.optional(),
    parkingSpaces: count.optional(),
    treeCount: count.optional(),
    streetWidthMeters: nonnegative.optional(),

    zoning: optionalText(150),
    landUse: optionalText(150),
    condition: optionalText(150),

    roomDetails: z.array(roomSchema).max(60),
    apartments: z.array(apartmentSchema).max(100),
    floorAreas: z.array(floorAreaSchema).max(150),
  })
  .strict();

const locationReference = z.union([
  z
    .object({
      existingId: uuid,
    })
    .strict(),

  z
    .object({
      new: z
        .object({
          nameAr: z.string().trim().min(2).max(120),
        })
        .strict(),
    })
    .strict(),
]);

const phone = z.string().trim().min(7).max(25);

const contactReference = z.union([
  z
    .object({
      existingId: uuid,
    })
    .strict(),

  z
    .object({
      new: z
        .object({
          fullName: z.string().trim().min(2).max(150),
          phone,
          alternativePhone: phone.nullable().optional(),
          notes: z.string().trim().max(2000).nullable().optional(),
        })
        .strict(),
    })
    .strict(),
]);

const contactLink = z
  .object({
    contact: contactReference,
    role: z.enum(["OWNER", "CO_OWNER", "AUTHORIZED_REPRESENTATIVE"]),
    isPrimary: z.boolean(),
    canSharePhone: z.boolean(),
  })
  .strict();

const offering = z
  .object({
    transactionType: z.enum(["SALE", "RENT"]),
    ownerPrice: positive,
    advertisedPrice: positive,
    rentalPeriod: z
      .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "OTHER"])
      .nullable()
      .optional(),
    allowNegotiation: z.boolean(),
    status: z.enum([
      "AVAILABLE",
      "RESERVED",
      "UNDER_NEGOTIATION",
      "SOLD",
      "RENTED",
      "WITHDRAWN",
    ]),
    finalPrice: positive.nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.transactionType === "RENT" && !value.rentalPeriod) {
      ctx.addIssue({
        code: "custom",
        path: ["rentalPeriod"],
        message: "اختاري فترة الإيجار",
      });
    }

    if (value.transactionType === "SALE" && value.rentalPeriod) {
      ctx.addIssue({
        code: "custom",
        path: ["rentalPeriod"],
        message: "فترة الإيجار غير مناسبة للبيع",
      });
    }

    if (value.status === "SOLD" && value.transactionType !== "SALE") {
      ctx.addIssue({
        code: "custom",
        path: ["status"],
        message: "حالة مباع متاحة للبيع فقط",
      });
    }

    if (value.status === "RENTED" && value.transactionType !== "RENT") {
      ctx.addIssue({
        code: "custom",
        path: ["status"],
        message: "حالة مؤجر متاحة للإيجار فقط",
      });
    }

    if (["SOLD", "RENTED"].includes(value.status) && !value.finalPrice) {
      ctx.addIssue({
        code: "custom",
        path: ["finalPrice"],
        message: "السعر النهائي مطلوب عند إغلاق العرض",
      });
    }
  });

export const propertyCreateSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().max(10000).nullable().optional(),
    internalNotes: z.string().trim().max(10000).nullable().optional(),

    typeId: uuid,
    location: locationReference,

    address: z.string().trim().max(500).nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),

    areaValue: positive,
    areaUnit: z.enum(["SQUARE_METER", "DUNUM", "OTHER"]),
    areaUnitLabel: z.string().trim().max(60).nullable().optional(),

    status,
    details: propertyCreateDetailsSchema,

    contacts: z.array(contactLink).min(1).max(30),
    offerings: z.array(offering).min(1).max(2),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.areaUnit === "OTHER" && !value.areaUnitLabel) {
      ctx.addIssue({
        code: "custom",
        path: ["areaUnitLabel"],
        message: "أدخلي وحدة المساحة",
      });
    }

    if (value.contacts.filter((item) => item.isPrimary).length !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["contacts"],
        message: "اختاري جهة اتصال رئيسية واحدة",
      });
    }

    const transactions = value.offerings.map((item) => item.transactionType);

    if (new Set(transactions).size !== transactions.length) {
      ctx.addIssue({
        code: "custom",
        path: ["offerings"],
        message: "لا يمكن تكرار عرض بيع أو إيجار",
      });
    }

    const details = value.details;

    if (
      details.apartmentCount !== undefined &&
      details.apartments.length > 0 &&
      details.apartments.length !== details.apartmentCount
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["details", "apartments"],
        message: "عدد الشقق المدخلة لا يطابق عدد الشقق المحدد",
      });
    }
  });

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
