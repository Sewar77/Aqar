
"use client";

import {
    useEffect,
    useMemo,
    useState,
    type FormEvent,
    type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Building2,
    ImagePlus,
    MapPin,
    Plus,
    Save,
    Tags,
    Trash2,
} from "lucide-react";

type ApiResult<T> = {
    success: boolean;
    data?: T;
    message?: string;
    errors?: {
        path: (string | number)[];
        message: string;
    }[];
    pagination?: {
        page: number;
        totalPages: number;
        total: number;
    };
};

type PropertyType = {
    id: string;
    code: string;
    nameAr: string;
    isActive: boolean;
};

type PickItem = {
    id: string;
    nameAr?: string;
    fullName?: string;
    phone?: string;
};

type Room = {
    nameAr: string;
    count: string;
    areaSqm: string;
    description: string;
};

type Apartment = {
    label: string;
    areaSqm: string;
    bedrooms: string;
    bathrooms: string;
    description: string;
};

type Floor = {
    floor: string;
    areaSqm: string;
};

type Offer = {
    transactionType: "SALE" | "RENT";
    ownerPrice: string;
    advertisedPrice: string;
    finalPrice: string;
    rentalPeriod: string;
    allowNegotiation: boolean;
    status: string;
    notes: string;
};

type ContactItem = {
    key: string;
    mode: "existing" | "new";
    existingId: string;
    fullName: string;
    phone: string;
    alternativePhone: string;
    notes: string;
    role: "OWNER" | "CO_OWNER" | "AUTHORIZED_REPRESENTATIVE";
    isPrimary: boolean;
    canSharePhone: boolean;
};

const control =
    "w-full rounded-xl border border-[#d8ddcf] bg-white " +
    "px-3 py-2.5 text-[#263b2b] outline-none " +
    "focus:border-[#456b4f] focus:ring-2 focus:ring-[#456b4f]/15";

const secondary =
    "rounded-xl border border-[#d8ddcf] bg-white px-3 py-2 " +
    "text-sm font-semibold text-[#365440] hover:bg-[#edf3e9] " +
    "disabled:opacity-50";

const initialOffer = (): Offer => ({
    transactionType: "SALE",
    ownerPrice: "",
    advertisedPrice: "",
    finalPrice: "",
    rentalPeriod: "",
    allowNegotiation: true,
    status: "AVAILABLE",
    notes: "",
});

const initialContact = (): ContactItem => ({
    key: crypto.randomUUID(),
    mode: "existing",
    existingId: "",
    fullName: "",
    phone: "",
    alternativePhone: "",
    notes: "",
    role: "OWNER",
    isPrimary: true,
    canSharePhone: false,
});

const numberOrUndefined = (value: string) =>
    value.trim() === "" ? undefined : Number(value);

const trimOrUndefined = (value: string) =>
    value.trim() || undefined;

const areaKinds = [
    ["landAreaSqm", "مساحة الأرض (م²)"],
    ["buildingAreaSqm", "مساحة البناء (م²)"],
    ["gardenAreaSqm", "مساحة الحديقة (م²)"],
    ["roofAreaSqm", "مساحة السطح (م²)"],
    ["frontageMeters", "طول الواجهة (متر)"],
    ["cultivatedAreaSqm", "المساحة المزروعة (م²)"],
] as const;

type AreaKey = (typeof areaKinds)[number][0];

const featureSuggestions: Record<string, string[]> = {
    LAND: [
        "على شارع",
        "على شارعين",
        "على ثلاث شوارع",
        "أرض مستوية",
        "أرض مائلة",
        "قريبة من الخدمات",
        "ماء",
        "كهرباء",
        "إطلالة",
        "سور",
        "شارع معبّد",
    ],
    HOUSE: [
        "كراج",
        "حديقة",
        "سور",
        "بئر ماء",
        "على شارع",
        "على شارعين",
        "تدفئة",
        "تكييف",
        "طاقة شمسية",
        "بلكونة",
        "مدخل مستقل",
        "تشطيب حديث",
    ],
    APARTMENT: [
        "مصعد",
        "كراج",
        "بلكونة",
        "مفروشة",
        "تدفئة",
        "تكييف",
        "مستودع",
        "إطلالة",
        "قريبة من الخدمات",
    ],
    BUILDING: [
        "مصعد",
        "كراج",
        "على شارع",
        "على شارعين",
        "مداخل مستقلة",
        "سور",
        "تشطيب حديث",
        "مؤجرة",
        "قريبة من الخدمات",
    ],
    COMMERCIAL: [
        "واجهة زجاج",
        "شارع تجاري",
        "موقف سيارات",
        "مستودع",
        "مدخل مستقل",
        "على شارع",
        "على شارعين",
        "تشطيب جاهز",
    ],
    FARM: [
        "بئر ماء",
        "شبكة ري",
        "سور",
        "أشجار مثمرة",
        "زيتون",
        "كهرباء",
        "منزل",
        "مخزن",
        "شارع معبّد",
        "على شارع",
    ],
    OTHER: [
        "على شارع",
        "كراج",
        "حديقة",
        "سور",
        "ماء",
        "كهرباء",
        "قريبة من الخدمات",
    ],
};

function Section({
    title,
    note,
    children,
}: {
    title: string;
    note?: string;
    children: ReactNode;
}) {
    return (
        <section className="space-y-4 rounded-2xl border border-[#e2e6dc] bg-white p-5 shadow-sm sm:p-6">
            <div className="border-b border-[#ecefe8] pb-3">
                <h2 className="text-xl font-bold text-[#29442f]">
                    {title}
                </h2>
                {note && (
                    <p className="mt-1 text-sm text-[#718071]">
                        {note}
                    </p>
                )}
            </div>
            {children}
        </section>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <label className="block space-y-1.5 text-sm font-semibold text-[#374d3b]">
            <span>{label}</span>
            {children}
        </label>
    );
}

function SmallNumber({
    label,
    value,
    onChange,
    min = 0,
    required = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    min?: number;
    required?: boolean;
}) {
    return (
        <Field label={label}>
            <input
                className={control}
                type="number"
                min={min}
                required={required}
                step="any"
                inputMode="decimal"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </Field>
    );
}

