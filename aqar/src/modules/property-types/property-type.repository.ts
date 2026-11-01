import { prisma } from "@/lib/prisma";
import type {
  CreatePropertyTypeInput,
  UpdatePropertyTypeInput,
  PropertyTypeListFilters,
} from "./property-type.types";

export const propertyTypeRepository = {
  findAll(filters: PropertyTypeListFilters = {}) {
    return prisma.propertyType.findMany({
      where: {
        ...(filters.search && {
          OR: [
            {
              nameAr: {
                contains: filters.search,
                mode: "insensitive" as const,
              },
            },
            {
              nameEn: {
                contains: filters.search,
                mode: "insensitive" as const,
              },
            },
            {
              code: {
                contains: filters.search,
                mode: "insensitive" as const,
              },
            },
          ],
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
    return prisma.propertyType.findUnique({
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

  findByCode(code: string) {
    return prisma.propertyType.findUnique({
      where: { code },
    });
  },

  create(data: CreatePropertyTypeInput) {
    return prisma.propertyType.create({
      data,
    });
  },

  update(id: string, data: UpdatePropertyTypeInput) {
    return prisma.propertyType.update({
      where: { id },
      data,
    });
  },
};
