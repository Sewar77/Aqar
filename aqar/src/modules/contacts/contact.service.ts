import { createPagination } from "@/lib/pagination";
import {
  contactRepository,
  ContactDeleteConflictError,
  ContactNotFoundError,
} from "./contact.repository";

import type {
  CreateContactInput,
  UpdateContactInput,
  ContactListFilters,
  DeleteContactInput,
  ContactDetailsDto,
} from "./contact.types";

export class ContactServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ContactServiceError";
  }
}

function normalizeOptionalText(value: string | null | undefined) {
  if (value == null) return null;

  return value.trim() || null;
}

export const contactService = {
  async getAll(filters: Partial<ContactListFilters> = {}) {
    const query: ContactListFilters = {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      search: filters.search,
      isActive: filters.isActive,
    };

    const result = await contactRepository.findAll(query);

    return {
      data: result.data,
      pagination: createPagination(query.page, query.limit, result.total),
    };
  },

  async getById(id: string): Promise<ContactDetailsDto> {
    const contact = await contactRepository.findById(id);

    if (!contact) {
      throw new ContactServiceError("جهة الاتصال غير موجودة", 404);
    }

    // One person may have several roles in one
    // property; display the property only once.
    const uniqueProperties = new Map(
      contact.properties.map(({ property }) => [
        property.id,
        {
          id: property.id,
          title: property.title,
        },
      ]),
    );

    const properties = [...uniqueProperties.values()].sort((a, b) =>
      a.id.localeCompare(b.id),
    );

    return {
      id: contact.id,
      fullName: contact.fullName,
      phone: contact.phone,
      alternativePhone: contact.alternativePhone,
      notes: contact.notes,
      isActive: contact.isActive,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
      propertyCount: properties.length,
      properties,
    };
  },

  async create(input: CreateContactInput) {
    const alternativePhone = input.alternativePhone ?? null;

    if (alternativePhone !== null && alternativePhone === input.phone) {
      throw new ContactServiceError(
        "رقم الهاتف الإضافي يجب أن يختلف عن الرقم الأساسي",
        400,
      );
    }

    const duplicate = await contactRepository.findByPhone(input.phone);

    if (duplicate) {
      throw new ContactServiceError("رقم الهاتف الأساسي مسجل مسبقًا", 409);
    }

    const created = await contactRepository.create({
      ...input,
      alternativePhone,
      notes: normalizeOptionalText(input.notes),
    });

    return {
      ...created,
      propertyCount: 0,
    };
  },

  async update(id: string, input: UpdateContactInput) {
    const existing = await this.getById(id);

    const nextPhone = input.phone ?? existing.phone;

    const nextAlternativePhone =
      input.alternativePhone === undefined
        ? existing.alternativePhone
        : input.alternativePhone;

    if (nextAlternativePhone !== null && nextAlternativePhone === nextPhone) {
      throw new ContactServiceError(
        "رقم الهاتف الإضافي يجب أن يختلف عن الرقم الأساسي",
        400,
      );
    }

    if (input.phone !== undefined) {
      const duplicate = await contactRepository.findByPhone(input.phone, id);

      if (duplicate) {
        throw new ContactServiceError(
          "رقم الهاتف الأساسي مسجل مسبقًا لجهة اتصال أخرى",
          409,
        );
      }
    }

    await contactRepository.update(id, {
      ...input,
      ...(input.notes !== undefined
        ? {
            notes: normalizeOptionalText(input.notes),
          }
        : {}),
    });

    return this.getById(id);
  },

  async delete(id: string, input: DeleteContactInput) {
    try {
      return await contactRepository.deleteWithProperties(
        id,
        input.confirmName,
        input.expectedPropertyIds,
      );
    } catch (error) {
      if (error instanceof ContactNotFoundError) {
        throw new ContactServiceError("جهة الاتصال غير موجودة", 404);
      }

      if (error instanceof ContactDeleteConflictError) {
        throw new ContactServiceError(error.message, 409);
      }

      throw error;
    }
  },
};
