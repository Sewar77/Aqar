import { prisma } from "@/lib/prisma";
import type { CityFilters } from "./city.types";

export const cityRepository = {
  findAll(filters: CityFilters = {}) {
    return prisma.city.findMany({
      where: {
        governorateId: filters.governorateId,
        isActive: filters.isActive,
      },
      orderBy: {
        nameAr: "asc",
      },
      include: {
        governorate: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });
  },

  findById(id: string) {
    return prisma.city.findUnique({
      where: { id },
      include: {
        governorate: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });
  },
};
