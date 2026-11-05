import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import {
  ArrowRight,
  Building2,
  MapPin,
  Ruler,
  UserRound,
} from "lucide-react";

import { propertyRepository } from "@/modules/properties/property.repository";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const numberFormatter = new Intl.NumberFormat(
  "ar-JO",
  {
    maximumFractionDigits: 2,
  },
);

const propertyStatusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  ACTIVE: "نشط",
  ARCHIVED: "مؤرشف",
};

const offeringStatusLabels: Record<string, string> = {
  AVAILABLE: "متاح",
  RESERVED: "محجوز",
  UNDER_NEGOTIATION: "قيد التفاوض",
  SOLD: "مباع",
  RENTED: "مؤجر",
  WITHDRAWN: "مسحوب",
};

const roleLabels: Record<string, string> = {
  OWNER: "المالك",
  CO_OWNER: "شريك في الملكية",
  AUTHORIZED_REPRESENTATIVE: "مفوّض بالتواصل",
};

async function PropertyDetailsContent({
  params,
}: Props) {
  await connection();

  const { id } = await params;

  if (!uuidPattern.test(id)) {
    notFound();
  }

  const property =
    await propertyRepository.findById(id);

  if (!property) {
    notFound();
  }

  const area =
    property.areaValue !== null
      ? numberFormatter.format(
        Number(property.areaValue),
      )
      : null;

  const areaUnit =
    property.areaUnit === "DUNUM"
      ? "دونم"
      : property.areaUnit === "SQUARE_METER"
        ? "م²"
        : property.areaUnitLabel ?? "";

  return (
    <section dir="rtl" className="space-y-7">
      <Link
        href="/properties"
        className="inline-flex items-center gap-2 font-semibold text-brand hover:underline"
      >
        <ArrowRight size={18} aria-hidden="true" />
        العودة إلى العقارات
      </Link>

      {/* Property Header */}
      <header className="aqar-card space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="aqar-heading text-3xl">
              {property.title}
            </h1>

            <p className="aqar-description mt-2">
              {property.description ??
                "لا يوجد وصف إضافي"}
            </p>
          </div>

          <span className="aqar-badge aqar-badge-active">
            {propertyStatusLabels[property.status]}
          </span>
        </div>
      </header>

      {/* Basic Information */}
      <section className="aqar-card space-y-5 p-6">
        <h2 className="aqar-heading text-2xl">
          معلومات العقار
        </h2>

        <dl className="grid gap-5 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <Building2
              size={20}
              className="text-olive"
              aria-hidden="true"
            />

            <div>
              <dt className="text-secondary">
                نوع العقار
              </dt>

              <dd className="font-bold">
                {property.type.nameAr}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin
              size={20}
              className="text-olive"
              aria-hidden="true"
            />

            <div>
              <dt className="text-secondary">
                المنطقة
              </dt>

              <dd>
                <Link
                  href={`/locations/${property.location.id}`}
                  className="font-bold text-brand hover:underline"
                >
                  {property.location.nameAr}
                </Link>
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Ruler
              size={20}
              className="text-olive"
              aria-hidden="true"
            />

            <div>
              <dt className="text-secondary">
                المساحة
              </dt>

              <dd className="font-bold">
                {area
                  ? `${area} ${areaUnit}`
                  : "غير محددة"}
              </dd>
            </div>
          </div>

          {property.address && (
            <div>
              <dt className="text-secondary">
                العنوان
              </dt>

              <dd className="font-bold">
                {property.address}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* Contacts */}
      <section className="aqar-card space-y-5 p-6">
        <div className="flex items-center gap-3">
          <UserRound
            size={23}
            className="text-olive"
            aria-hidden="true"
          />

          <h2 className="aqar-heading text-2xl">
            جهات الاتصال
          </h2>
        </div>

        {property.contacts.length === 0 ? (
          <p className="text-secondary">
            لا توجد جهات اتصال مرتبطة.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {property.contacts.map((relation) => (
              <Link
                key={relation.id}
                href={`/contacts/${relation.contact.id}`}
                className="rounded-2xl bg-surface-muted p-5 transition-colors hover:bg-olive-soft"
              >
                <h3 className="text-lg font-bold text-ink">
                  {relation.contact.fullName}
                </h3>

                <p
                  dir="ltr"
                  className="mt-2 text-right text-secondary"
                >
                  {relation.contact.phone}
                </p>

                <p className="mt-2 text-sm font-semibold text-brand">
                  {roleLabels[relation.role]}
                </p>

                <p className="mt-3 text-sm text-secondary">
                  عرض جميع العقارات المرتبطة
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Offerings */}
      <section className="aqar-card space-y-5 p-6">
        <h2 className="aqar-heading text-2xl">
          عروض البيع والإيجار
        </h2>

        {property.offerings.length === 0 ? (
          <p className="text-secondary">
            لا توجد عروض مسجلة.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {property.offerings.map((offering) => (
              <article
                key={offering.id}
                className="rounded-2xl bg-surface-muted p-5"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <h3 className="font-bold text-ink">
                    {offering.transactionType === "SALE"
                      ? "للبيع"
                      : "للإيجار"}
                  </h3>

                  <span className="aqar-badge aqar-badge-active">
                    {offeringStatusLabels[
                      offering.status
                    ]}
                  </span>
                </div>

                <p className="mt-4 text-sm text-secondary">
                  سعر الإعلان
                </p>

                <p className="mt-1 text-2xl font-extrabold text-brand">
                  {numberFormatter.format(
                    Number(offering.advertisedPrice),
                  )}{" "}
                  د.أ
                </p>

                <p className="mt-3 text-sm text-secondary">
                  سعر المالك:{" "}
                  {numberFormatter.format(
                    Number(offering.ownerPrice),
                  )}{" "}
                  د.أ
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Internal Notes */}
      {property.internalNotes && (
        <section className="aqar-card p-6">
          <h2 className="aqar-heading mb-3 text-xl">
            ملاحظات داخلية
          </h2>

          <p className="whitespace-pre-wrap text-secondary">
            {property.internalNotes}
          </p>
        </section>
      )}
    </section>
  );
}

export default function PropertyDetailsPage(
  props: Props,
) {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          className="aqar-surface p-8"
        >
          جارٍ تحميل تفاصيل العقار...
        </div>
      }
    >
      <PropertyDetailsContent {...props} />
    </Suspense>
  );
}