import Link from "next/link";

const mobileNavigation = [
  {
    label: "الرئيسية",
    href: "/",
  },
  {
    label: "جهات الاتصال",
    href: "/contacts",
  },
  {
    label: "العقارات",
    href: "/properties",
  },
  {
    label: "المناطق",
    href: "/locations",
  },
];

export function AppHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="flex min-h-16 items-center justify-between px-4 md:px-8">
        <div>
          <h2 className="text-lg font-extrabold text-brand">
            نظام عقار
          </h2>

          <p className="text-xs text-muted">
            كل تفاصيل العقارات في مكان واحد
          </p>
        </div>

        <span className="rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-brand">
          لوحة الإدارة
        </span>
      </div>

      <nav
        aria-label="التنقل الرئيسي للموبايل"
        className="flex gap-2 overflow-x-auto border-t border-line px-3 py-2 md:hidden"
      >
        {mobileNavigation.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="shrink-0 rounded-lg bg-surface-subtle px-3 py-2 text-xs font-medium text-ink hover:bg-brand-soft"
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}