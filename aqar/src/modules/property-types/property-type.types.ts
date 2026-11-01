import { z } from "zod";

import {
  createPropertyTypeSchema,
  updatePropertyTypeSchema,
  propertyTypeListQuerySchema,
} from "./property-type.validator";

export type CreatePropertyTypeInput = z.infer<typeof createPropertyTypeSchema>;

export type UpdatePropertyTypeInput = z.infer<typeof updatePropertyTypeSchema>;

export type PropertyTypeListFilters = z.infer<
  typeof propertyTypeListQuerySchema
>;
