import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import {
    ArrowRight,
    Building2,
    Mail,
    Phone,
    UserRound,
} from "lucide-react";

import { contactRepository } from "@/modules/contacts/contact.repository";
import { propertyRepository } from "@/modules/properties/property.repository";

import { PropertyCard } from "@/components/properties/property-card";

type Props = {
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

const roleLabels: Record<string, string> = {
    OWNER: "مالك",
    CO_OWNER: "شريك في الملكية",
    AUTHORIZED_REPRESENTATIVE: "مفوّض بالتواصل",
};

async function ContactDetailsContent({
    params,
    searchParams,
}: Props) {
    await connection();

    const { id } = await params;

    if (!uuidPattern.test(id)) {
        notFound();
    }

    const rawPage = (await searchParams).page;

    const inputPage = Array.isArray(rawPage)
        ? rawPage[0]
        : rawPage;

    const pageNumber = Number(inputPage ?? "1");

    const page =
        Number.isSafeInteger(pageNumber) &&
            pageNumber > 0
            ? Math.min(pageNumber, 1000)
            : 1;

    const contact = await contactRepository.findById(id);

    if (!contact) {
        notFound();
    }

    const result = await propertyRepository.list(
        {
            contacts: {
                some: {
                    contactId: id,
                },
            },
        },
        page,
        PAGE_SIZE,
    );

    // A contact may have more than one role on a property.
    const rolesByProperty = new Map<string, string[]>();

    for (const relation of contact.properties) {
        const existing =
            rolesByProperty.get(relation.property.id) ?? [];

        existing.push(
            roleLabels[relation.role] ?? relation.role,
        );

        rolesByProperty.set(
            relation.property.id,
            existing,
        );
    }

    return (
        <section dir="rtl" className="space-y-7">
            <Link
                href="/contacts"
                className="inline-flex items-center gap-2 font-semibold text-brand hover:underline"
            >
                <ArrowRight size={18} aria-hidden="true" />
                العودة إلى جهات الاتصال
            </Link>

            {/* Contact Information */}
            <header className="aqar-card space-y-4 p-6">
                <div className="flex items-center gap-4">
                    <span className="rounded-xl bg-accent-soft p-3 text-olive">
                        <UserRound
                            size={29}
                            aria-hidden="true"
                        />
                    </span>

                    <div>
                        <h1 className="aqar-heading text-3xl">
                            {contact.fullName}
                        </h1>

                        <p className="aqar-description">
                            جهة اتصال وعقاراتها المرتبطة
                        </p>
                    </div>
                </div>

                <dl className="grid gap-3 md:grid-cols-2">
                    <div>
                        <dt className="text-sm text-muted">
                            الهاتف
                        </dt>

                        <dd className="mt-1 flex items-center gap-2 font-semibold">
                            <Phone size={17} aria-hidden="true" />
                            <bdi dir="ltr">{contact.phone}</bdi>
                        </dd>
                    </div>

                    {contact.alternativePhone && (
                        <div>
                            <dt className="text-sm text-muted">
                                هاتف بديل
                            </dt>

                            <dd className="mt-1 font-semibold">
                                <bdi dir="ltr">
                                    {contact.alternativePhone}
                                </bdi>
                            </dd>
                        </div>
                    )}

                    {contact.email && (
                        <div>
                            <dt className="flex items-center gap-2 text-sm text-muted">
                                <Mail size={16} aria-hidden="true" />
                                البريد الإلكتروني
                            </dt>

                            <dd
                                dir="ltr"
                                className="mt-1 break-all text-right font-semibold"
                            >
                                {contact.email}
                            </dd>
                        </div>
                    )}

                    {contact.notes && (
                        <div className="md:col-span-2">
                            <dt className="text-sm text-muted">
                                ملاحظات
                            </dt>

                            <dd className="mt-1 whitespace-pre-wrap">
                                {contact.notes}
                            </dd>
                        </div>
                    )}
                </dl>
            </header>

            {/* Total Properties */}
            <div className="aqar-surface flex items-center gap-4 p-5">
                <span className="rounded-xl bg-brand-soft p-3 text-brand">
                    <Building2 size={23} aria-hidden="true" />
                </span>

                <div>
                    <p className="text-secondary">
                        عدد العقارات المرتبطة
                    </p>

                    <p className="text-3xl font-extrabold text-brand">
                        {result.pagination.total}
                    </p>
                </div>
            </div>

            {/* Related Properties */}
            <section aria-labelledby="related-properties-heading">
                <h2
                    id="related-properties-heading"
                    className="aqar-heading mb-5 text-2xl"
                >
                    العقارات المرتبطة
                </h2>

                {result.data.length === 0 ? (
                    <div className="aqar-surface p-10 text-center text-secondary">
                        لا توجد عقارات في هذه الصفحة.
                    </div>
                ) : (
                    <div className="grid gap-5 lg:grid-cols-2">
                        {result.data.map((property) => (
                            <div
                                key={property.id}
                                className="space-y-2"
                            >
                                <p className="text-sm font-semibold text-olive">
                                    الصفة:{" "}
                                    {(
                                        rolesByProperty.get(property.id) ??
                                        []
                                    ).join("، ") || "جهة اتصال"}
                                </p>

                                <PropertyCard property={property} />
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Pagination */}
            {result.pagination.totalPages > 1 && (
                <nav
                    aria-label="صفحات العقارات المرتبطة"
                    className="flex items-center justify-between gap-3"
                >
                    {page > 1 ? (
                        <Link
                            href={`/contacts/${id}?page=${page - 1}`}
                            className="aqar-button aqar-button-soft"
                        >
                            السابق
                        </Link>
                    ) : (
                        <span />
                    )}

                    <span className="text-secondary">
                        صفحة {page} من{" "}
                        {result.pagination.totalPages}
                    </span>

                    {page < result.pagination.totalPages ? (
                        <Link
                            href={`/contacts/${id}?page=${page + 1}`}
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

export default function ContactDetailsPage(
    props: Props,
) {
    return (
        <Suspense
            fallback={
                <p
                    role="status"
                    className="aqar-surface p-8"
                >
                    جارٍ تحميل عقارات جهة الاتصال...
                </p>
            }
        >
            <ContactDetailsContent {...props} />
        </Suspense>
    );
}