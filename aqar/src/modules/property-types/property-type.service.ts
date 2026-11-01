import { propertyTypeRepository } from "./property-type.repository";

import type {
  CreatePropertyTypeInput,
  UpdatePropertyTypeInput,
  PropertyTypeListFilters,
} from "./property-type.types";

export class PropertyTypeServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "PropertyTypeServiceError";
  }
}

export const propertyTypeService = {
  async getAll(filters: PropertyTypeListFilters = {}) {
    return propertyTypeRepository.findAll(filters);
  },

  async getById(id: string) {
    const propertyType = await propertyTypeRepository.findById(id);

    if (!propertyType) {
      throw new PropertyTypeServiceError("نوع العقار غير موجود", 404);
    }

    return propertyType;
  },

  async create(input: CreatePropertyTypeInput) {
    const existing = await propertyTypeRepository.findByCode(input.code);

    if (existing) {
      throw new PropertyTypeServiceError("كود نوع العقار مستخدم مسبقًا", 409);
    }

    return propertyTypeRepository.create({
      code: input.code,
      nameAr: input.nameAr,
      nameEn: input.nameEn ?? null,
    });
  },

  async update(id: string, input: UpdatePropertyTypeInput) {
    await this.getById(id);

    return propertyTypeRepository.update(id, input);
  },
};
