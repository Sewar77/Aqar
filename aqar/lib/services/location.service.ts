import { prisma } from "@/lib/prisma";

export async function getActiveGovernorates() {
  return prisma.governorate.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      cities: {
        where: { isActive: true },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
        },
        orderBy: {
          nameAr: "asc",
        },
      },
    },
    orderBy: {
      nameAr: "asc",
    },
  });
}
export async function getActiveCities(governorateId?: string) {
  return prisma.city.findMany({
    where: {
      isActive: true,
      governorate: {
        isActive: true,
      },
      ...(governorateId ? { governorateId } : {}),
    },
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      governorate: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
        },
      },
    },
    orderBy: {
      nameAr: "asc",
    },
  });
}
