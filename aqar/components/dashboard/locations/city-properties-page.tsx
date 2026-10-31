"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface City {
  id: string;
  nameAr: string;
  nameEn: string | null;
  governorate?: {
    nameAr: string;
  };
}

interface Offering {
  id: string;
  transactionType: "SALE" | "RENT";
  advertisedPrice: string;
  currency: string;
  status: string;
  rentalPeriod?: string | null;
}

interface Property {
  id: string;
  title: string;
  address?: string | null;
  status: string;
  areaValue?: string | number | null;
  areaUnit?: string | null;
  areaUnitLabel?: string | null;
  type?: {
    nameAr: string;
  };
  offerings: Offering[];
}

interface PropertiesApiResponse {
  success: boolean;
  items: Property[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}

interface CityApiResponse {
  success: boolean;
  data: City;
  message?: string;
}

const propertyStatusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  ACTIVE: "نشط",
  ARCHIVED: "مؤرشف",
};

function formatPrice(price: string, currency: string) {
  return `${Number(price).toLocaleString("en-US")} ${currency}`;
}

export default function CityPropertiesPage({ cityId }: { cityId: string }) {
  const [city, setCity] = useState<City | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [cityResponse, propertiesResponse] = await Promise.all([
          fetch(`/api/cities/${cityId}`),
          fetch(`/api/properties?cityId=${cityId}&page=1&limit=50`),
        ]);

        const cityResult: CityApiResponse = await cityResponse.json();
        const propertiesResult: PropertiesApiResponse =
          await propertiesResponse.json();

        if (!cityResponse.ok || !cityResult.success) {
          throw new Error("تعذر تحميل بيانات المدينة");
        }

        if (!propertiesResponse.ok || !propertiesResult.success) {
          throw new Error("تعذر تحميل العقارات");
        }

        setCity(cityResult.data);
        setProperties(propertiesResult.items ?? []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "حدث خطأ أثناء تحميل البيانات",
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [cityId]);

  if (loading) {
    return (
      <div dir="rtl" className="p-6 text-gray-500">
        جاري تحميل بيانات المدينة والعقارات...
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="rounded-lg bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!city) return null;

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <Link
          href="/locations"
          className="text-sm text-blue-600 hover:underline"
        >
          ← العودة إلى المحافظات والمدن
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          عقارات {city.nameAr}
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          {city.governorate?.nameAr} · جميع العقارات المسجلة في هذه المدينة
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-5">
          <h2 className="font-semibold text-gray-900">العقارات</h2>
          <p className="mt-1 text-sm text-gray-500">{properties.length} عقار</p>
        </div>

        {properties.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-medium text-gray-700">
              لا توجد عقارات مسجلة في هذه المدينة حتى الآن.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="px-4 py-3">العقار</th>
                  <th className="px-4 py-3">النوع</th>
                  <th className="px-4 py-3">المساحة</th>
                  <th className="px-4 py-3">العرض والسعر</th>
                  <th className="px-4 py-3">العنوان</th>
                  <th className="px-4 py-3">الحالة</th>
                </tr>
              </thead>

              <tbody>
                {properties.map((property) => (
                  <tr
                    key={property.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 font-semibold">
                      <Link
                        href={`/properties/${property.id}`}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {property.title}
                      </Link>
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {property.type?.nameAr ?? "—"}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {property.areaValue
                        ? `${property.areaValue} ${property.areaUnitLabel ?? ""}`
                        : "—"}
                    </td>

                    <td className="px-4 py-4">
                      {property.offerings?.length ? (
                        <div className="space-y-1">
                          {property.offerings.map((offering) => (
                            <div key={offering.id}>
                              <span className="text-gray-500">
                                {offering.transactionType === "SALE"
                                  ? "بيع"
                                  : "إيجار"}
                                :
                              </span>{" "}
                              <span className="font-semibold text-gray-900">
                                {formatPrice(
                                  offering.advertisedPrice,
                                  offering.currency,
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {property.address || "—"}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                        {propertyStatusLabels[property.status] ??
                          property.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
