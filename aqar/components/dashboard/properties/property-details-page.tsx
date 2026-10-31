"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PropertyOffering = {
  id: string;
  transactionType: "SALE" | "RENT";
  ownerPrice: string;
  advertisedPrice: string;
  currency: string;
  rentalPeriod: string | null;
  allowNegotiation: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type PropertyRelation = {
  id: string;
  title: string;
  status: string;
  type?: {
    nameAr?: string;
  } | null;
};

type PropertyRecord = Record<string, unknown> & {
  id: string;
  title: string;
  description: string | null;
  typeId: string;
  parentPropertyId: string | null;
  cityId: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  areaValue: string | null;
  areaUnit: string | null;
  areaUnitLabel: string | null;
  areaInSquareMeters: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  type: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string | null;
  } | null;
  city: {
    id: string;
    nameAr: string;
    nameEn: string | null;
    governorate: {
      id: string;
      nameAr: string;
      nameEn: string | null;
    } | null;
  } | null;
  parentProperty: PropertyRelation | null;
  childProperties: PropertyRelation[];
  contacts: Record<string, unknown>[];
  offerings: PropertyOffering[];
  photos: Record<string, unknown>[];
  events: Record<string, unknown>[];
};

type ApiResponse = {
  success: boolean;
  data?: PropertyRecord;
  message?: string;
};

const statusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  ACTIVE: "نشط",
  ARCHIVED: "مؤرشف",
  AVAILABLE: "متاح",
  RESERVED: "محجوز",
  UNDER_NEGOTIATION: "قيد التفاوض",
  SOLD: "تم البيع",
  RENTED: "تم التأجير",
  WITHDRAWN: "مسحوب",
  SALE: "بيع",
  RENT: "إيجار",
  DAILY: "يومي",
  WEEKLY: "أسبوعي",
  MONTHLY: "شهري",
  YEARLY: "سنوي",
  OTHER: "أخرى",
};

function label(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "boolean") return value ? "نعم" : "لا";

  if (typeof value === "string") {
    return statusLabels[value] ?? value;
  }

  if (typeof value === "number") return value.toLocaleString("en-US");

  return String(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ar-JO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPrice(value: string | number | null, currency = "JOD") {
  if (value === null || value === undefined || value === "") return "—";

  const number = Number(value);

  if (Number.isNaN(number)) return `${value} ${currency}`;

  return `${number.toLocaleString("en-US")} ${currency}`;
}

function getDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "boolean") return value ? "نعم" : "لا";

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return label(value);
}

