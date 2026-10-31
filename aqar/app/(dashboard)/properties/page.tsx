"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Plus, Search, RefreshCw } from "lucide-react";

type Property = {
  id: string;
  title: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  areaValue: string | number | null;
  areaUnit: string | null;
  type?: { nameAr: string } | null;
  city?: {
    nameAr: string;
    governorate?: { nameAr: string } | null;
  } | null;
  offerings?: {
    advertisedPrice: string | number;
    currency: string;
    transactionType: string;
  }[];
};

const statusLabels = {
  ACTIVE: "نشط",
  DRAFT: "مسودة",
  ARCHIVED: "مؤرشف",
};

function extractProperties(payload: any): Property[] {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.properties)) return data.properties;

  throw new Error("صيغة بيانات العقارات غير متوقعة");
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProperties() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/properties", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("تعذر تحميل العقارات");
      }

      const payload = await response.json();
      setProperties(extractProperties(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProperties();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return properties.filter((property) => {
      const text = [
        property.title,
        property.type?.nameAr,
        property.city?.nameAr,
        property.city?.governorate?.nameAr,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(term);
      const matchesStatus = status === "ALL" || property.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [properties, search, status]);

  const numberFormat = new Intl.NumberFormat("ar-JO");

  return (
    <main dir="rtl" className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">العقارات</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            إدارة ومتابعة العقارات المسجلة
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => void loadProperties()}
            disabled={loading}
            className="rounded-lg border p-2.5 hover:bg-muted disabled:opacity-50"
            aria-label="تحديث العقارات"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <Link
            href="/properties/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            إضافة عقار
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "جميع العقارات", value: properties.length },
          {
            label: "نشطة",
            value: properties.filter((p) => p.status === "ACTIVE").length,
          },
          {
            label: "مسودات",
            value: properties.filter((p) => p.status === "DRAFT").length,
          },
          {
            label: "مؤرشفة",
            value: properties.filter((p) => p.status === "ARCHIVED").length,
          },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-bold">
              {numberFormat.format(item.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث بالعنوان أو المنطقة أو النوع..."
            className="w-full rounded-lg border bg-background py-2.5 pr-10 pl-3 text-sm"
          />
        </div>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-lg border bg-background px-4 py-2.5 text-sm"
        >
          <option value="ALL">جميع الحالات</option>
          <option value="ACTIVE">نشط</option>
          <option value="DRAFT">مسودة</option>
          <option value="ARCHIVED">مؤرشف</option>
        </select>
      </div>

      {loading ? (
        <p className="py-12 text-center text-muted-foreground">
          جاري تحميل العقارات...
        </p>
      ) : error ? (
        <div className="rounded-xl border p-6 text-center">
          <p className="text-destructive">{error}</p>
          <button
            onClick={() => void loadProperties()}
            className="mt-3 text-sm underline"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border p-12 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p>لا توجد عقارات مطابقة</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((property) => {
            const offering = property.offerings?.[0];

            return (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="rounded-xl border bg-card p-5 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
                    <Building2 className="h-5 w-5" />
                  </div>

                  <span className="rounded-full bg-muted px-3 py-1 text-xs">
                    {statusLabels[property.status] ?? property.status}
                  </span>
                </div>

                <h2 className="mt-4 font-semibold">{property.title}</h2>

                <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {[property.city?.nameAr, property.city?.governorate?.nameAr]
                    .filter(Boolean)
                    .join("، ") || "الموقع غير محدد"}
                </p>

                <div className="mt-4 flex justify-between border-t pt-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">النوع</p>
                    <p className="mt-1 font-medium">
                      {property.type?.nameAr ?? "غير محدد"}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">المساحة</p>
                    <p className="mt-1 font-medium">
                      {property.areaValue == null
                        ? "غير محددة"
                        : `${numberFormat.format(Number(property.areaValue))} ${
                            property.areaUnit === "DUNUM"
                              ? "دونم"
                              : property.areaUnit === "SQUARE_METER"
                                ? "م²"
                                : ""
                          }`}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t pt-4">
                  <p className="text-xs text-muted-foreground">السعر المعلن</p>
                  <p className="mt-1 text-lg font-bold">
                    {offering
                      ? `${numberFormat.format(
                          Number(offering.advertisedPrice),
                        )} ${offering.currency}`
                      : "لا يوجد عرض"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && !error && (
        <p className="text-sm text-muted-foreground">
          عدد النتائج: {numberFormat.format(filtered.length)}
        </p>
      )}
    </main>
  );
}
