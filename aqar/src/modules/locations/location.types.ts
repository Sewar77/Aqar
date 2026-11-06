import type { z } from "zod";

import type {
  createLocationSchema,
  updateLocationSchema,
  locationListQuerySchema,
  deleteLocationSchema,
} from "./location.validators";

export type CreateLocationInput = z.infer<typeof createLocationSchema>;

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

export type LocationListFilters = z.infer<typeof locationListQuerySchema>;

export type DeleteLocationInput = z.infer<typeof deleteLocationSchema>;

export type LocationDto = {
  id: string;
  nameAr: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    properties: number;
  };
};

export type LocationConflict = {
  id: string;
};
