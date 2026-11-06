import { createPagination } from "@/lib/pagination";
import { LocationRepository } from "./location.repository";

import type {
  CreateLocationInput,
  UpdateLocationInput,
  LocationListFilters,
  DeleteLocationInput,
} from "./location.types";

export class LocationServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "LocationServiceError";
  }
}

export const LocationService = {
  // GET ALL - Search, filters and pagination
  async getAll(filters: Partial<LocationListFilters> = {}) {
    const query: LocationListFilters = {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      search: filters.search,
      isActive: filters.isActive,
    };

    const result = await LocationRepository.findAll(query);

    return {
      data: result.data,
      pagination: createPagination(query.page, query.limit, result.total),
    };
  },

  // GET BY ID
  async getById(id: string) {
    const location = await LocationRepository.findById(id);

    if (!location) {
      throw new LocationServiceError("المنطقة غير موجودة", 404);
    }

    return location;
  },

  // CREATE
  async create(input: CreateLocationInput) {
    const existing = await LocationRepository.findByNormalizedName(
      input.nameAr,
    );

    if (existing) {
      throw new LocationServiceError("هذه المنطقة مسجلة بالفعل", 409);
    }

    return LocationRepository.create({
      nameAr: input.nameAr,
    });
  },

  // UPDATE - Name and status
  async update(id: string, input: UpdateLocationInput) {
    const existing = await this.getById(id);

    if (input.nameAr !== undefined) {
      const duplicate = await LocationRepository.findByNormalizedName(
        input.nameAr,
        id,
      );

      if (duplicate) {
        throw new LocationServiceError(
          "توجد منطقة أخرى بهذا الاسم بالفعل",
          409,
        );
      }
    }

    const nameUnchanged =
      input.nameAr === undefined || input.nameAr === existing.nameAr;

    const statusUnchanged =
      input.isActive === undefined || input.isActive === existing.isActive;

    if (nameUnchanged && statusUnchanged) {
      return existing;
    }

    return LocationRepository.update(id, input);
  },

  // DELETE - With related properties and confirmation
  async delete(id: string, input: DeleteLocationInput) {
    const location = await this.getById(id);

    // Validate the confirmation name.
    if (input.confirmName !== location.nameAr) {
      throw new LocationServiceError(
        "اسم المنطقة المدخل لا يطابق اسم المنطقة المحددة",
        400,
      );
    }

    // Require explicit approval to delete properties.
    if (!input.confirm || !input.deleteRelatedProperties) {
      throw new LocationServiceError(
        "يجب تأكيد حذف المنطقة والعقارات المرتبطة",
        400,
      );
    }

    // Load the actual property IDs.
    const properties = await LocationRepository.findPropertyIds(id);

    // Check whether the linked property count changed.
    if (properties.length !== input.expectedPropertyCount) {
      throw new LocationServiceError(
        "تغيّر عدد العقارات المرتبطة بالمنطقة. حدّث القائمة وراجع الحذف مجددًا.",
        409,
      );
    }

    // The repository performs both deletions atomically.
    return LocationRepository.deleteWithProperties(
      id,
      properties.map((property) => property.id),
    );
  },
};
