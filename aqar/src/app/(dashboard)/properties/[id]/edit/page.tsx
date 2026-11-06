
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { PropertyEditor } from "@/components/properties/property-editor";

import { PropertyOfferingsEditor } from "@/components/properties/property-offerings-editor";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * This component reads dynamic URL data.
 * Keep it inside a Suspense boundary.
 */
async function EditPropertyContent({
    params,
}: PageProps) {
    const { id } = await params;

    if (!uuidPattern.test(id)) {
        notFound();
    }

    return (
        <main
            dir="rtl"
            className="space-y-12"
        >
            <PropertyEditor
                mode="edit"
                id={id}
            />

            <PropertyOfferingsEditor
                propertyId={id}
            />
        </main>
    );
}

/**
 * Route shell.
 *
 * Do not await params here.
 * The loading UI can render while URL data
 * and the page content are being resolved.
 */
export default function EditPropertyPage({
    params,
}: PageProps) {
    return (
        <Suspense
            fallback={<EditPropertyLoading />}
        >
            <EditPropertyContent params={params} />
        </Suspense>
    );
}

function EditPropertyLoading() {
    return (
        <main
            dir="rtl"
            role="status"
            className="mx-auto max-w-5xl space-y-6"
        >
            <div className="space-y-3">
                <div className="h-9 w-64 animate-pulse rounded-xl bg-surface-muted" />
                <div className="h-5 w-96 max-w-full animate-pulse rounded-lg bg-surface-muted" />
            </div>

            <div className="aqar-card space-y-5 p-6">
                <div className="h-8 w-44 animate-pulse rounded-lg bg-surface-muted" />

                <div className="grid gap-5 md:grid-cols-2">
                    {Array.from({ length: 6 }).map(
                        (_, index) => (
                            <div
                                key={index}
                                className="h-16 animate-pulse rounded-xl bg-surface-muted"
                            />
                        ),
                    )}
                </div>
            </div>

            <span className="sr-only">
                جارٍ تحميل صفحة تعديل العقار...
            </span>
        </main>
    );
}
