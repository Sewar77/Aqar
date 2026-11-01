import Link from "next/link";

const mobileNavigation = [
  { label: "الرئيسية", href: "/" },
  { label: "جهات الاتصال", href: "/contacts" },
  { label: "العقارات", href: "/properties" },
  { label: "المناطق", href: "/locations" },
];

export function AppHeader() {
  return (
    <header className="border-b border-[#e3e8e4] bg-white">
      <div className="flex min-h-16 items-center justify-between px-4 md:px-8">
        <div>
          <h2 className="text-lg font-bold text-[#195a46]">نظام عقار</h2>

          <p className="text-xs text-gray-500">إدارة العقارات بسهولة</p>
        </div>

        <div className="rounded-full bg-[#e8f2ed] px-4 py-2 text-sm font-medium text-[#195a46]">
          لوحة الإدارة
        </div>
      </div>

      <nav
        aria-label="التنقل الرئيسي للموبايل"
        className="flex gap-2 overflow-x-auto border-t border-gray-100 px-3 py-2 md:hidden"
      >
        {mobileNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
