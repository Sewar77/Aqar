"use client";

import {
    useEffect,
    useState,
    type FormEvent,
} from "react";

import {
    MapPin,
    Plus,
    Search,
    RotateCcw,
} from "lucide-react";

import {
    LocationForm,
    type LocationFormValues,
} from "./location-form";

import { LocationsList } from "./locations-list";

import type {
    LocationListItem,
    LocationListResponse,
    SaveLocationResult,
} from "./location.types";

type StatusFilter = "all" | "active" | "inactive";

type EditorState =
    | { mode: "create" }
    | {
        mode: "edit";
        location: LocationListItem;
    }
    | null;

export function LocationManager() {
    const [locations, setLocations] = useState<
        LocationListItem[]
    >([]);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("all");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [editor, setEditor] = useState<EditorState>(null);
    const [reload, setReload] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        async function loadLocations() {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();

            if (search) {
                params.set("search", search);
            }

            if (statusFilter !== "all") {
                params.set(
                    "isActive",
                    String(statusFilter === "active"),
                );
            }

            try {
                const response = await fetch(
                    `/api/locations?${params.toString()}`,
                    {
                        signal: controller.signal,
                        cache: "no-store",
                    },
                );

                const body =
                    (await response.json()) as LocationListResponse;

                if (
                    !response.ok ||
                    !body.success ||
                    !Array.isArray(body.data)
                ) {
                    throw new Error(
                        body.message || "تعذّر تحميل المناطق",
                    );
                }

                setLocations(body.data);
            } catch (caught) {
                if (controller.signal.aborted) return;

                setLocations([]);

                setError(
                    caught instanceof Error
                        ? caught.message
                        : "حدث خطأ غير متوقع",
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void loadLocations();

        return () => controller.abort();
    }, [search, statusFilter, reload]);

    function handleSearch(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setNotice("");
        setSearch(searchInput.trim());
    }

    function clearFilters() {
        setSearchInput("");
        setSearch("");
        setStatusFilter("all");
    }

    async function saveLocation(
        values: LocationFormValues,
    ): Promise<SaveLocationResult> {
        if (!editor) {
            return {
                ok: false,
                status: 400,
                message: "النموذج غير مفتوح",
            };
        }

        const isEditing = editor.mode === "edit";

        const url = isEditing
            ? `/api/locations/${editor.location.id}`
            : "/api/locations";

        // English fields are not collected from the user.
        const payload = {
            nameAr: values.nameAr.trim(),
            ...(isEditing
                ? { isActive: values.isActive }
                : {}),
        };

        try {
            const response = await fetch(url, {
                method: isEditing ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const body = (await response.json()) as {
                success?: boolean;
                message?: string;
            };

            if (!response.ok || !body.success) {
                return {
                    ok: false,
                    status: response.status,
                    message:
                        body.message || "تعذّر حفظ المنطقة",
                };
            }

            setEditor(null);

            setNotice(
                isEditing
                    ? "تم تعديل المنطقة بنجاح"
                    : "تمت إضافة المنطقة بنجاح",
            );

            if (!isEditing) {
                clearFilters();
            }

            setReload((current) => current + 1);

            return { ok: true };
        } catch {
            return {
                ok: false,
                status: 0,
                message: "تعذّر الاتصال بالخادم",
            };
        }
    }

    return (
        <section className="aqar-page space-y-7">
            {/* Page Heading */}
            <header className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                    <span className="rounded-2xl bg-olive-soft p-3 text-brand">
                        <MapPin size={29} aria-hidden="true" />
                    </span>

                    <div>
                        <h1 className="aqar-heading text-3xl">
                            المناطق
                        </h1>

                        <p className="aqar-description mt-1">
                            إدارة المناطق والعقارات التابعة لكل منطقة
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setNotice("");
                        setEditor({ mode: "create" });
                    }}
                    className="aqar-button aqar-button-primary"
                >
                    <Plus size={20} aria-hidden="true" />
                    إضافة منطقة
                </button>
            </header>

            {/* Filters */}
            <form
                onSubmit={handleSearch}
                className="flex flex-wrap items-center gap-3"
            >
                <div className="relative min-w-[220px] flex-1">
                    <Search
                        size={20}
                        aria-hidden="true"
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
                    />

                    <input
                        aria-label="البحث باسم المنطقة"
                        value={searchInput}
                        onChange={(event) =>
                            setSearchInput(event.target.value)
                        }
                        placeholder="ابحث باسم المنطقة..."
                        className="aqar-input pr-12"
                    />
                </div>

                <select
                    aria-label="تصفية المناطق حسب الحالة"
                    value={statusFilter}
                    onChange={(event) =>
                        setStatusFilter(
                            event.target.value as StatusFilter,
                        )
                    }
                    className="aqar-input w-auto min-w-40"
                >
                    <option value="all">كل الحالات</option>
                    <option value="active">نشطة</option>
                    <option value="inactive">غير نشطة</option>
                </select>

                <button
                    type="submit"
                    className="aqar-button aqar-button-soft"
                >
                    بحث
                </button>

                {(search || statusFilter !== "all") && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="aqar-button bg-surface text-secondary"
                    >
                        <RotateCcw size={17} aria-hidden="true" />
                        مسح الفلاتر
                    </button>
                )}
            </form>

            <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-secondary">
                    عدد المناطق المعروضة:{" "}
                    <span className="text-ink">
                        {locations.length}
                    </span>
                </p>
            </div>

            {/* Feedback */}
            {notice && (
                <p
                    role="status"
                    className="rounded-xl bg-success-soft p-3 text-success"
                >
                    {notice}
                </p>
            )}

            {error && (
                <div
                    role="alert"
                    className="flex flex-wrap items-center gap-3 rounded-xl bg-danger-soft p-4 text-danger"
                >
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() =>
                            setReload((current) => current + 1)
                        }
                        className="font-bold underline"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            )}

            {!error && (
                <LocationsList
                    locations={locations}
                    loading={loading}
                    onEdit={(location) => {
                        setNotice("");

                        setEditor({
                            mode: "edit",
                            location,
                        });
                    }}
                />
            )}

            {/* Existing Add / Edit Dialog */}
            {editor && (
                <LocationForm
                    location={
                        editor.mode === "edit"
                            ? editor.location
                            : null
                    }
                    onClose={() => setEditor(null)}
                    onSave={saveLocation}
                />
            )}
        </section>
    );
}