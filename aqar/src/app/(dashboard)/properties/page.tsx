
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { propertyService } from "@/modules/properties/property.service";
import { PropertyCard } from "@/components/properties/property-card";

type Status = "ACTIVE" | "DRAFT" | "ARCHIVED";

type SearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

const tabs: {
  value: Status | "ALL";
  label: string;
}[] = [
    { value: "ALL", label: "جميع العقارات" },
    { value: "ACTIVE", label: "النشطة" },
    { value: "DRAFT", label: "المسودات" },
    { value: "ARCHIVED", label: "المؤرشفة" },
  ];

const first = (
  value: string | string[] | undefined,
) => Array.isArray(value) ? value[0] : value;

function hrefFor(
  status: Status | "ALL",
  search: string,
  page = 1,
) {
  const params = new URLSearchParams();

  if (status !== "ALL") {
    params.set("status", status);
  }

  if (search) {
    params.set("search", search);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return `/properties${query ? `?${query}` : ""}`;
}

async function Content({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await connection();

  const params = await searchParams;

  const candidate = first(params.status);

  const selected =
    tabs.find((tab) => tab.value === candidate)?.value ??
    "ALL";

  const status =
    selected === "ALL" ? undefined : selected;

  const search = (first(params.search) ?? "")
    .trim()
    .slice(0, 150);

  const pageNumber = Number(
    first(params.page) ?? "1",
  );

  const page =
    Number.isSafeInteger(pageNumber) &&
      pageNumber > 0
      ? Math.min(pageNumber, 10000)
      : 1;

  const result = await propertyService.list({
    status,
    search: search || undefined,
    page,
    limit: 12,
  });

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <h1 className="aqar-heading text-3xl">
            العقارات
          </h1>

          <p className="aqar-description mt-1">
            إضافة العقارات وتعديلها ومتابعة حالاتها وأرشفتها
          </p>
        </div>

        <Link
          href="/properties/new"
          className="aqar-button aqar-button-primary"
        >
          <Plus size={19} aria-hidden="true" />
          إضافة عقار
        </Link>
      </header>

      <form
        method="get"
        action="/properties"
        className="flex flex-wrap gap-3"
      >
        {status && (
          <input
            type="hidden"
            name="status"
            value={status}
          />
        )}

        <label className="relative min-w-[240px] flex-1">
          <span className="sr-only">
            البحث عن عقار
          </span>

          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
          />

          <input
            name="search"
            defaultValue={search}
            maxLength={150}
            placeholder="ابحث بالعنوان أو المنطقة أو المالك..."
            className="aqar-input pr-11"
          />
        </label>

        <button
          type="submit"
          className="aqar-button aqar-button-soft"
        >
          بحث
        </button>
      </form>

      <nav
        aria-label="تصفية العقارات حسب الحالة"
        className="flex flex-wrap gap-2"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={hrefFor(tab.value, search)}
            aria-current={
              selected === tab.value ? "page" : undefined
            }
            className={`aqar-button ${selected === tab.value
              ? "aqar-button-primary"
              : "aqar-button-soft"
              }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <p className="font-semibold text-secondary">
        العقارات المطابقة:{" "}
        <strong className="text-ink">
          {result.pagination.total}
        </strong>
      </p>

      {result.data.length === 0 ? (
        <div className="aqar-surface p-12 text-center text-secondary">
          لا توجد عقارات مطابقة. جربي تغيير البحث أو الحالة.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {result.data.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
            />
          ))}
        </div>
      )}

      {result.pagination.totalPages > 1 && (
        <nav
          aria-label="صفحات العقارات"
          className="flex items-center justify-between gap-4"
        >
          {page > 1 ? (
            <Link
              href={hrefFor(
                selected,
                search,
                page - 1,
              )}
              className="aqar-button aqar-button-soft"
            >
              السابق
            </Link>
          ) : (
            <span />
          )}

          <span className="text-secondary">
            صفحة {page} من {result.pagination.totalPages}
          </span>

          {page < result.pagination.totalPages ? (
            <Link
              href={hrefFor(
                selected,
                search,
                page + 1,
              )}
              className="aqar-button aqar-button-soft"
            >
              التالي
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </section>
  );
}

export default function PropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          className="aqar-surface p-8"
        >
          جارٍ تحميل العقارات...
        </div>
      }
    >
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
