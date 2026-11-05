import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";

import { propertyRepository } from "@/modules/properties/property.repository";
import { PropertyCard } from "@/components/properties/property-card";

async function PropertiesContent() {
  await connection();

  const result = await propertyRepository.list(
    {},
    1,
    15,
  );

  const properties = result.data;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">
            العقارات
          </h1>

          <p className="mt-1 text-sm text-muted">
            إدارة العقارات المسجلة في النظام
          </p>
        </div>

        <Link
          href="/properties/new"
          className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-hover"
        >
          + إضافة عقار
        </Link>
      </header>

      {/* Summary */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm text-muted">
          إجمالي العقارات
        </p>

        <p className="mt-2 text-3xl font-extrabold text-brand">
          {result.pagination.total}
        </p>
      </section>

      {/* Property Cards */}
      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center text-muted">
          لا توجد عقارات مسجلة بعد.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<PropertiesFallback />}>
      <PropertiesContent />
    </Suspense>
  );
}

function PropertiesFallback() {
  return (
    <div
      role="status"
      className="animate-pulse space-y-6"
    >
      <div className="h-8 w-40 rounded-lg bg-gray-200" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-80 rounded-2xl bg-gray-200"
          />
        ))}
      </div>

      <span className="sr-only">
        جارٍ تحميل العقارات
      </span>
    </div>
  );
}