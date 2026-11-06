
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import {
    Archive,
    Pencil,
    RotateCcw,
} from "lucide-react";

type Props = {
    id: string;
    title: string;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
};

export function PropertyActions({
    id,
    title,
    status,
}: Props) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [working, setWorking] = useState(false);
    const [error, setError] = useState("");

    const archived = status === "ARCHIVED";
    const nextStatus = archived ? "DRAFT" : "ARCHIVED";

    async function changeStatus() {
        if (working) return;

        setWorking(true);
        setError("");

        try {
            const response = await fetch(
                `/api/properties/${id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        status: nextStatus,
                    }),
                },
            );

            const result = (await response.json()) as {
                success?: boolean;
                message?: string;
            };

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "تعذّر تغيير حالة العقار",
                );
            }

            setOpen(false);
            router.refresh();
        } catch (caught) {
            setError(
                caught instanceof Error
                    ? caught.message
                    : "تعذّر تنفيذ العملية",
            );
        } finally {
            setWorking(false);
        }
    }

    return (
        <>
            <div className="flex flex-wrap gap-2">
                <Link
                    href={`/properties/${id}/edit`}
                    className="aqar-button aqar-button-edit"
                >
                    <Pencil size={16} aria-hidden="true" />
                    تعديل
                </Link>

                <button
                    type="button"
                    onClick={() => {
                        setError("");
                        setOpen(true);
                    }}
                    className={`aqar-button ${archived
                        ? "aqar-button-primary"
                        : "aqar-button-archive"
                        }`}
                >
                    {archived ? (
                        <RotateCcw size={16} aria-hidden="true" />
                    ) : (
                        <Archive size={16} aria-hidden="true" />
                    )}

                    {archived ? "استرجاع" : "أرشفة"}
                </button>
            </div>

            <Dialog.Root
                open={open}
                onOpenChange={(next) => {
                    if (!working) setOpen(next);
                }}
            >
                <Dialog.Portal>
                    <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/35" />

                    <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <Dialog.Popup
                            dir="rtl"
                            className="aqar-dialog w-full max-w-md p-6 outline-none"
                        >
                            <Dialog.Title className="aqar-heading text-xl">
                                {archived
                                    ? "استرجاع العقار"
                                    : "تأكيد أرشفة العقار"}
                            </Dialog.Title>

                            <Dialog.Description className="mt-3 leading-8 text-secondary">
                                {archived
                                    ? `هل تريد استرجاع «${title}» إلى المسودات؟ لن يتم تفعيله تلقائيًا.`
                                    : `هل تريد أرشفة «${title}»؟ ستبقى بيانات المالك والعروض والصور محفوظة.`}
                            </Dialog.Description>

                            {error && (
                                <p
                                    role="alert"
                                    className="mt-3 rounded-xl bg-danger-soft p-3 text-danger"
                                >
                                    {error}
                                </p>
                            )}

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    disabled={working}
                                    onClick={() => setOpen(false)}
                                    className="aqar-button aqar-button-soft"
                                >
                                    إلغاء
                                </button>

                                <button
                                    type="button"
                                    disabled={working}
                                    onClick={changeStatus}
                                    className="aqar-button aqar-button-primary"
                                >
                                    {working
                                        ? "جارٍ التنفيذ..."
                                        : archived
                                            ? "استرجاع إلى المسودات"
                                            : "تأكيد الأرشفة"}
                                </button>
                            </div>
                        </Dialog.Popup>
                    </Dialog.Viewport>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
}
