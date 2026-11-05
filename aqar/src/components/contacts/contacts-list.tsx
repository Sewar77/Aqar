import Link from "next/link";

import {
    Building2,
    Pencil,
    Trash2,
    UserRound,
} from "lucide-react";

import { ContactCard } from "./contact-card";

import type { ContactListItem } from "./contact.types";

type Props = {
    contacts: ContactListItem[];
    loading: boolean;
    onEdit: (contact: ContactListItem) => void;
    onDelete: (contact: ContactListItem) => void;
};

export function ContactsList({
    contacts,
    loading,
    onEdit,
    onDelete,
}: Props) {
    if (loading) {
        return (
            <div
                role="status"
                className="aqar-surface p-10 text-center text-secondary"
            >
                جارٍ تحميل جهات الاتصال...
            </div>
        );
    }

    if (contacts.length === 0) {
        return (
            <div className="aqar-surface p-10 text-center text-secondary">
                لا توجد جهات اتصال مطابقة.
            </div>
        );
    }

    return (
        <>
            {/* Mobile */}
            <div className="grid gap-4 md:hidden">
                {contacts.map((contact) => (
                    <ContactCard
                        key={contact.id}
                        contact={contact}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </div>

            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[860px] border-separate border-spacing-y-3 text-right">
                    <thead className="text-sm text-secondary">
                        <tr>
                            <th
                                scope="col"
                                className="px-5 pb-1 font-medium"
                            >
                                جهة الاتصال
                            </th>

                            <th
                                scope="col"
                                className="px-4 pb-1 font-medium"
                            >
                                الهاتف
                            </th>

                            <th
                                scope="col"
                                className="px-4 pb-1 font-medium"
                            >
                                العقارات
                            </th>

                            <th
                                scope="col"
                                className="px-5 pb-1 font-medium"
                            >
                                الإجراءات
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {contacts.map((contact) => (
                            <tr
                                key={contact.id}
                                className="group"
                            >
                                <td className="rounded-r-2xl bg-surface px-5 py-5 shadow-sm group-hover:bg-surface-muted">
                                    <Link
                                        href={`/contacts/${contact.id}`}
                                        className="inline-flex items-center gap-3 font-bold text-ink hover:text-brand"
                                    >
                                        <span className="rounded-xl bg-accent-soft p-2 text-olive">
                                            <UserRound
                                                size={20}
                                                aria-hidden="true"
                                            />
                                        </span>

                                        {contact.fullName}
                                    </Link>
                                </td>

                                <td className="bg-surface px-4 py-5 shadow-sm group-hover:bg-surface-muted">
                                    <span
                                        dir="ltr"
                                        className="inline-block text-ink"
                                    >
                                        {contact.phone}
                                    </span>
                                </td>

                                <td className="bg-surface px-4 py-5 shadow-sm group-hover:bg-surface-muted">
                                    <Link
                                        href={`/contacts/${contact.id}`}
                                        className="inline-flex items-center gap-2 font-medium text-brand hover:underline"
                                    >
                                        <Building2
                                            size={17}
                                            aria-hidden="true"
                                        />

                                        {contact.propertyCount} عقارات · عرض
                                    </Link>
                                </td>

                                <td className="rounded-l-2xl bg-surface px-5 py-5 shadow-sm group-hover:bg-surface-muted">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(contact)}
                                            className="aqar-button aqar-button-edit"
                                        >
                                            <Pencil
                                                size={16}
                                                aria-hidden="true"
                                            />
                                            تعديل
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => onDelete(contact)}
                                            disabled={contact.propertyCount > 0}
                                            title={
                                                contact.propertyCount > 0
                                                    ? "لا يمكن حذف جهة مرتبطة بعقارات"
                                                    : "حذف نهائي"
                                            }
                                            className="aqar-button aqar-button-danger"
                                        >
                                            <Trash2
                                                size={16}
                                                aria-hidden="true"
                                            />
                                            حذف
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}