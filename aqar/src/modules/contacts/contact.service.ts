import { contactRepository } from "./contact.repository";
import {
  ContactListFilter,
  CreateContactInput,
  UpdateContactInput,
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
export const contactService = {
  async getAll(filters: ContactListFilter) {
    const [contacts, total] = await Promise.all([
      contactRepository.findAll(filters),
      contactRepository.count(filters),
    ]);

    const counts = await contactRepository.countDistinctProperties(
      contacts.map((contact) => contact.id),
    );

    const data = contacts.map((contact) => ({
      ...contact,
      propertyCount: counts.get(contact.id) ?? 0,
    }));

    return {
      data,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  },

  async getById(id: string) {
    const contact = await contactRepository.findById(id);

    if (!contact) {
      throw new ContactServiceError("جهة الاتصال غير موجودة", 404);
    }

    const propertyCount = new Set(
      contact.properties.map((relationship) => relationship.property.id),
    ).size;

    return {
      ...contact,
      propertyCount,
    };
  },

  async create(input: CreateContactInput) {
    const phone = input.phone.trim();

    const existingContact = await contactRepository.findByPhone(phone);

    if (existingContact) {
      throw new ContactServiceError(
        "رقم الهاتف مسجل مسبقًا لجهة اتصال أخرى",
        409,
      );
    }

    return contactRepository.create({
      fullName: input.fullName.trim(),
      phone,
      alternativePhone: input.alternativePhone ?? null,
      email: input.email ?? null,
      notes: input.notes ?? null,
    });
  },

  async update(id: string, input: UpdateContactInput) {
    await this.getById(id);

    if (input.phone !== undefined) {
      const existingContact = await contactRepository.findByPhone(
        input.phone.trim(),
      );

      if (existingContact && existingContact.id !== id) {
        throw new ContactServiceError(
          "رقم الهاتف مسجل مسبقًا لجهة اتصال أخرى",
          409,
        );
      }
    }

    return contactRepository.update(id, input);
  },

  async delete(id: string) {
    const contact = await this.getById(id);

    if (contact.propertyCount > 0) {
      throw new ContactServiceError(
        "لا يمكن حذف جهة اتصال مرتبطة بعقارات. أزل ارتباطاتها أولًا.",
        409,
      );
    }

    await contactRepository.delete(id);

    return {
      message: "تم حذف جهة الاتصال بنجاح",
    };
  },
};
