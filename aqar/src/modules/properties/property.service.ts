import type { Prisma } from "../../../generated/prisma/client";

import { propertyRepository } from "./property.repository";
import { PropertyHttpError } from "./property.error";

import type {
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyListFilters,
  CreateOfferingInput,
  UpdateOfferingInput,
  AddPhotoInput,
  ContactLinkInput,
  LocationRefInput,
} from "./properties.types";

// Short aliases reduce repetition without losing types.
type Tx = Prisma.TransactionClient;

const propertyNotFound = () => new PropertyHttpError("Property not found", 404);

// --------------------------------------------------
// Resolve location
// --------------------------------------------------

async function resolveLocation(
  tx: Tx,
  reference: LocationRefInput,
): Promise<string> {
  // The "in" operator narrows a union type.
  // TypeScript now knows this is the existingId option.
  if ("existingId" in reference) {
    const location = await tx.location.findUnique({
      where: { id: reference.existingId },
    });

    if (!location || !location.isActive) {
      throw new PropertyHttpError("Location not found or inactive", 400);
    }

    return location.id;
  }

  // Otherwise, Zod guarantees the reference has "new".
  const existing = await tx.location.findUnique({
    where: { nameAr: reference.new.nameAr },
  });

  if (existing) {
    throw new PropertyHttpError("Location name already exists", 409);
  }

  const created = await tx.location.create({
    data: reference.new,
  });

  return created.id;
}

// --------------------------------------------------
// Resolve and link contacts
// --------------------------------------------------

async function resolveContacts(
  tx: Tx,
  propertyId: string,
  links: ContactLinkInput[],
): Promise<void> {
  const unique = new Set<string>();
  let primaryCount = 0;

  for (const link of links) {
    let contactId: string;

    if ("existingId" in link.contact) {
      const contact = await tx.contact.findUnique({
        where: {
          id: link.contact.existingId,
        },
      });

      if (!contact) {
        throw new PropertyHttpError("Contact not found", 400);
      }

      contactId = contact.id;
    } else {
      const existing = await tx.contact.findUnique({
        where: {
          phone: link.contact.new.phone,
        },
      });

      if (existing) {
        throw new PropertyHttpError(
          "Contact phone already exists. Select the existing contact.",
          409,
        );
      }

      const created = await tx.contact.create({
        data: link.contact.new,
      });

      contactId = created.id;
    }

    // The database allows one contact to have different roles,
    // but it should not receive the SAME role twice.
    const key = `${contactId}:${link.role}`;

    if (unique.has(key)) {
      throw new PropertyHttpError("Duplicate contact and role", 400);
    }

    unique.add(key);

    if (link.isPrimary) {
      primaryCount++;
    }

    // PropertyContact is a junction table:
    // Property <-- PropertyContact --> Contact
    await tx.propertyContact.create({
      data: {
        propertyId,
        contactId,
        role: link.role,
        isPrimary: link.isPrimary,
        canSharePhone: link.canSharePhone,
      },
    });
  }

  if (primaryCount > 1) {
    throw new PropertyHttpError("Only one primary contact is allowed", 400);
  }
}

// --------------------------------------------------
// Validate property type
// --------------------------------------------------

async function validateType(tx: Tx, typeId: string) {
  const type = await tx.propertyType.findUnique({
    where: { id: typeId },
  });

  if (!type || !type.isActive) {
    throw new PropertyHttpError("Property type not found or inactive", 400);
  }

  return type;
}

// --------------------------------------------------
// Validate details according to property type
// --------------------------------------------------

// These keys are allowed regardless of property type.
const sharedDetailKeys = new Set(["extras"]);

