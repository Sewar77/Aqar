import { governorateReposirty } from "../governorates/governorate.repository";
import { cityRepository } from "./city.repository";
import type { CityFilters } from "./city.types";

export const cityService = {
  async getAll(filters: CityFilters) {
    if (filters.governorateId) {
      const governorate = await governorateReposirty.findById(
        filters.governorateId,
      );

      if (!governorate) {
        return null;
      }
    }

    return cityRepository.findAll(filters);
  },

  async getById(id: string) {
    return cityRepository.findById(id);
  },
};
