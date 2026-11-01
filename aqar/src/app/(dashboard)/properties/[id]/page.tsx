import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { propertyRepository } from "../../../../modules/properties/property.repository";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

// This component handles the request-specific database query.
async function PropertyDetailsContent({ params }: PageProps) {
  // Ensure the database query runs at request time.
  await connection();

  const { id } = await params;

  // Validate the UUID before passing it to Prisma.
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    notFound();
  }

  const property = await propertyRepository.findById(id);

  if (!property) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/properties" className="text-sm font-medium text-[#195a46]">
        → العودة إلى العقارات
      </Link>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">{property.propertyCode}</p>

        <h1 className="mt-2 text-2xl font-bold">{property.title}</h1>

        <p className="mt-3 text-sm text-gray-600">
          {property.description ?? "لا يوجد وصف"}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold">معلومات العقار</h2>

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">النوع</dt>
              <dd>{property.type.nameAr}</dd>
            </div>

            <div>
              <dt className="text-gray-500">المنطقة</dt>
              <dd>{property.location.nameAr}</dd>
            </div>

            <div>
              <dt className="text-gray-500">العنوان</dt>
              <dd>{property.address ?? "غير محدد"}</dd>
            </div>

            <div>
              <dt className="text-gray-500">المساحة</dt>
              <dd>
                {property.areaValue !== null
                  ? Number(property.areaValue).toLocaleString("ar-JO")
                  : "غير محددة"}{" "}
                {property.areaUnit === "DUNUM"
                  ? "دونم"
                  : property.areaUnit === "SQUARE_METER"
                    ? "م²"
                    : (property.areaUnitLabel ?? "")}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold">جهات الاتصال</h2>

          <div className="space-y-4">
            {property.contacts.map((relationship) => (
              <div key={relationship.id} className="rounded-xl bg-gray-50 p-4">
                <p className="font-semibold">{relationship.contact.fullName}</p>

                <p className="mt-1 text-sm text-gray-600" dir="ltr">
                  {relationship.contact.phone}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {relationship.role === "OWNER"
                    ? "المالك"
                    : relationship.role === "CO_OWNER"
                      ? "شريك في الملكية"
                      : "مفوّض بالتواصل"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold">عروض البيع والإيجار</h2>

          <div className="space-y-4">
            {property.offerings.map((offering) => (
              <div key={offering.id} className="rounded-xl bg-gray-50 p-4">
                <p className="font-semibold">
                  {offering.transactionType === "SALE" ? "للبيع" : "للإيجار"}
                </p>

                <p className="mt-2 text-sm">
                  سعر المالك:{" "}
                  {Number(offering.ownerPrice).toLocaleString("ar-JO")} د.أ
                </p>

                <p className="text-sm font-bold text-[#195a46]">
                  سعر الإعلان:{" "}
                  {Number(offering.advertisedPrice).toLocaleString("ar-JO")} د.أ
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold">ملاحظات داخلية</h2>

          <p className="text-sm text-gray-600">
            {property.internalNotes ?? "لا توجد ملاحظات"}
          </p>
        </section>
      </div>
    </div>
  );
}

// The page renders immediately with a fallback.
// The database-dependent content streams in afterward.
export default function PropertyDetailsPage({ params }: PageProps) {
  return (
    <Suspense fallback={<PropertyDetailsFallback />}>
      <PropertyDetailsContent params={params} />
    </Suspense>
  );
}

function PropertyDetailsFallback() {
  return (
    <div role="status" className="space-y-5 animate-pulse">
      <div className="h-6 w-32 rounded bg-gray-200" />
      <div className="h-36 rounded-2xl bg-gray-200" />

      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-48 rounded-2xl bg-gray-200" />
        ))}
      </div>

      <span className="sr-only">جاري تحميل تفاصيل العقار</span>
    </div>
  );
}
