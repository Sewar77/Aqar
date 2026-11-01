import { LocationRepository } from "./location.repository";
import type {
  CreateLocationInput,
  UpdateLocationInput,
  LocationListFilters,
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
  async getAll(filters: LocationListFilters = {}) {
    return LocationRepository.findAll(filters);
  },
  async getById(id: string) {
    const location = await LocationRepository.findById(id);
    if (!location) {
      throw new LocationServiceError("المنطقة المختارة غير موجودة", 404);
    }
    return location;
  },

  async create(data: CreateLocationInput) {
    const nameAr = data.nameAr.trim();
    const isNameExist = await LocationRepository.findByName(nameAr);
    if (isNameExist) {
      throw new LocationServiceError("هذا الاسم موجود بالفعل", 409);
    }
    return LocationRepository.create({
      nameAr,
      nameEn: data.nameEn?.trim() || null,
    });
  },
  async update(id: string, input: UpdateLocationInput) {
    await this.getById(id);
    if (input.nameAr !== undefined) {
      const exsit = await LocationRepository.findByName(input.nameAr.trim());
      if (exsit && exsit.id !== id) {
        throw new LocationServiceError("هذا الاسم موجود بالفعل", 409);
      }
    }
    const data: UpdateLocationInput = {
      ...input,
      ...(input.nameAr !== undefined && {
        nameAr: input.nameAr.trim(),
      }),
      ...(input.nameEn !== undefined && {
        nameEn: input.nameEn?.trim() || null,
      }),
    };
    return LocationRepository.update(id, data);
  },
};
