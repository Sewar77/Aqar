"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createContactSchema } from "@/modules/contacts/contact.validators";

import type { CreateContactInput } from "@/modules/contacts/contact.types";

import type {
    ContactListItem,
    SaveContactResult,
} from "./contact.types";

type Props = {
    contact: ContactListItem | null;
    onClose: () => void;
    onSave: (
        values: CreateContactInput,
    ) => Promise<SaveContactResult>;
};

const blankToNull = (value: unknown) =>
    typeof value === "string"
        ? value.trim() || null
        : null;

export function ContactForm({
    contact,
    onClose,
    onSave,
}: Props) {
    const [submitError, setSubmitError] = useState("");

    const {
        register,
        handleSubmit,
        setError,
        formState: {
            errors,
            isDirty,
            isSubmitting,
        },
    } = useForm<CreateContactInput>({
        resolver: zodResolver(createContactSchema),

        mode: "onBlur",

        defaultValues: {
            fullName: contact?.fullName ?? "",
            phone: contact?.phone ?? "",
            alternativePhone:
                contact?.alternativePhone ?? null,
            email: contact?.email ?? null,
            notes: contact?.notes ?? null,
        },
    });

    function requestClose() {
        if (isSubmitting) return;

        if (
            isDirty &&
            !window.confirm(
                "هناك تغييرات غير محفوظة. هل تريد إغلاق النموذج؟",
            )
        ) {
            return;
        }

        onClose();
    }

    async function submit(values: CreateContactInput) {
        setSubmitError("");

        const result = await onSave(values);

        if (result.ok) return;

        if (result.status === 409) {
            setError("phone", {
                type: "server",
                message: result.message,
            });

            return;
        }

        setSubmitError(result.message);
    }

    return (
        <Dialog.Root
            open
            onOpenChange={(open) => {
                if (!open) requestClose();
            }}
        >
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/35" />

                <Dialog.Viewport className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-5">
                    <Dialog.Popup
                        dir="rtl"
                        className="aqar-dialog flex h-dvh w-full max-w-xl flex-col overflow-hidden outline-none sm:h-auto sm:max-h-[calc(100dvh-2.5rem)]"
                    >
                        <form
                            onSubmit={handleSubmit(submit)}
                            noValidate
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 px-6 py-5">
                                <div>
                                    <Dialog.Title className="aqar-heading text-2xl">
                                        {contact
                                            ? "تعديل جهة اتصال"
                                            : "إضافة جهة اتصال"}
                                    </Dialog.Title>

                                    <Dialog.Description className="aqar-description mt-1">
                                        أدخل الاسم ورقم الهاتف، وباقي
                                        المعلومات اختيارية.
                                    </Dialog.Description>
                                </div>

                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={requestClose}
                                    className="rounded-xl px-3 py-2 text-secondary hover:bg-surface-muted"
                                >
                                    إغلاق
                                </button>
                            </div>

                            {/* Fields */}
                            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                                {submitError && (
                                    <p
                                        role="alert"
                                        className="rounded-xl bg-danger-soft p-3 text-danger"
                                    >
                                        {submitError}
                                    </p>
                                )}

                                <div>
                                    <label
                                        htmlFor="contact-full-name"
                                        className="font-bold text-ink"
                                    >
                                        الاسم الكامل *
                                    </label>

                                    <input
                                        id="contact-full-name"
                                        autoComplete="name"
                                        disabled={isSubmitting}
                                        aria-invalid={Boolean(errors.fullName)}
                                        className="aqar-input mt-2"
                                        placeholder="مثال: أحمد محمد العلي"
                                        {...register("fullName")}
                                    />

                                    {errors.fullName && (
                                        <p
                                            role="alert"
                                            className="mt-2 text-sm text-danger"
                                        >
                                            {errors.fullName.message}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="contact-phone"
                                            className="font-bold text-ink"
                                        >
                                            رقم الهاتف *
                                        </label>

                                        <input
                                            id="contact-phone"
                                            type="tel"
                                            dir="ltr"
                                            autoComplete="tel"
                                            disabled={isSubmitting}
                                            aria-invalid={Boolean(errors.phone)}
                                            className="aqar-input mt-2"
                                            placeholder="0790000000"
                                            {...register("phone")}
                                        />

                                        {errors.phone && (
                                            <p
                                                role="alert"
                                                className="mt-2 text-sm text-danger"
                                            >
                                                {errors.phone.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="contact-alt-phone"
                                            className="font-bold text-ink"
                                        >
                                            هاتف بديل
                                        </label>

                                        <input
                                            id="contact-alt-phone"
                                            type="tel"
                                            dir="ltr"
                                            disabled={isSubmitting}
                                            aria-invalid={Boolean(
                                                errors.alternativePhone,
                                            )}
                                            className="aqar-input mt-2"
                                            {...register("alternativePhone", {
                                                setValueAs: blankToNull,
                                            })}
                                        />

                                        {errors.alternativePhone && (
                                            <p
                                                role="alert"
                                                className="mt-2 text-sm text-danger"
                                            >
                                                {errors.alternativePhone.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="contact-email"
                                        className="font-bold text-ink"
                                    >
                                        البريد الإلكتروني
                                    </label>

                                    <input
                                        id="contact-email"
                                        type="email"
                                        dir="ltr"
                                        autoComplete="email"
                                        disabled={isSubmitting}
                                        aria-invalid={Boolean(errors.email)}
                                        className="aqar-input mt-2"
                                        {...register("email", {
                                            setValueAs: blankToNull,
                                        })}
                                    />

                                    {errors.email && (
                                        <p
                                            role="alert"
                                            className="mt-2 text-sm text-danger"
                                        >
                                            {errors.email.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="contact-notes"
                                        className="font-bold text-ink"
                                    >
                                        ملاحظات
                                    </label>

                                    <textarea
                                        id="contact-notes"
                                        rows={4}
                                        disabled={isSubmitting}
                                        aria-invalid={Boolean(errors.notes)}
                                        className="aqar-input mt-2"
                                        placeholder="ملاحظات إضافية..."
                                        {...register("notes", {
                                            setValueAs: blankToNull,
                                        })}
                                    />

                                    {errors.notes && (
                                        <p
                                            role="alert"
                                            className="mt-2 text-sm text-danger"
                                        >
                                            {errors.notes.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-3 px-6 py-5">
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={requestClose}
                                    className="aqar-button bg-surface-muted text-ink"
                                >
                                    إلغاء
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="aqar-button aqar-button-primary"
                                >
                                    {isSubmitting
                                        ? "جارٍ الحفظ..."
                                        : contact
                                            ? "حفظ التعديلات"
                                            : "إضافة جهة الاتصال"}
                                </button>
                            </div>
                        </form>
                    </Dialog.Popup>
                </Dialog.Viewport>
            </Dialog.Portal>
        </Dialog.Root>
    );
}