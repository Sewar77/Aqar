import { prisma } from "../../lib/prisma";

import type { Prisma } from "../../../generated/prisma/client";

// satisfies checks that this object follows Prisma.PropertyInclude
// while preserving the specific selected relation types.
//
// This also helps TypeScript infer the shape of results
// returned by findUnique() and findMany().

export const propertyInclude = {
  type: {
    select: {
      id: true,
      code: true,
      nameAr: true,
    },
  },

  location: {
    select: {
      id: true,
      nameAr: true,
    },
  },

  contacts: {
    include: {
      contact: true,
    },
  },

  offerings: true,

  photos: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
  },
} satisfies Prisma.PropertyInclude;

export const propertyRepository = {
  // A transaction is a group of DB operations
  // that must all succeed or all roll back.
  //
  // T is a generic type: the return type depends
  // on what the callback actually returns.
  transaction: <T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) =>
    prisma.$transaction(callback),

  findById(id: string) {
    return prisma.property.findUnique({
      where: { id },
      include: propertyInclude,
    });
  },

  findType(id: string) {
    return prisma.propertyType.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        isActive: true,
      },
    });
  },

  findLocation(id: string) {
    return prisma.location.findUnique({
      where: { id },
      select: {
        id: true,
        isActive: true,
      },
    });
  },

  findContact(id: string) {
    return prisma.contact.findUnique({
      where: { id },
      select: { id: true },
    });
  },

  findParent(id: string) {
    return prisma.property.findUnique({
      where: { id },
      select: { id: true },
    });
  },

  async list(where: Prisma.PropertyWhereInput, page: number, limit: number) {
    // Example: page 3, limit 10 -> skip 20 rows.
    const skip = (page - 1) * limit;

    // The array transaction returns the results of
    // these two database operations in order.
    const [data, total] = await prisma.$transaction([
      prisma.property.findMany({
        where,
        include: propertyInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.property.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
