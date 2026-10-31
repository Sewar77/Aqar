import { prisma } from "@/lib/prisma";
import type {
  CreatePropertyInput,
  PropertyFilters,
  UpdatePropertyInput,
} from "../types/property.types";

type CreatePropertyRecord = CreatePropertyInput & {
  areaInSquareMeters: number | null;
};

export async function createPropertyRepository(data: CreatePropertyRecord) {
  const {
    initialContact,
    offering,
    areaInSquareMeters,
    typeId,
    cityId,
    parentPropertyId,
    ...propertyData
  } = data;

  return prisma.property.create({
    data: {
      ...propertyData,
      areaInSquareMeters,

      type: {
        connect: { id: typeId },
      },

      city: {
        connect: { id: cityId },
      },

      ...(parentPropertyId
        ? {
            parentProperty: {
              connect: { id: parentPropertyId },
            },
          }
        : {}),

      contacts: {
        create: {
          role: initialContact.role,
          isPrimary: initialContact.isPrimary,
          canSharePhone: initialContact.canSharePhone,
          contact: {
            create: {
              fullName: initialContact.fullName,
              phone: initialContact.phone,
            },
          },
        },
      },

      offerings: {
        create: {
          transactionType: offering.transactionType,
          ownerPrice: offering.ownerPrice,
          advertisedPrice: offering.advertisedPrice,
          currency: offering.currency,
          rentalPeriod: offering.rentalPeriod,
          allowNegotiation: offering.allowNegotiation,
        },
      },

      events: {
        create: {
          eventType: "CREATED",
          title: "تم إنشاء العقار",
        },
      },
    },

    include: {
      type: true,
      city: {
        include: {
          governorate: true,
        },
      },
      parentProperty: {
        include: {
          type: true,
        },
      },
      contacts: {
        include: {
          contact: true,
        },
      },
      offerings: true,
      photos: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });
}

export async function findPropertiesRepository(filters: PropertyFilters) {
  const { search, typeId, cityId, status, page = 1, limit = 10 } = filters;

  const where = {
    ...(typeId && { typeId }),
    ...(cityId && { cityId }),
    ...(status && { status }),

    ...(search && {
      OR: [
        {
          title: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
        {
          city: {
            is: {
              nameAr: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
        },
        {
          city: {
            is: {
              nameEn: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
        },
        {
          address: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
        {
          contacts: {
            some: {
              contact: {
                is: {
                  OR: [
                    {
                      fullName: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      phone: {
                        contains: search,
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.property.findMany({
      where,
      include: {
        type: true,
        city: {
          include: {
            governorate: true,
          },
        },
        parentProperty: {
          include: {
            type: true,
          },
        },
        offerings: {
          orderBy: {
            createdAt: "desc",
          },
        },
        contacts: {
          include: {
            contact: true,
          },
        },
        photos: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),

    prisma.property.count({ where }),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function findPropertyByIdRepository(id: string) {
  return prisma.property.findUnique({
    where: { id },
    include: {
      type: true,

      city: {
        include: {
          governorate: true,
        },
      },

      parentProperty: {
        include: {
          type: true,
          city: {
            include: {
              governorate: true,
            },
          },
        },
      },

      childProperties: {
        include: {
          type: true,
          city: {
            include: {
              governorate: true,
            },
          },
        },
      },

      contacts: {
        include: {
          contact: true,
        },
      },

      offerings: {
        orderBy: {
          createdAt: "desc",
        },
      },

      photos: {
        orderBy: {
          sortOrder: "asc",
        },
      },

      events: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export async function updatePropertyRepository(
  id: string,
  data: UpdatePropertyInput & {
    areaInSquareMeters?: number | null;
  },
) {
  const { typeId, cityId, parentPropertyId, ...propertyData } = data;

  return prisma.property.update({
    where: { id },

    data: {
      ...propertyData,

      ...(typeId !== undefined && {
        type: {
          connect: { id: typeId },
        },
      }),

      ...(cityId !== undefined && {
        city: {
          connect: { id: cityId },
        },
      }),

      ...(parentPropertyId !== undefined && {
        parentProperty: parentPropertyId
          ? {
              connect: { id: parentPropertyId },
            }
          : {
              disconnect: true,
            },
      }),
    },

    include: {
      type: true,
      city: {
        include: {
          governorate: true,
        },
      },
      parentProperty: {
        include: {
          type: true,
        },
      },
      contacts: {
        include: {
          contact: true,
        },
      },
      offerings: true,
      photos: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });
}

export async function archivePropertyRepository(id: string) {
  return prisma.property.update({
    where: { id },
    data: {
      status: "ARCHIVED",
    },
  });
}

export async function propertyExistsRepository(id: string) {
  return prisma.property.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      areaValue: true,
      areaUnit: true,
      cityId: true,
    },
  });
}

export async function propertyTypeExistsRepository(id: string) {
  return prisma.propertyType.findUnique({
    where: { id },
    select: {
      id: true,
      isActive: true,
    },
  });
}

export async function cityExistsRepository(id: string) {
  return prisma.city.findUnique({
    where: { id },
    select: {
      id: true,
      isActive: true,
      governorateId: true,
    },
  });
}
