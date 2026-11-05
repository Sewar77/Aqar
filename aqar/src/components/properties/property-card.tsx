import Link from "next/link";

import {
  Building2,
  MapPin,
  Ruler,
  Tag,
} from "lucide-react";

import type { PropertyWithRelations } from "@/modules/properties/property.view-types";

type PropertyCardProps = {
  property: PropertyWithRelations;
};

const propertyStatusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  ACTIVE: "نشط",
  ARCHIVED: "مؤرشف",
};

const offerStatusLabels: Record<string, string> = {
  AVAILABLE: "متاح",
  RESERVED: "محجوز",
  UNDER_NEGOTIATION: "قيد التفاوض",
  SOLD: "مباع",
  RENTED: "مؤجّر",
  WITHDRAWN: "مسحوب",
};

const areaUnitLabels: Record<string, string> = {
  SQUARE_METER: "م²",
  DUNUM: "دونم",
  OTHER: "",
};

const numberFormatter = new Intl.NumberFormat("ar-JO", {
  maximumFractionDigits: 2,
});

export function PropertyCard({
  property,
}: PropertyCardProps) {
  /*
   * Prefer an available offering.
   * If none is available, display the first recorded offer.
   */
  const offer =
    property.offerings.find(
      (item) => item.status === "AVAILABLE",
    ) ?? property.offerings[0];

  const areaUnit =
    property.areaUnit === "OTHER"
      ? property.areaUnitLabel
      : property.areaUnit
        ? areaUnitLabels[property.areaUnit]
        : null;

  const area =
    property.areaValue === null
      ? null
      : `${numberFormatter.format(
        Number(property.areaValue),
      )} ${areaUnit ?? ""}`.trim();

  const price = offer
    ? `${numberFormatter.format(
      Number(offer.advertisedPrice),
    )} د.أ`
    : "غير محدد";

  const offerType = offer
    ? offer.transactionType === "SALE"
      ? "للبيع"
      : "للإيجار"
    : "لا يوجد عرض حالي";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-shadow hover:shadow-md">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 border-b border-line bg-surface-subtle px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="rounded-xl bg-brand-soft p-2.5 text-brand">
            <Building2
              size={21}
              aria-hidden="true"
            />
          </span>

          <div className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-extrabold text-ink">
              {property.title}
            </h3>

            <p className="mt-1 text-sm text-muted">
              {property.type.nameAr}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">
          {propertyStatusLabels[property.status] ??
            property.status}
        </span>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        {property.description && (
          <p className="line-clamp-2 text-sm leading-7 text-muted">
            {property.description}
          </p>
        )}

        <dl className="grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
          {/* Location */}
          <div className="min-w-0">
            <dt className="flex items-center gap-1.5 text-muted">
              <MapPin
                size={15}
                aria-hidden="true"
              />
              المنطقة
            </dt>

            <dd className="mt-1 font-semibold text-ink">
              {property.location.nameAr}
            </dd>
          </div>

          {/* Area */}
          <div className="min-w-0">
            <dt className="flex items-center gap-1.5 text-muted">
              <Ruler
                size={15}
                aria-hidden="true"
              />
              المساحة
            </dt>

            <dd className="mt-1 font-semibold text-ink">
              {area ?? "غير محددة"}
            </dd>
          </div>

          {/* Transaction Type */}
          <div className="min-w-0">
            <dt className="flex items-center gap-1.5 text-muted">
              <Tag
                size={15}
                aria-hidden="true"
              />
              نوع العرض
            </dt>

            <dd className="mt-1 font-semibold text-ink">
              {offerType}
            </dd>
          </div>

          {/* Offering Status */}
          <div className="min-w-0">
            <dt className="text-muted">
              حالة العرض
            </dt>

            <dd className="mt-1 font-semibold text-ink">
              {offer
                ? (offerStatusLabels[offer.status] ??
                  offer.status)
                : "—"}
            </dd>
          </div>
        </dl>

        {/* Optional Address */}
        {property.address && (
          <p className="rounded-xl bg-surface-subtle px-3 py-2 text-sm text-muted">
            <span className="font-semibold text-ink">
              العنوان:{" "}
            </span>

            {property.address}
          </p>
        )}

        {/* Price and Navigation */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="text-xs text-muted">
              سعر الإعلان
            </p>

            <p className="mt-1 text-xl font-extrabold text-brand">
              {price}
            </p>
          </div>

          <Link
            href={`/properties/${property.id}`}
            className="shrink-0 rounded-xl bg-info-soft px-4 py-2.5 text-sm font-bold text-info hover:brightness-95"
            aria-label={`عرض تفاصيل ${property.title}`}
          >
            عرض التفاصيل
          </Link>
        </div>
      </div>
    </article>
  );
}