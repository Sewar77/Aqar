
"use client";

import {
    useState,
    type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import {
    Archive,
    Pencil,
    RotateCcw,
    Save,
    Trash2,
    X,
} from "lucide-react";

type Status = "DRAFT" | "ACTIVE" | "ARCHIVED";

type AreaUnit =
    | "SQUARE_METER"
    | "DUNUM"
    | "OTHER"
    | null;

type PropertyForActions = {
    id: string;
    title: string;
    description: string | null;
    internalNotes: string | null;
    address: string | null;
    status: Status;
    latitude: number | null;
    longitude: number | null;
    areaValue: number | null;
    areaUnit: AreaUnit;
    areaUnitLabel: string | null;
    details: Record<string, unknown>;
    updatedAt: string;
    contactsCount: number;
    offeringsCount: number;
    photosCount: number;
    childPropertiesCount: number;
};

const labels: Record<string, string> = {
    locationDetails: "الموقع والحوض",
    areas: "تفاصيل المساحات",
    features: "الميزات",
    basinName: "اسم الحوض",
    basinNumber: "رقم الحوض",
    parcelNumber: "رقم القطعة",
    googleMapsUrl: "رابط Google Maps",
    directions: "وصف الطريق",
    landmarks: "معالم قريبة",
    nearbyServices: "الخدمات والشوارع القريبة",
    landAreaSqm: "مساحة الأرض (م²)",
    buildingAreaSqm: "مساحة البناء (م²)",
    gardenAreaSqm: "مساحة الحديقة (م²)",
    roofAreaSqm: "مساحة السطح (م²)",
    frontageMeters: "طول الواجهة (متر)",
    cultivatedAreaSqm: "المساحة المزروعة (م²)",
    rooms: "عدد الغرف",
    bedrooms: "غرف النوم",
    bathrooms: "الحمامات",
    livingRooms: "الصالونات",
    kitchens: "المطابخ",
    floorNumber: "رقم الطابق",
    totalFloors: "عدد الطوابق",
    apartmentCount: "عدد الشقق",
    buildingAgeYears: "عمر البناء (سنوات)",
    parkingSpaces: "مواقف السيارات",
    treeCount: "عدد الأشجار",
    streetWidthMeters: "عرض الشارع (متر)",
    zoning: "التنظيم",
    landUse: "استعمال الأرض",
    condition: "حالة العقار",
    roomDetails: "تفاصيل الغرف",
    apartments: "تفاصيل الشقق",
    floorAreas: "مساحات الطوابق",
    label: "اسم الوحدة",
    nameAr: "اسم الغرفة",
    count: "العدد",
    areaSqm: "المساحة (م²)",
    description: "الوصف",
    floor: "رقم الطابق",
    extras: "تفاصيل أخرى",
};

const optionalFields: Record<
    string,
    Record<string, unknown>
> = {
    locationDetails: {
        basinName: "",
        basinNumber: "",
        parcelNumber: "",
        googleMapsUrl: "",
        directions: "",
        landmarks: "",
        nearbyServices: "",
    },

    areas: {
        landAreaSqm: 1,
        buildingAreaSqm: 1,
        gardenAreaSqm: 0,
        roofAreaSqm: 0,
        frontageMeters: 0,
        cultivatedAreaSqm: 0,
    },

    root: {
        rooms: 0,
        bedrooms: 0,
        bathrooms: 0,
        livingRooms: 0,
        kitchens: 0,
        floorNumber: 0,
        totalFloors: 0,
        apartmentCount: 0,
        buildingAgeYears: 0,
        parkingSpaces: 0,
        treeCount: 0,
        streetWidthMeters: 0,
        zoning: "",
        landUse: "",
        condition: "",
    },
};

const inputClass =
    "w-full rounded-xl border border-[#d8e0d5] " +
    "bg-white px-3 py-2.5 text-sm text-[#293c2d] " +
    "outline-none focus:border-[#346747]";

const actionClass =
    "inline-flex items-center justify-center gap-2 " +
    "rounded-xl px-4 py-2.5 text-sm font-bold transition " +
    "disabled:cursor-not-allowed disabled:opacity-50";

function isObject(
    value: unknown,
): value is Record<string, unknown> {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function arrayTemplate(key: string): unknown {
    if (key === "roomDetails") {
        return {
            nameAr: "",
            count: 1,
            areaSqm: null,
            description: "",
        };
    }

    if (key === "apartments") {
        return {
            label: "شقة جديدة",
            areaSqm: 1,
            bedrooms: 0,
            bathrooms: 0,
            description: "",
        };
    }

    if (key === "floorAreas") {
        return {
            floor: 1,
            areaSqm: 1,
        };
    }

    return "";
}

// Recursive editor for saved property details.
function DetailsEditor({
    label,
    value,
    onChange,
    group = "",
    depth = 0,
}: {
    label: string;
    value: unknown;
    onChange: (next: unknown) => void;
    group?: string;
    depth?: number;
}) {
    if (depth > 12) {
        return <p>هذا الحقل متداخل جدًا.</p>;
    }

    if (Array.isArray(value)) {
        return (
            <div className="space-y-3 rounded-xl border border-[#e3e9df] p-3">
                <p className="font-semibold text-[#365440]">
                    {labels[label] || label} ({value.length})
                </p>

                {value.map((item, index) => (
                    <div
                        key={index}
                        className="rounded-xl bg-[#f7f9f5] p-3"
                    >
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#678069]">
                                العنصر {index + 1}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    onChange(
                                        value.filter(
                                            (_, i) => i !== index,
                                        ),
                                    )
                                }
                                className="text-xs font-semibold text-red-700"
                            >
                                إزالة
                            </button>
                        </div>

                        <DetailsEditor
                            label={
                                label === "features"
                                    ? "ميزة"
                                    : `عنصر ${index + 1}`
                            }
                            value={item}
                            onChange={(next) =>
                                onChange(
                                    value.map((v, i) =>
                                        i === index ? next : v,
                                    ),
                                )
                            }
                            depth={depth + 1}
                        />
                    </div>
                ))}

                <button
                    type="button"
                    onClick={() =>
                        onChange([
                            ...value,
                            arrayTemplate(label),
                        ])
                    }
                    className="rounded-lg border border-[#b9cdb8] px-3 py-2 text-sm font-semibold text-[#346747]"
                >
                    + إضافة عنصر
                </button>
            </div>
        );
    }

    if (isObject(value)) {
        const options =
            optionalFields[label] ??
            optionalFields[group];

        const available = options
            ? Object.keys(options).filter(
                (key) => !(key in value),
            )
            : [];

        return (
            <fieldset className="space-y-3 rounded-xl border border-[#e3e9df] p-3">
                <legend className="px-2 text-sm font-bold text-[#365440]">
                    {labels[label] || label}
                </legend>

                <div className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(value).map(
                        ([key, child]) => (
                            <div
                                key={key}
                                className={
                                    isObject(child) ||
                                        Array.isArray(child)
                                        ? "sm:col-span-2"
                                        : ""
                                }
                            >
                                <DetailsEditor
                                    label={key}
                                    group={label}
                                    value={child}
                                    onChange={(next) =>
                                        onChange({
                                            ...value,
                                            [key]: next,
                                        })
                                    }
                                    depth={depth + 1}
                                />
                            </div>
                        ),
                    )}
                </div>

                {available.length > 0 && (
                    <select
                        aria-label={`إضافة حقل إلى ${labels[label] || label
                            }`}
                        className={inputClass}
                        value=""
                        onChange={(event) => {
                            const key = event.target.value;

                            if (key && options) {
                                onChange({
                                    ...value,
                                    [key]: options[key],
                                });
                            }
                        }}
                    >
                        <option value="">
                            + إضافة حقل غير مسجل
                        </option>

                        {available.map((key) => (
                            <option key={key} value={key}>
                                {labels[key] || key}
                            </option>
                        ))}
                    </select>
                )}
            </fieldset>
        );
    }

    if (typeof value === "boolean") {
        return (
            <label className="flex items-center gap-2 text-sm font-semibold text-[#365440]">
                <input
                    type="checkbox"
                    checked={value}
                    onChange={(event) =>
                        onChange(event.target.checked)
                    }
                />
                {labels[label] || label}
            </label>
        );
    }

    const numeric =
        typeof value === "number" ||
        (value === null &&
            ["areaSqm", "count"].includes(label));

    return (
        <label className="block space-y-1 text-sm font-semibold text-[#365440]">
            <span>{labels[label] || label}</span>

            <input
                className={inputClass}
                type={numeric ? "number" : "text"}
                step={numeric ? "any" : undefined}
                value={
                    value == null ? "" : String(value)
                }
                onChange={(event) =>
                    onChange(
                        numeric
                            ? event.target.value === ""
                                ? null
                                : Number(event.target.value)
                            : event.target.value,
                    )
                }
            />
        </label>
    );
}

