import { prisma } from "@/lib/prisma";

import type {
  ContactDto,
  ContactListFilters,
  CreateContactInput,
  UpdateContactInput,
} from "./contact.types";

export class ContactDeleteConflictError extends Error {}
export class ContactNotFoundError extends Error {}

const contactSelect = {
  id: true,
  fullName: true,
  phone: true,
  alternativePhone: true,
  notes: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

type ContactRow = ContactDto;

function normalizeSearchPhone(search: string) {
  if (!/^[+0-9٠-٩۰-۹\s().-]+$/.test(search)) {
    return "";
  }

  return search
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[\s().-]/g, "");
}

export const contactRepository = {
  async findAll(filters: ContactListFilters): Promise<{
    data: ContactDto[];
    total: number;
  }> {
    const { page, limit, search = "" } = filters;

    const isActive = filters.isActive ?? null;
    const phoneSearch = normalizeSearchPhone(search);
    const offset = (page - 1) * limit;

    type ContactPageRow = ContactDto & {
      totalCount: number;
    };

    const rows = await prisma.$queryRaw<ContactPageRow[]>`
    SELECT
      c.id,
      c.full_name AS "fullName",
      c.phone,
      c.alternative_phone AS "alternativePhone",
      c.notes,
      c.is_active AS "isActive",
      c.created_at AS "createdAt",
      c.updated_at AS "updatedAt",

      (
        SELECT COUNT(DISTINCT pc.property_id)::integer
        FROM public.property_contacts AS pc
        WHERE pc.contact_id = c.id
      ) AS "propertyCount",

      COUNT(*) OVER()::integer AS "totalCount"

    FROM public.contacts AS c

    WHERE
      (
        ${isActive}::boolean IS NULL
        OR c.is_active = ${isActive}::boolean
      )

      AND (
        ${search}::text = ''

        OR strpos(
          public.aqar_normalize_contact_name(c.full_name),
          public.aqar_normalize_contact_name(
            ${search}::text
          )
        ) > 0

        OR (
          ${phoneSearch}::text <> ''
          AND (
            strpos(
              public.aqar_normalize_phone(c.phone),
              ${phoneSearch}::text
            ) > 0

            OR strpos(
              public.aqar_normalize_phone(
                COALESCE(c.alternative_phone, '')
              ),
              ${phoneSearch}::text
            ) > 0
          )
        )
      )

    ORDER BY
      public.aqar_normalize_contact_name(c.full_name),
      c.id

    LIMIT ${limit}::integer
    OFFSET ${offset}::integer
  `;

    let total = rows[0]?.totalCount ?? 0;

    if (rows.length === 0 && page > 1) {
      const counts = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COUNT(*)::integer AS total
      FROM public.contacts AS c

      WHERE
        (
          ${isActive}::boolean IS NULL
          OR c.is_active = ${isActive}::boolean
        )

        AND (
          ${search}::text = ''

          OR strpos(
            public.aqar_normalize_contact_name(c.full_name),
            public.aqar_normalize_contact_name(
              ${search}::text
            )
          ) > 0

          OR (
            ${phoneSearch}::text <> ''
            AND (
              strpos(
                public.aqar_normalize_phone(c.phone),
                ${phoneSearch}::text
              ) > 0

              OR strpos(
                public.aqar_normalize_phone(
                  COALESCE(c.alternative_phone, '')
                ),
                ${phoneSearch}::text
              ) > 0
            )
          )
        )
    `;

      total = counts[0]?.total ?? 0;
    }

    return {
      data: rows.map(({ totalCount: _totalCount, ...contact }) => contact),
      total,
    };
  },

  findById(id: string) {
    return prisma.contact.findUnique({
      where: { id },
      select: {
        ...contactSelect,

        properties: {
          select: {
            role: true,
            property: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
  },

  async findByPhone(phone: string, excludeId: string | null = null) {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM public.contacts

      WHERE
        public.aqar_normalize_phone(phone)
        =
        public.aqar_normalize_phone(
          ${phone}::text
        )

        AND (
          ${excludeId}::uuid IS NULL
          OR id <> ${excludeId}::uuid
        )

      LIMIT 1
    `;

    return rows[0] ?? null;
  },

  create(input: CreateContactInput) {
    return prisma.contact.create({
      data: {
        fullName: input.fullName,
        phone: input.phone,
        alternativePhone: input.alternativePhone ?? null,
        notes: input.notes ?? null,
        isActive: true,
      },
      select: contactSelect,
    });
  },

  update(id: string, input: UpdateContactInput) {
    return prisma.contact.update({
      where: { id },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),

        ...(input.phone !== undefined ? { phone: input.phone } : {}),

        ...(input.alternativePhone !== undefined
          ? { alternativePhone: input.alternativePhone }
          : {}),

        ...(input.notes !== undefined ? { notes: input.notes } : {}),

        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      select: contactSelect,
    });
  },

  async deleteWithProperties(
    contactId: string,
    expectedName: string,
    expectedPropertyIds: string[],
  ) {
    return prisma.$transaction(
      async (tx) => {
        // Lock the contact. Concurrent changes to
        // its foreign-key relationships must wait.
        const locked = await tx.$queryRaw<{ id: string; fullName: string }[]>`
          SELECT id, full_name AS "fullName"
          FROM public.contacts
          WHERE id = ${contactId}::uuid
          FOR UPDATE
        `;

        const contact = locked[0];

        if (!contact) {
          throw new ContactNotFoundError();
        }

        if (contact.fullName !== expectedName) {
          throw new ContactDeleteConflictError(
            "تغيّر اسم جهة الاتصال. راجعي البيانات مجددًا.",
          );
        }

        const relationships = await tx.propertyContact.findMany({
          where: {
            contactId,
          },
          select: {
            propertyId: true,
          },
        });

        const actualIds = [
          ...new Set(relationships.map((item) => item.propertyId)),
        ].sort();

        const expectedIds = [...expectedPropertyIds].sort();

        if (
          actualIds.length !== expectedIds.length ||
          actualIds.some((id, index) => id !== expectedIds[index])
        ) {
          throw new ContactDeleteConflictError(
            "تغيّرت العقارات المرتبطة بجهة الاتصال. راجعي قائمة الحذف مجددًا.",
          );
        }

        let deletedPropertiesCount = 0;

        if (actualIds.length > 0) {
          const deleted = await tx.property.deleteMany({
            where: {
              id: {
                in: actualIds,
              },
            },
          });

          if (deleted.count !== actualIds.length) {
            throw new ContactDeleteConflictError(
              "تغيّرت العقارات أثناء الحذف. لم تكتمل العملية.",
            );
          }

          deletedPropertiesCount = deleted.count;
        }

        const deletedContact = await tx.contact.delete({
          where: {
            id: contactId,
          },
          select: {
            id: true,
            fullName: true,
          },
        });

        return {
          ...deletedContact,
          deletedPropertiesCount,
        };
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );
  },
};
