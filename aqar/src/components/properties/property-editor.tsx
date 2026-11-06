
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    useForm,
    useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Save } from "lucide-react";

const formSchema = z.object({
    title: z
        .string()
        .trim()
        .min(3, "العنوان يجب أن يتكون من 3 أحرف على الأقل"),

    typeId: z.string().min(1, "اختاري نوع العقار"),
    locationId: z.string().min(1, "اختاري المنطقة"),

    description: z.string(),
    address: z.string(),
    internalNotes: z.string(),

    areaValue: z.string(),
    areaUnit: z.enum([
        "SQUARE_METER",
        "DUNUM",
        "OTHER",
    ]),
    areaUnitLabel: z.string(),

    basinNumber: z.string(),
    parcelNumber: z.string(),

    status: z.enum(["DRAFT", "ACTIVE"]),

    contactId: z.string(),
    transactionType: z.enum(["SALE", "RENT"]),
    ownerPrice: z.string(),
    advertisedPrice: z.string(),

    rentalPeriod: z.enum([
        "DAILY",
        "WEEKLY",
        "MONTHLY",
        "YEARLY",
        "OTHER",
    ]),
});

type FormValues = z.infer<typeof formSchema>;

type Option = {
    id: string;
    nameAr: string;
    isActive: boolean;
};

type Contact = {
    id: string;
    fullName: string;
    phone: string;
};

type PropertyRecord = {
    id: string;
    title: string;
    typeId: string;
    locationId: string;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    description: string | null;
    address: string | null;
    internalNotes: string | null;
    areaValue: string | number | null;
    areaUnit: "SQUARE_METER" | "DUNUM" | "OTHER" | null;
    areaUnitLabel: string | null;
    details: unknown;
};

type ApiIssue = {
    path: Array<string | number>;
    message: string;
};

type ApiResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
    errors?: ApiIssue[];
};

type Props =
    | { mode: "create" }
    | { mode: "edit"; id: string };

const defaultValues: FormValues = {
    title: "",
    typeId: "",
    locationId: "",
    description: "",
    address: "",
    internalNotes: "",
    areaValue: "",
    areaUnit: "SQUARE_METER",
    areaUnitLabel: "",
    basinNumber: "",
    parcelNumber: "",
    status: "DRAFT",
    contactId: "",
    transactionType: "SALE",
    ownerPrice: "",
    advertisedPrice: "",
    rentalPeriod: "MONTHLY",
};

const fieldLabels: Record<string, string> = {
    title: "عنوان العقار",
    typeId: "نوع العقار",
    location: "المنطقة",
    contacts: "المالك",
    offerings: "العرض",
    areaValue: "المساحة",
    areaUnit: "وحدة المساحة",
    areaUnitLabel: "اسم وحدة المساحة",
    details: "تفاصيل العقار",
    address: "العنوان التفصيلي",
    status: "حالة العقار",
};

function readExtras(
    details: unknown,
): Record<string, string> {
    if (
        !details ||
        typeof details !== "object" ||
        Array.isArray(details)
    ) {
        return {};
    }

    const extras = (
        details as Record<string, unknown>
    ).extras;

    if (
        !extras ||
        typeof extras !== "object" ||
        Array.isArray(extras)
    ) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(extras).filter(
            (entry): entry is [string, string] =>
                typeof entry[1] === "string",
        ),
    );
}

function readDetails(
    details: unknown,
): Record<string, unknown> {
    if (
        !details ||
        typeof details !== "object" ||
        Array.isArray(details)
    ) {
        return {};
    }

    return details as Record<string, unknown>;
}

async function parseApiResponse<T>(
    response: Response,
): Promise<ApiResponse<T>> {
    try {
        return (await response.json()) as ApiResponse<T>;
    } catch {
        return {
            success: false,
            message: "تعذّر قراءة استجابة الخادم",
        };
    }
}

