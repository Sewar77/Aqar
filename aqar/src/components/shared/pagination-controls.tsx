
"use client";

import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

import type { PaginationMeta } from "@/lib/pagination";

type Props = {
    pagination: PaginationMeta;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    disabled?: boolean;
};

export function PaginationControls({
    pagination,
    onPageChange,
    onLimitChange,
    disabled = false,
}: Props) {
    const {
        page,
        limit,
        total,
        totalPages,
    } = pagination;

    const from =
        total === 0 ? 0 : (page - 1) * limit + 1;

    const to = Math.min(page * limit, total);

    const visibleCount = Math.min(5, totalPages);

    const startPage = Math.max(
        1,
        Math.min(
            page - Math.floor(visibleCount / 2),
            totalPages - visibleCount + 1,
        ),
    );

    const visiblePages = Array.from(
        { length: visibleCount },
        (_, index) => startPage + index,
    );

    const baseButton =
        "inline-flex min-h-10 min-w-10 items-center " +
        "justify-center rounded-xl px-3 text-sm " +
        "font-semibold transition disabled:cursor-not-allowed " +
        "disabled:opacity-40";

    const inactiveButton =
        "bg-[#f1f0ea] text-[#4d5b4e] " +
        "hover:bg-[#e4e9de]";

    return (
        <nav
            dir="rtl"
            aria-label="التنقل بين صفحات النتائج"
            className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex flex-wrap items-center gap-3">
                <label
                    htmlFor="pagination-page-size"
                    className="text-sm font-semibold text-[#344b38]"
                >
                    عرض
                </label>

                <select
                    id="pagination-page-size"
                    value={limit}
                    disabled={disabled}
                    onChange={(event) =>
                        onLimitChange(Number(event.target.value))
                    }
                    className="rounded-xl border border-[#deded1] bg-white px-3 py-2 text-sm text-[#263b2b]"
                >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>

                <span className="text-sm text-[#667568]">
                    عرض {from}–{to} من أصل {total}
                </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1">
                <button
                    type="button"
                    title="الصفحة الأولى"
                    aria-label="الصفحة الأولى"
                    disabled={disabled || page === 1}
                    onClick={() => onPageChange(1)}
                    className={`${baseButton} ${inactiveButton}`}
                >
                    <ChevronsRight size={17} aria-hidden="true" />
                </button>

                <button
                    type="button"
                    aria-label="الصفحة السابقة"
                    disabled={disabled || page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className={`${baseButton} ${inactiveButton}`}
                >
                    <ChevronRight size={17} aria-hidden="true" />
                </button>

                {visiblePages.map((number) => (
                    <button
                        key={number}
                        type="button"
                        aria-label={`صفحة ${number}`}
                        aria-current={
                            number === page ? "page" : undefined
                        }
                        disabled={disabled}
                        onClick={() => onPageChange(number)}
                        className={`${baseButton} ${number === page
                                ? "bg-[#346747] text-white"
                                : inactiveButton
                            }`}
                    >
                        {number}
                    </button>
                ))}

                <button
                    type="button"
                    aria-label="الصفحة التالية"
                    disabled={disabled || page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className={`${baseButton} ${inactiveButton}`}
                >
                    <ChevronLeft size={17} aria-hidden="true" />
                </button>

                <button
                    type="button"
                    title="الصفحة الأخيرة"
                    aria-label="الصفحة الأخيرة"
                    disabled={disabled || page >= totalPages}
                    onClick={() => onPageChange(totalPages)}
                    className={`${baseButton} ${inactiveButton}`}
                >
                    <ChevronsLeft size={17} aria-hidden="true" />
                </button>
            </div>
        </nav>
    );
}