function InfoItem({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="mb-2 text-sm text-gray-500">{title}</p>
      <div className="break-words font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}

function RecordDetails({
  record,
  excludedKeys = [],
}: {
  record: Record<string, unknown>;
  excludedKeys?: string[];
}) {
  const entries = Object.entries(record).filter(
    ([key, value]) =>
      !excludedKeys.includes(key) && value !== null && value !== undefined,
  );

  if (entries.length === 0) {
    return <EmptyState message="لا توجد تفاصيل إضافية." />;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries
          .filter(([, value]) => typeof value !== "object")
          .map(([key, value]) => (
            <InfoItem key={key} title={key} value={getDisplayValue(value)} />
          ))}
      </div>

      {entries
        .filter(
          ([, value]) =>
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value),
        )
        .map(([key, value]) => (
          <div key={key} className="rounded-xl border border-gray-200 p-4">
            <h4 className="mb-3 font-semibold text-gray-800">{key}</h4>
            <RecordDetails record={value as Record<string, unknown>} />
          </div>
        ))}

      {entries
        .filter(([, value]) => Array.isArray(value) && value.length > 0)
        .map(([key, value]) => (
          <div key={key} className="rounded-xl border border-gray-200 p-4">
            <h4 className="mb-3 font-semibold text-gray-800">{key}</h4>
            <div className="space-y-3">
              {(value as unknown[]).map((item, index) => (
                <div key={index}>
                  {typeof item === "object" && item !== null ? (
                    <RecordDetails record={item as Record<string, unknown>} />
                  ) : (
                    <p>{getDisplayValue(item)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

export default function PropertyDetailsPage({
  propertyId,
}: {
  propertyId: string;
}) {
  const [property, setProperty] = useState<PropertyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProperty() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/properties/${propertyId}`, {
          cache: "no-store",
        });

        const result: ApiResponse = await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || "تعذر تحميل تفاصيل العقار.");
        }

        if (!cancelled) {
          setProperty(result.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "حدث خطأ أثناء تحميل العقار.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProperty();

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  if (loading) {
    return (
      <div dir="rtl" className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded bg-gray-200" />
          <div className="h-32 rounded-2xl bg-gray-100" />
          <div className="h-48 rounded-2xl bg-gray-100" />
        </div>
        <p className="mt-4 text-sm text-gray-500">
          جاري تحميل تفاصيل العقار...
        </p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div dir="rtl" className="p-6">
        <Link
          href="/locations"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          العودة إلى المواقع
        </Link>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error || "العقار غير موجود."}
        </div>
      </div>
    );
  }

  const location = [property.city?.governorate?.nameAr, property.city?.nameAr]
    .filter(Boolean)
    .join(" / ");

  return (
    <main dir="rtl" className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Breadcrumb and actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <Link href="/locations" className="hover:text-blue-600">
            المواقع
          </Link>
          <span>/</span>
          {property.city && (
            <>
              <Link
                href={`/locations/${property.city.id}`}
                className="hover:text-blue-600"
              >
                {property.city.nameAr}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="font-medium text-gray-900">تفاصيل العقار</span>
        </div>

        <Link
          href={property.city ? `/locations/${property.city.id}` : "/locations"}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          العودة للقائمة
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {property.type?.nameAr || "نوع غير محدد"}
              </span>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                {label(property.status)}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              {property.title}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {location || "الموقع غير محدد"}
              {property.address ? ` — ${property.address}` : ""}
            </p>
          </div>

          <div className="text-left text-xs text-gray-400" dir="ltr">
            <p>Property ID</p>
            <p className="mt-1 break-all font-mono">{property.id}</p>
          </div>
        </div>

        {property.description && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <h3 className="mb-2 text-sm font-bold text-gray-700">الوصف</h3>
            <p className="whitespace-pre-wrap leading-7 text-gray-600">
              {property.description}
            </p>
          </div>
        )}
      </div>

      {/* Basic information */}
      <Section title="المعلومات الأساسية">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem title="اسم العقار" value={property.title} />
          <InfoItem title="نوع العقار" value={property.type?.nameAr || "—"} />
          <InfoItem title="رمز النوع" value={property.type?.code || "—"} />
          <InfoItem title="حالة العقار" value={label(property.status)} />
          <InfoItem
            title="المحافظة"
            value={property.city?.governorate?.nameAr || "—"}
          />
          <InfoItem title="المدينة" value={property.city?.nameAr || "—"} />
          <InfoItem title="العنوان التفصيلي" value={property.address || "—"} />
          <InfoItem title="خط العرض" value={label(property.latitude)} />
          <InfoItem title="خط الطول" value={label(property.longitude)} />
        </div>
      </Section>

      {/* Area and specifications */}
      <Section title="المساحة والمواصفات">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            title="المساحة المدخلة"
            value={
              property.areaValue
                ? `${Number(property.areaValue).toLocaleString("en-US")} ${property.areaUnitLabel || ""}`
                : "—"
            }
          />
          <InfoItem title="وحدة المساحة" value={label(property.areaUnit)} />
          <InfoItem
            title="المساحة بالمتر المربع"
            value={
              property.areaInSquareMeters
                ? `${Number(property.areaInSquareMeters).toLocaleString("en-US")} م²`
                : "—"
            }
          />

          <InfoItem
            title="العقار الرئيسي"
            value={property.parentPropertyId || "لا يوجد"}
          />
        </div>
      </Section>

      {/* Parent and child properties */}
      <Section
        title="العقارات المرتبطة"
        description="العقار الرئيسي والوحدات أو العقارات التابعة له."
      >
        {property.parentProperty ? (
          <div className="mb-4 rounded-xl border border-gray-200 p-4">
            <p className="mb-2 text-sm text-gray-500">العقار الرئيسي</p>
            <Link
              href={`/properties/${property.parentProperty.id}`}
              className="font-semibold text-blue-600 hover:underline"
            >
              {property.parentProperty.title}
            </Link>
          </div>
        ) : (
          <p className="mb-4 text-sm text-gray-500">
            هذا العقار ليس تابعاً لعقار رئيسي.
          </p>
        )}

        {property.childProperties.length > 0 ? (
          <div className="space-y-2">
            {property.childProperties.map((child) => (
              <div
                key={child.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-4"
              >
                <div>
                  <Link
                    href={`/properties/${child.id}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {child.title}
                  </Link>
                  <p className="mt-1 text-xs text-gray-500">
                    {child.type?.nameAr || "نوع غير محدد"}
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                  {label(child.status)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="لا توجد عقارات أو وحدات تابعة لهذا العقار." />
        )}
      </Section>

      {/* Offerings */}
      <Section
        title="العروض والأسعار"
        description="تفاصيل البيع أو الإيجار والأسعار المطلوبة والمعلنة."
      >
        {property.offerings.length > 0 ? (
          <div className="space-y-4">
            {property.offerings.map((offering, index) => (
              <div
                key={offering.id}
                className="rounded-xl border border-gray-200 p-4 sm:p-5"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-gray-900">
                    العرض {index + 1} — {label(offering.transactionType)}
                  </h3>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {label(offering.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoItem
                    title="السعر المطلوب من المالك"
                    value={formatPrice(offering.ownerPrice, offering.currency)}
                  />
                  <InfoItem
                    title="السعر المعلن"
                    value={formatPrice(
                      offering.advertisedPrice,
                      offering.currency,
                    )}
                  />
                  <InfoItem title="العملة" value={offering.currency} />
                  <InfoItem
                    title="فترة الإيجار"
                    value={label(offering.rentalPeriod)}
                  />
                  <InfoItem
                    title="السماح بالتفاوض"
                    value={label(offering.allowNegotiation)}
                  />
                  <InfoItem title="حالة العرض" value={label(offering.status)} />
                  <InfoItem
                    title="تاريخ إنشاء العرض"
                    value={formatDate(offering.createdAt)}
                  />
                  <InfoItem
                    title="آخر تحديث للعرض"
                    value={formatDate(offering.updatedAt)}
                  />
                  <InfoItem title="معرّف العرض" value={offering.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="لا توجد عروض أو أسعار مسجلة لهذا العقار." />
        )}
      </Section>

      {/* Contacts */}
      <Section
        title="الملاك وجهات الاتصال"
        description="الملاك والشركاء والممثلون المفوضون المرتبطون بالعقار."
      >
        {property.contacts.length > 0 ? (
          <div className="space-y-4">
            {property.contacts.map((contact, index) => (
              <div
                key={String(contact.id ?? index)}
                className="rounded-xl border border-gray-200 p-4"
              >
                <h3 className="mb-4 font-bold">جهة الاتصال {index + 1}</h3>
                <RecordDetails record={contact} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="لا توجد جهات اتصال مرتبطة بهذا العقار." />
        )}
      </Section>

      {/* Photos */}
      <Section
        title="الصور والملفات"
        description="الصور والملفات المسجلة للعقار."
      >
        {property.photos.length > 0 ? (
          <div className="space-y-3">
            {property.photos.map((photo, index) => (
              <div
                key={String(photo.id ?? index)}
                className="rounded-xl border border-gray-200 p-4"
              >
                <h3 className="mb-3 font-semibold">ملف {index + 1}</h3>
                <RecordDetails record={photo} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="لا توجد صور أو ملفات مرفقة حالياً." />
        )}
      </Section>

      {/* Activity history */}
      <Section
        title="سجل النشاط والتاريخ"
        description="الأحداث والتغييرات المسجلة على العقار."
      >
        {property.events.length > 0 ? (
          <div className="relative space-y-4">
            {property.events.map((event, index) => (
              <div
                key={String(event.id ?? index)}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-gray-900">
                    {label(event.eventType ?? event.type ?? `حدث ${index + 1}`)}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {formatDate(
                      String(event.createdAt ?? event.occurredAt ?? ""),
                    )}
                  </span>
                </div>
                <RecordDetails record={event} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="لا توجد أحداث مسجلة لهذا العقار حتى الآن." />
        )}
      </Section>

      {/* System information */}
      <Section title="معلومات النظام">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            title="تاريخ إنشاء العقار"
            value={formatDate(property.createdAt)}
          />
          <InfoItem
            title="آخر تحديث للعقار"
            value={formatDate(property.updatedAt)}
          />
          <InfoItem
            title="معرّف العقار الرئيسي"
            value={property.parentPropertyId || "—"}
          />
        </div>
      </Section>
    </main>
  );
}
