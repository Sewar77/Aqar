import {
  archivePropertyRepository,
  createPropertyRepository,
  findPropertiesRepository,
  findPropertyByIdRepository,
  propertyExistsRepository,
  propertyTypeExistsRepository,
  updatePropertyRepository,
} from "../repositories/property.repository";

import type {
  CreatePropertyInput,
  PropertyFilters,
  UpdatePropertyInput,
} from "../types/property.types";

function calculateAreaInSquareMeters(
  areaValue?: number | null,
  areaUnit?: "SQUARE_METER" | "DUNUM" | "OTHER" | null,
): number | null {
  if (areaValue == null || areaUnit == null) return null;

  if (areaUnit === "SQUARE_METER") return areaValue;
  if (areaUnit === "DUNUM") return areaValue * 1000;

  return null;
}

export async function createProperty(data: CreatePropertyInput) {
  const propertyType = await propertyTypeExistsRepository(data.typeId);

  if (!propertyType || !propertyType.isActive) {
    throw new Error("INVALID_PROPERTY_TYPE");
  }

  if (data.parentPropertyId) {
    const parent = await propertyExistsRepository(data.parentPropertyId);

    if (!parent || parent.status === "ARCHIVED") {
      throw new Error("PARENT_PROPERTY_NOT_FOUND");
    }
  }

  const areaInSquareMeters = calculateAreaInSquareMeters(
    data.areaValue,
    data.areaUnit,
  );

  return createPropertyRepository({
    ...data,
    areaInSquareMeters,
  });
}

export async function getProperties(filters: PropertyFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 10));

  return findPropertiesRepository({
    ...filters,
    page,
    limit,
  });
}

export async function getPropertyById(id: string) {
  const property = await findPropertyByIdRepository(id);

  if (!property) {
    throw new Error("PROPERTY_NOT_FOUND");
  }

  return property;
}

export async function updateProperty(id: string, data: UpdatePropertyInput) {
  const existingProperty = await propertyExistsRepository(id);

  if (!existingProperty) {
    throw new Error("PROPERTY_NOT_FOUND");
  }

  if (data.typeId) {
    const propertyType = await propertyTypeExistsRepository(data.typeId);

    if (!propertyType || !propertyType.isActive) {
      throw new Error("INVALID_PROPERTY_TYPE");
    }
  }

  if (data.parentPropertyId) {
    if (data.parentPropertyId === id) {
      throw new Error("PROPERTY_CANNOT_BE_ITS_OWN_PARENT");
    }

    const parent = await propertyExistsRepository(data.parentPropertyId);

    if (!parent || parent.status === "ARCHIVED") {
      throw new Error("PARENT_PROPERTY_NOT_FOUND");
    }
  }

  const areaValue =
    data.areaValue !== undefined
      ? data.areaValue
      : existingProperty.areaValue == null
        ? null
        : Number(existingProperty.areaValue);

  const areaUnit =
    data.areaUnit !== undefined ? data.areaUnit : existingProperty.areaUnit;

  const areaInSquareMeters =
    data.areaValue !== undefined || data.areaUnit !== undefined
      ? calculateAreaInSquareMeters(areaValue, areaUnit)
      : undefined;

  return updatePropertyRepository(id, {
    ...data,
    ...(areaInSquareMeters !== undefined && { areaInSquareMeters }),
  });
}

export async function archiveProperty(id: string) {
  const property = await propertyExistsRepository(id);

  if (!property) {
    throw new Error("PROPERTY_NOT_FOUND");
  }

  if (property.status === "ARCHIVED") {
    throw new Error("PROPERTY_ALREADY_ARCHIVED");
  }

  return archivePropertyRepository(id);
}
