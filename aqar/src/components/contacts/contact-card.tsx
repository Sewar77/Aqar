import Link from "next/link";

import {
    Building2,
    ChevronLeft,
    Pencil,
    Phone,
    Trash2,
    UserRound,
} from "lucide-react";

import type { ContactListItem } from "./contact.types";

type Props = {
    contact: ContactListItem;
    onEdit: (contact: ContactListItem) => void;
    onDelete: (contact: ContactListItem) => void;
};

export function ContactCard({
    contact,
    onEdit,
    onDelete,
}: Props) {
    const canDelete = contact.propertyCount === 0;

    return (
        <article className="aqar-card space-y-4 p-5">
            <div className="flex items-start gap-3">
                <span className="rounded-xl bg-accent-soft p-3 text-olive">
                    <UserRound size={22} aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                    <Link
                        href={`/contacts/${contact.id}`}
                        className="aqar-heading text-xl hover:text-brand"
                    >
                        {contact.fullName}
                    </Link>

                    <p
                        dir="ltr"
                        className="mt-1 flex items-center justify-end gap-2 text-base text-secondary"
                    >
                        <Phone size={16} aria-hidden="true" />
                        {contact.phone}
                    </p>
                </div>
            </div>

            {contact.alternativePhone && (
                <p className="text-sm text-secondary">
                    هاتف بديل:{" "}
                    <bdi dir="ltr">{contact.alternativePhone}</bdi>
                </p>
            )}

            {contact.email && (
                <p
                    dir="ltr"
                    className="break-all text-left text-sm text-secondary"
                >
                    {contact.email}
                </p>
            )}

            <Link
                href={`/contacts/${contact.id}`}
                className="flex items-center gap-2 font-semibold text-brand"
            >
                <Building2 size={18} aria-hidden="true" />

                {contact.propertyCount} عقارات مرتبطة

                <ChevronLeft size={17} aria-hidden="true" />
            </Link>

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => onEdit(contact)}
                    className="aqar-button aqar-button-edit"
                >
                    <Pencil size={17} aria-hidden="true" />
                    تعديل
                </button>

                <button
                    type="button"
                    onClick={() => onDelete(contact)}
                    disabled={!canDelete}
                    title={
                        canDelete
                            ? "حذف جهة الاتصال"
                            : "لا يمكن حذف جهة مرتبطة بعقارات"
                    }
                    className="aqar-button aqar-button-danger"
                >
                    <Trash2 size={17} aria-hidden="true" />
                    حذف
                </button>
            </div>
        </article>
    );
}