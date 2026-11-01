"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    label: "لوحة التحكم",
    href: "/",
    icon: "▦",
  },
  {
    label: "جهات الاتصال",
    href: "/contacts",
    icon: "♙",
  },
  {
    label: "العقارات",
    href: "/properties",
    icon: "⌂",
  },
  {
    label: "المناطق",
    href: "/locations",
    icon: "⌖",
  },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-l border-[#e3e8e4] bg-white p-5 md:block">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-[#195a46]">عقار</h1>

        <p className="mt-1 text-xs text-gray-500">
          Aqar Real Estate Management
        </p>
      </div>

      <nav className="space-y-2">
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                isActive
                  ? "bg-[#e8f2ed] font-semibold text-[#195a46]"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span aria-hidden="true" className="text-lg">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