function PagedPicker({
    kind,
    value,
    onChange,
    placeholder,
}: {
    kind: "locations" | "contacts";
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [items, setItems] = useState<PickItem[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);

    const [savedOption, setSavedOption] =
        useState<PickItem | null>(null);

    useEffect(() => {
        const abort = new AbortController();

        const timer = setTimeout(async () => {
            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: "10",
                    isActive: "true",
                });

                if (search.trim()) {
                    params.set("search", search.trim());
                }

                const response = await fetch(
                    `/api/${kind}?${params}`,
                    {
                        signal: abort.signal,
                        cache: "no-store",
                    },
                );

                const body =
                    (await response.json()) as ApiResult<PickItem[]>;

                if (
                    !response.ok ||
                    !body.success ||
                    !Array.isArray(body.data)
                ) {
                    throw new Error(
                        body.message || "تعذّر تحميل القائمة",
                    );
                }

                if (!abort.signal.aborted) {
                    setItems(body.data);
                    setTotalPages(body.pagination?.totalPages || 1);
                    setError("");

                    if (value) {
                        const selected = body.data.find(
                            (item) => item.id === value,
                        );

                        if (selected) {
                            setSavedOption(selected);
                        }
                    }
                }
            } catch (error) {
                if (!abort.signal.aborted) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "تعذّر التحميل",
                    );
                }
            } finally {
                if (!abort.signal.aborted) {
                    setBusy(false);
                }
            }
        }, 250);

        return () => {
            abort.abort();
            clearTimeout(timer);
        };
    }, [kind, search, page, value]);

    const hasValueInPage = items.some(
        (item) => item.id === value,
    );

    const visible =
        value &&
            savedOption?.id === value &&
            !hasValueInPage
            ? [savedOption, ...items]
            : items;

    return (
        <div className="space-y-2">
            <input
                className={control}
                value={search}
                onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                    setBusy(true);
                }}
                placeholder={`ابحث عن ${kind === "locations"
                    ? "منطقة"
                    : "جهة اتصال"
                    }...`}
            />

            <select
                className={control}
                value={value}
                onChange={(event) => {
                    onChange(event.target.value);

                    const selected = visible.find(
                        (item) => item.id === event.target.value,
                    );

                    if (selected) {
                        setSavedOption(selected);
                    }
                }}
            >
                <option value="">
                    {busy ? "جارٍ التحميل..." : placeholder}
                </option>

                {visible.map((item) => (
                    <option key={item.id} value={item.id}>
                        {kind === "locations"
                            ? item.nameAr
                            : `${item.fullName} — ${item.phone}`}
                    </option>
                ))}
            </select>

            <div className="flex items-center justify-between gap-2 text-xs text-[#718071]">
                <button
                    type="button"
                    className={secondary}
                    disabled={busy || page <= 1}
                    onClick={() => {
                        setPage((current) => current - 1);
                        setBusy(true);
                    }}
                >
                    السابق
                </button>

                <span>
                    صفحة {page} من {totalPages}
                </span>

                <button
                    type="button"
                    className={secondary}
                    disabled={busy || page >= totalPages}
                    onClick={() => {
                        setPage((current) => current + 1);
                        setBusy(true);
                    }}
                >
                    التالي
                </button>
            </div>

            {error && (
                <p className="text-sm text-red-700">
                    {error}
                </p>
            )}
        </div>
    );
}

