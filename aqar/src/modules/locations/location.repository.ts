import { prisma } from "@/lib/prisma";

import type {
  CreateLocationInput,
  UpdateLocationInput,
  LocationListFilters,
} from "./location.types";

export const LocationRepository = {
  findAll(filters: LocationListFilters = {}) {
    return prisma.location.findMany({
      where: {
        ...(filters.search && {
          nameAr: {
            contains: filters.search,
            mode: "insensitive" as const,
          },
        }),

        ...(filters.isActive !== undefined && {
          isActive: filters.isActive,
        }),
      },

      include: {
        _count: {
          select: {
            properties: true,
          },
        },
      },

      orderBy: {
        nameAr: "asc",
      },
    });
  },
  findById(id: string) {
    return prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            properties: true,
          },
        },
      },
    });
  },

  findByName(nameAr: string) {
    return prisma.location.findFirst({
      where: {
        nameAr: {
          equals: nameAr,
          mode: "insensitive",
        },
      },
    });
  },
  create(data: CreateLocationInput) {
    return prisma.location.create({
      data,
    });
  },
  update(id: string, data: UpdateLocationInput) {
    return prisma.location.update({
      where: { id },
      data,
    });
  },
};
