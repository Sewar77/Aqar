"use client";

import { Menu, Search, Bell, User } from "lucide-react";

type HeaderProps = {
    onMenuClick: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
            {/* Right side */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
                    aria-label="فتح القائمة"
                >
                    <Menu size={22} />
                </button>

                <div>
                    <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
                        مرحباً بك في AqarDesk
                    </h2>
                    <p className="hidden text-xs text-gray-500 sm:block">
                        إدارة عقاراتك من مكان واحد
                    </p>
                </div>
            </div>

            {/* Left side */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Search */}
                <button
                    type="button"
                    aria-label="بحث"
                    className="rounded-xl p-2.5 text-gray-600 transition-colors hover:bg-gray-100"
                >
                    <Search size={20} />
                </button>

                {/* Notifications */}
                <button
                    type="button"
                    aria-label="الإشعارات"
                    className="relative rounded-xl p-2.5 text-gray-600 transition-colors hover:bg-gray-100"
                >
                    <Bell size={20} />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                </button>

                {/* User */}
                <div className="flex items-center gap-2 border-r border-gray-200 pr-3 sm:pr-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <User size={20} />
                    </div>

                    <div className="hidden sm:block">
                        <p className="text-sm font-semibold text-gray-900">مدير النظام</p>
                        <p className="text-xs text-gray-500">Admin</p>
                    </div>
                </div>
            </div>
        </header>
    );
}