import { governorateReposirty } from "./governorate.repository";
import { governorateIdSchema } from "./governorate.validator";
import type { GovernorateFilters } from "./governorate.types";

export const governorateService = {
  async getAll(filters: GovernorateFilters = {}) {
    return governorateReposirty.findAll(filters);
  },

  async getById(id: string) {
    return governorateReposirty.findById(id);
  },
};
