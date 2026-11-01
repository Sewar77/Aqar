import type { z } from "zod";

import {
  createPropertySchema,
  updatePropertySchema,
  listPropertiesQuerySchema,
  createOfferingSchema,
  updateOfferingSchema,
  addPhotoSchema,
} from "./properties.validation";

// z.infer extracts the OUTPUT TypeScript type from a Zod schema.
//
// We do not repeat an interface manually because the
// interface could become different from the validation rules.

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

export type PropertyListFilters = z.infer<typeof listPropertiesQuerySchema>;

export type CreateOfferingInput = z.infer<typeof createOfferingSchema>;

export type UpdateOfferingInput = z.infer<typeof updateOfferingSchema>;

export type AddPhotoInput = z.infer<typeof addPhotoSchema>;

// Indexed access types:
//
// CreatePropertyInput["contacts"] -> Array of contacts
// [number] -> Type of ONE item in that array

export type ContactLinkInput = CreatePropertyInput["contacts"][number];

export type LocationRefInput = CreatePropertyInput["location"];
