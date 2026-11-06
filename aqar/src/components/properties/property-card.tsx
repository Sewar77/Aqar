
import Link from "next/link";
import {
  Building2,
  MapPin,
  Ruler,
  Tag,
} from "lucide-react";

import { PropertyActions } from "./property-actions";

type PropertyCardData = {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  areaValue: unknown;
  areaUnit: "SQUARE_METER" | "DUNUM" | "OTHER" | null;
  areaUnitLabel: string | null;
  type: {
    nameAr: string;
  };
  location: {
    nameAr: string;
  };
  offerings: Array<{
    status: string;
    advertisedPrice: unknown;
    transactionType: string;
  }>;
};

const numberFormatter = new Intl.NumberFormat("ar-JO", {
  maximumFractionDigits: 2,
});

const propertyStatus = {
  DRAFT: "مسودة",
  ACTIVE: "نشط",
  ARCHIVED: "مؤرشف",
} as const;

const offeringStatus: Record<string, string> = {
  AVAILABLE: "متاح",
  RESERVED: "محجوز",
  UNDER_NEGOTIATION: "قيد التفاوض",
  SOLD: "مباع",
  RENTED: "مؤجر",
  WITHDRAWN: "مسحوب",
};

export function PropertyCard({
  property,
}: {
  property: PropertyCardData;
}) {
  const offer =
    property.offerings.find(
      (item) => item.status === "AVAILABLE",
    ) ?? property.offerings[0];

  const area =
    property.areaValue == null
      ? null
      : Number(property.areaValue);

  const areaUnit =
    property.areaUnit === "DUNUM"
      ? "دونم"
      : property.areaUnit === "SQUARE_METER"
        ? "م²"
        : property.areaUnitLabel ?? "";

  const price = offer
    ? Number(offer.advertisedPrice)
    : null;

  const statusClass =
    property.status === "ACTIVE"
      ? "aqar-badge-active"
      : property.status === "ARCHIVED"
        ? "aqar-badge-archived"
        : "aqar-badge-inactive";

  return (
    <article className="aqar-card flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-xl bg-olive-soft p-3 text-brand">
          <Building2 size={22} aria-hidden="true" />
        </span>

        <span className={`aqar-badge ${statusClass}`}>
          {propertyStatus[property.status]}
        </span>
      </div>

      <Link
        href={`/properties/${property.id}`}
        className="aqar-heading mt-4 line-clamp-2 text-xl hover:text-brand"
      >
        {property.title}
      </Link>

      <p className="mt-1 text-sm text-secondary">
        {property.type.nameAr}
      </p>

      {property.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-7 text-secondary">
          {property.description}
        </p>
      )}

      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="flex items-center gap-1 text-muted">
            <MapPin size={16} aria-hidden="true" />
            المنطقة
          </dt>
          <dd className="mt-1 font-semibold text-ink">
            {property.location.nameAr}
          </dd>
        </div>

        <div>
          <dt className="flex items-center gap-1 text-muted">
            <Ruler size={16} aria-hidden="true" />
            المساحة
          </dt>
          <dd className="mt-1 font-semibold text-ink">
            {area == null
              ? "غير محددة"
              : `${numberFormatter.format(area)} ${areaUnit}`}
          </dd>
        </div>

        <div>
          <dt className="flex items-center gap-1 text-muted">
            <Tag size={16} aria-hidden="true" />
            نوع العرض
          </dt>
          <dd className="mt-1 font-semibold text-ink">
            {offer
              ? offer.transactionType === "SALE"
                ? "للبيع"
                : "للإيجار"
              : "غير محدد"}
          </dd>
        </div>

        <div>
          <dt className="text-muted">حالة العرض</dt>
          <dd className="mt-1 font-semibold text-ink">
            {offer
              ? offeringStatus[offer.status] ?? "غير محددة"
              : "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-auto pt-5">
        <div className="mb-4 rounded-xl bg-surface-muted p-3">
          <span className="block text-sm text-secondary">
            سعر الإعلان
          </span>

          <strong className="text-xl text-brand">
            {price == null
              ? "غير محدد"
              : `${numberFormatter.format(price)} د.أ`}
          </strong>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/properties/${property.id}`}
            className="font-semibold text-brand hover:underline"
          >
            عرض التفاصيل
          </Link>

          <PropertyActions
            id={property.id}
            title={property.title}
            status={property.status}
          />
        </div>
      </div>
    </article>
  );
}
