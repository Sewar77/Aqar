import { z } from "zod";

// A reusable UUID validator.
// All primary IDs in our schema use UUID.
const uuid = z.uuid();

// A reusable helper for optional text fields.
// The caller may omit the field or explicitly send null.
const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional();

// --------------------------------------------------
// Location: choose existing OR create new
// --------------------------------------------------

const newLocationSchema = z
  .object({
    nameAr: z.string().trim().min(2).max(120),
    nameEn: optionalText(120),
    notes: optionalText(1000),
  })
  .strict();

export const locationReferenceSchema = z.union([
  z
    .object({
      existingId: uuid,
    })
    .strict(),

  z
    .object({
      new: newLocationSchema,
    })
    .strict(),
]);

// --------------------------------------------------
// Contact: choose existing OR create new
// --------------------------------------------------

const newContactSchema = z
  .object({
    fullName: z.string().trim().min(2).max(160),
    phone: z.string().trim().min(7).max(25),
    alternativePhone: optionalText(25),
    email: z.email().nullable().optional(),
    notes: optionalText(2000),
  })
  .strict();

const contactReferenceSchema = z.union([
  z
    .object({
      existingId: uuid,
    })
    .strict(),

  z
    .object({
      new: newContactSchema,
    })
    .strict(),
]);

const contactLinkSchema = z
  .object({
    contact: contactReferenceSchema,

    role: z.enum(["OWNER", "CO_OWNER", "AUTHORIZED_REPRESENTATIVE"]),

    isPrimary: z.boolean().default(false),
    canSharePhone: z.boolean().default(false),
  })
  .strict();

// --------------------------------------------------
// Property details stored in JSON
// --------------------------------------------------

export const propertyDetailsSchema = z
  .object({
    // Rooms and residential information
    rooms: z.number().int().min(0).optional(),
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.number().int().min(0).optional(),
    livingRooms: z.number().int().min(0).optional(),
    kitchens: z.number().int().min(0).optional(),

    floorNumber: z.number().int().optional(),
    totalFloors: z.number().int().min(0).optional(),
    buildingAgeYears: z.number().int().min(0).optional(),
    buildingAreaSqm: z.number().positive().optional(),

    apartmentCount: z.number().int().min(0).optional(),
    parkingSpaces: z.number().int().min(0).optional(),

    hasElevator: z.boolean().optional(),
    hasParking: z.boolean().optional(),
    isFurnished: z.boolean().optional(),
    hasBalcony: z.boolean().optional(),

    condition: z.string().trim().max(120).optional(),

    // Land information
    zoning: z.string().trim().max(160).optional(),
    landUse: z.string().trim().max(160).optional(),
    streetWidthMeters: z.number().min(0).optional(),
    frontageMeters: z.number().min(0).optional(),

    availableServices: z
      .array(z.string().trim().min(1).max(100))
      .max(30)
      .optional(),

    // Farm information
    treeCount: z.number().int().min(0).optional(),
    hasWaterWell: z.boolean().optional(),

    // Flexible extra information:
    // extras: { basinNumber: "12", parcelNumber: "156" }
    extras: z.record(z.string(), z.string().max(500)).optional(),
  })
  .strict();

// --------------------------------------------------
// Sale / Rent offering
// --------------------------------------------------

const offeringBaseSchema = z
  .object({
    transactionType: z.enum(["SALE", "RENT"]),

    // Internal owner asking price
    ownerPrice: z.number().positive(),

    // Price used in advertisements
    advertisedPrice: z.number().positive(),

    rentalPeriod: z
      .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "OTHER"])
      .nullable()
      .optional(),

    allowNegotiation: z.boolean().default(true),
    notes: optionalText(2000),
  })
  .strict();

export const createOfferingSchema = offeringBaseSchema.superRefine(
  (value, ctx) => {
    // Business rule: rental offers need a period.
    if (value.transactionType === "RENT" && !value.rentalPeriod) {
      ctx.addIssue({
        code: "custom",
        path: ["rentalPeriod"],
        message: "Rental period is required for RENT.",
      });
    }

    // A sale does not have a rental period.
    if (value.transactionType === "SALE" && value.rentalPeriod) {
      ctx.addIssue({
        code: "custom",
        path: ["rentalPeriod"],
        message: "SALE cannot have a rental period.",
      });
    }
  },
);

