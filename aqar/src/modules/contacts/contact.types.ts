import type { z } from "zod";

import type {
  createContactSchema,
  updateContactSchema,
  contactListQuerySchema,
  deleteContactSchema,
} from "./contact.validators";

export type CreateContactInput = z.infer<typeof createContactSchema>;

export type UpdateContactInput = z.infer<typeof updateContactSchema>;

export type ContactListFilters = z.infer<typeof contactListQuerySchema>;

export type DeleteContactInput = z.infer<typeof deleteContactSchema>;

export type ContactDto = {
  id: string;
  fullName: string;
  phone: string;
  alternativePhone: string | null;
  notes: string | null;
  isActive: boolean;
  propertyCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ContactPropertySummary = {
  id: string;
  title: string;
};

export type ContactDetailsDto = ContactDto & {
  properties: ContactPropertySummary[];
};