const detailKeysByType: Record<string, string[]> = {
  LAND: [
    "zoning",
    "landUse",
    "streetWidthMeters",
    "frontageMeters",
    "availableServices",
  ],

  HOUSE: [
    "rooms",
    "bedrooms",
    "bathrooms",
    "livingRooms",
    "kitchens",
    "floorNumber",
    "totalFloors",
    "buildingAgeYears",
    "buildingAreaSqm",
    "parkingSpaces",
    "hasElevator",
    "hasParking",
    "isFurnished",
    "hasBalcony",
    "condition",
    "availableServices",
  ],

  APARTMENT: [
    "rooms",
    "bedrooms",
    "bathrooms",
    "livingRooms",
    "kitchens",
    "floorNumber",
    "totalFloors",
    "buildingAgeYears",
    "buildingAreaSqm",
    "parkingSpaces",
    "hasElevator",
    "hasParking",
    "isFurnished",
    "hasBalcony",
    "condition",
    "availableServices",
  ],

  BUILDING: [
    "rooms",
    "totalFloors",
    "buildingAgeYears",
    "buildingAreaSqm",
    "apartmentCount",
    "parkingSpaces",
    "hasElevator",
    "hasParking",
    "condition",
    "availableServices",
  ],

  COMMERCIAL: [
    "rooms",
    "bathrooms",
    "floorNumber",
    "buildingAreaSqm",
    "parkingSpaces",
    "hasParking",
    "frontageMeters",
    "condition",
    "availableServices",
  ],

  FARM: [
    "landUse",
    "streetWidthMeters",
    "frontageMeters",
    "availableServices",
    "treeCount",
    "hasWaterWell",
    "buildingAreaSqm",
  ],

  OTHER: [
    "rooms",
    "bedrooms",
    "bathrooms",
    "livingRooms",
    "kitchens",
    "floorNumber",
    "totalFloors",
    "buildingAgeYears",
    "buildingAreaSqm",
    "apartmentCount",
    "parkingSpaces",
    "hasElevator",
    "hasParking",
    "isFurnished",
    "hasBalcony",
    "condition",
    "zoning",
    "landUse",
    "streetWidthMeters",
    "frontageMeters",
    "availableServices",
    "treeCount",
    "hasWaterWell",
  ],
};

function validateDetailsForType(
  code: string,
  details?: Record<string, unknown>,
): void {
  if (!details) return;

  // Custom property types use the general Zod schema.
  // For our standard types, enforce applicable keys.
  const allowed = detailKeysByType[code];

  if (!allowed) return;

  const invalid = Object.keys(details).filter(
    (key) => !sharedDetailKeys.has(key) && !allowed.includes(key),
  );

  if (invalid.length > 0) {
    throw new PropertyHttpError(
      `Fields not applicable to ${code}: ${invalid.join(", ")}`,
      400,
    );
  }
}

// --------------------------------------------------
// Area conversion
// --------------------------------------------------

function calculateAreaInSquareMeters(
  value?: number | null,
  unit?: string | null,
): number | null {
  if (value == null || !unit) return null;

  if (unit === "SQUARE_METER") return value;

  // In Jordan, 1 dunum = 1000 square meters.
  if (unit === "DUNUM") return value * 1000;

  // We cannot convert an unknown custom unit.
  return null;
}

// --------------------------------------------------
// Helper for creating offering data
// --------------------------------------------------

function offeringCreateData(offering: CreateOfferingInput) {
  return {
    transactionType: offering.transactionType,
    ownerPrice: offering.ownerPrice,
    advertisedPrice: offering.advertisedPrice,
    rentalPeriod: offering.rentalPeriod ?? null,
    allowNegotiation: offering.allowNegotiation,
    notes: offering.notes ?? null,
  };
}

