"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Governorate {
  id: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
}

interface City {
  id: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
  governorateId: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export default function LocationsPage() {
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState("");

  const [loadingGovernorates, setLoadingGovernorates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState("");

  // Fetch governorates
  useEffect(() => {
    async function fetchGovernorates() {
      try {
        setLoadingGovernorates(true);
        setError("");

        const response = await fetch("/api/governorates");
        const result: ApiResponse<Governorate[]> = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to fetch governorates");
        }

        setGovernorates(result.data);

        if (result.data.length > 0) {
          setSelectedGovernorate(result.data[0].id);
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Something went wrong",
        );
      } finally {
        setLoadingGovernorates(false);
      }
    }

    fetchGovernorates();
  }, []);

  // Fetch cities whenever the selected governorate changes
  useEffect(() => {
    if (!selectedGovernorate) {
      setCities([]);
      return;
    }

    const controller = new AbortController();

    async function fetchCities() {
      try {
        setLoadingCities(true);
        setError("");

        const response = await fetch(
          `/api/cities?governorateId=${selectedGovernorate}`,
          { signal: controller.signal },
        );

        const result: ApiResponse<City[]> = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to fetch cities");
        }

        setCities(result.data);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setError(
          error instanceof Error ? error.message : "Something went wrong",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCities(false);
        }
      }
    }

    fetchCities();

    return () => controller.abort();
  }, [selectedGovernorate]);

  const activeGovernorates = governorates.filter(
    (governorate) => governorate.isActive,
  ).length;

  const activeCities = cities.filter((city) => city.isActive).length;

  if (loadingGovernorates) {
    return (
      <div dir="rtl" className="p-6 text-gray-500">
        جاري تحميل المحافظات...
      </div>
    );
  }
  console.log(cities);
  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المواقع</h1>
          <p className="mt-1 text-sm text-gray-500">
            إدارة المحافظات والمدن المستخدمة في تسجيل العقارات.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="إجمالي المحافظات" value={governorates.length} />

        <StatCard title="المحافظات النشطة" value={activeGovernorates} />

        <StatCard title="المدن في المحافظة المختارة" value={cities.length} />
      </div>

      {/* Main content */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              المحافظات والمدن
            </h2>
            <p className="text-sm text-gray-500">
              اختر محافظة لعرض المدن التابعة لها.
            </p>
          </div>

          <select
            value={selectedGovernorate}
            onChange={(event) => setSelectedGovernorate(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 sm:w-64"
          >
            <option value="">اختر المحافظة</option>

            {governorates.map((governorate) => (
              <option key={governorate.id} value={governorate.id}>
                {governorate.nameAr}
              </option>
            ))}
          </select>
        </div>

        {/* Governorates */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            المحافظات
          </h3>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {governorates.map((governorate) => {
              const isSelected = selectedGovernorate === governorate.id;

              return (
                <button
                  key={governorate.id}
                  onClick={() => setSelectedGovernorate(governorate.id)}
                  className={`rounded-lg border p-4 text-right transition ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <p className="font-semibold text-gray-900">
                    {governorate.nameAr}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {governorate.nameEn}
                  </p>

                  <span
                    className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs ${
                      governorate.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {governorate.isActive ? "نشطة" : "غير نشطة"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">المدن</h3>
              <p className="text-sm text-gray-500">
                {governorates.find((item) => item.id === selectedGovernorate)
                  ?.nameAr || "لم يتم اختيار محافظة"}
              </p>
            </div>

            <span className="text-sm text-gray-500">
              {activeCities} مدينة نشطة
            </span>
          </div>

          {loadingCities ? (
            <p className="py-8 text-center text-sm text-gray-500">
              جاري تحميل المدن...
            </p>
          ) : !selectedGovernorate ? (
            <p className="py-8 text-center text-sm text-gray-500">
              اختر محافظة لعرض المدن.
            </p>
          ) : cities.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              لا توجد مدن مسجلة لهذه المحافظة.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="px-4 py-3 font-medium">اسم المدينة</th>
                    <th className="px-4 py-3 font-medium">English Name</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                  </tr>
                </thead>

                <tbody>
                  {cities.map((city) => (
                    <tr
                      key={city.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/locations/${city.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {city.nameAr}
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-gray-500">{city.nameEn}</td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${
                            city.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {city.isActive ? "نشطة" : "غير نشطة"}
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
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
