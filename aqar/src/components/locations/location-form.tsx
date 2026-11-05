"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createLocationSchema } from "@/modules/locations/location.validators";

import type {
    LocationListItem,
    SaveLocationResult,
} from "./location.types";

// Reuse the backend validation for the Arabic name.
// isActive is used only when editing.
const locationFormSchema = createLocationSchema
    .omit({ nameEn: true })
    .extend({
        isActive: z.boolean(),
    });

export type LocationFormValues =
    z.infer<typeof locationFormSchema>;

type LocationFormProps = {
    location: LocationListItem | null;
    onClose: () => void;
    onSave: (
        values: LocationFormValues,
    ) => Promise<SaveLocationResult>;
};

export function LocationForm({
    location,
    onClose,
    onSave,
}: LocationFormProps) {
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
    } = useForm<LocationFormValues>({
        resolver: zodResolver(locationFormSchema),
        mode: "onBlur",
        defaultValues: {
            nameAr: location?.nameAr ?? "",
            isActive: location?.isActive ?? true,
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

    async function submit(values: LocationFormValues) {
        setSubmitError("");

        const result = await onSave(values);

        if (result.ok) return;

        if (result.status === 409) {
            setError("nameAr", {
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
                        className="aqar-dialog flex h-dvh w-full max-w-lg flex-col overflow-hidden outline-none sm:h-auto sm:max-h-[calc(100dvh-2.5rem)]"
                    >
                        <form
                            onSubmit={handleSubmit(submit)}
                            noValidate
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="flex items-start justify-between gap-4 px-6 py-5">
                                <div>
                                    <Dialog.Title className="aqar-heading text-2xl">
                                        {location
                                            ? "تعديل منطقة"
                                            : "إضافة منطقة"}
                                    </Dialog.Title>

                                    <Dialog.Description className="aqar-description mt-1">
                                        أدخل اسم المنطقة باللغة العربية.
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

                            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
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
                                        htmlFor="location-name"
                                        className="text-base font-bold text-ink"
                                    >
                                        اسم المنطقة *
                                    </label>

                                    <input
                                        id="location-name"
                                        placeholder="مثال: الحصن"
                                        maxLength={120}
                                        disabled={isSubmitting}
                                        aria-invalid={Boolean(errors.nameAr)}
                                        className="aqar-input mt-2"
                                        {...register("nameAr")}
                                    />

                                    {errors.nameAr && (
                                        <p
                                            role="alert"
                                            className="mt-2 text-sm text-danger"
                                        >
                                            {errors.nameAr.message}
                                        </p>
                                    )}
                                </div>

                                {location && (
                                    <label className="flex items-center gap-3 rounded-2xl bg-surface-muted p-4">
                                        <input
                                            type="checkbox"
                                            disabled={isSubmitting}
                                            className="h-5 w-5 accent-brand"
                                            {...register("isActive")}
                                        />

                                        <span className="font-medium text-ink">
                                            المنطقة نشطة
                                        </span>
                                    </label>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 px-6 py-5">
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={requestClose}
                                    className="aqar-button bg-surface-muted text-secondary"
                                >
                                    إلغاء
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        isSubmitting ||
                                        (location !== null && !isDirty)
                                    }
                                    className="aqar-button aqar-button-primary"
                                >
                                    {isSubmitting
                                        ? "جارٍ الحفظ..."
                                        : location
                                            ? "حفظ التعديلات"
                                            : "إضافة المنطقة"}
                                </button>
                            </div>
                        </form>
                    </Dialog.Popup>
                </Dialog.Viewport>
            </Dialog.Portal>
        </Dialog.Root>
    );
}