function asMessage(
    result: unknown,
    fallback: string,
) {
    if (
        isObject(result) &&
        typeof result.message === "string"
    ) {
        return result.message;
    }

    if (
        isObject(result) &&
        Array.isArray(result.errors)
    ) {
        const issue = result.errors[0];

        if (
            isObject(issue) &&
            typeof issue.message === "string"
        ) {
            return issue.message;
        }
    }

    return fallback;
}

export function PropertyDetailsActions({
    property,
}: {
    property: PropertyForActions;
}) {
    const router = useRouter();

    const [modal, setModal] = useState<
        "edit" | "delete" | null
    >(null);

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [confirmTitle, setConfirmTitle] =
        useState("");

    const [confirmCheck, setConfirmCheck] =
        useState(false);

    const [draft, setDraft] = useState(() => ({
        title: property.title,
        description: property.description ?? "",
        internalNotes: property.internalNotes ?? "",
        address: property.address ?? "",
        latitude:
            property.latitude == null
                ? ""
                : String(property.latitude),
        longitude:
            property.longitude == null
                ? ""
                : String(property.longitude),
        areaValue:
            property.areaValue == null
                ? ""
                : String(property.areaValue),
        areaUnit:
            property.areaUnit ?? "SQUARE_METER",
        areaUnitLabel:
            property.areaUnitLabel ?? "",
        status: property.status,
    }));

    const [details, setDetails] = useState<
        Record<string, unknown>
    >(property.details);

    function openEdit() {
        setDraft({
            title: property.title,
            description: property.description ?? "",
            internalNotes: property.internalNotes ?? "",
            address: property.address ?? "",
            latitude:
                property.latitude == null
                    ? ""
                    : String(property.latitude),
            longitude:
                property.longitude == null
                    ? ""
                    : String(property.longitude),
            areaValue:
                property.areaValue == null
                    ? ""
                    : String(property.areaValue),
            areaUnit:
                property.areaUnit ?? "SQUARE_METER",
            areaUnitLabel:
                property.areaUnitLabel ?? "",
            status: property.status,
        });

        setDetails(
            JSON.parse(
                JSON.stringify(property.details),
            ) as Record<string, unknown>,
        );

        setError("");
        setNotice("");
        setModal("edit");
    }

    async function send(
        method: "PATCH" | "DELETE",
        payload: Record<string, unknown>,
    ) {
        const response = await fetch(
            `/api/properties/${property.id}/manage`,
            {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            },
        );

        const result: unknown = await response
            .json()
            .catch(() => null);

        if (
            !response.ok ||
            !isObject(result) ||
            result.success !== true
        ) {
            throw new Error(
                asMessage(
                    result,
                    "تعذّر حفظ التعديلات",
                ),
            );
        }

        return result;
    }

    async function archiveOrRestore() {
        if (busy) return;

        setBusy(true);
        setError("");
        setNotice("");

        try {
            const next =
                property.status === "ARCHIVED"
                    ? "ACTIVE"
                    : "ARCHIVED";

            await send("PATCH", {
                expectedUpdatedAt:
                    property.updatedAt,
                status: next,
            });

            setNotice(
                next === "ARCHIVED"
                    ? "تمت أرشفة العقار"
                    : "تم استرجاع العقار",
            );

            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "تعذّر تغيير الحالة",
            );
        } finally {
            setBusy(false);
        }
    }

    async function saveEdit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (busy) return;

        setBusy(true);
        setError("");

        try {
            if (
                !draft.title.trim() ||
                draft.title.trim().length < 3
            ) {
                throw new Error(
                    "اسم العقار يجب ألا يقل عن 3 أحرف",
                );
            }

            if (
                !draft.areaValue ||
                Number(draft.areaValue) <= 0
            ) {
                throw new Error(
                    "أدخلي مساحة العقار بشكل صحيح",
                );
            }

            await send("PATCH", {
                expectedUpdatedAt:
                    property.updatedAt,

                title: draft.title.trim(),

                description:
                    draft.description.trim() || null,

                internalNotes:
                    draft.internalNotes.trim() || null,

                address:
                    draft.address.trim() || null,

                latitude:
                    draft.latitude === ""
                        ? null
                        : Number(draft.latitude),

                longitude:
                    draft.longitude === ""
                        ? null
                        : Number(draft.longitude),

                areaValue: Number(draft.areaValue),
                areaUnit: draft.areaUnit,

                areaUnitLabel:
                    draft.areaUnit === "OTHER"
                        ? draft.areaUnitLabel.trim()
                        : null,

                status: draft.status,
                details,
            });

            setModal(null);
            setNotice(
                "تم تعديل بيانات العقار بنجاح",
            );
            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "تعذّر تعديل العقار",
            );
        } finally {
            setBusy(false);
        }
    }

    async function deleteProperty() {
        if (
            busy ||
            confirmTitle !== property.title ||
            !confirmCheck
        ) {
            return;
        }

        setBusy(true);
        setError("");

        try {
            await send("DELETE", {
                confirm: true,
                confirmTitle: property.title,
                expectedUpdatedAt:
                    property.updatedAt,

                expectedContactsCount:
                    property.contactsCount,

                expectedOfferingsCount:
                    property.offeringsCount,

                expectedPhotosCount:
                    property.photosCount,

                expectedChildPropertiesCount:
                    property.childPropertiesCount,
            });

            setModal(null);
            router.replace("/properties");
            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "تعذّر حذف العقار",
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    disabled={busy}
                    onClick={openEdit}
                    className={`${actionClass} bg-[#346747] text-white hover:bg-[#285338]`}
                >
                    <Pencil size={17} />
                    تعديل العقار
                </button>

                <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                        void archiveOrRestore()
                    }
                    className={`${actionClass} bg-[#f1f3ec] text-[#496149] hover:bg-[#e5ecdf]`}
                >
                    {property.status === "ARCHIVED" ? (
                        <RotateCcw size={17} />
                    ) : (
                        <Archive size={17} />
                    )}

                    {property.status === "ARCHIVED"
                        ? "استرجاع العقار"
                        : "أرشفة العقار"}
                </button>

                <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                        setModal("delete");
                        setError("");
                        setConfirmTitle("");
                        setConfirmCheck(false);
                    }}
                    className={`${actionClass} bg-red-50 text-red-700 hover:bg-red-100`}
                >
                    <Trash2 size={17} />
                    حذف نهائي
                </button>
            </div>

            {notice && (
                <p
                    role="status"
                    className="rounded-xl bg-[#e8f2e4] p-3 text-sm font-semibold text-[#285338]"
                >
                    {notice}
                </p>
            )}

            {error && modal === null && (
                <p
                    role="alert"
                    className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                >
                    {error}
                </p>
            )}

            <Dialog.Root
                open={modal !== null}
                onOpenChange={(open) => {
                    if (!open && !busy) {
                        setModal(null);
                    }
                }}
            >
                <Dialog.Portal>
                    <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50" />

                    <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 md:p-5">
                        <Dialog.Popup
                            dir="rtl"
                            className="my-auto w-full max-w-3xl rounded-2xl bg-[#f9faf7] p-5 shadow-2xl outline-none md:p-7"
                        >
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <Dialog.Title className="text-xl font-bold text-[#28432f]">
                                    {modal === "edit"
                                        ? "تعديل بيانات العقار"
                                        : "تأكيد الحذف النهائي"}
                                </Dialog.Title>

                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => setModal(null)}
                                    aria-label="إغلاق"
                                    className="rounded-lg p-2 text-[#657365] hover:bg-[#eaf0e5]"
                                >
                                    <X size={19} />
                                </button>
                            </div>

                            {modal === "edit" ? (
                                <form
                                    onSubmit={(event) =>
                                        void saveEdit(event)
                                    }
                                    className="space-y-4"
                                >
                                    <Dialog.Description className="text-sm text-[#667667]">
                                        عدّلي المعلومات والتفاصيل
                                        المحفوظة. الملاك والعروض
                                        والصور تُدار بشكل منفصل.
                                    </Dialog.Description>

                                    <div className="max-h-[68vh] space-y-4 overflow-y-auto px-1 pb-2">
                                        <label className="block space-y-1 text-sm font-semibold">
                                            اسم العقار *
                                            <input
                                                className={inputClass}
                                                required
                                                minLength={3}
                                                maxLength={200}
                                                value={draft.title}
                                                onChange={(event) =>
                                                    setDraft({
                                                        ...draft,
                                                        title:
                                                            event.target.value,
                                                    })
                                                }
                                            />
                                        </label>

                                        <label className="block space-y-1 text-sm font-semibold">
                                            الوصف
                                            <textarea
                                                className={inputClass}
                                                rows={3}
                                                value={draft.description}
                                                onChange={(event) =>
                                                    setDraft({
                                                        ...draft,
                                                        description:
                                                            event.target.value,
                                                    })
                                                }
                                            />
                                        </label>

                                        <label className="block space-y-1 text-sm font-semibold">
                                            العنوان
                                            <input
                                                className={inputClass}
                                                value={draft.address}
                                                onChange={(event) =>
                                                    setDraft({
                                                        ...draft,
                                                        address:
                                                            event.target.value,
                                                    })
                                                }
                                            />
                                        </label>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <label className="block space-y-1 text-sm font-semibold">
                                                خط العرض
                                                <input
                                                    className={inputClass}
                                                    dir="ltr"
                                                    type="number"
                                                    min={-90}
                                                    max={90}
                                                    step="any"
                                                    value={draft.latitude}
                                                    onChange={(event) =>
                                                        setDraft({
                                                            ...draft,
                                                            latitude:
                                                                event.target.value,
                                                        })
                                                    }
                                                />
                                            </label>

                                            <label className="block space-y-1 text-sm font-semibold">
                                                خط الطول
                                                <input
                                                    className={inputClass}
                                                    dir="ltr"
                                                    type="number"
                                                    min={-180}
                                                    max={180}
                                                    step="any"
                                                    value={draft.longitude}
                                                    onChange={(event) =>
                                                        setDraft({
                                                            ...draft,
                                                            longitude:
                                                                event.target.value,
                                                        })
                                                    }
                                                />
                                            </label>

                                            <label className="block space-y-1 text-sm font-semibold">
                                                المساحة الرئيسية *
                                                <input
                                                    className={inputClass}
                                                    type="number"
                                                    min={0.01}
                                                    step="any"
                                                    required
                                                    value={draft.areaValue}
                                                    onChange={(event) =>
                                                        setDraft({
                                                            ...draft,
                                                            areaValue:
                                                                event.target.value,
                                                        })
                                                    }
                                                />
                                            </label>

                                            <label className="block space-y-1 text-sm font-semibold">
                                                وحدة المساحة
                                                <select
                                                    className={inputClass}
                                                    value={draft.areaUnit}
                                                    onChange={(event) =>
                                                        setDraft({
                                                            ...draft,
                                                            areaUnit:
                                                                event.target.value as NonNullable<AreaUnit>,
                                                        })
                                                    }
                                                >
                                                    <option value="SQUARE_METER">
                                                        متر مربع
                                                    </option>
                                                    <option value="DUNUM">
                                                        دونم
                                                    </option>
                                                    <option value="OTHER">
                                                        أخرى
                                                    </option>
                                                </select>
                                            </label>

                                            {draft.areaUnit === "OTHER" && (
                                                <label className="block space-y-1 text-sm font-semibold">
                                                    اسم الوحدة
                                                    <input
                                                        className={inputClass}
                                                        value={
                                                            draft.areaUnitLabel
                                                        }
                                                        onChange={(event) =>
                                                            setDraft({
                                                                ...draft,
                                                                areaUnitLabel:
                                                                    event.target.value,
                                                            })
                                                        }
                                                    />
                                                </label>
                                            )}

                                            <label className="block space-y-1 text-sm font-semibold">
                                                حالة السجل
                                                <select
                                                    className={inputClass}
                                                    value={draft.status}
                                                    onChange={(event) =>
                                                        setDraft({
                                                            ...draft,
                                                            status:
                                                                event.target.value as Status,
                                                        })
                                                    }
                                                >
                                                    <option value="ACTIVE">
                                                        نشط
                                                    </option>
                                                    <option value="DRAFT">
                                                        مسودة
                                                    </option>
                                                    <option value="ARCHIVED">
                                                        مؤرشف
                                                    </option>
                                                </select>
                                            </label>
                                        </div>

                                        <div className="space-y-3 rounded-xl border border-[#e1e9df] bg-white p-4">
                                            <h3 className="text-lg font-bold text-[#29442f]">
                                                تفاصيل العقار حسب النوع
                                            </h3>

                                            <p className="text-xs text-[#6f816f]">
                                                كل الحقول المخزنة ظاهرة
                                                ويمكن تعديلها. يمكنك إضافة
                                                حقول ناقصة من القوائم
                                                أسفل الأقسام.
                                            </p>

                                            <DetailsEditor
                                                label="root"
                                                group="root"
                                                value={details}
                                                onChange={(next) => {
                                                    if (isObject(next)) {
                                                        setDetails(next);
                                                    }
                                                }}
                                            />
                                        </div>

                                        <label className="block space-y-1 text-sm font-semibold">
                                            ملاحظات داخلية
                                            <textarea
                                                className={inputClass}
                                                rows={3}
                                                value={
                                                    draft.internalNotes
                                                }
                                                onChange={(event) =>
                                                    setDraft({
                                                        ...draft,
                                                        internalNotes:
                                                            event.target.value,
                                                    })
                                                }
                                            />
                                        </label>
                                    </div>

                                    {error && (
                                        <p
                                            role="alert"
                                            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                                        >
                                            {error}
                                        </p>
                                    )}

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() =>
                                                setModal(null)
                                            }
                                            className={`${actionClass} bg-[#e9ece6]`}
                                        >
                                            إلغاء
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={busy}
                                            className={`${actionClass} bg-[#346747] text-white`}
                                        >
                                            <Save size={16} />
                                            {busy
                                                ? "جارٍ الحفظ..."
                                                : "حفظ التعديلات"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <Dialog.Description className="leading-7 text-[#475f4c]">
                                        أنت على وشك حذف العقار{" "}
                                        <strong>
                                            {property.title}
                                        </strong>{" "}
                                        بشكل نهائي.
                                    </Dialog.Description>

                                    <div
                                        role="alert"
                                        className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-7 text-red-800"
                                    >
                                        <p className="text-lg font-bold">
                                            تحذير: لا يمكن التراجع
                                            عن الحذف
                                        </p>

                                        <p>
                                            سيتم حذف العقار و
                                            <strong>
                                                {property.contactsCount}
                                            </strong>{" "}
                                            علاقة بجهات الاتصال،
                                            و
                                            <strong>
                                                {property.offeringsCount}
                                            </strong>{" "}
                                            عرض بيع/إيجار،
                                            و
                                            <strong>
                                                {property.photosCount}
                                            </strong>{" "}
                                            سجل صورة، وسجل التغييرات.
                                        </p>

                                        <p>
                                            لن يتم حذف أشخاص
                                            جهات الاتصال أنفسهم.
                                            هناك{" "}
                                            <strong>
                                                {property.childPropertiesCount}
                                            </strong>{" "}
                                            عقار تابع؛ ستُزال
                                            علاقته بالعقار المحذوف فقط،
                                            وفق إعدادات قاعدة البيانات.
                                        </p>

                                        <p>
                                            ملفات الصور المخزنة في
                                            Cloudinary لن تُحذف تلقائيًا.
                                        </p>
                                    </div>

                                    <label className="block space-y-2 text-sm font-semibold">
                                        اكتبي اسم العقار حرفيًا:{" "}
                                        <strong className="text-red-700">
                                            {property.title}
                                        </strong>

                                        <input
                                            className={inputClass}
                                            autoComplete="off"
                                            value={confirmTitle}
                                            onChange={(event) =>
                                                setConfirmTitle(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </label>

                                    <label className="flex items-start gap-2 text-sm leading-7">
                                        <input
                                            type="checkbox"
                                            className="mt-1 h-5 w-5 accent-red-700"
                                            checked={confirmCheck}
                                            onChange={(event) =>
                                                setConfirmCheck(
                                                    event.target.checked,
                                                )
                                            }
                                        />

                                        <span>
                                            راجعت البيانات المرتبطة
                                            وأوافق على الحذف النهائي.
                                        </span>
                                    </label>

                                    {error && (
                                        <p
                                            role="alert"
                                            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                                        >
                                            {error}
                                        </p>
                                    )}

                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() =>
                                                setModal(null)
                                            }
                                            className={`${actionClass} bg-[#e9ece6]`}
                                        >
                                            إلغاء
                                        </button>

                                        <button
                                            type="button"
                                            disabled={
                                                busy ||
                                                !confirmCheck ||
                                                confirmTitle !==
                                                property.title
                                            }
                                            onClick={() =>
                                                void deleteProperty()
                                            }
                                            className={`${actionClass} bg-red-700 text-white`}
                                        >
                                            {busy
                                                ? "جارٍ الحذف..."
                                                : "حذف العقار نهائيًا"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Dialog.Popup>
                    </Dialog.Viewport>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
