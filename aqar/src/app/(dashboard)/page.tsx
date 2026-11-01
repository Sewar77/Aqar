import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">لوحة التحكم</h1>

      <p className="text-gray-500">مرحبًا بك في نظام عقار لإدارة العقارات.</p>

      <Link
        href="/properties"
        className="inline-block rounded-xl bg-[#195a46] px-5 py-3 text-white"
      >
        عرض العقارات
      </Link>
    </div>
  );
}
