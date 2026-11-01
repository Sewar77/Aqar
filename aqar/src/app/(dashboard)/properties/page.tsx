import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";

import { propertyRepository } from "../../../modules/properties/property.repository";
import { PropertyCard } from "../../../components/properties/property-card";

// This component is responsible for database access.
// It runs at request time, inside a Suspense boundary.
async function PropertiesContent() {
  // Tell Next.js to wait for an actual request
  // before executing the database query.
  await connection();

  const result = await propertyRepository.list({}, 1, 15);
  const properties = result.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">العقارات</h1>

          <p className="mt-1 text-sm text-gray-500">
            إدارة العقارات المسجلة في النظام
          </p>
        </div>

        <Link
          href="/properties/new"
          className="rounded-xl bg-[#195a46] px-5 py-3 text-sm font-semibold text-white"
        >
          + إضافة عقار
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-500">إجمالي العقارات</p>

        <p className="mt-2 text-3xl font-bold text-[#195a46]">
          {result.pagination.total}
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          لا توجد عقارات مسجلة بعد.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}

// This is the route's entry component.
// It can render a fallback without waiting for PostgreSQL.
export default function PropertiesPage() {
  return (
    <Suspense fallback={<PropertiesFallback />}>
      <PropertiesContent />
    </Suspense>
  );
}

function PropertiesFallback() {
  return (
    <div role="status" className="space-y-6 animate-pulse">
      <div className="h-8 w-40 rounded-lg bg-gray-200" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-72 rounded-2xl bg-gray-200" />
        ))}
      </div>

      <span className="sr-only">جاري تحميل العقارات</span>
    </div>
  );
}
