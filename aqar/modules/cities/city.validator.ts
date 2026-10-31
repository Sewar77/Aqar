import { z } from "zod";

export const cityIdSchema = z.string().uuid();

export const cityFiltersSchema = z.object({
  governorateId: z.string().uuid().optional(),
  isActive: z
    .string()
    .optional()
    .refine(
      (value) => value === undefined || value === "true" || value === "false",
      { message: "isActive must be true or false" },
    )
    .transform((value) => (value === undefined ? undefined : value === "true")),
});
