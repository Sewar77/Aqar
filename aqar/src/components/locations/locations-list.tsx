import Link from "next/link";
import {
    Building2,
    ChevronLeft,
    MapPin,
    Pencil,
} from "lucide-react";

import { LocationCard } from "./location-card";

import type { LocationListItem } from "./location.types";

type LocationsListProps = {
    locations: LocationListItem[];
    loading: boolean;
    onEdit: (location: LocationListItem) => void;
};

export function LocationsList({
    locations,
    loading,
    onEdit,
}: LocationsListProps) {
    if (loading) {
        return (
            <div
                role="status"
                className="aqar-surface p-10 text-center text-secondary"
            >
                جارٍ تحميل المناطق...
            </div>
        );
    }

    if (locations.length === 0) {
        return (
            <div className="aqar-surface p-10 text-center">
                <MapPin
                    size={36}
                    aria-hidden="true"
                    className="mx-auto text-olive"
                />

                <h2 className="mt-4 text-xl font-bold text-ink">
                    لا توجد مناطق مطابقة
                </h2>

                <p className="mt-2 text-secondary">
                    جربي تغيير البحث أو إضافة منطقة جديدة.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Mobile */}
            <div className="grid gap-4 md:hidden">
                {locations.map((location) => (
                    <LocationCard
                        key={location.id}
                        location={location}
                        onEdit={onEdit}
                    />
                ))}
            </div>

            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[780px] border-separate border-spacing-y-3 text-right">
                    <thead className="text-sm text-secondary">
                        <tr>
                            <th scope="col" className="px-5 pb-1 font-medium">
                                المنطقة
                            </th>
                            <th scope="col" className="px-4 pb-1 font-medium">
                                العقارات
                            </th>
                            <th scope="col" className="px-4 pb-1 font-medium">
                                الحالة
                            </th>
                            <th scope="col" className="px-5 pb-1 font-medium">
                                الإجراءات
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {locations.map((location) => (
                            <tr
                                key={location.id}
                                className="group text-ink"
                            >
                                <td className="rounded-r-2xl bg-surface px-5 py-5 shadow-sm transition-colors group-hover:bg-surface-muted">
                                    <Link
                                        href={`/locations/${location.id}`}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="rounded-xl bg-accent-soft p-2.5 text-olive">
                                            <MapPin
                                                size={21}
                                                aria-hidden="true"
                                            />
                                        </span>

                                        <span className="text-lg font-bold hover:text-brand">
                                            {location.nameAr}
                                        </span>
                                    </Link>
                                </td>

                                <td className="bg-surface px-4 py-5 shadow-sm transition-colors group-hover:bg-surface-muted">
                                    <span className="inline-flex items-center gap-2 font-medium">
                                        <Building2
                                            size={18}
                                            className="text-olive"
                                            aria-hidden="true"
                                        />

                                        {location._count.properties}
                                        <span className="text-secondary">
                                            عقارات
                                        </span>
                                    </span>
                                </td>

                                <td className="bg-surface px-4 py-5 shadow-sm transition-colors group-hover:bg-surface-muted">
                                    <span
                                        className={`aqar-badge ${location.isActive
                                            ? "aqar-badge-active"
                                            : "aqar-badge-inactive"
                                            }`}
                                    >
                                        {location.isActive
                                            ? "نشطة"
                                            : "غير نشطة"}
                                    </span>
                                </td>

                                <td className="rounded-l-2xl bg-surface px-5 py-5 shadow-sm transition-colors group-hover:bg-surface-muted">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Link
                                            href={`/locations/${location.id}`}
                                            className="aqar-button aqar-button-soft"
                                        >
                                            عرض العقارات
                                            <ChevronLeft
                                                size={16}
                                                aria-hidden="true"
                                            />
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() => onEdit(location)}
                                            className="aqar-button aqar-button-edit"
                                        >
                                            <Pencil
                                                size={16}
                                                aria-hidden="true"
                                            />
                                            تعديل
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}