export const updateOfferingSchema = offeringBaseSchema
  .omit({ transactionType: true })
  .partial()
  .extend({
    status: z
      .enum([
        "AVAILABLE",
        "RESERVED",
        "UNDER_NEGOTIATION",
        "SOLD",
        "RENTED",
        "WITHDRAWN",
      ])
      .optional(),

    finalPrice: z.number().positive().nullable().optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required.",
  );

// --------------------------------------------------
// Shared Property fields
// --------------------------------------------------

const basePropertySchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: optionalText(10000),
  internalNotes: optionalText(10000),

  // Must refer to an existing PropertyType.
  typeId: uuid,

  // User may choose an existing location or add a new one.
  location: locationReferenceSchema,

  address: optionalText(500),

  latitude: z.number().min(-90).max(90).nullable().optional(),

  longitude: z.number().min(-180).max(180).nullable().optional(),

  areaValue: z.number().positive().nullable().optional(),

  areaUnit: z.enum(["SQUARE_METER", "DUNUM", "OTHER"]).nullable().optional(),

  areaUnitLabel: optionalText(60),

  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),

  parentPropertyId: uuid.nullable().optional(),

  details: propertyDetailsSchema.optional(),
});

// --------------------------------------------------
// Cross-field validation
// --------------------------------------------------

function validateArea(
  input: {
    areaValue?: number | null;
    areaUnit?: string | null;
    areaUnitLabel?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  // Either both value and unit exist, or both are absent.
  if ((input.areaValue == null) !== (input.areaUnit == null)) {
    ctx.addIssue({
      code: "custom",
      path: ["areaValue"],
      message: "Area value and unit are required together.",
    });
  }

  if (input.areaUnit === "OTHER" && !input.areaUnitLabel) {
    ctx.addIssue({
      code: "custom",
      path: ["areaUnitLabel"],
      message: "Custom area unit requires a label.",
    });
  }
}

function validateContacts(
  contacts: z.infer<typeof contactLinkSchema>[],
  ctx: z.RefinementCtx,
) {
  const primaryCount = contacts.filter((contact) => contact.isPrimary).length;

  if (primaryCount > 1) {
    ctx.addIssue({
      code: "custom",
      path: ["contacts"],
      message: "Only one primary contact is allowed.",
    });
  }
}

// --------------------------------------------------
// CREATE Property
// --------------------------------------------------

export const createPropertySchema = basePropertySchema
  .extend({
    // Your client's requirement: at least one contact.
    contacts: z.array(contactLinkSchema).min(1).max(30),

    // At least one SALE or RENT offering.
    offerings: z.array(createOfferingSchema).min(1).max(2),
  })
  .strict()
  .superRefine((input, ctx) => {
    validateArea(input, ctx);
    validateContacts(input.contacts, ctx);

    const transactionTypes = input.offerings.map(
      (offering) => offering.transactionType,
    );

    // No duplicate SALE or RENT offerings.
    if (new Set(transactionTypes).size !== transactionTypes.length) {
      ctx.addIssue({
        code: "custom",
        path: ["offerings"],
        message: "Only one offering per transaction type.",
      });
    }
  });

// --------------------------------------------------
// UPDATE Property
// --------------------------------------------------

export const updatePropertySchema = basePropertySchema
  .partial()
  .extend({
    // If contacts are provided, replace the whole list.
    contacts: z.array(contactLinkSchema).min(1).max(30).optional(),
  })
  .strict()
  .superRefine((input, ctx) => {
    if (Object.keys(input).length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "At least one field is required.",
      });
    }

    if (input.contacts) {
      validateContacts(input.contacts, ctx);
    }

    // On PATCH, area validation also depends on saved values.
    // The service will validate the merged result.
  });

// --------------------------------------------------
// GET /api/properties query parameters
// --------------------------------------------------

export const listPropertiesQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),

  locationId: uuid.optional(),
  typeId: uuid.optional(),

  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),

  transactionType: z.enum(["SALE", "RENT"]).optional(),

  offeringStatus: z
    .enum([
      "AVAILABLE",
      "RESERVED",
      "UNDER_NEGOTIATION",
      "SOLD",
      "RENTED",
      "WITHDRAWN",
    ])
    .optional(),

  // URL query parameters are strings.
  // z.coerce.number() converts "2" into 2.
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
});

export const uuidSchema = uuid;

// --------------------------------------------------
// Photo metadata (actual upload is a separate step)
// --------------------------------------------------

export const addPhotoSchema = z
  .object({
    storageKey: z.string().trim().min(1).max(1000),
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().max(100).optional(),
    sizeBytes: z.number().int().min(0).optional(),
    sortOrder: z.number().int().min(0).default(0),
    isPrimary: z.boolean().default(false),
  })
  .strict();
