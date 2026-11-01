import {
  contactListQuerySchema,
  createContactSchema,
  updateContactSchema,
} from "./contact.validators";
import { z } from "zod";

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactListFilter = z.infer<typeof contactListQuerySchema>;
