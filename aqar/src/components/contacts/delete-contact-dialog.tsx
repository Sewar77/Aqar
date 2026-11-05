"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";

import {
    AlertTriangle,
    Trash2,
} from "lucide-react";

import type { ContactListItem } from "./contact.types";

type DeleteResult =
    | { ok: true }
    | { ok: false; message: string };

type Props = {
    contact: ContactListItem;
    onClose: () => void;
    onConfirm: (id: string) => Promise<DeleteResult>;
};

export function DeleteContactDialog({
    contact,
    onClose,
    onConfirm,
}: Props) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    async function confirmDelete() {
        if (deleting) return;

        setDeleting(true);
        setError("");

        try {
            const result = await onConfirm(contact.id);

            if (!result.ok) {
                setError(result.message);
            }
        } catch {
            setError(
                "تعذّر الاتصال بالخادم. حاول مرة أخرى.",
            );
        } finally {
            setDeleting(false);
        }
    }

    return (
        <Dialog.Root
            open
            onOpenChange={(open) => {
                if (!open && !deleting) {
                    onClose();
                }
            }}
        >
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/35" />

                <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Dialog.Popup
                        dir="rtl"
                        className="aqar-dialog w-full max-w-md p-6 outline-none"
                    >
                        <div className="flex items-center gap-3 text-danger">
                            <span className="rounded-xl bg-danger-soft p-3">
                                <AlertTriangle
                                    size={24}
                                    aria-hidden="true"
                                />
                            </span>

                            <Dialog.Title className="aqar-heading text-xl">
                                تأكيد الحذف النهائي
                            </Dialog.Title>
                        </div>

                        <Dialog.Description className="mt-4 leading-8 text-secondary">
                            هل تريد حذف جهة الاتصال{" "}
                            <strong className="text-ink">
                                {contact.fullName}
                            </strong>{" "}
                            نهائيًا؟ لا يمكن التراجع عن الحذف.
                        </Dialog.Description>

                        <p className="mt-3 rounded-xl bg-surface-muted p-3 text-sm text-secondary">
                            جهات الاتصال المرتبطة بعقارات لا يمكن حذفها.
                        </p>

                        {error && (
                            <p
                                role="alert"
                                className="mt-4 rounded-xl bg-danger-soft p-3 text-sm text-danger"
                            >
                                {error}
                            </p>
                        )}

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={onClose}
                                className="aqar-button bg-surface-muted text-ink"
                            >
                                إلغاء
                            </button>

                            <button
                                type="button"
                                disabled={deleting}
                                onClick={confirmDelete}
                                className="aqar-button aqar-button-danger"
                            >
                                <Trash2
                                    size={17}
                                    aria-hidden="true"
                                />

                                {deleting
                                    ? "جارٍ الحذف..."
                                    : "حذف نهائي"}
                            </button>
                        </div>
                    </Dialog.Popup>
                </Dialog.Viewport>
            </Dialog.Portal>
        </Dialog.Root>
    );
}