import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";

import { MapPin, ArrowRight, Building2 } from "lucide-react";

import { LocationRepository } from "@/modules/locations/location.repository";
import { propertyRepository } from "@/modules/properties/property.repository";
import { PropertyCard } from "@/components/properties/property-card";

type PageProps = {
    params: Promise<{
        id: string;
    }>;

    searchParams: Promise<{
        page?: string | string[];
    }>;
};

const PAGE_SIZE = 12;

const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function LocationPropertiesContent({
    params,
    searchParams,
}: PageProps) {
    await connection();

    const { id } = await params;
    const query = await searchParams;

    if (!uuidPattern.test(id)) {
        notFound();
    }

    const rawPage = Array.isArray(query.page)
        ? query.page[0]
        : query.page;

    const requestedPage = Number(rawPage ?? "1");

    const page =
        Number.isSafeInteger(requestedPage) &&
            requestedPage > 0
            ? Math.min(requestedPage, 1000)
            : 1;

    // Both queries can run concurrently.
    const [location, result] = await Promise.all([
        LocationRepository.findById(id),

        propertyRepository.list(
            { locationId: id },
            page,
            PAGE_SIZE,
        ),
    ]);

    if (!location) {
        notFound();
    }

    const { data: properties, pagination } = result;

    return (
        <section className="space-y-7">
            <Link
                href="/locations"
                className="inline-flex items-center gap-2 font-semibold text-brand hover:underline"
            >
                <ArrowRight size={18} aria-hidden="true" />
                العودة إلى المناطق
            </Link>

            {/* Location Header */}
            <header className="aqar-card flex flex-wrap items-center justify-between gap-5 p-6">
                <div className="flex items-center gap-4">
                    <span className="rounded-2xl bg-olive-soft p-4 text-brand">
                        <MapPin size={28} aria-hidden="true" />
                    </span>

                    <div>
                        <h1 className="aqar-heading text-3xl">
                            {location.nameAr}
                        </h1>

                        <p className="aqar-description mt-1">
                            العقارات المسجلة في هذه المنطقة
                        </p>
                    </div>
                </div>

                <span
                    className={`aqar-badge ${location.isActive
                        ? "aqar-badge-active"
                        : "aqar-badge-inactive"
                        }`}
                >
                    {location.isActive
                        ? "منطقة نشطة"
                        : "منطقة غير نشطة"}
                </span>
            </header>

            {/* Summary */}
            <div className="aqar-surface flex items-center gap-4 p-6">
                <span className="rounded-xl bg-brand-soft p-3 text-brand">
                    <Building2 size={25} aria-hidden="true" />
                </span>

                <div>
                    <p className="text-secondary">
                        إجمالي العقارات المرتبطة
                    </p>

                    <p className="text-3xl font-extrabold text-brand">
                        {pagination.total}
                    </p>
                </div>
            </div>

            {/* Properties */}
            <section aria-labelledby="properties-heading">
                <h2
                    id="properties-heading"
                    className="aqar-heading mb-5 text-2xl"
                >
                    قائمة العقارات
                </h2>

                {properties.length === 0 ? (
                    <div className="aqar-surface p-10 text-center text-secondary">
                        لا توجد عقارات في هذه الصفحة.
                    </div>
                ) : (
                    <div className="grid gap-5 lg:grid-cols-2">
                        {properties.map((property) => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <nav
                    aria-label="صفحات عقارات المنطقة"
                    className="flex items-center justify-between gap-4"
                >
                    {page > 1 ? (
                        <Link
                            href={`/locations/${id}?page=${page - 1}`}
                            className="aqar-button aqar-button-soft"
                        >
                            السابق
                        </Link>
                    ) : (
                        <span />
                    )}

                    <p className="font-medium text-secondary">
                        صفحة {page} من {pagination.totalPages}
                    </p>

                    {page < pagination.totalPages ? (
                        <Link
                            href={`/locations/${id}?page=${page + 1}`}
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

export default function LocationDetailsPage(
    props: PageProps,
) {
    return (
        <Suspense fallback={<LocationDetailsLoading />}>
            <LocationPropertiesContent {...props} />
        </Suspense>
    );
}

function LocationDetailsLoading() {
    return (
        <div role="status" className="space-y-5">
            <div className="h-32 animate-pulse rounded-2xl bg-surface-muted" />

            <div className="grid gap-5 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-72 animate-pulse rounded-2xl bg-surface-muted"
                    />
                ))}
            </div>

            <span className="sr-only">
                جارٍ تحميل عقارات المنطقة...
            </span>
        </div>
    );
}