import { prisma } from "@/lib/prisma";

import type {
  CreateLocationInput,
  UpdateLocationInput,
  LocationDto,
  LocationConflict,
  LocationListFilters,
} from "./location.types";

type LocationRow = {
  id: string;
  nameAr: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  propertiesCount: number;
};

const locationSelect = {
  id: true,
  nameAr: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      properties: true,
    },
  },
} as const;

export const LocationRepository = {
  async findAll(filters: LocationListFilters): Promise<{
    data: LocationDto[];
    total: number;
  }> {
    const { page, limit, search = "" } = filters;

    const isActive = filters.isActive ?? null;
    const offset = (page - 1) * limit;

    type LocationPageRow = {
      id: string;
      nameAr: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      propertiesCount: number;
      totalCount: number;
    };

    const rows = await prisma.$queryRaw<LocationPageRow[]>`
    SELECT
      l.id,
      l.name_ar AS "nameAr",
      l.is_active AS "isActive",
      l.created_at AS "createdAt",
      l.updated_at AS "updatedAt",

      COUNT(p.id)::integer AS "propertiesCount",
      COUNT(*) OVER()::integer AS "totalCount"

    FROM public.locations AS l

    LEFT JOIN public.properties AS p
      ON p.location_id = l.id

    WHERE
      (
        ${isActive}::boolean IS NULL
        OR l.is_active = ${isActive}::boolean
      )
      AND (
        ${search}::text = ''
        OR strpos(
          public.aqar_normalize_location_name(l.name_ar),
          public.aqar_normalize_location_name(
            ${search}::text
          )
        ) > 0
      )

    GROUP BY
      l.id,
      l.name_ar,
      l.is_active,
      l.created_at,
      l.updated_at

    ORDER BY
      public.aqar_normalize_location_name(l.name_ar),
      l.name_ar,
      l.id

    LIMIT ${limit}::integer
    OFFSET ${offset}::integer
  `;

    let total = rows[0]?.totalCount ?? 0;

    // If a user visits a page beyond the last page,
    // the window count has no rows to return.
    // Only in this case do a separate COUNT query.
    if (rows.length === 0 && page > 1) {
      const counts = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COUNT(*)::integer AS total
      FROM public.locations AS l
      WHERE
        (
          ${isActive}::boolean IS NULL
          OR l.is_active = ${isActive}::boolean
        )
        AND (
          ${search}::text = ''
          OR strpos(
            public.aqar_normalize_location_name(l.name_ar),
            public.aqar_normalize_location_name(
              ${search}::text
            )
          ) > 0
        )
    `;

      total = counts[0]?.total ?? 0;
    }

    return {
      data: rows.map((row) => ({
        id: row.id,
        nameAr: row.nameAr,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        _count: {
          properties: row.propertiesCount,
        },
      })),
      total,
    };
  },

  findById(id: string) {
    return prisma.location.findUnique({
      where: { id },
      select: locationSelect,
    });
  },

  async findByNormalizedName(
    nameAr: string,
    excludeId: string | null = null,
  ): Promise<LocationConflict | null> {
    const rows = await prisma.$queryRaw<LocationConflict[]>`
        SELECT id
        FROM public.locations
        WHERE
          public.aqar_normalize_location_name(name_ar)
          =
          public.aqar_normalize_location_name(
            ${nameAr}::text
          )
          AND (
            ${excludeId}::uuid IS NULL
            OR id <> ${excludeId}::uuid
          )
        LIMIT 1
      `;

    return rows[0] ?? null;
  },

  create(data: CreateLocationInput) {
    return prisma.location.create({
      data: {
        nameAr: data.nameAr,
        isActive: true,
      },
      select: locationSelect,
    });
  },

  update(id: string, data: UpdateLocationInput) {
    return prisma.location.update({
      where: { id },
      data: {
        ...(data.nameAr !== undefined ? { nameAr: data.nameAr } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      select: locationSelect,
    });
  },

  async findPropertyIds(locationId: string) {
    return prisma.property.findMany({
      where: {
        locationId,
      },
      select: {
        id: true,
      },
    });
  },

  async deleteWithProperties(locationId: string, propertyIds: string[]) {
    const [propertiesResult, deletedLocation] = await prisma.$transaction([
      prisma.property.deleteMany({
        where: {
          locationId,
          id: {
            in: propertyIds,
          },
        },
      }),

      prisma.location.delete({
        where: {
          id: locationId,
        },
        select: {
          id: true,
          nameAr: true,
        },
      }),
    ]);

    return {
      id: deletedLocation.id,
      nameAr: deletedLocation.nameAr,
      deletedPropertiesCount: propertiesResult.count,
    };
  },
};
