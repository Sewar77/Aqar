import Link from "next/link";
import {
    Building2,
    MapPin,
    Pencil,
    ChevronLeft,
} from "lucide-react";

import type { LocationListItem } from "./location.types";

type LocationCardProps = {
    location: LocationListItem;
    onEdit: (location: LocationListItem) => void;
};

export function LocationCard({
    location,
    onEdit,
}: LocationCardProps) {
    return (
        <article className="aqar-card space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="rounded-xl bg-accent-soft p-3 text-olive">
                        <MapPin size={23} aria-hidden="true" />
                    </span>

                    <div>
                        <Link
                            href={`/locations/${location.id}`}
                            className="aqar-heading text-xl hover:text-brand"
                        >
                            {location.nameAr}
                        </Link>

                        <p className="mt-1 flex items-center gap-2 text-sm text-secondary">
                            <Building2 size={16} aria-hidden="true" />
                            {location._count.properties} عقارات
                        </p>
                    </div>
                </div>

                <span
                    className={`aqar-badge ${location.isActive
                        ? "aqar-badge-active"
                        : "aqar-badge-inactive"
                        }`}
                >
                    {location.isActive ? "نشطة" : "غير نشطة"}
                </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
                <Link
                    href={`/locations/${location.id}`}
                    className="aqar-button aqar-button-soft flex-1"
                >
                    عرض العقارات
                    <ChevronLeft size={17} aria-hidden="true" />
                </Link>

                <button
                    type="button"
                    onClick={() => onEdit(location)}
                    className="aqar-button aqar-button-edit"
                    aria-label={`تعديل منطقة ${location.nameAr}`}
                >
                    <Pencil size={16} aria-hidden="true" />
                    تعديل
                </button>
            </div>
        </article>
    );
}