export const propertyService = {
  // ------------------------------------------------
  // GET /api/properties
  // ------------------------------------------------

  async list(filters: PropertyListFilters) {
    const where: Prisma.PropertyWhereInput = {
      ...(filters.locationId ? { locationId: filters.locationId } : {}),

      ...(filters.typeId ? { typeId: filters.typeId } : {}),

      ...(filters.status ? { status: filters.status } : {}),

      // Prisma relation filter:
      // "some" means at least one related offering matches.
      ...(filters.transactionType || filters.offeringStatus
        ? {
            offerings: {
              some: {
                ...(filters.transactionType
                  ? { transactionType: filters.transactionType }
                  : {}),

                ...(filters.offeringStatus
                  ? { status: filters.offeringStatus }
                  : {}),
              },
            },
          }
        : {}),

      ...(filters.search
        ? {
            OR: [
              {
                title: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                propertyCode: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                address: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                location: {
                  nameAr: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
              },
              {
                contacts: {
                  some: {
                    contact: {
                      OR: [
                        {
                          fullName: {
                            contains: filters.search,
                            mode: "insensitive",
                          },
                        },
                        {
                          phone: {
                            contains: filters.search,
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    return propertyRepository.list(where, filters.page, filters.limit);
  },

  // ------------------------------------------------
  // GET /api/properties/:id
  // ------------------------------------------------

  async get(id: string) {
    const property = await propertyRepository.findById(id);

    if (!property) {
      throw propertyNotFound();
    }

    return property;
  },

  // ------------------------------------------------
  // POST /api/properties
  // ------------------------------------------------

  async create(input: CreatePropertyInput) {
    // The whole registration runs in ONE DB transaction.
    //
    // If creating a contact, offering, or event fails,
    // all earlier writes are rolled back.

    const propertyId = await propertyRepository.transaction(async (tx) => {
      const type = await validateType(tx, input.typeId);

      validateDetailsForType(type.code, input.details);

      // May create a location if the user entered a new one.
      const locationId = await resolveLocation(tx, input.location);

      // Optional parent property:
      // Example: apartment inside an existing building.
      if (input.parentPropertyId) {
        const parent = await tx.property.findUnique({
          where: { id: input.parentPropertyId },
        });

        if (!parent) {
          throw new PropertyHttpError("Parent property not found", 400);
        }
      }

      // An autoincrement sequence generates a unique number.
      const sequence = await tx.propertyCodeCounter.create({
        data: {},
      });

      const propertyCode = `AQ-${String(sequence.id).padStart(5, "0")}`;

      // Prisma accepts numeric values for Decimal columns.
      const property = await tx.property.create({
        data: {
          propertyCode,
          title: input.title,
          description: input.description ?? null,
          internalNotes: input.internalNotes ?? null,

          typeId: input.typeId,
          locationId,

          address: input.address ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,

          areaValue: input.areaValue ?? null,
          areaUnit: input.areaUnit ?? null,
          areaUnitLabel: input.areaUnitLabel ?? null,

          areaInSquareMeters: calculateAreaInSquareMeters(
            input.areaValue,
            input.areaUnit,
          ),

          status: input.status,
          parentPropertyId: input.parentPropertyId ?? null,

          // Prisma JSON field needs a JSON-compatible value.
          details: (input.details ?? {}) as Prisma.InputJsonValue,
        },
      });

      // Create or connect all required contacts.
      await resolveContacts(tx, property.id, input.contacts);

      // Create sale/rent offerings for this property.
      for (const offering of input.offerings) {
        await tx.propertyOffering.create({
          data: {
            propertyId: property.id,
            ...offeringCreateData(offering),
          },
        });
      }

      // Audit trail: record the creation event.
      await tx.propertyEvent.create({
        data: {
          propertyId: property.id,
          eventType: "CREATED",
          title: "تم تسجيل العقار",
        },
      });

      return property.id;
    });

    // Once committed, fetch the full property with relations.
    return this.get(propertyId);
  },

  // ------------------------------------------------
  // PATCH /api/properties/:id
  // ------------------------------------------------

  async update(id: string, input: UpdatePropertyInput) {
    await propertyRepository.transaction(async (tx) => {
      const existing = await tx.property.findUnique({
        where: { id },
      });

      if (!existing) {
        throw propertyNotFound();
      }

      const type = await validateType(tx, input.typeId ?? existing.typeId);

      // JSON fields come back as Prisma JSON values.
      // Narrow them to a plain object before validation.
      const currentDetails =
        existing.details &&
        typeof existing.details === "object" &&
        !Array.isArray(existing.details)
          ? (existing.details as Record<string, unknown>)
          : {};

      validateDetailsForType(
        type.code,
        (input.details ?? currentDetails) as Record<string, unknown>,
      );

      const locationId = input.location
        ? await resolveLocation(tx, input.location)
        : undefined;

      // Prevent a property from being its own parent.
      if (input.parentPropertyId === id) {
        throw new PropertyHttpError("Property cannot be its own parent", 400);
      }

      // Prevent circular parent/child relationships.
      if (input.parentPropertyId) {
        let parent = await tx.property.findUnique({
          where: { id: input.parentPropertyId },
        });

        if (!parent) {
          throw new PropertyHttpError("Parent property not found", 400);
        }

        const visited = new Set<string>();

        while (parent) {
          if (parent.id === id || visited.has(parent.id)) {
            throw new PropertyHttpError("Circular property hierarchy", 400);
          }

          visited.add(parent.id);

          if (!parent.parentPropertyId) break;

          parent = await tx.property.findUnique({
            where: { id: parent.parentPropertyId },
          });
        }
      }

      const data: Prisma.PropertyUncheckedUpdateInput = {};

      // Only fields explicitly included in the PATCH
      // should overwrite existing values.
      const updatableFields = [
        "title",
        "description",
        "internalNotes",
        "typeId",
        "address",
        "latitude",
        "longitude",
        "areaValue",
        "areaUnit",
        "areaUnitLabel",
        "status",
        "parentPropertyId",
      ] as const;

      for (const key of updatableFields) {
        if (input[key] !== undefined) {
          Object.assign(data, { [key]: input[key] });
        }
      }

      if (locationId) {
        data.locationId = locationId;
      }

      if (input.details !== undefined) {
        data.details = input.details as Prisma.InputJsonValue;
      }

      // Area validation must consider values already saved.
      const newAreaValue =
        input.areaValue === undefined
          ? existing.areaValue === null
            ? null
            : Number(existing.areaValue)
          : input.areaValue;

      const newAreaUnit =
        input.areaUnit === undefined ? existing.areaUnit : input.areaUnit;

      if ((newAreaValue == null) !== (newAreaUnit == null)) {
        throw new PropertyHttpError(
          "Area value and unit are required together",
          400,
        );
      }

      const newAreaUnitLabel =
        input.areaUnitLabel === undefined
          ? existing.areaUnitLabel
          : input.areaUnitLabel;

      if (newAreaUnit === "OTHER" && !newAreaUnitLabel) {
        throw new PropertyHttpError("Custom area unit requires a label", 400);
      }

      data.areaInSquareMeters = calculateAreaInSquareMeters(
        newAreaValue,
        newAreaUnit,
      );

      await tx.property.update({
        where: { id },
        data,
      });

      // The contacts array represents the FULL updated list.
      // We delete old junction records and create new ones.
      if (input.contacts) {
        await tx.propertyContact.deleteMany({
          where: { propertyId: id },
        });

        await resolveContacts(tx, id, input.contacts);

        await tx.propertyEvent.create({
          data: {
            propertyId: id,
            eventType: "CONTACT_CHANGED",
            title: "تم تحديث جهات الاتصال",
          },
        });
      }

      if (input.status !== undefined && input.status !== existing.status) {
        await tx.propertyEvent.create({
          data: {
            propertyId: id,
            eventType: "STATUS_CHANGED",
            title: "تم تغيير حالة العقار",
            description: `${existing.status} → ${input.status}`,
          },
        });
      }

      await tx.propertyEvent.create({
        data: {
          propertyId: id,
          eventType: "UPDATED",
          title: "تم تحديث العقار",
        },
      });
    });

    return this.get(id);
  },
};

// These functions are separate services because they manage
// related resources with their own business rules.

export const propertyOfferingService = {
  async add(propertyId: string, input: CreateOfferingInput) {
    return propertyRepository.transaction(async (tx) => {
      const property = await tx.property.findUnique({
        where: { id: propertyId },
        select: { id: true },
      });

      if (!property) {
        throw propertyNotFound();
      }

      // Sprint 1: one SALE and one RENT offer maximum
      // for the same property.
      const duplicate = await tx.propertyOffering.findFirst({
        where: {
          propertyId,
          transactionType: input.transactionType,
        },
      });

      if (duplicate) {
        throw new PropertyHttpError(
          "This transaction type already exists.",
          409,
        );
      }

      const offering = await tx.propertyOffering.create({
        data: {
          propertyId,
          ...offeringCreateData(input),
        },
      });

      await tx.propertyEvent.create({
        data: {
          propertyId,
          eventType: "UPDATED",
          title: "تم إضافة عرض للعقار",
        },
      });

      return offering;
    });
  },

  async update(
    propertyId: string,
    offeringId: string,
    input: UpdateOfferingInput,
  ) {
    return propertyRepository.transaction(async (tx) => {
      const old = await tx.propertyOffering.findFirst({
        where: {
          id: offeringId,
          propertyId,
        },
      });

      if (!old) {
        throw new PropertyHttpError("Offering not found", 404);
      }

      // Use Prisma's generated update type.
      const data: Prisma.PropertyOfferingUpdateInput = {};

      const fields = [
        "ownerPrice",
        "advertisedPrice",
        "finalPrice",
        "rentalPeriod",
        "allowNegotiation",
        "notes",
        "status",
      ] as const;

      for (const key of fields) {
        if (input[key] !== undefined) {
          Object.assign(data, { [key]: input[key] });
        }
      }

      const period =
        input.rentalPeriod === undefined
          ? old.rentalPeriod
          : input.rentalPeriod;

      if (old.transactionType === "RENT" && !period) {
        throw new PropertyHttpError("Rental period is required", 400);
      }

      if (old.transactionType === "SALE" && period) {
        throw new PropertyHttpError("Sale cannot have a rental period", 400);
      }

      const status = input.status ?? old.status;

      if (status === "SOLD" && old.transactionType !== "SALE") {
        throw new PropertyHttpError("Only SALE offerings can be SOLD", 400);
      }

      if (status === "RENTED" && old.transactionType !== "RENT") {
        throw new PropertyHttpError("Only RENT offerings can be RENTED", 400);
      }

      const finalPrice =
        input.finalPrice === undefined ? old.finalPrice : input.finalPrice;

      if (
        (status === "SOLD" || status === "RENTED") &&
        (finalPrice == null || Number(finalPrice) <= 0)
      ) {
        throw new PropertyHttpError(
          "Final price is required when closing a deal",
          400,
        );
      }

      // A closed offering records the closing timestamp.
      if (input.status !== undefined) {
        data.closedAt =
          status === "SOLD" || status === "RENTED"
            ? (old.closedAt ?? new Date())
            : null;
      }

      const updated = await tx.propertyOffering.update({
        where: { id: offeringId },
        data,
      });

      // Keep a history when any price changes.
      if (
        input.ownerPrice !== undefined ||
        input.advertisedPrice !== undefined
      ) {
        await tx.propertyEvent.create({
          data: {
            propertyId,
            eventType: "PRICE_CHANGED",
            title: "تم تعديل سعر العقار",
            description:
              input.ownerPrice !== undefined
                ? "تم تعديل سعر المالك أو سعر الإعلان"
                : "تم تعديل سعر الإعلان",
            oldPrice: old.advertisedPrice,
            newPrice: updated.advertisedPrice,
          },
        });
      }

      if (input.status !== undefined && input.status !== old.status) {
        await tx.propertyEvent.create({
          data: {
            propertyId,
            eventType: "STATUS_CHANGED",
            title: "تم تغيير حالة العرض",
            description: `${old.status} → ${updated.status}`,
          },
        });
      }

      return updated;
    });
  },
};

export const propertyPhotoService = {
  async add(propertyId: string, input: AddPhotoInput) {
    return propertyRepository.transaction(async (tx) => {
      const property = await tx.property.findUnique({
        where: { id: propertyId },
        select: { id: true },
      });

      if (!property) {
        throw propertyNotFound();
      }

      // If this becomes the cover image,
      // clear the primary flag from other images.
      if (input.isPrimary) {
        await tx.propertyPhoto.updateMany({
          where: { propertyId },
          data: { isPrimary: false },
        });
      }

      // This saves upload metadata, not file bytes.
      const photo = await tx.propertyPhoto.create({
        data: {
          propertyId,
          ...input,
        },
      });

      await tx.propertyEvent.create({
        data: {
          propertyId,
          eventType: "PHOTO_CHANGED",
          title: "تم إضافة صورة للعقار",
        },
      });

      return photo;
    });
  },

  async remove(propertyId: string, photoId: string) {
    return propertyRepository.transaction(async (tx) => {
      // Verify that this photo belongs to this property.
      const photo = await tx.propertyPhoto.findFirst({
        where: {
          id: photoId,
          propertyId,
        },
      });

      if (!photo) {
        throw new PropertyHttpError("Photo not found", 404);
      }

      await tx.propertyPhoto.delete({
        where: { id: photoId },
      });

      await tx.propertyEvent.create({
        data: {
          propertyId,
          eventType: "PHOTO_CHANGED",
          title: "تم حذف صورة من العقار",
        },
      });

      // Return storageKey so a future storage integration
      // can identify the remote file.
      return {
        storageKey: photo.storageKey,
      };
    });
  },
};
