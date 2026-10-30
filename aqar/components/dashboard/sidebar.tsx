"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Building2,
    Users,
    Settings,
    House,
    X,
    LogOut,
} from "lucide-react";

const navItems = [
    {
        label: "لوحة التحكم",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        label: "العقارات",
        href: "/properties",
        icon: Building2,
    },
    {
        label: "جهات الاتصال",
        href: "/contacts",
        icon: Users,
    },
];

type SidebarProps = {
    open: boolean;
    onClose: () => void;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            className={`
        fixed right-0 top-0 z-50 flex h-screen w-64 flex-col
        border-l border-gray-200 bg-white
        transition-transform duration-300
        ${open ? "translate-x-0" : "translate-x-full"}
        lg:translate-x-0
      `}
        >
            {/* Logo */}
            <div className="flex h-20 items-center justify-between border-b border-gray-100 px-6">
                <Link href="/" className="flex items-center gap-3" onClick={onClose}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <House size={22} />
                    </div>

                    <div>
                        <h1 className="text-xl font-bold text-gray-900">AqarDesk</h1>
                        <p className="text-xs text-gray-500">إدارة العقارات</p>
                    </div>
                </Link>

                <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
                    aria-label="إغلاق القائمة"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2 px-4 py-6">
                <p className="mb-4 px-3 text-xs font-semibold text-gray-400">
                    القائمة الرئيسية
                </p>

                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        item.href === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={`
                flex items-center gap-3 rounded-xl px-4 py-3
                text-sm font-medium transition-colors
                ${isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }
              `}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section */}
            <div className="space-y-2 border-t border-gray-100 p-4">
                <Link
                    href="/settings"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                >
                    <Settings size={20} />
                    <span>الإعدادات</span>
                </Link>

                <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                    <LogOut size={20} />
                    <span>تسجيل الخروج</span>
                </button>
            </div>
        </aside>
    );
}