import { prisma } from "@/lib/prisma";
import type { GovernorateFilters } from "./governorate.types";
export const governorateReposirty = {
  findAll(filters: GovernorateFilters = {}) {
    return prisma.governorate.findMany({
      where: {
        isActive: filters.isActive,
      },
      orderBy: {
        nameAr: "asc",
      },
      include: {
        _count: {
          select: {
            cities: true,
          },
        },
      },
    });
  },
  findById(id: string) {
    return prisma.governorate.findUnique({
      where: { id },
      include: {
        cities: {
          where: {
            isActive: true,
          },
          orderBy: {
            nameAr: "asc",
          },
        },
      },
    });
  },
};
