import type { z } from "zod";
import type {
  createPropertySchema,
  updatePropertySchema,
} from "../validations/property.validation";

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

export type PropertyFilters = {
  search?: string;
  typeId?: string;
  cityId?: string;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  page?: number;
  limit?: number;
};