function getSaveError(
    status: number,
    result: ApiResponse<unknown>,
): string {
    if (status >= 500) {
        return (
            "حدث خطأ في الخادم. تحققي من قائمة العقارات " +
            "قبل إعادة المحاولة، فقد تكون البيانات حُفظت."
        );
    }

    const issue = result.errors?.[0];

    if (issue) {
        const field = String(issue.path[0] ?? "");
        const label =
            fieldLabels[field] ?? "البيانات المدخلة";

        console.error("Property validation errors:", result.errors);

        return `يرجى مراجعة ${label}.`;
    }

    const knownErrors: Record<string, string> = {
        "Location not found":
            "المنطقة المحددة غير موجودة.",
        "Location is inactive":
            "المنطقة المحددة غير نشطة.",
        "Property type not found":
            "نوع العقار المحدد غير موجود.",
        "Property type is inactive":
            "نوع العقار المحدد غير نشط.",
        "Contact not found":
            "جهة الاتصال المحددة غير موجودة.",
    };

    return (
        knownErrors[result.message ?? ""] ??
        result.message ??
        "تعذّر حفظ العقار"
    );
}

export function PropertyEditor(props: Props) {
    const router = useRouter();

    const propertyId =
        props.mode === "edit" ? props.id : null;

    const editing = propertyId !== null;

    const [types, setTypes] = useState<Option[]>([]);
    const [locations, setLocations] = useState<Option[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);

    const [originalDetails, setOriginalDetails] =
        useState<Record<string, unknown>>({});

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: {
            errors,
            isSubmitting,
        },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    const areaUnit = useWatch({
        control,
        name: "areaUnit",
    });

    const transactionType = useWatch({
        control,
        name: "transactionType",
    });

    const selectedTypeId = useWatch({
        control,
        name: "typeId",
    });

    const selectedLocationId = useWatch({
        control,
        name: "locationId",
    });

    useEffect(() => {
        const controller = new AbortController();

        async function loadData() {
            try {
                const urls = [
                    "/api/property-types",
                    "/api/locations",
                    ...(!propertyId
                        ? ["/api/contacts?page=1&limit=100"]
                        : []),
                    ...(propertyId
                        ? [`/api/properties/${propertyId}`]
                        : []),
                ];

                const responses = await Promise.all(
                    urls.map((url) =>
                        fetch(url, {
                            signal: controller.signal,
                            cache: "no-store",
                        }),
                    ),
                );

                const results = await Promise.all(
                    responses.map((response) =>
                        parseApiResponse<unknown>(response),
                    ),
                );

                if (controller.signal.aborted) return;

                for (let index = 0; index < results.length; index++) {
                    if (
                        !responses[index].ok ||
                        !results[index].success
                    ) {
                        const status = responses[index].status;

                        throw new Error(
                            status === 400 && propertyId
                                ? "تعذّر قراءة العقار. قد يكون المعرّف غير متوافق مع التحقق في الخادم."
                                : results[index].message ??
                                "تعذّر تحميل بيانات النموذج",
                        );
                    }
                }

                const loadedTypes = results[0].data;
                const loadedLocations = results[1].data;

                if (
                    !Array.isArray(loadedTypes) ||
                    !Array.isArray(loadedLocations)
                ) {
                    throw new Error(
                        "بيانات الأنواع أو المناطق غير صحيحة",
                    );
                }

                setTypes(loadedTypes as Option[]);
                setLocations(loadedLocations as Option[]);

                if (propertyId) {
                    const property = results[2].data as
                        | PropertyRecord
                        | undefined;

                    if (!property) {
                        throw new Error("العقار غير موجود");
                    }

                    const details = readDetails(property.details);
                    const extras = readExtras(property.details);

                    setOriginalDetails(details);

                    reset({
                        ...defaultValues,
                        title: property.title,
                        typeId: property.typeId,
                        locationId: property.locationId,
                        description: property.description ?? "",
                        address: property.address ?? "",
                        internalNotes: property.internalNotes ?? "",
                        areaValue:
                            property.areaValue == null
                                ? ""
                                : String(property.areaValue),
                        areaUnit:
                            property.areaUnit ?? "SQUARE_METER",
                        areaUnitLabel: property.areaUnitLabel ?? "",
                        basinNumber: extras.basinNumber ?? "",
                        parcelNumber: extras.parcelNumber ?? "",
                        status:
                            property.status === "ACTIVE"
                                ? "ACTIVE"
                                : "DRAFT",
                    });
                } else {
                    const contactData = results[2].data;

                    if (!Array.isArray(contactData)) {
                        throw new Error(
                            "تعذّر قراءة جهات الاتصال",
                        );
                    }

                    setContacts(contactData as Contact[]);
                }

                setLoadError("");
            } catch (caught) {
                if (controller.signal.aborted) return;

                setLoadError(
                    caught instanceof Error
                        ? caught.message
                        : "تعذّر تحميل النموذج",
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void loadData();

        return () => controller.abort();
    }, [propertyId, reset, reloadKey]);

    async function submit(values: FormValues) {
        setSubmitError("");

        const areaText = values.areaValue.trim();

        const areaNumber =
            areaText === "" ? null : Number(areaText);

        if (
            areaNumber !== null &&
            (!Number.isFinite(areaNumber) || areaNumber <= 0)
        ) {
            setSubmitError(
                "المساحة يجب أن تكون رقمًا موجبًا",
            );
            return;
        }

        if (
            areaNumber !== null &&
            values.areaUnit === "OTHER" &&
            !values.areaUnitLabel.trim()
        ) {
            setSubmitError(
                "اكتبي اسم وحدة المساحة المخصصة",
            );
            return;
        }

        const extras = {
            ...readExtras(originalDetails),
        };

        if (values.basinNumber.trim()) {
            extras.basinNumber = values.basinNumber.trim();
        } else {
            delete extras.basinNumber;
        }

        if (values.parcelNumber.trim()) {
            extras.parcelNumber = values.parcelNumber.trim();
        } else {
            delete extras.parcelNumber;
        }

        const payload: Record<string, unknown> = {
            title: values.title.trim(),
            typeId: values.typeId,

            location: {
                existingId: values.locationId,
            },

            description:
                values.description.trim() || null,

            address:
                values.address.trim() || null,

            internalNotes:
                values.internalNotes.trim() || null,

            areaValue: areaNumber,

            areaUnit:
                areaNumber === null
                    ? null
                    : values.areaUnit,

            areaUnitLabel:
                areaNumber !== null &&
                    values.areaUnit === "OTHER"
                    ? values.areaUnitLabel.trim()
                    : null,

            details: {
                ...originalDetails,
                extras,
            },
        };

        if (!editing) {
            if (!values.contactId) {
                setSubmitError("اختاري مالك العقار");
                return;
            }

            const ownerPrice = Number(values.ownerPrice);
            const advertisedPrice =
                Number(values.advertisedPrice);

            if (
                !values.ownerPrice.trim() ||
                !values.advertisedPrice.trim() ||
                !Number.isFinite(ownerPrice) ||
                !Number.isFinite(advertisedPrice) ||
                ownerPrice <= 0 ||
                advertisedPrice <= 0
            ) {
                setSubmitError(
                    "سعر المالك وسعر الإعلان يجب أن يكونا أكبر من صفر",
                );
                return;
            }

            Object.assign(payload, {
                status: values.status,

                contacts: [
                    {
                        contact: {
                            existingId: values.contactId,
                        },
                        role: "OWNER",
                        isPrimary: true,
                        canSharePhone: false,
                    },
                ],

                offerings: [
                    {
                        transactionType: values.transactionType,
                        ownerPrice,
                        advertisedPrice,

                        rentalPeriod:
                            values.transactionType === "RENT"
                                ? values.rentalPeriod
                                : null,

                        allowNegotiation: true,
                    },
                ],
            });
        }

        try {
            const response = await fetch(
                editing
                    ? `/api/properties/${propertyId}`
                    : "/api/properties",
                {
                    method: editing ? "PATCH" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                },
            );

            const result =
                await parseApiResponse<{ id: string }>(response);

            if (!response.ok || !result.success) {
                throw new Error(
                    getSaveError(response.status, result),
                );
            }

            if (!result.data?.id) {
                throw new Error(
                    "لم يرجع الخادم معرّف العقار. تحققي من حفظ البيانات قبل إعادة المحاولة.",
                );
            }

            router.push(`/properties/${result.data.id}`);
            router.refresh();
        } catch (caught) {
            setSubmitError(
                caught instanceof Error
                    ? caught.message
                    : "تعذّر حفظ العقار. تحققي من القائمة قبل إعادة المحاولة.",
            );
        }
    }

    if (loading) {
        return (
            <div
                role="status"
                className="aqar-surface p-8"
            >
                جارٍ تحميل نموذج العقار...
            </div>
        );
    }

    if (loadError) {
        return (
            <div
                role="alert"
                className="aqar-surface space-y-4 p-6"
            >
                <p className="text-danger">
                    {loadError}
                </p>

                <div className="flex gap-3">
                    <button
                        type="button"
                        className="aqar-button aqar-button-soft"
                        onClick={() => {
                            setLoading(true);
                            setLoadError("");
                            setReloadKey((value) => value + 1);
                        }}
                    >
                        إعادة المحاولة
                    </button>

                    <Link
                        href="/properties"
                        className="aqar-button aqar-button-soft"
                    >
                        العودة إلى العقارات
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <section
            dir="rtl"
            className="mx-auto max-w-5xl space-y-6"
        >
            <Link
                href="/properties"
                className="inline-flex items-center gap-2 font-semibold text-brand"
            >
                <ArrowRight size={18} aria-hidden="true" />
                العودة إلى العقارات
            </Link>

            <div>
                <h1 className="aqar-heading text-3xl">
                    {editing
                        ? "تعديل بيانات العقار"
                        : "إضافة عقار جديد"}
                </h1>

                <p className="aqar-description mt-1">
                    أدخل بيانات العقار باللغة العربية.
                    الحقول الإلزامية مميزة بنجمة.
                </p>
            </div>

            <form
                onSubmit={handleSubmit(submit)}
                noValidate
                className="space-y-5"
            >
                <section className="aqar-card grid gap-5 p-6 md:grid-cols-2">
                    <h2 className="aqar-heading text-xl md:col-span-2">
                        المعلومات الأساسية
                    </h2>

                    <label className="md:col-span-2">
                        عنوان العقار *
                        <input
                            className="aqar-input mt-2"
                            placeholder="مثال: أرض زراعية للبيع في الحصن"
                            {...register("title")}
                        />
                        {errors.title && (
                            <span className="block text-sm text-danger">
                                {errors.title.message}
                            </span>
                        )}
                    </label>

                    <label>
                        نوع العقار *
                        <select
                            className="aqar-input mt-2"
                            {...register("typeId")}
                        >
                            <option value="">اختاري نوع العقار</option>

                            {types
                                .filter(
                                    (type) =>
                                        type.isActive ||
                                        type.id === selectedTypeId,
                                )
                                .map((type) => (
                                    <option
                                        key={type.id}
                                        value={type.id}
                                    >
                                        {type.nameAr}
                                    </option>
                                ))}
                        </select>

                        {errors.typeId && (
                            <span className="block text-sm text-danger">
                                {errors.typeId.message}
                            </span>
                        )}
                    </label>

                    <label>
                        المنطقة *
                        <select
                            className="aqar-input mt-2"
                            {...register("locationId")}
                        >
                            <option value="">اختاري المنطقة</option>

                            {locations
                                .filter(
                                    (location) =>
                                        location.isActive ||
                                        location.id === selectedLocationId,
                                )
                                .map((location) => (
                                    <option
                                        key={location.id}
                                        value={location.id}
                                    >
                                        {location.nameAr}
                                    </option>
                                ))}
                        </select>

                        {errors.locationId && (
                            <span className="block text-sm text-danger">
                                {errors.locationId.message}
                            </span>
                        )}
                    </label>

                    <label className="md:col-span-2">
                        العنوان التفصيلي
                        <input
                            className="aqar-input mt-2"
                            {...register("address")}
                        />
                    </label>

                    <label className="md:col-span-2">
                        الوصف
                        <textarea
                            rows={3}
                            className="aqar-input mt-2"
                            {...register("description")}
                        />
                    </label>

                    <label>
                        المساحة
                        <input
                            dir="ltr"
                            inputMode="decimal"
                            className="aqar-input mt-2"
                            placeholder="750"
                            {...register("areaValue")}
                        />
                    </label>

                    <label>
                        وحدة المساحة
                        <select
                            className="aqar-input mt-2"
                            {...register("areaUnit")}
                        >
                            <option value="SQUARE_METER">
                                متر مربع
                            </option>
                            <option value="DUNUM">دونم</option>
                            <option value="OTHER">وحدة أخرى</option>
                        </select>
                    </label>

                    {areaUnit === "OTHER" && (
                        <label className="md:col-span-2">
                            اسم الوحدة
                            <input
                                className="aqar-input mt-2"
                                {...register("areaUnitLabel")}
                            />
                        </label>
                    )}

                    <label>
                        رقم الحوض
                        <input
                            className="aqar-input mt-2"
                            {...register("basinNumber")}
                        />
                    </label>

                    <label>
                        رقم القطعة
                        <input
                            className="aqar-input mt-2"
                            {...register("parcelNumber")}
                        />
                    </label>

                    <label className="md:col-span-2">
                        ملاحظات داخلية
                        <textarea
                            rows={3}
                            className="aqar-input mt-2"
                            {...register("internalNotes")}
                        />
                        <span className="mt-1 block text-sm text-secondary">
                            هذه المعلومات لا تظهر في الإعلانات.
                        </span>
                    </label>
                </section>

                {!editing && (
                    <section className="aqar-card grid gap-5 p-6 md:grid-cols-2">
                        <h2 className="aqar-heading text-xl md:col-span-2">
                            المالك وعرض العقار
                        </h2>

                        <label className="md:col-span-2">
                            المالك *
                            <select
                                className="aqar-input mt-2"
                                {...register("contactId")}
                            >
                                <option value="">
                                    اختاري جهة اتصال
                                </option>

                                {contacts.map((contact) => (
                                    <option
                                        key={contact.id}
                                        value={contact.id}
                                    >
                                        {contact.fullName} — {contact.phone}
                                    </option>
                                ))}
                            </select>

                            <span className="mt-1 block text-sm text-secondary">
                                تعرض القائمة أول 100 جهة اتصال.
                                إذا لم يظهر المالك، أضيفيه من
                                صفحة جهات الاتصال أولًا.
                            </span>
                        </label>

                        <label>
                            نوع العرض *
                            <select
                                className="aqar-input mt-2"
                                {...register("transactionType")}
                            >
                                <option value="SALE">للبيع</option>
                                <option value="RENT">للإيجار</option>
                            </select>
                        </label>

                        {transactionType === "RENT" && (
                            <label>
                                فترة الإيجار *
                                <select
                                    className="aqar-input mt-2"
                                    {...register("rentalPeriod")}
                                >
                                    <option value="MONTHLY">شهري</option>
                                    <option value="YEARLY">سنوي</option>
                                    <option value="WEEKLY">أسبوعي</option>
                                    <option value="DAILY">يومي</option>
                                    <option value="OTHER">أخرى</option>
                                </select>
                            </label>
                        )}

                        <label>
                            سعر المالك (د.أ) *
                            <input
                                dir="ltr"
                                inputMode="decimal"
                                className="aqar-input mt-2"
                                {...register("ownerPrice")}
                            />
                        </label>

                        <label>
                            سعر الإعلان (د.أ) *
                            <input
                                dir="ltr"
                                inputMode="decimal"
                                className="aqar-input mt-2"
                                {...register("advertisedPrice")}
                            />
                        </label>

                        <label className="md:col-span-2">
                            حالة العقار
                            <select
                                className="aqar-input mt-2"
                                {...register("status")}
                            >
                                <option value="DRAFT">مسودة</option>
                                <option value="ACTIVE">نشط</option>
                            </select>
                        </label>
                    </section>
                )}

                {editing && (
                    <p className="rounded-xl bg-accent-soft p-4 text-secondary">
                        تعديل معلومات العقار الأساسية لا
                        يغيّر الملاك أو يحذف العروض المسجلة.
                        تعديل الأسعار متاح في القسم التالي.
                    </p>
                )}

                {submitError && (
                    <p
                        role="alert"
                        className="rounded-xl bg-danger-soft p-4 text-danger"
                    >
                        {submitError}
                    </p>
                )}

                <div className="flex flex-wrap justify-end gap-3">
                    <Link
                        href="/properties"
                        className="aqar-button aqar-button-soft"
                    >
                        إلغاء
                    </Link>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="aqar-button aqar-button-primary"
                    >
                        <Save size={18} aria-hidden="true" />
                        {isSubmitting
                            ? "جارٍ الحفظ..."
                            : editing
                                ? "حفظ التعديلات"
                                : "تسجيل العقار"}
                    </button>
                </div>
            </form>
        </section>
    );
}