export function PropertyCreateForm() {
    const router = useRouter();

    const [types, setTypes] = useState<PropertyType[]>([]);
    const [typesError, setTypesError] = useState("");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [internalNotes, setInternalNotes] = useState("");
    const [typeId, setTypeId] = useState("");

    const [status, setStatus] =
        useState<"DRAFT" | "ACTIVE">("ACTIVE");

    const [locationMode, setLocationMode] =
        useState<"existing" | "new">("existing");

    const [locationId, setLocationId] = useState("");
    const [newLocation, setNewLocation] = useState("");
    const [address, setAddress] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");

    const [locationDetails, setLocationDetails] = useState({
        basinName: "",
        basinNumber: "",
        parcelNumber: "",
        googleMapsUrl: "",
        directions: "",
        landmarks: "",
        nearbyServices: "",
    });

    const [areaValue, setAreaValue] = useState("");

    const [areaUnit, setAreaUnit] =
        useState<"SQUARE_METER" | "DUNUM" | "OTHER">(
            "SQUARE_METER",
        );

    const [areaUnitLabel, setAreaUnitLabel] = useState("");

    const [areas, setAreas] =
        useState<Record<AreaKey, string>>({
            landAreaSqm: "",
            buildingAreaSqm: "",
            gardenAreaSqm: "",
            roofAreaSqm: "",
            frontageMeters: "",
            cultivatedAreaSqm: "",
        });

    const [counts, setCounts] = useState({
        rooms: "",
        bedrooms: "",
        bathrooms: "",
        livingRooms: "",
        kitchens: "",
        floorNumber: "",
        totalFloors: "",
        apartmentCount: "",
        buildingAgeYears: "",
        parkingSpaces: "",
        treeCount: "",
        streetWidthMeters: "",
    });

    const [zoning, setZoning] = useState("");
    const [landUse, setLandUse] = useState("");
    const [condition, setCondition] = useState("");

    const [roomDetails, setRoomDetails] =
        useState<Room[]>([]);

    const [apartments, setApartments] =
        useState<Apartment[]>([]);

    const [floorAreas, setFloorAreas] =
        useState<Floor[]>([]);

    const [features, setFeatures] =
        useState<string[]>([]);

    const [customFeature, setCustomFeature] =
        useState("");

    const [contacts, setContacts] =
        useState<ContactItem[]>(() => [initialContact()]);

    const [offers, setOffers] =
        useState<Offer[]>([initialOffer()]);

    const [photos, setPhotos] = useState<File[]>([]);

    const [createdId, setCreatedId] =
        useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [uploadWarning, setUploadWarning] =
        useState("");

    useEffect(() => {
        const abort = new AbortController();

        async function loadTypes() {
            try {
                const response = await fetch(
                    "/api/property-types?isActive=true",
                    {
                        signal: abort.signal,
                        cache: "no-store",
                    },
                );

                const body =
                    (await response.json()) as ApiResult<
                        PropertyType[]
                    >;

                if (
                    !response.ok ||
                    !body.success ||
                    !Array.isArray(body.data)
                ) {
                    throw new Error(
                        body.message ||
                        "تعذّر تحميل أنواع العقارات",
                    );
                }

                if (!abort.signal.aborted) {
                    setTypes(
                        body.data.filter((item) => item.isActive),
                    );
                }
            } catch (error) {
                if (!abort.signal.aborted) {
                    setTypesError(
                        error instanceof Error
                            ? error.message
                            : "تعذّر تحميل أنواع العقارات",
                    );
                }
            }
        }

        void loadTypes();

        return () => abort.abort();
    }, []);

    const selectedType = types.find(
        (item) => item.id === typeId,
    );

    const kind =
        selectedType?.code.toUpperCase() || "";

    const showRooms = [
        "HOUSE",
        "APARTMENT",
        "BUILDING",
        "COMMERCIAL",
        "OTHER",
    ].includes(kind);

    const showApartments = kind === "BUILDING";

    const showLand = [
        "LAND",
        "FARM",
        "OTHER",
    ].includes(kind);

    const showTrees = kind === "FARM";

    const allowedAreas = useMemo(() => {
        const visible: Record<string, AreaKey[]> = {
            LAND: ["landAreaSqm", "frontageMeters"],
            HOUSE: [
                "landAreaSqm",
                "buildingAreaSqm",
                "gardenAreaSqm",
                "roofAreaSqm",
                "frontageMeters",
            ],
            APARTMENT: ["buildingAreaSqm"],
            BUILDING: [
                "landAreaSqm",
                "buildingAreaSqm",
                "roofAreaSqm",
                "frontageMeters",
            ],
            COMMERCIAL: [
                "buildingAreaSqm",
                "frontageMeters",
            ],
            FARM: [
                "landAreaSqm",
                "buildingAreaSqm",
                "cultivatedAreaSqm",
                "frontageMeters",
            ],
        };

        return visible[kind] ||
            areaKinds.map(([key]) => key);
    }, [kind]);

    function addFeature(raw: string) {
        const clean = raw.trim().replace(/\s+/g, " ");

        if (!clean || clean.length > 90) return;

        const normalize = (value: string) =>
            value
                .replace(/[أإآٱ]/g, "ا")
                .replace(/[ًٌٍَُِّْٰـ]/g, "")
                .trim();

        setFeatures((old) =>
            old.some(
                (item) =>
                    normalize(item) === normalize(clean),
            )
                ? old
                : [...old, clean].slice(0, 80),
        );

        setCustomFeature("");
    }

    function updateContact(
        key: string,
        patch: Partial<ContactItem>,
    ) {
        setContacts((old) =>
            old.map((contact) =>
                contact.key === key
                    ? { ...contact, ...patch }
                    : contact,
            ),
        );
    }

    function updateOffer(
        index: number,
        patch: Partial<Offer>,
    ) {
        setOffers((old) =>
            old.map((offer, i) =>
                i === index
                    ? { ...offer, ...patch }
                    : offer,
            ),
        );
    }

    function updateRoom(
        index: number,
        patch: Partial<Room>,
    ) {
        setRoomDetails((old) =>
            old.map((room, i) =>
                i === index
                    ? { ...room, ...patch }
                    : room,
            ),
        );
    }

    function updateApartment(
        index: number,
        patch: Partial<Apartment>,
    ) {
        setApartments((old) =>
            old.map((apartment, i) =>
                i === index
                    ? { ...apartment, ...patch }
                    : apartment,
            ),
        );
    }

    function changeApartmentCount(raw: string) {
        setCounts((old) => ({
            ...old,
            apartmentCount: raw,
        }));

        if (raw.trim() === "") return;

        const count = Math.max(
            0,
            Math.min(
                100,
                Math.floor(Number(raw) || 0),
            ),
        );

        setApartments((old) =>
            Array.from(
                { length: count },
                (_, i) =>
                    old[i] || {
                        label: `شقة ${i + 1}`,
                        areaSqm: "",
                        bedrooms: "",
                        bathrooms: "",
                        description: "",
                    },
            ),
        );
    }

    async function save(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (saving) return;

        setSaving(true);
        setError("");
        setUploadWarning("");

        try {
            let id = createdId;

            if (!id) {
                if (!typeId) {
                    throw new Error("اختاري نوع العقار");
                }

                if (
                    locationMode === "existing" &&
                    !locationId
                ) {
                    throw new Error(
                        "اختاري المنطقة أو أضيفي منطقة جديدة",
                    );
                }

                if (
                    locationMode === "new" &&
                    newLocation.trim().length < 2
                ) {
                    throw new Error(
                        "اكتبي اسم المنطقة الجديدة",
                    );
                }

                if (
                    contacts.some((contact) =>
                        contact.mode === "existing"
                            ? !contact.existingId
                            : !contact.fullName.trim() ||
                            !contact.phone.trim(),
                    )
                ) {
                    throw new Error(
                        "أكملي بيانات الملاك",
                    );
                }

                if (
                    showApartments &&
                    counts.apartmentCount &&
                    apartments.some(
                        (apartment) =>
                            !apartment.areaSqm ||
                            apartment.bedrooms === "" ||
                            apartment.bathrooms === "",
                    )
                ) {
                    throw new Error(
                        "أكملي مساحة وعدد غرف وحمامات كل شقة",
                    );
                }

                const detailNumbers =
                    Object.fromEntries(
                        Object.entries(counts)
                            .filter(
                                ([key, value]) =>
                                    value !== "" &&
                                    (
                                        showRooms ||
                                        ![
                                            "rooms",
                                            "bedrooms",
                                            "bathrooms",
                                            "livingRooms",
                                            "kitchens",
                                            "floorNumber",
                                            "totalFloors",
                                            "apartmentCount",
                                            "buildingAgeYears",
                                            "parkingSpaces",
                                        ].includes(key)
                                    ),
                            )
                            .map(([key, value]) => [
                                key,
                                Number(value),
                            ]),
                    );

                const areasPayload =
                    Object.fromEntries(
                        Object.entries(areas)
                            .filter(
                                ([key, value]) =>
                                    allowedAreas.includes(
                                        key as AreaKey,
                                    ) &&
                                    value !== "",
                            )
                            .map(([key, value]) => [
                                key,
                                Number(value),
                            ]),
                    );

                const payload = {
                    title: title.trim(),
                    description:
                        description.trim() || null,
                    internalNotes:
                        internalNotes.trim() || null,

                    typeId,
                    status,

                    location:
                        locationMode === "new"
                            ? {
                                new: {
                                    nameAr: newLocation.trim(),
                                },
                            }
                            : {
                                existingId: locationId,
                            },

                    address: address.trim() || null,
                    latitude:
                        numberOrUndefined(latitude) ?? null,
                    longitude:
                        numberOrUndefined(longitude) ?? null,

                    areaValue: Number(areaValue),
                    areaUnit,
                    areaUnitLabel:
                        areaUnit === "OTHER"
                            ? areaUnitLabel.trim()
                            : null,

                    details: {
                        locationDetails:
                            Object.fromEntries(
                                Object.entries(locationDetails)
                                    .filter(
                                        ([, value]) => value.trim(),
                                    )
                                    .map(([key, value]) => [
                                        key,
                                        value.trim(),
                                    ]),
                            ),

                        areas: areasPayload,
                        features,

                        ...detailNumbers,

                        ...(showLand
                            ? {
                                zoning:
                                    trimOrUndefined(zoning),
                                landUse:
                                    trimOrUndefined(landUse),
                            }
                            : {}),

                        ...(showRooms
                            ? {
                                condition:
                                    trimOrUndefined(condition),
                            }
                            : {}),

                        roomDetails: showRooms
                            ? roomDetails.map((room) => ({
                                nameAr: room.nameAr.trim(),
                                count: Number(room.count),
                                areaSqm:
                                    numberOrUndefined(
                                        room.areaSqm,
                                    ) ?? null,
                                description:
                                    trimOrUndefined(
                                        room.description,
                                    ),
                            }))
                            : [],

                        apartments: showApartments
                            ? apartments.map((apartment) => ({
                                label:
                                    apartment.label.trim(),
                                areaSqm: Number(
                                    apartment.areaSqm,
                                ),
                                bedrooms: Number(
                                    apartment.bedrooms,
                                ),
                                bathrooms: Number(
                                    apartment.bathrooms,
                                ),
                                description:
                                    trimOrUndefined(
                                        apartment.description,
                                    ),
                            }))
                            : [],

                        floorAreas: [
                            "HOUSE",
                            "BUILDING",
                            "OTHER",
                        ].includes(kind)
                            ? floorAreas.map((floor) => ({
                                floor: Number(floor.floor),
                                areaSqm: Number(floor.areaSqm),
                            }))
                            : [],
                    },

                    contacts: contacts.map(
                        (contact) => ({
                            contact:
                                contact.mode === "new"
                                    ? {
                                        new: {
                                            fullName:
                                                contact.fullName.trim(),
                                            phone:
                                                contact.phone.trim(),
                                            alternativePhone:
                                                contact.alternativePhone.trim() ||
                                                null,
                                            notes:
                                                contact.notes.trim() ||
                                                null,
                                        },
                                    }
                                    : {
                                        existingId:
                                            contact.existingId,
                                    },

                            role: contact.role,
                            isPrimary: contact.isPrimary,
                            canSharePhone:
                                contact.canSharePhone,
                        }),
                    ),

                    offerings: offers.map(
                        (offer) => ({
                            transactionType:
                                offer.transactionType,
                            ownerPrice:
                                Number(offer.ownerPrice),
                            advertisedPrice:
                                Number(offer.advertisedPrice),

                            rentalPeriod:
                                offer.transactionType === "RENT"
                                    ? offer.rentalPeriod || null
                                    : null,

                            allowNegotiation:
                                offer.allowNegotiation,

                            status: offer.status,

                            finalPrice: [
                                "SOLD",
                                "RENTED",
                            ].includes(offer.status)
                                ? numberOrUndefined(
                                    offer.finalPrice,
                                ) ?? null
                                : null,

                            notes:
                                offer.notes.trim() || null,
                        }),
                    ),
                };

                const response = await fetch(
                    "/api/properties",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify(payload),
                    },
                );

                const result =
                    (await response.json()) as ApiResult<{
                        id: string;
                    }>;

                if (
                    !response.ok ||
                    !result.success ||
                    !result.data?.id
                ) {
                    const validation =
                        result.errors
                            ?.slice(0, 3)
                            .map(
                                (issue) =>
                                    `${issue.path.join(".")}: ${issue.message
                                    }`,
                            )
                            .join("، ");

                    throw new Error(
                        validation ||
                        result.message ||
                        "تعذّر تسجيل العقار",
                    );
                }

                id = result.data.id;
                setCreatedId(id);
            }

            if (photos.length) {
                const failed: File[] = [];

                for (const photo of photos) {
                    try {
                        const form = new FormData();
                        form.append("file", photo);

                        const response = await fetch(
                            `/api/properties/${id}/photos/upload`,
                            {
                                method: "POST",
                                body: form,
                            },
                        );

                        const result =
                            (await response.json()) as ApiResult<unknown>;

                        if (!response.ok || !result.success) {
                            throw new Error(
                                result.message ||
                                "فشل رفع الصورة",
                            );
                        }
                    } catch {
                        failed.push(photo);
                    }
                }

                setPhotos(failed);

                if (failed.length) {
                    setUploadWarning(
                        `تم حفظ العقار، لكن تعذّر رفع ${failed.length} صورة. يمكنك إعادة المحاولة دون إنشاء عقار جديد.`,
                    );
                    return;
                }
            }

            router.push(`/properties/${id}`);
            router.refresh();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "تعذّر الحفظ",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <form
            onSubmit={save}
            dir="rtl"
            className="mx-auto max-w-6xl space-y-5 pb-16"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-[#263b2b]">
                        إضافة عقار
                    </h1>

                    <p className="mt-1 text-[#728072]">
                        أدخلي المعلومات المتوفرة؛ الحقول الإضافية
                        تظهر حسب نوع العقار.
                    </p>
                </div>

                <Link
                    href="/properties"
                    className={secondary}
                >
                    العودة للعقارات
                </Link>
            </div>

            <Section title="المعلومات الأساسية">
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="اسم العقار *">
                        <input
                            required
                            minLength={3}
                            maxLength={200}
                            className={control}
                            value={title}
                            onChange={(event) =>
                                setTitle(event.target.value)
                            }
                            placeholder="مثال: منزل مستقل في الحصن"
                        />
                    </Field>

                    <Field label="نوع العقار *">
                        <select
                            required
                            className={control}
                            value={typeId}
                            onChange={(event) => {
                                setTypeId(event.target.value);
                                setFeatures([]);
                            }}
                        >
                            <option value="">
                                اختاري نوع العقار
                            </option>

                            {types.map((type) => (
                                <option
                                    key={type.id}
                                    value={type.id}
                                >
                                    {type.nameAr}
                                </option>
                            ))}
                        </select>

                        {typesError && (
                            <span className="text-red-700">
                                {typesError}
                            </span>
                        )}
                    </Field>

                    <Field label="حالة السجل">
                        <select
                            className={control}
                            value={status}
                            onChange={(event) =>
                                setStatus(
                                    event.target.value as
                                    | "DRAFT"
                                    | "ACTIVE",
                                )
                            }
                        >
                            <option value="ACTIVE">
                                نشط
                            </option>
                            <option value="DRAFT">
                                مسودة
                            </option>
                        </select>
                    </Field>
                </div>

                <Field label="وصف العقار">
                    <textarea
                        rows={3}
                        className={control}
                        value={description}
                        onChange={(event) =>
                            setDescription(event.target.value)
                        }
                        placeholder="وصف عام للعقار"
                    />
                </Field>
            </Section>

            <Section title="الموقع ومعلومات الحوض">
                <div className="flex flex-wrap gap-2">
                    <button
                        className={secondary}
                        type="button"
                        aria-pressed={
                            locationMode === "existing"
                        }
                        onClick={() =>
                            setLocationMode("existing")
                        }
                    >
                        اختيار منطقة موجودة
                    </button>

                    <button
                        className={secondary}
                        type="button"
                        aria-pressed={
                            locationMode === "new"
                        }
                        onClick={() =>
                            setLocationMode("new")
                        }
                    >
                        <Plus
                            size={15}
                            className="inline"
                        />{" "}
                        إضافة منطقة جديدة
                    </button>
                </div>

                {locationMode === "existing" ? (
                    <PagedPicker
                        kind="locations"
                        value={locationId}
                        onChange={setLocationId}
                        placeholder="اختاري المنطقة"
                    />
                ) : (
                    <Field label="اسم المنطقة الجديدة *">
                        <input
                            className={control}
                            minLength={2}
                            required
                            value={newLocation}
                            onChange={(event) =>
                                setNewLocation(event.target.value)
                            }
                            placeholder="مثال: إيدون"
                        />
                    </Field>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="اسم الحوض">
                        <input
                            className={control}
                            value={locationDetails.basinName}
                            onChange={(event) =>
                                setLocationDetails((old) => ({
                                    ...old,
                                    basinName: event.target.value,
                                }))
                            }
                        />
                    </Field>

                    <Field label="رقم الحوض">
                        <input
                            className={control}
                            value={locationDetails.basinNumber}
                            onChange={(event) =>
                                setLocationDetails((old) => ({
                                    ...old,
                                    basinNumber: event.target.value,
                                }))
                            }
                        />
                    </Field>

                    <Field label="رقم القطعة">
                        <input
                            className={control}
                            value={locationDetails.parcelNumber}
                            onChange={(event) =>
                                setLocationDetails((old) => ({
                                    ...old,
                                    parcelNumber: event.target.value,
                                }))
                            }
                        />
                    </Field>

                    <Field label="العنوان التفصيلي">
                        <input
                            className={control}
                            value={address}
                            onChange={(event) =>
                                setAddress(event.target.value)
                            }
                        />
                    </Field>

                    <Field label="رابط Google Maps">
                        <input
                            type="url"
                            dir="ltr"
                            className={control}
                            value={locationDetails.googleMapsUrl}
                            onChange={(event) =>
                                setLocationDetails((old) => ({
                                    ...old,
                                    googleMapsUrl: event.target.value,
                                }))
                            }
                            placeholder="https://maps.google.com/..."
                        />
                    </Field>

                    <Field label="معالم قريبة">
                        <input
                            className={control}
                            value={locationDetails.landmarks}
                            onChange={(event) =>
                                setLocationDetails((old) => ({
                                    ...old,
                                    landmarks: event.target.value,
                                }))
                            }
                        />
                    </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="خط العرض">
                        <input
                            type="number"
                            step="any"
                            min={-90}
                            max={90}
                            className={control}
                            dir="ltr"
                            value={latitude}
                            onChange={(event) =>
                                setLatitude(event.target.value)
                            }
                            placeholder="32.55"
                        />
                    </Field>

                    <Field label="خط الطول">
                        <input
                            type="number"
                            step="any"
                            min={-180}
                            max={180}
                            className={control}
                            dir="ltr"
                            value={longitude}
                            onChange={(event) =>
                                setLongitude(event.target.value)
                            }
                            placeholder="35.85"
                        />
                    </Field>
                </div>

                {latitude.trim() &&
                    longitude.trim() &&
                    Number.isFinite(Number(latitude)) &&
                    Number.isFinite(Number(longitude)) && (
                        <div className="space-y-2">
                            <a
                                className="text-sm font-semibold text-[#346747] underline"
                                target="_blank"
                                rel="noopener noreferrer"
                                href={`https://www.google.com/maps?q=${encodeURIComponent(
                                    `${latitude},${longitude}`,
                                )}`}
                            >
                                فتح الموقع على الخريطة
                            </a>

                            <iframe
                                title="موقع العقار على الخريطة"
                                loading="lazy"
                                className="h-60 w-full rounded-xl border border-[#d8ddcf]"
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(longitude) - 0.006
                                    }%2C${Number(latitude) - 0.006
                                    }%2C${Number(longitude) + 0.006
                                    }%2C${Number(latitude) + 0.006
                                    }&layer=mapnik&marker=${Number(latitude)
                                    }%2C${Number(longitude)}`}
                            />
                        </div>
                    )}

                <Field label="وصف الطريق للوصول">
                    <textarea
                        rows={2}
                        className={control}
                        value={locationDetails.directions}
                        onChange={(event) =>
                            setLocationDetails((old) => ({
                                ...old,
                                directions: event.target.value,
                            }))
                        }
                    />
                </Field>

                <Field label="الشوارع الرئيسية والخدمات القريبة">
                    <textarea
                        rows={2}
                        className={control}
                        value={locationDetails.nearbyServices}
                        onChange={(event) =>
                            setLocationDetails((old) => ({
                                ...old,
                                nearbyServices: event.target.value,
                            }))
                        }
                    />
                </Field>
            </Section>

            <Section
                title="المساحات"
                note="المساحة الرئيسية مطلوبة، والبقية تظهر بحسب نوع العقار."
            >
                <div className="grid gap-4 sm:grid-cols-3">
                    <SmallNumber
                        label="المساحة الرئيسية *"
                        required
                        min={0.01}
                        value={areaValue}
                        onChange={setAreaValue}
                    />

                    <Field label="الوحدة">
                        <select
                            className={control}
                            value={areaUnit}
                            onChange={(event) =>
                                setAreaUnit(
                                    event.target.value as
                                    typeof areaUnit,
                                )
                            }
                        >
                            <option value="SQUARE_METER">
                                متر مربع
                            </option>
                            <option value="DUNUM">
                                دونم
                            </option>
                            <option value="OTHER">
                                وحدة أخرى
                            </option>
                        </select>
                    </Field>

                    {areaUnit === "OTHER" && (
                        <Field label="اسم الوحدة">
                            <input
                                required
                                className={control}
                                value={areaUnitLabel}
                                onChange={(event) =>
                                    setAreaUnitLabel(
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {areaKinds
                        .filter(([key]) =>
                            allowedAreas.includes(key),
                        )
                        .map(([key, label]) => (
                            <SmallNumber
                                key={key}
                                label={label}
                                value={areas[key]}
                                onChange={(value) =>
                                    setAreas((old) => ({
                                        ...old,
                                        [key]: value,
                                    }))
                                }
                            />
                        ))}
                </div>
            </Section>

            <Section
                title="تفاصيل العقار حسب النوع"
                note="يمكنك إضافة تفاصيل محددة، والمساحات والوصف لكل غرفة أو شقة."
            >
                {showLand && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="التنظيم">
                            <input
                                className={control}
                                value={zoning}
                                onChange={(event) =>
                                    setZoning(event.target.value)
                                }
                                placeholder="سكني، زراعي..."
                            />
                        </Field>

                        <Field label="استعمال الأرض">
                            <input
                                className={control}
                                value={landUse}
                                onChange={(event) =>
                                    setLandUse(event.target.value)
                                }
                            />
                        </Field>
                    </div>
                )}

                {(showLand ||
                    kind === "COMMERCIAL" ||
                    kind === "BUILDING") && (
                        <SmallNumber
                            label="عرض الشارع (متر)"
                            value={counts.streetWidthMeters}
                            onChange={(value) =>
                                setCounts((old) => ({
                                    ...old,
                                    streetWidthMeters: value,
                                }))
                            }
                        />
                    )}

                {showRooms && (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {(
                                [
                                    ["rooms", "عدد الغرف الإجمالي"],
                                    ["bedrooms", "غرف النوم"],
                                    ["bathrooms", "الحمامات"],
                                    ["livingRooms", "الصالونات"],
                                    ["kitchens", "المطابخ"],
                                    ["floorNumber", "رقم الطابق"],
                                    ["totalFloors", "عدد الطوابق"],
                                    ["buildingAgeYears", "عمر البناء (سنوات)"],
                                    ["parkingSpaces", "مواقف السيارات"],
                                ] as const
                            )
                                .filter(
                                    ([key]) =>
                                        kind !== "BUILDING" ||
                                        [
                                            "rooms",
                                            "bedrooms",
                                            "bathrooms",
                                            "totalFloors",
                                            "buildingAgeYears",
                                            "parkingSpaces",
                                        ].includes(key),
                                )
                                .map(([key, label]) => (
                                    <SmallNumber
                                        key={key}
                                        label={label}
                                        value={counts[key]}
                                        onChange={(value) =>
                                            setCounts((old) => ({
                                                ...old,
                                                [key]: value,
                                            }))
                                        }
                                    />
                                ))}
                        </div>

                        <Field label="حالة العقار / التشطيبات">
                            <input
                                className={control}
                                value={condition}
                                onChange={(event) =>
                                    setCondition(event.target.value)
                                }
                                placeholder="جديد، بحاجة لصيانة، تشطيب فاخر..."
                            />
                        </Field>

                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-[#29442f]">
                                تفاصيل الغرف (المساحة والوصف لكل نوع)
                            </h3>

                            <button
                                type="button"
                                className={secondary}
                                onClick={() =>
                                    setRoomDetails((old) => [
                                        ...old,
                                        {
                                            nameAr: "",
                                            count: "1",
                                            areaSqm: "",
                                            description: "",
                                        },
                                    ])
                                }
                            >
                                <Plus size={16} className="inline" />{" "}
                                إضافة غرفة
                            </button>
                        </div>

                        {roomDetails.map((room, index) => (
                            <div
                                key={index}
                                className="grid gap-3 rounded-xl bg-[#f4f6f1] p-4 sm:grid-cols-4"
                            >
                                <Field label="نوع الغرفة">
                                    <input
                                        required
                                        className={control}
                                        list="room-suggestions"
                                        value={room.nameAr}
                                        onChange={(event) =>
                                            updateRoom(index, {
                                                nameAr: event.target.value,
                                            })
                                        }
                                        placeholder="غرفة نوم، صالون..."
                                    />
                                </Field>

                                <SmallNumber
                                    label="العدد"
                                    min={1}
                                    value={room.count}
                                    onChange={(value) =>
                                        updateRoom(index, {
                                            count: value,
                                        })
                                    }
                                />

                                <SmallNumber
                                    label="مساحة كل غرفة (م²)"
                                    min={0.01}
                                    value={room.areaSqm}
                                    onChange={(value) =>
                                        updateRoom(index, {
                                            areaSqm: value,
                                        })
                                    }
                                />

                                <div className="flex items-end gap-2">
                                    <Field label="الوصف">
                                        <input
                                            className={control}
                                            value={room.description}
                                            onChange={(event) =>
                                                updateRoom(index, {
                                                    description:
                                                        event.target.value,
                                                })
                                            }
                                            placeholder="شرفة، تشطيب..."
                                        />
                                    </Field>

                                    <button
                                        type="button"
                                        aria-label="حذف الغرفة"
                                        className="rounded-lg p-2 text-red-700"
                                        onClick={() =>
                                            setRoomDetails((old) =>
                                                old.filter(
                                                    (_, current) =>
                                                        current !== index,
                                                ),
                                            )
                                        }
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <datalist id="room-suggestions">
                            <option value="غرفة نوم" />
                            <option value="غرفة ضيوف" />
                            <option value="صالون" />
                            <option value="حمام" />
                            <option value="مطبخ" />
                            <option value="مكتب" />
                        </datalist>
                    </>
                )}

                {showApartments && (
                    <>
                        <SmallNumber
                            label="عدد الشقق في العمارة"
                            value={counts.apartmentCount}
                            onChange={changeApartmentCount}
                        />

                        <p className="text-sm text-[#718071]">
                            لكل شقة أدخلي مساحتها وغرف النوم والحمامات،
                            ويمكنك إضافة وصف خاص بها.
                        </p>

                        {apartments.map((apartment, index) => (
                            <div
                                key={index}
                                className="space-y-3 rounded-xl border border-[#e2e6dc] p-4"
                            >
                                <h3 className="font-bold text-[#365440]">
                                    الشقة {index + 1}
                                </h3>

                                <div className="grid gap-3 sm:grid-cols-4">
                                    <Field label="تسمية الشقة">
                                        <input
                                            required
                                            className={control}
                                            value={apartment.label}
                                            onChange={(event) =>
                                                updateApartment(index, {
                                                    label: event.target.value,
                                                })
                                            }
                                        />
                                    </Field>

                                    <SmallNumber
                                        label="المساحة (م²) *"
                                        required
                                        min={0.01}
                                        value={apartment.areaSqm}
                                        onChange={(value) =>
                                            updateApartment(index, {
                                                areaSqm: value,
                                            })
                                        }
                                    />

                                    <SmallNumber
                                        label="غرف النوم *"
                                        value={apartment.bedrooms}
                                        onChange={(value) =>
                                            updateApartment(index, {
                                                bedrooms: value,
                                            })
                                        }
                                    />

                                    <SmallNumber
                                        label="الحمامات *"
                                        value={apartment.bathrooms}
                                        onChange={(value) =>
                                            updateApartment(index, {
                                                bathrooms: value,
                                            })
                                        }
                                    />
                                </div>

                                <Field label="وصف الشقة">
                                    <input
                                        className={control}
                                        value={apartment.description}
                                        onChange={(event) =>
                                            updateApartment(index, {
                                                description:
                                                    event.target.value,
                                            })
                                        }
                                    />
                                </Field>
                            </div>
                        ))}
                    </>
                )}

                {[
                    "BUILDING",
                    "HOUSE",
                    "OTHER",
                ].includes(kind) && (
                        <>
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-[#29442f]">
                                    مساحة كل طابق
                                </h3>

                                <button
                                    className={secondary}
                                    type="button"
                                    onClick={() =>
                                        setFloorAreas((old) => [
                                            ...old,
                                            {
                                                floor: String(old.length + 1),
                                                areaSqm: "",
                                            },
                                        ])
                                    }
                                >
                                    <Plus size={16} className="inline" />{" "}
                                    إضافة طابق
                                </button>
                            </div>

                            {floorAreas.map((floor, index) => (
                                <div
                                    key={index}
                                    className="flex items-end gap-3"
                                >
                                    <div className="flex-1">
                                        <SmallNumber
                                            label="رقم الطابق"
                                            min={-5}
                                            value={floor.floor}
                                            onChange={(value) =>
                                                setFloorAreas((old) =>
                                                    old.map((item, i) =>
                                                        i === index
                                                            ? {
                                                                ...item,
                                                                floor: value,
                                                            }
                                                            : item,
                                                    ),
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <SmallNumber
                                            label="مساحة الطابق (م²)"
                                            min={0.01}
                                            value={floor.areaSqm}
                                            onChange={(value) =>
                                                setFloorAreas((old) =>
                                                    old.map((item, i) =>
                                                        i === index
                                                            ? {
                                                                ...item,
                                                                areaSqm: value,
                                                            }
                                                            : item,
                                                    ),
                                                )
                                            }
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        className="rounded-lg p-2 text-red-700"
                                        aria-label="حذف الطابق"
                                        onClick={() =>
                                            setFloorAreas((old) =>
                                                old.filter(
                                                    (_, i) => i !== index,
                                                ),
                                            )
                                        }
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </>
                    )}

                {showTrees && (
                    <SmallNumber
                        label="عدد الأشجار"
                        value={counts.treeCount}
                        onChange={(value) =>
                            setCounts((old) => ({
                                ...old,
                                treeCount: value,
                            }))
                        }
                    />
                )}

                {kind === "LAND" && (
                    <p className="rounded-xl bg-[#f0f4ed] p-3 text-sm text-[#45614a]">
                        بالنسبة للأرض، المساحة والوصف والحوض والقطعة
                        والتنظيم وميزات الأرض هي المعلومات الأساسية.
                    </p>
                )}
            </Section>

            <Section
                title="ميزات العقار"
                note="اختاري ميزات جاهزة أو أضيفي كلمات وعبارات كعلامات مستقلة، وليست نصًا طويلًا."
            >
                <div className="flex flex-wrap gap-2">
                    {(
                        featureSuggestions[kind] ||
                        featureSuggestions.OTHER
                    ).map((tag) => (
                        <button
                            type="button"
                            key={tag}
                            onClick={() =>
                                setFeatures((old) =>
                                    old.includes(tag)
                                        ? old.filter(
                                            (item) => item !== tag,
                                        )
                                        : [...old, tag],
                                )
                            }
                            className={`rounded-full border px-3 py-2 text-sm ${features.includes(tag)
                                ? "border-[#346747] bg-[#e4f0e0] text-[#285338]"
                                : "border-[#d4dbcc] bg-white text-[#4d604e]"
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2">
                    <input
                        className={`${control} min-w-[200px] flex-1`}
                        value={customFeature}
                        maxLength={90}
                        onChange={(event) =>
                            setCustomFeature(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                addFeature(customFeature);
                            }
                        }}
                        placeholder="ميزة إضافية، ثم Enter"
                    />

                    <button
                        type="button"
                        className={secondary}
                        onClick={() =>
                            addFeature(customFeature)
                        }
                    >
                        <Tags size={16} className="inline" />{" "}
                        إضافة ميزة
                    </button>
                </div>

                {features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {features.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-2 rounded-full bg-[#e7eee2] px-3 py-1.5 text-sm font-semibold text-[#365440]"
                            >
                                {tag}

                                <button
                                    type="button"
                                    aria-label={`حذف ${tag}`}
                                    onClick={() =>
                                        setFeatures((old) =>
                                            old.filter(
                                                (item) => item !== tag,
                                            ),
                                        )
                                    }
                                    className="text-[#b24b4b]"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </Section>

            <Section
                title="الملاك وجهات الاتصال"
                note="يمكن ربط عدة أشخاص، مع جهة اتصال رئيسية واحدة. يمكن إنشاء شخص جديد من هنا ضمن نفس عملية حفظ العقار."
            >
                {contacts.map((contact, index) => (
                    <div
                        key={contact.key}
                        className="space-y-3 rounded-xl border border-[#e2e6dc] p-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-[#365440]">
                                جهة الاتصال {index + 1}
                            </h3>

                            {contacts.length > 1 && (
                                <button
                                    type="button"
                                    aria-label="حذف جهة الاتصال من النموذج"
                                    onClick={() =>
                                        setContacts((old) => {
                                            const filtered =
                                                old.filter(
                                                    (item) =>
                                                        item.key !== contact.key,
                                                );

                                            if (
                                                contact.isPrimary &&
                                                filtered.length
                                            ) {
                                                filtered[0] = {
                                                    ...filtered[0],
                                                    isPrimary: true,
                                                };
                                            }

                                            return filtered;
                                        })
                                    }
                                    className="text-red-700"
                                >
                                    <Trash2 size={17} />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                className={secondary}
                                onClick={() =>
                                    updateContact(contact.key, {
                                        mode: "existing",
                                    })
                                }
                            >
                                اختيار شخص موجود
                            </button>

                            <button
                                type="button"
                                className={secondary}
                                onClick={() =>
                                    updateContact(contact.key, {
                                        mode: "new",
                                    })
                                }
                            >
                                <Plus
                                    size={15}
                                    className="inline"
                                />{" "}
                                شخص جديد
                            </button>
                        </div>

                        {contact.mode === "existing" ? (
                            <PagedPicker
                                kind="contacts"
                                value={contact.existingId}
                                onChange={(value) =>
                                    updateContact(contact.key, {
                                        existingId: value,
                                    })
                                }
                                placeholder="اختاري جهة الاتصال"
                            />
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="الاسم *">
                                    <input
                                        required
                                        className={control}
                                        value={contact.fullName}
                                        onChange={(event) =>
                                            updateContact(contact.key, {
                                                fullName:
                                                    event.target.value,
                                            })
                                        }
                                    />
                                </Field>

                                <Field label="رقم الهاتف *">
                                    <input
                                        required
                                        dir="ltr"
                                        className={control}
                                        value={contact.phone}
                                        onChange={(event) =>
                                            updateContact(contact.key, {
                                                phone:
                                                    event.target.value,
                                            })
                                        }
                                    />
                                </Field>

                                <Field label="رقم إضافي">
                                    <input
                                        dir="ltr"
                                        className={control}
                                        value={
                                            contact.alternativePhone
                                        }
                                        onChange={(event) =>
                                            updateContact(contact.key, {
                                                alternativePhone:
                                                    event.target.value,
                                            })
                                        }
                                    />
                                </Field>

                                <Field label="ملاحظات">
                                    <input
                                        className={control}
                                        value={contact.notes}
                                        onChange={(event) =>
                                            updateContact(contact.key, {
                                                notes:
                                                    event.target.value,
                                            })
                                        }
                                    />
                                </Field>
                            </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="الصفة">
                                <select
                                    className={control}
                                    value={contact.role}
                                    onChange={(event) =>
                                        updateContact(contact.key, {
                                            role:
                                                event.target.value as
                                                ContactItem["role"],
                                        })
                                    }
                                >
                                    <option value="OWNER">
                                        مالك
                                    </option>

                                    <option value="CO_OWNER">
                                        شريك بالملكية
                                    </option>

                                    <option value="AUTHORIZED_REPRESENTATIVE">
                                        شخص مفوض
                                    </option>
                                </select>
                            </Field>

                            <div className="flex flex-col justify-center gap-2">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        checked={contact.isPrimary}
                                        onChange={() =>
                                            setContacts((old) =>
                                                old.map((item) => ({
                                                    ...item,
                                                    isPrimary:
                                                        item.key ===
                                                        contact.key,
                                                })),
                                            )
                                        }
                                    />
                                    جهة الاتصال الرئيسية
                                </label>

                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={
                                            contact.canSharePhone
                                        }
                                        onChange={(event) =>
                                            updateContact(contact.key, {
                                                canSharePhone:
                                                    event.target.checked,
                                            })
                                        }
                                    />
                                    مسموح مشاركة الرقم
                                </label>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    className={secondary}
                    onClick={() =>
                        setContacts((old) => [
                            ...old,
                            {
                                ...initialContact(),
                                isPrimary: false,
                            },
                        ])
                    }
                >
                    <Plus size={17} className="inline" />{" "}
                    إضافة مالك أو مفوض آخر
                </button>
            </Section>

            <Section
                title="عروض البيع والإيجار"
                note="العقار يمكن أن يكون له عرض بيع وعرض إيجار، مع سعر المالك والسعر المعلن وحالة كل عرض."
            >
                {offers.map((offer, index) => (
                    <div
                        key={offer.transactionType}
                        className="space-y-3 rounded-xl border border-[#e2e6dc] p-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-[#365440]">
                                عرض{" "}
                                {offer.transactionType === "SALE"
                                    ? "بيع"
                                    : "إيجار"}
                            </h3>

                            {offers.length > 1 && (
                                <button
                                    type="button"
                                    aria-label="إزالة العرض"
                                    className="text-red-700"
                                    onClick={() =>
                                        setOffers((old) =>
                                            old.filter(
                                                (_, i) => i !== index,
                                            ),
                                        )
                                    }
                                >
                                    <Trash2 size={17} />
                                </button>
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <Field label="نوع العرض">
                                <select
                                    className={control}
                                    value={
                                        offer.transactionType
                                    }
                                    onChange={(event) =>
                                        updateOffer(index, {
                                            transactionType:
                                                event.target.value as
                                                Offer["transactionType"],
                                            rentalPeriod: "",
                                            status: "AVAILABLE",
                                            finalPrice: "",
                                        })
                                    }
                                >
                                    <option
                                        value="SALE"
                                        disabled={offers.some(
                                            (item, i) =>
                                                i !== index &&
                                                item.transactionType ===
                                                "SALE",
                                        )}
                                    >
                                        بيع
                                    </option>

                                    <option
                                        value="RENT"
                                        disabled={offers.some(
                                            (item, i) =>
                                                i !== index &&
                                                item.transactionType ===
                                                "RENT",
                                        )}
                                    >
                                        إيجار
                                    </option>
                                </select>
                            </Field>

                            <SmallNumber
                                label="سعر المالك (د.أ) *"
                                required
                                min={0.01}
                                value={offer.ownerPrice}
                                onChange={(value) =>
                                    updateOffer(index, {
                                        ownerPrice: value,
                                    })
                                }
                            />

                            <SmallNumber
                                label="السعر المعلن (د.أ) *"
                                required
                                min={0.01}
                                value={offer.advertisedPrice}
                                onChange={(value) =>
                                    updateOffer(index, {
                                        advertisedPrice: value,
                                    })
                                }
                            />

                            {offer.transactionType ===
                                "RENT" && (
                                    <Field label="فترة الإيجار *">
                                        <select
                                            required
                                            className={control}
                                            value={offer.rentalPeriod}
                                            onChange={(event) =>
                                                updateOffer(index, {
                                                    rentalPeriod:
                                                        event.target.value,
                                                })
                                            }
                                        >
                                            <option value="">
                                                اختاري الفترة
                                            </option>
                                            <option value="DAILY">
                                                يومي
                                            </option>
                                            <option value="WEEKLY">
                                                أسبوعي
                                            </option>
                                            <option value="MONTHLY">
                                                شهري
                                            </option>
                                            <option value="YEARLY">
                                                سنوي
                                            </option>
                                            <option value="OTHER">
                                                أخرى
                                            </option>
                                        </select>
                                    </Field>
                                )}

                            <Field label="حالة العرض">
                                <select
                                    className={control}
                                    value={offer.status}
                                    onChange={(event) =>
                                        updateOffer(index, {
                                            status:
                                                event.target.value,
                                        })
                                    }
                                >
                                    <option value="AVAILABLE">
                                        متاح
                                    </option>
                                    <option value="RESERVED">
                                        محجوز
                                    </option>
                                    <option value="UNDER_NEGOTIATION">
                                        قيد التفاوض
                                    </option>

                                    {offer.transactionType ===
                                        "SALE" ? (
                                        <option value="SOLD">
                                            مباع
                                        </option>
                                    ) : (
                                        <option value="RENTED">
                                            مؤجر
                                        </option>
                                    )}

                                    <option value="WITHDRAWN">
                                        مسحوب
                                    </option>
                                </select>
                            </Field>

                            {[
                                "SOLD",
                                "RENTED",
                            ].includes(offer.status) && (
                                    <SmallNumber
                                        label="السعر النهائي *"
                                        required
                                        min={0.01}
                                        value={offer.finalPrice}
                                        onChange={(value) =>
                                            updateOffer(index, {
                                                finalPrice: value,
                                            })
                                        }
                                    />
                                )}

                            <label className="flex items-center gap-2 text-sm font-semibold">
                                <input
                                    type="checkbox"
                                    checked={
                                        offer.allowNegotiation
                                    }
                                    onChange={(event) =>
                                        updateOffer(index, {
                                            allowNegotiation:
                                                event.target.checked,
                                        })
                                    }
                                />
                                السعر قابل للتفاوض
                            </label>
                        </div>

                        <Field label="ملاحظات العرض">
                            <textarea
                                rows={2}
                                className={control}
                                value={offer.notes}
                                onChange={(event) =>
                                    updateOffer(index, {
                                        notes: event.target.value,
                                    })
                                }
                            />
                        </Field>
                    </div>
                ))}

                {offers.length < 2 && (
                    <button
                        type="button"
                        className={secondary}
                        onClick={() =>
                            setOffers((old) => [
                                ...old,
                                {
                                    ...initialOffer(),
                                    transactionType:
                                        old[0].transactionType ===
                                            "SALE"
                                            ? "RENT"
                                            : "SALE",
                                },
                            ])
                        }
                    >
                        <Plus
                            size={17}
                            className="inline"
                        />{" "}
                        إضافة عرض{" "}
                        {offers[0].transactionType ===
                            "SALE"
                            ? "إيجار"
                            : "بيع"}
                    </button>
                )}
            </Section>

            <Section
                title="الصور"
                note="اختاري صور JPG أو PNG أو WebP (بحد أقصى 8 ميغابايت لكل صورة). تُرفع بعد نجاح تسجيل العقار."
            >
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#cfdcc9] p-6 text-center text-[#416449]">
                    <ImagePlus size={30} />

                    <strong>اختيار الصور</strong>

                    <span className="text-sm">
                        يمكن اختيار عدة صور معًا
                    </span>

                    <input
                        className="sr-only"
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                            const files = Array.from(
                                event.target.files || [],
                            );

                            if (
                                files.some(
                                    (file) =>
                                        file.size >
                                        8 * 1024 * 1024,
                                )
                            ) {
                                setError(
                                    "كل صورة يجب أن تكون أقل من 8 ميغابايت",
                                );
                                return;
                            }

                            setPhotos((old) =>
                                [...old, ...files].slice(0, 10),
                            );

                            event.target.value = "";
                        }}
                    />
                </label>

                <div className="space-y-2">
                    {photos.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between rounded-lg bg-[#f4f6f1] px-3 py-2 text-sm"
                        >
                            <span className="truncate">
                                {file.name}
                            </span>

                            <button
                                type="button"
                                aria-label="إزالة الصورة"
                                className="text-red-700"
                                onClick={() =>
                                    setPhotos((old) =>
                                        old.filter(
                                            (_, i) => i !== index,
                                        ),
                                    )
                                }
                            >
                                إزالة
                            </button>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="ملاحظات داخلية">
                <Field label="ملاحظات خاصة لا تظهر في الإعلانات">
                    <textarea
                        className={control}
                        rows={3}
                        value={internalNotes}
                        onChange={(event) =>
                            setInternalNotes(
                                event.target.value,
                            )
                        }
                        placeholder="معلومات خاصة بعمل المكتب العقاري"
                    />
                </Field>
            </Section>

            {error && (
                <p
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
                >
                    {error}
                </p>
            )}

            {uploadWarning && (
                <div
                    role="alert"
                    className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
                >
                    {uploadWarning}{" "}
                    {createdId && (
                        <Link
                            className="font-bold underline"
                            href={`/properties/${createdId}`}
                        >
                            فتح العقار المحفوظ
                        </Link>
                    )}
                </div>
            )}

            <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d4dfce] bg-white/95 p-4 shadow-lg backdrop-blur">
                <span className="flex items-center gap-2 text-sm text-[#718071]">
                    <MapPin size={17} />
                    <Building2 size={17} />
                    الحقول المعلّمة بنجمة مطلوبة
                </span>

                <button
                    type="submit"
                    disabled={saving}
                    className="flex min-h-12 items-center gap-2 rounded-xl bg-[#346747] px-7 py-3 font-bold text-white hover:bg-[#285338] disabled:opacity-60"
                >
                    <Save size={19} />

                    {saving
                        ? "جارٍ الحفظ..."
                        : createdId
                            ? "إعادة رفع الصور المتبقية"
                            : "حفظ العقار"}
                </button>
            </div>
        </form>
    );
}
