import Link from "next/link";

import type { PropertyWithRelations } from "../../modules/properties/property.view-types";

type PropertyCardProps = {
  property: PropertyWithRelations;
};

const statusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  ACTIVE: "نشط",
  ARCHIVED: "مؤرشف",
};

const areaUnitLabels: Record<string, string> = {
  SQUARE_METER: "م²",
  DUNUM: "دونم",
  OTHER: "",
};

export function PropertyCard({ property }: PropertyCardProps) {
  // Find the first available sale offering.
  const saleOffering = property.offerings.find(
    (offering) => offering.transactionType === "SALE",
  );

  // If there is no sale offering, show the rental one.
  const offering = saleOffering ?? property.offerings[0];

  const price = offering
    ? Number(offering.advertisedPrice).toLocaleString("ar-JO")
    : null;

  const area =
    property.areaValue !== null
      ? Number(property.areaValue).toLocaleString("ar-JO")
      : null;

  const areaUnit =
    property.areaUnit === "OTHER"
      ? property.areaUnitLabel
      : property.areaUnit
        ? areaUnitLabels[property.areaUnit]
        : "";

  return (
    <article className="overflow-hidden rounded-2xl border border-[#e3e8e4] bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex h-36 items-center justify-center bg-[#e8f2ed]">
        <span className="text-5xl text-[#195a46]" aria-hidden="true">
          ⌂
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-xs text-gray-500">
              {property.propertyCode}
            </p>

            <h3 className="font-bold text-gray-900">{property.title}</h3>
          </div>

          <span className="shrink-0 rounded-full bg-[#e8f2ed] px-3 py-1 text-xs font-medium text-[#195a46]">
            {statusLabels[property.status]}
          </span>
        </div>

        <p className="text-sm text-gray-500">
          {property.location.nameAr}
          {" · "}
          {property.type.nameAr}
        </p>

        {area !== null && (
          <p className="text-sm text-gray-600">
            المساحة: {area} {areaUnit}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs text-gray-500">سعر الإعلان</p>

            <p className="text-lg font-bold text-[#195a46]">
              {price ? `${price} د.أ` : "غير محدد"}
            </p>
          </div>

          <Link
            href={`/properties/${property.id}`}
            className="rounded-lg bg-[#195a46] px-4 py-2 text-sm font-medium text-white hover:bg-[#124635]"
          >
            التفاصيل
          </Link>
        </div>
      </div>
    </article>
  );
}
