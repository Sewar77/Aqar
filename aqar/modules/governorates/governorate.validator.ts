import { z } from "zod";

export const governorateIdSchema = z.string().uuid();

export const governorateFiltersSchema = z.object({
  isActive: z
    .string()
    .optional()
    .refine(
      (value) => value === undefined || value === "true" || value === "false",
      { message: "isActive must be true or false" },
    )
    .transform((value) => {
      if (value === undefined) return undefined;
      return value === "true";
    }),
});
