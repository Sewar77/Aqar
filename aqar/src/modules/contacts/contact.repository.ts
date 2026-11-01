import { prisma } from "@/src/lib/prisma";
import type {
  CreateContactInput,
  UpdateContactInput,
  ContactListFilter,
} from "./contact.types";

export const contactRepository = {
  findByPhone(phone: string) {
    return prisma.contact.findUnique({
      where: { phone },
    });
  },
  findAll(filters: ContactListFilter) {
    const { search, page, limit } = filters;

    return prisma.contact.findMany({
      where: {
        ...(search && {
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
            {
              alternativePhone: {
                contains: search,
              },
            },
          ],
        }),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    });
  },

  count(filters: ContactListFilter) {
    const { search } = filters;

    return prisma.contact.count({
      where: {
        ...(search && {
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
            {
              alternativePhone: {
                contains: search,
              },
            },
          ],
        }),
      },
    });
  },

  findById(id: string) {
    return prisma.contact.findUnique({
      where: { id },

      include: {
        properties: {
          select: {
            role: true,
            isPrimary: true,
            canSharePhone: true,

            property: {
              select: {
                id: true,
                propertyCode: true,
                title: true,
                status: true,

                location: {
                  select: {
                    nameAr: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  },

  async countDistinctProperties(contactIds: string[]) {
    if (contactIds.length === 0) {
      return new Map<string, number>();
    }

    const relationships = await prisma.propertyContact.groupBy({
      by: ["contactId", "propertyId"],
      where: {
        contactId: {
          in: contactIds,
        },
      },
    });

    const counts = new Map<string, number>();

    for (const relationship of relationships) {
      const current = counts.get(relationship.contactId) ?? 0;

      counts.set(relationship.contactId, current + 1);
    }

    return counts;
  },

  create(data: CreateContactInput) {
    return prisma.contact.create({
      data,
    });
  },

  update(id: string, data: UpdateContactInput) {
    return prisma.contact.update({
      where: { id },
      data,
    });
  },

  delete(id: string) {
    return prisma.contact.delete({
      where: { id },
    });
  },
};
