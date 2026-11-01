import type { Prisma } from "../../../generated/prisma/client";

import { propertyInclude } from "./property.repository";

// Prisma.PropertyGetPayload builds the TypeScript type
// for a property WITH the relations defined in our include.
//
// This means property.location, property.contacts,
// property.offerings, and property.photos are typed.

export type PropertyWithRelations = Prisma.PropertyGetPayload<{
  include: typeof propertyInclude;
}>;
