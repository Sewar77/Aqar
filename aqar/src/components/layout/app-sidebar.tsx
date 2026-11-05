"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  House,
  LayoutDashboard,
  MapPin,
  UsersRound,
} from "lucide-react";

const navigation = [
  {
    label: "لوحة التحكم",
    href: "/",
    Icon: LayoutDashboard,
  },
  {
    label: "جهات الاتصال",
    href: "/contacts",
    Icon: UsersRound,
  },
  {
    label: "العقارات",
    href: "/properties",
    Icon: House,
  },
  {
    label: "المناطق",
    href: "/locations",
    Icon: MapPin,
  },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-l border-line bg-surface p-5 md:block">
      <div className="mb-10 border-b border-line pb-6">
        <h1 className="text-3xl font-extrabold text-brand">
          عقار
        </h1>

        <p className="mt-1 text-xs text-muted">
          إدارة العقارات بوضوح وسهولة
        </p>
      </div>

      <nav
        aria-label="القائمة الرئيسية"
        className="space-y-2"
      >
        {navigation.map(({ href, label, Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href ||
              pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              aria-current={
                active ? "page" : undefined
              }
              className={`
                flex items-center gap-3
                rounded-xl px-4 py-3
                text-sm transition-colors
                ${active
                  ? "bg-brand-soft font-bold text-brand"
                  : "text-muted hover:bg-surface-subtle hover:text-ink"
                }
              `}
            >
              <Icon
                size={19}
                aria-hidden="true"
              />

              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}