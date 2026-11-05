"use client";

import {
    useEffect,
    useState,
    type FormEvent,
} from "react";

import {
    Plus,
    RotateCcw,
    Search,
    UsersRound,
} from "lucide-react";

import type { CreateContactInput } from "@/modules/contacts/contact.types";

import { ContactForm } from "./contact-form";
import { ContactsList } from "./contacts-list";
import { DeleteContactDialog } from "./delete-contact-dialog";

import type {
    ContactListItem,
    ContactListResponse,
    ContactPagination,
    SaveContactResult,
} from "./contact.types";

type EditorState =
    | { mode: "create" }
    | { mode: "edit"; contact: ContactListItem }
    | null;

const PAGE_SIZE = 20;

const EMPTY_PAGE: ContactPagination = {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
};

export function ContactManager() {
    const [contacts, setContacts] = useState<ContactListItem[]>([]);
    const [pagination, setPagination] =
        useState<ContactPagination>(EMPTY_PAGE);

    const [searchText, setSearchText] = useState("");
    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);
    const [revision, setRevision] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [editor, setEditor] = useState<EditorState>(null);

    const [deletingContact, setDeletingContact] =
        useState<ContactListItem | null>(null);

    // Fetch contacts when search, page or revision changes.
    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            setLoading(true);
            setError("");

            const params = new URLSearchParams({
                page: String(page),
                limit: String(PAGE_SIZE),
            });

            if (search) {
                params.set("search", search);
            }

            try {
                const response = await fetch(
                    `/api/contacts?${params}`,
                    {
                        signal: controller.signal,
                        cache: "no-store",
                    },
                );

                const result =
                    (await response.json()) as ContactListResponse;

                if (
                    !response.ok ||
                    !result.success ||
                    !Array.isArray(result.data) ||
                    !result.pagination
                ) {
                    throw new Error(
                        result.message ||
                        "تعذّر تحميل جهات الاتصال",
                    );
                }

                // After deletion, the last page might become empty.
                if (
                    page > 1 &&
                    result.data.length === 0
                ) {
                    setPage((current) =>
                        Math.max(1, current - 1),
                    );

                    return;
                }

                setContacts(result.data);
                setPagination(result.pagination);
            } catch (caught) {
                if (controller.signal.aborted) return;

                setContacts([]);
                setPagination(EMPTY_PAGE);

                setError(
                    caught instanceof Error
                        ? caught.message
                        : "حدث خطأ غير متوقع",
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void load();

        return () => controller.abort();
    }, [page, search, revision]);

    function submitSearch(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setPage(1);
        setSearch(searchText.trim());
        setNotice("");
    }

    async function saveContact(
        values: CreateContactInput,
    ): Promise<SaveContactResult> {
        if (!editor) {
            return {
                ok: false,
                status: 400,
                message: "النموذج غير مفتوح",
            };
        }

        const editing = editor.mode === "edit";

        try {
            const response = await fetch(
                editing
                    ? `/api/contacts/${editor.contact.id}`
                    : "/api/contacts",
                {
                    method: editing ? "PATCH" : "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify(values),
                },
            );

            const result = (await response.json()) as {
                success?: boolean;
                message?: string;
            };

            if (!response.ok || !result.success) {
                return {
                    ok: false,
                    status: response.status,
                    message:
                        result.message ||
                        "تعذّر حفظ جهة الاتصال",
                };
            }

            setEditor(null);

            setNotice(
                editing
                    ? "تم حفظ التعديلات"
                    : "تمت إضافة جهة الاتصال",
            );

            setPage(1);
            setRevision((value) => value + 1);

            return { ok: true };
        } catch {
            return {
                ok: false,
                status: 0,
                message: "تعذّر الاتصال بالخادم",
            };
        }
    }

    async function deleteContact(
        id: string,
    ): Promise<
        | { ok: true }
        | { ok: false; message: string }
    > {
        try {
            const response = await fetch(
                `/api/contacts/${id}`,
                {
                    method: "DELETE",
                },
            );

            const result = (await response.json()) as {
                success?: boolean;
                message?: string;
            };

            if (!response.ok || !result.success) {
                // Refresh counts if another operation linked
                // this contact to a property.
                if (response.status === 409) {
                    setRevision((value) => value + 1);
                }

                return {
                    ok: false,
                    message:
                        result.message ||
                        "تعذّر حذف جهة الاتصال",
                };
            }

            setDeletingContact(null);
            setNotice("تم حذف جهة الاتصال بنجاح");

            setRevision((value) => value + 1);

            return { ok: true };
        } catch {
            return {
                ok: false,
                message: "تعذّر الاتصال بالخادم",
            };
        }
    }

    return (
        <section dir="rtl" className="aqar-page space-y-7">
            {/* Header */}
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <span className="rounded-2xl bg-olive-soft p-3 text-brand">
                        <UsersRound
                            size={28}
                            aria-hidden="true"
                        />
                    </span>

                    <div>
                        <h1 className="aqar-heading text-3xl">
                            جهات الاتصال
                        </h1>

                        <p className="aqar-description">
                            إدارة الملاك والمفوّضين وعقاراتهم المرتبطة
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setNotice("");
                        setEditor({ mode: "create" });
                    }}
                    className="aqar-button aqar-button-primary"
                >
                    <Plus size={19} aria-hidden="true" />
                    إضافة جهة اتصال
                </button>
            </header>

            {/* Search */}
            <form
                onSubmit={submitSearch}
                className="flex flex-wrap gap-3"
            >
                <div className="relative min-w-[220px] flex-1">
                    <Search
                        size={19}
                        aria-hidden="true"
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
                    />

                    <input
                        aria-label="البحث بالاسم أو الهاتف"
                        value={searchText}
                        onChange={(event) =>
                            setSearchText(event.target.value)
                        }
                        maxLength={150}
                        placeholder="ابحث بالاسم أو رقم الهاتف..."
                        className="aqar-input pr-12"
                    />
                </div>

                <button
                    type="submit"
                    className="aqar-button aqar-button-soft"
                >
                    بحث
                </button>

                {search && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearch("");
                            setSearchText("");
                            setPage(1);
                        }}
                        className="aqar-button bg-surface text-secondary"
                    >
                        <RotateCcw size={17} aria-hidden="true" />
                        مسح
                    </button>
                )}
            </form>

            <p className="font-semibold text-secondary">
                إجمالي جهات الاتصال:{" "}
                <span className="text-ink">
                    {pagination.total}
                </span>
            </p>

            {/* Feedback */}
            {notice && (
                <p
                    role="status"
                    className="rounded-xl bg-success-soft p-3 text-success"
                >
                    {notice}
                </p>
            )}

            {error && (
                <div
                    role="alert"
                    className="rounded-xl bg-danger-soft p-3 text-danger"
                >
                    {error}

                    <button
                        type="button"
                        onClick={() =>
                            setRevision((value) => value + 1)
                        }
                        className="mr-2 underline"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            )}

            {/* Responsive List */}
            {!error && (
                <ContactsList
                    contacts={contacts}
                    loading={loading}
                    onEdit={(contact) => {
                        setNotice("");

                        setEditor({
                            mode: "edit",
                            contact,
                        });
                    }}
                    onDelete={(contact) =>
                        setDeletingContact(contact)
                    }
                />
            )}

            {/* Pagination */}
            {!loading &&
                !error &&
                pagination.totalPages > 1 && (
                    <nav
                        aria-label="صفحات جهات الاتصال"
                        className="flex items-center justify-between gap-3"
                    >
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() =>
                                setPage((value) => value - 1)
                            }
                            className="aqar-button aqar-button-soft disabled:opacity-40"
                        >
                            السابق
                        </button>

                        <span className="text-secondary">
                            صفحة {page} من{" "}
                            {pagination.totalPages}
                        </span>

                        <button
                            type="button"
                            disabled={
                                page >= pagination.totalPages
                            }
                            onClick={() =>
                                setPage((value) => value + 1)
                            }
                            className="aqar-button aqar-button-soft disabled:opacity-40"
                        >
                            التالي
                        </button>
                    </nav>
                )}

            {/* Add/Edit Dialog */}
            {editor && (
                <ContactForm
                    contact={
                        editor.mode === "edit"
                            ? editor.contact
                            : null
                    }
                    onClose={() => setEditor(null)}
                    onSave={saveContact}
                />
            )}

            {/* Delete Dialog */}
            {deletingContact && (
                <DeleteContactDialog
                    contact={deletingContact}
                    onClose={() =>
                        setDeletingContact(null)
                    }
                    onConfirm={deleteContact}
                />
            )}
        </section>
    );
}