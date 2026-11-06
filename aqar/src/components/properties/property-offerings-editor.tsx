
"use client";

import {
    useEffect,
    useState,
    type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

const statusLabels: Record<string, string> = {
    AVAILABLE: "متاح",
    RESERVED: "محجوز",
    UNDER_NEGOTIATION: "قيد التفاوض",
    SOLD: "مباع",
    RENTED: "مؤجّر",
    WITHDRAWN: "مسحوب",
};

type Offering = {
    id: string;
    updatedAt: string;
    transactionType: "SALE" | "RENT";
    ownerPrice: string | number;
    advertisedPrice: string | number;
    finalPrice: string | number | null;
    status: string;
};

type ApiResult = {
    success: boolean;
    message?: string;
    data?: {
        offerings: Offering[];
    };
};

type OfferingRowProps = {
    propertyId: string;
    offering: Offering;
    onSaved: () => void;
};

function OfferingRow({
    propertyId,
    offering,
    onSaved,
}: OfferingRowProps) {
    const [ownerPrice, setOwnerPrice] = useState(
        String(offering.ownerPrice),
    );

    const [advertisedPrice, setAdvertisedPrice] = useState(
        String(offering.advertisedPrice),
    );

    const [finalPrice, setFinalPrice] = useState(
        offering.finalPrice == null
            ? ""
            : String(offering.finalPrice),
    );

    const [status, setStatus] = useState(
        offering.status,
    );

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const isClosed =
        status === "SOLD" || status === "RENTED";

    const allowedStatuses =
        offering.transactionType === "SALE"
            ? [
                "AVAILABLE",
                "RESERVED",
                "UNDER_NEGOTIATION",
                "SOLD",
                "WITHDRAWN",
            ]
            : [
                "AVAILABLE",
                "RESERVED",
                "UNDER_NEGOTIATION",
                "RENTED",
                "WITHDRAWN",
            ];

    async function save(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (saving) return;

        setError("");

        const owner = Number(ownerPrice);
        const advertised = Number(advertisedPrice);
        const final = Number(finalPrice);

        if (
            !ownerPrice.trim() ||
            !advertisedPrice.trim() ||
            !Number.isFinite(owner) ||
            !Number.isFinite(advertised) ||
            owner <= 0 ||
            advertised <= 0
        ) {
            setError(
                "سعر المالك وسعر الإعلان يجب أن يكونا أكبر من صفر",
            );
            return;
        }

        if (
            isClosed &&
            (!finalPrice.trim() ||
                !Number.isFinite(final) ||
                final <= 0)
        ) {
            setError(
                "السعر النهائي مطلوب عند إتمام البيع أو الإيجار",
            );
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(
                `/api/properties/${propertyId}/offerings/${offering.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        ownerPrice: owner,
                        advertisedPrice: advertised,
                        status,
                        finalPrice: isClosed ? final : null,
                    }),
                },
            );

            const body = (await response.json()) as {
                success?: boolean;
                message?: string;
            };

            if (!response.ok || !body.success) {
                if (response.status >= 500) {
                    throw new Error(
                        "حدث خطأ في الخادم. تحققي من السعر المسجل قبل إعادة المحاولة.",
                    );
                }

                throw new Error(
                    body.message || "تعذّر حفظ العرض",
                );
            }

            onSaved();
        } catch (caught) {
            setError(
                caught instanceof Error
                    ? caught.message
                    : "تعذّر حفظ العرض",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <form
            onSubmit={save}
            className="aqar-surface space-y-5 p-6"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="aqar-heading text-xl">
                    {offering.transactionType === "SALE"
                        ? "عرض بيع"
                        : "عرض إيجار"}
                </h3>

                <span className="aqar-badge aqar-badge-active">
                    {statusLabels[offering.status] ??
                        offering.status}
                </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <label>
                    سعر المالك (د.أ)
                    <input
                        dir="ltr"
                        inputMode="decimal"
                        value={ownerPrice}
                        disabled={saving}
                        onChange={(event) =>
                            setOwnerPrice(event.target.value)
                        }
                        className="aqar-input mt-2"
                    />
                </label>

                <label>
                    سعر الإعلان (د.أ)
                    <input
                        dir="ltr"
                        inputMode="decimal"
                        value={advertisedPrice}
                        disabled={saving}
                        onChange={(event) =>
                            setAdvertisedPrice(event.target.value)
                        }
                        className="aqar-input mt-2"
                    />
                </label>

                <label>
                    حالة العرض
                    <select
                        value={status}
                        disabled={saving}
                        onChange={(event) =>
                            setStatus(event.target.value)
                        }
                        className="aqar-input mt-2"
                    >
                        {allowedStatuses.map((value) => (
                            <option
                                key={value}
                                value={value}
                            >
                                {statusLabels[value]}
                            </option>
                        ))}
                    </select>
                </label>

                {isClosed && (
                    <label>
                        السعر النهائي (د.أ)
                        <input
                            dir="ltr"
                            inputMode="decimal"
                            value={finalPrice}
                            disabled={saving}
                            onChange={(event) =>
                                setFinalPrice(event.target.value)
                            }
                            className="aqar-input mt-2"
                        />
                    </label>
                )}
            </div>

            {error && (
                <p
                    role="alert"
                    className="rounded-xl bg-danger-soft p-4 text-danger"
                >
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={saving}
                className="aqar-button aqar-button-primary"
            >
                <Save size={18} aria-hidden="true" />
                {saving
                    ? "جارٍ الحفظ..."
                    : "حفظ العرض"}
            </button>
        </form>
    );
}

export function PropertyOfferingsEditor({
    propertyId,
}: {
    propertyId: string;
}) {
    const router = useRouter();

    const [offerings, setOfferings] = useState<
        Offering[]
    >([]);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        fetch(`/api/properties/${propertyId}`, {
            cache: "no-store",
            signal: controller.signal,
        })
            .then(async (response) => {
                const body =
                    (await response.json()) as ApiResult;

                if (
                    !response.ok ||
                    !body.success ||
                    !body.data ||
                    !Array.isArray(body.data.offerings)
                ) {
                    throw new Error(
                        body.message || "تعذّر تحميل العروض",
                    );
                }

                return body.data.offerings;
            })
            .then((data) => {
                if (controller.signal.aborted) return;

                setOfferings(data);
                setError("");
            })
            .catch((caught: unknown) => {
                if (controller.signal.aborted) return;

                setError(
                    caught instanceof Error
                        ? caught.message
                        : "تعذّر تحميل العروض",
                );
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [propertyId, reloadKey]);

    function handleSaved() {
        setLoading(true);
        setReloadKey((value) => value + 1);
        router.refresh();
    }

    return (
        <section className="space-y-5">
            <div>
                <h2 className="aqar-heading text-2xl">
                    العروض والأسعار
                </h2>

                <p className="aqar-description mt-1">
                    يمكنك تعديل الأسعار وحالة العرض.
                    يتم حفظ التغييرات في قاعدة البيانات.
                </p>
            </div>

            {loading && (
                <div
                    role="status"
                    className="aqar-surface p-6 text-secondary"
                >
                    جارٍ تحميل العروض...
                </div>
            )}

            {error && (
                <p
                    role="alert"
                    className="rounded-xl bg-danger-soft p-4 text-danger"
                >
                    {error}
                </p>
            )}

            {!loading &&
                !error &&
                offerings.length === 0 && (
                    <div className="aqar-surface p-6 text-secondary">
                        لا توجد عروض مسجلة لهذا العقار.
                    </div>
                )}

            {!loading &&
                !error &&
                offerings.map((offering) => (
                    <OfferingRow
                        key={`${offering.id}-${offering.updatedAt}`}
                        propertyId={propertyId}
                        offering={offering}
                        onSaved={handleSaved}
                    />
                ))}
        </section>
    );
}
