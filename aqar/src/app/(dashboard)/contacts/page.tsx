
"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Dialog } from "@base-ui/react/dialog";
import {
  Archive,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { PaginationControls } from "@/components/shared/pagination-controls";
import type { PaginationMeta } from "@/lib/pagination";

type Contact = {
  id: string;
  fullName: string;
  phone: string;
  alternativePhone: string | null;
  notes: string | null;
  isActive: boolean;
  propertyCount: number;
  createdAt: string;
  updatedAt: string;
};

type ContactDetail = Contact & {
  properties: Array<{
    id: string;
    title: string;
  }>;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: PaginationMeta;
  errors?: Array<{
    path: Array<string | number>;
    message: string;
  }>;
};

type Filter = "all" | "active" | "archived";
type Modal = "create" | "edit" | "delete" | null;

const initialPagination: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const inputClass =
  "w-full rounded-xl border border-[#deded1] bg-white " +
  "px-4 py-3 text-base text-[#263b2b] outline-none " +
  "focus:border-[#346747] focus:ring-2 focus:ring-[#346747]/15 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 " +
  "rounded-xl px-4 py-2.5 text-sm font-semibold transition " +
  "disabled:cursor-not-allowed disabled:opacity-50";

async function readResponse<T>(
  response: Response,
): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      message: "تعذّر قراءة استجابة الخادم",
    };
  }
}

function responseError(
  response: Response,
  body: ApiResponse<unknown>,
): string {
  if (response.status >= 500) {
    return (
      "حدث خطأ في الخادم. تحقّق من البيانات " +
      "قبل إعادة إرسال العملية."
    );
  }

  return (
    body.errors?.[0]?.message ??
    body.message ??
    "تعذّر تنفيذ العملية"
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [pagination, setPagination] =
    useState<PaginationMeta>(initialPagination);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<Contact | null>(
    null,
  );

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [alternativePhone, setAlternativePhone] =
    useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [preview, setPreview] =
    useState<ContactDetail | null>(null);
  const [previewLoading, setPreviewLoading] =
    useState(false);

  const previewController = useRef<AbortController | null>(
    null,
  );

  const [confirmName, setConfirmName] = useState("");
  const [acknowledgeDeletion, setAcknowledgeDeletion] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(
    null,
  );
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  // Load contacts using server-side pagination.
  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      async function loadContacts() {
        let correctingPage = false;

        try {
          const params = new URLSearchParams({
            page: String(page),
            limit: String(limit),
          });

          if (search.trim()) {
            params.set("search", search.trim());
          }

          if (filter !== "all") {
            params.set(
              "isActive",
              filter === "active" ? "true" : "false",
            );
          }

          const response = await fetch(
            `/api/contacts?${params.toString()}`,
            {
              cache: "no-store",
              signal: controller.signal,
            },
          );

          const body =
            await readResponse<Contact[]>(response);

          if (
            !response.ok ||
            !body.success ||
            !Array.isArray(body.data) ||
            !body.pagination
          ) {
            throw new Error(
              body.message ??
              "تعذّر تحميل جهات الاتصال",
            );
          }

          if (controller.signal.aborted) return;

          // Recover if the last record on a page
          // was deleted or no longer matches filters.
          if (page > body.pagination.totalPages) {
            correctingPage = true;
            setPage(body.pagination.totalPages);
            return;
          }

          setContacts(body.data);
          setPagination(body.pagination);
          setLoadError("");
        } catch (error) {
          if (controller.signal.aborted) return;

          setLoadError(
            error instanceof Error
              ? error.message
              : "تعذّر تحميل جهات الاتصال",
          );
        } finally {
          if (
            !controller.signal.aborted &&
            !correctingPage
          ) {
            setLoading(false);
          }
        }
      }

      void loadContacts();
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, filter, page, limit, reloadKey]);

  function refresh() {
    setLoading(true);
    setReloadKey((value) => value + 1);
  }

  function resetPreview() {
    previewController.current?.abort();
    previewController.current = null;
    setPreview(null);
    setPreviewLoading(false);
  }

  function openCreate() {
    resetPreview();
    setSelected(null);

    setFullName("");
    setPhone("");
    setAlternativePhone("");
    setNotes("");
    setIsActive(true);

    setFormError("");
    setNotice("");
    setModal("create");
  }

  function openEdit(contact: Contact) {
    resetPreview();
    setSelected(contact);

    setFullName(contact.fullName);
    setPhone(contact.phone);
    setAlternativePhone(contact.alternativePhone ?? "");
    setNotes(contact.notes ?? "");
    setIsActive(contact.isActive);

    setFormError("");
    setNotice("");
    setModal("edit");
  }

  async function openDelete(contact: Contact) {
    resetPreview();

    setSelected(contact);
    setModal("delete");
    setConfirmName("");
    setAcknowledgeDeletion(false);
    setPreviewLoading(true);
    setFormError("");
    setNotice("");

    const controller = new AbortController();
    previewController.current = controller;

    try {
      // Fetch the full list of linked properties.
      const response = await fetch(
        `/api/contacts/${contact.id}`,
        {
          cache: "no-store",
          signal: controller.signal,
        },
      );

      const body =
        await readResponse<ContactDetail>(response);

      if (
        !response.ok ||
        !body.success ||
        !body.data ||
        !Array.isArray(body.data.properties)
      ) {
        throw new Error(
          body.message ??
          "تعذّر تحميل العقارات المرتبطة",
        );
      }

      if (!controller.signal.aborted) {
        setPreview(body.data);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setFormError(
          error instanceof Error
            ? error.message
            : "تعذّر التحقق من العقارات المرتبطة",
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setPreviewLoading(false);
      }
    }
  }

  function closeModal() {
    if (saving) return;

    resetPreview();
    setModal(null);
    setSelected(null);
    setConfirmName("");
    setAcknowledgeDeletion(false);
    setFormError("");
  }

  async function toggleArchive(contact: Contact) {
    if (workingId !== null) return;

    setWorkingId(contact.id);
    setNotice("");
    setLoadError("");

    try {
      const response = await fetch(
        `/api/contacts/${contact.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !contact.isActive,
          }),
        },
      );

      const body =
        await readResponse<Contact>(response);

      if (!response.ok || !body.success) {
        throw new Error(responseError(response, body));
      }

      setNotice(
        contact.isActive
          ? "تمت أرشفة جهة الاتصال بنجاح"
          : "تم استرجاع جهة الاتصال بنجاح",
      );

      refresh();
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "تعذّر تغيير حالة جهة الاتصال",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving || !modal) return;

    setSaving(true);
    setFormError("");

    try {
      let url: string;
      let method: "POST" | "PATCH" | "DELETE";
      let payload: Record<string, unknown>;

      if (modal === "create") {
        url = "/api/contacts";
        method = "POST";

        payload = {
          fullName: fullName.trim(),
          phone: phone.trim(),
          alternativePhone:
            alternativePhone.trim() || null,
          notes: notes.trim() || null,
        };
      } else if (modal === "edit" && selected) {
        url = `/api/contacts/${selected.id}`;
        method = "PATCH";

        payload = {
          fullName: fullName.trim(),
          phone: phone.trim(),
          alternativePhone:
            alternativePhone.trim() || null,
          notes: notes.trim() || null,
          isActive,
        };
      } else if (
        modal === "delete" &&
        selected &&
        preview
      ) {
        if (
          previewLoading ||
          formError ||
          confirmName.trim() !== preview.fullName ||
          !acknowledgeDeletion
        ) {
          throw new Error(
            "يجب مراجعة العقارات وتأكيد الحذف أولًا",
          );
        }

        url = `/api/contacts/${selected.id}`;
        method = "DELETE";

        payload = {
          confirm: true,
          confirmName: preview.fullName,
          deleteRelatedProperties: true,
          expectedPropertyIds: preview.properties.map(
            (property) => property.id,
          ),
        };
      } else {
        throw new Error("العملية غير متاحة");
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body =
        await readResponse<unknown>(response);

      if (!response.ok || !body.success) {
        throw new Error(responseError(response, body));
      }

      resetPreview();
      setModal(null);
      setSelected(null);
      setConfirmName("");
      setAcknowledgeDeletion(false);

      setNotice(
        body.message ?? "تم تنفيذ العملية بنجاح",
      );

      refresh();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تنفيذ العملية",
      );
    } finally {
      setSaving(false);
    }
  }

  function changePage(nextPage: number) {
    if (nextPage === page) return;

    setLoading(true);
    setPage(nextPage);
  }

  function changeLimit(nextLimit: number) {
    setLoading(true);
    setPage(1);
    setLimit(nextLimit);
  }

  const deletionConfirmed =
    modal === "delete" &&
    preview !== null &&
    !previewLoading &&
    !formError &&
    confirmName.trim() === preview.fullName &&
    acknowledgeDeletion;

  const modalTitle =
    modal === "create"
      ? "إضافة جهة اتصال جديدة"
      : modal === "edit"
        ? "تعديل جهة الاتصال"
        : "تأكيد الحذف النهائي";

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-6xl space-y-6 pb-12"
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#263b2b]">
            جهات الاتصال
          </h1>

          <p className="mt-2 text-[#667568]">
            إدارة الأسماء وأرقام الهواتف والعقارات المرتبطة.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className={`${buttonClass} bg-[#346747] text-white hover:bg-[#285338]`}
        >
          <Plus size={19} aria-hidden="true" />
          إضافة جهة اتصال
        </button>
      </header>

      {notice && (
        <p
          role="status"
          className="rounded-xl bg-[#e6f0e5] p-4 text-[#285338]"
        >
          {notice}
        </p>
      )}

      <section className="flex flex-wrap gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">
            البحث عن جهة اتصال
          </span>

          <Search
            size={19}
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#798578]"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
              setLoading(true);
              setNotice("");
            }}
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            className={`${inputClass} pr-11`}
          />
        </label>

        <label className="min-w-[180px]">
          <span className="sr-only">
            تصفية جهات الاتصال حسب الحالة
          </span>

          <select
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value as Filter);
              setPage(1);
              setLoading(true);
            }}
            className={inputClass}
          >
            <option value="all">
              جميع جهات الاتصال
            </option>
            <option value="active">النشطة</option>
            <option value="archived">المؤرشفة</option>
          </select>
        </label>
      </section>

      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
        >
          <p>{loadError}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-2 font-semibold underline"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#eeeae1] p-5">
          <h2 className="text-lg font-bold text-[#263b2b]">
            جهات الاتصال المسجلة
          </h2>

          <span className="text-sm text-[#667568]">
            الإجمالي: {pagination.total}
          </span>
        </div>

        {loading ? (
          <div
            role="status"
            className="p-12 text-center text-[#667568]"
          >
            جارٍ تحميل جهات الاتصال...
          </div>
        ) : loadError ? (
          <div className="p-10 text-center text-[#667568]">
            تعذّر عرض القائمة. استخدم إعادة المحاولة.
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center">
            <Phone
              size={36}
              aria-hidden="true"
              className="mx-auto mb-3 text-[#859885]"
            />
            <p className="font-semibold text-[#263b2b]">
              لا توجد جهات اتصال مطابقة
            </p>
            <p className="mt-2 text-sm text-[#667568]">
              جرّب تغيير البحث أو الفلتر.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0ede7]">
            {contacts.map((contact) => (
              <article
                key={contact.id}
                className="flex flex-wrap items-start justify-between gap-4 p-5"
              >
                <div className="flex min-w-[220px] items-start gap-3">
                  <span className="rounded-xl bg-[#edf1e8] p-3 text-[#346747]">
                    <Phone size={20} aria-hidden="true" />
                  </span>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-[#263b2b]">
                      {contact.fullName}
                    </h3>

                    <p
                      dir="ltr"
                      className="text-right text-sm text-[#425346]"
                    >
                      {contact.phone}
                    </p>

                    {contact.alternativePhone && (
                      <p
                        dir="ltr"
                        className="text-right text-sm text-[#667568]"
                      >
                        {contact.alternativePhone}
                      </p>
                    )}

                    <p className="text-sm text-[#667568]">
                      العقارات المرتبطة:{" "}
                      {contact.propertyCount}
                    </p>

                    {contact.notes && (
                      <p className="max-w-md whitespace-pre-wrap break-words text-sm leading-6 text-[#667568]">
                        {contact.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${contact.isActive
                        ? "bg-[#e6f0e5] text-[#346747]"
                        : "bg-[#f1eee8] text-[#796f5d]"
                      }`}
                  >
                    {contact.isActive
                      ? "نشطة"
                      : "مؤرشفة"}
                  </span>

                  <button
                    type="button"
                    onClick={() => openEdit(contact)}
                    className={`${buttonClass} bg-[#edf1e8] text-[#346747] hover:bg-[#dfe8d9]`}
                  >
                    <Pencil size={16} aria-hidden="true" />
                    تعديل
                  </button>

                  <button
                    type="button"
                    disabled={workingId !== null}
                    onClick={() =>
                      void toggleArchive(contact)
                    }
                    className={`${buttonClass} bg-[#f1eee8] text-[#5e685c] hover:bg-[#e7e2d7]`}
                  >
                    {contact.isActive ? (
                      <Archive size={16} aria-hidden="true" />
                    ) : (
                      <RotateCcw size={16} aria-hidden="true" />
                    )}

                    {contact.isActive
                      ? "أرشفة"
                      : "استرجاع"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void openDelete(contact)
                    }
                    className={`${buttonClass} bg-red-50 text-red-700 hover:bg-red-100`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    حذف
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {!loadError && (
        <PaginationControls
          pagination={pagination}
          disabled={loading}
          onPageChange={changePage}
          onLimitChange={changeLimit}
        />
      )}

      <Dialog.Root
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />

          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
            <Dialog.Popup
              dir="rtl"
              className="my-auto w-full max-w-lg rounded-2xl bg-[#f8f6f0] p-6 shadow-2xl outline-none"
            >
              <form
                onSubmit={submit}
                className="space-y-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <Dialog.Title className="text-2xl font-bold text-[#263b2b]">
                    {modalTitle}
                  </Dialog.Title>

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    aria-label="إغلاق النافذة"
                    className="rounded-lg p-2 text-[#667568] hover:bg-[#eeeae1]"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>

                {modal === "delete" ? (
                  <>
                    <Dialog.Description className="leading-7 text-[#4a584c]">
                      أنت على وشك حذف جهة الاتصال{" "}
                      <strong>
                        {preview?.fullName ??
                          selected?.fullName}
                      </strong>{" "}
                      نهائيًا.
                    </Dialog.Description>

                    {previewLoading ? (
                      <p role="status">
                        جارٍ تحميل العقارات المرتبطة...
                      </p>
                    ) : preview ? (
                      <>
                        <div
                          role="alert"
                          className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
                        >
                          <p className="text-lg font-bold">
                            تحذير: حذف نهائي
                          </p>

                          <p>
                            سيتم حذف جهة الاتصال و{" "}
                            <strong>
                              {preview.properties.length}
                            </strong>{" "}
                            عقار مرتبط بها.
                          </p>

                          {preview.properties.length > 0 && (
                            <div className="max-h-52 overflow-y-auto rounded-lg bg-white p-3">
                              <p className="mb-2 text-sm font-semibold">
                                العقارات التي ستُحذف:
                              </p>

                              <ul className="list-disc space-y-2 pr-6 text-sm">
                                {preview.properties.map(
                                  (property) => (
                                    <li
                                      key={property.id}
                                      className="break-words"
                                    >
                                      {property.title}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}

                          <p className="text-sm leading-7">
                            سيُحذف العقار بالكامل حتى لو
                            كان مرتبطًا بملاك آخرين، لكن
                            جهات الاتصال الأخرى نفسها
                            ستبقى محفوظة.
                          </p>

                          <p className="text-sm leading-7">
                            سيشمل الحذف عروض العقارات،
                            وسجل التغييرات، وعلاقات الملاك،
                            وسجلات الصور المرتبطة بها.
                            ملفات الصور الخارجية قد تتطلب
                            تنظيفًا منفصلًا.
                          </p>
                        </div>

                        <label className="block font-semibold text-[#263b2b]">
                          اكتب اسم جهة الاتصال للتأكيد:
                          <strong className="mr-2 text-red-700">
                            {preview.fullName}
                          </strong>

                          <input
                            autoFocus
                            autoComplete="off"
                            value={confirmName}
                            disabled={saving}
                            onChange={(event) =>
                              setConfirmName(
                                event.target.value,
                              )
                            }
                            className={`${inputClass} mt-2`}
                          />
                        </label>

                        <label className="flex items-start gap-3 rounded-xl bg-white p-4">
                          <input
                            type="checkbox"
                            checked={acknowledgeDeletion}
                            disabled={saving}
                            onChange={(event) =>
                              setAcknowledgeDeletion(
                                event.target.checked,
                              )
                            }
                            className="mt-1 h-5 w-5 accent-red-700"
                          />

                          <span className="text-sm leading-7 text-[#263b2b]">
                            أفهم أن حذف جهة الاتصال سيحذف
                            جميع العقارات المذكورة وبياناتها
                            التابعة بشكل نهائي.
                          </span>
                        </label>
                      </>
                    ) : (
                      <p
                        role="alert"
                        className="rounded-xl bg-red-50 p-4 text-red-700"
                      >
                        تعذّر تحميل معلومات الحذف.
                        لن يتم السماح بالحذف قبل التحقق منها.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <Dialog.Description className="text-sm text-[#667568]">
                      أدخل معلومات جهة الاتصال.
                    </Dialog.Description>

                    <label className="block font-semibold text-[#263b2b]">
                      الاسم *
                      <input
                        autoFocus
                        required
                        maxLength={150}
                        value={fullName}
                        disabled={saving}
                        onChange={(event) =>
                          setFullName(event.target.value)
                        }
                        placeholder="الاسم الكامل"
                        className={`${inputClass} mt-2`}
                      />
                    </label>

                    <label className="block font-semibold text-[#263b2b]">
                      رقم الهاتف *
                      <input
                        type="tel"
                        dir="ltr"
                        required
                        value={phone}
                        disabled={saving}
                        onChange={(event) =>
                          setPhone(event.target.value)
                        }
                        placeholder="07XXXXXXXX"
                        className={`${inputClass} mt-2`}
                      />
                    </label>

                    <label className="block font-semibold text-[#263b2b]">
                      رقم هاتف إضافي
                      <input
                        type="tel"
                        dir="ltr"
                        value={alternativePhone}
                        disabled={saving}
                        onChange={(event) =>
                          setAlternativePhone(
                            event.target.value,
                          )
                        }
                        placeholder="اختياري"
                        className={`${inputClass} mt-2`}
                      />
                    </label>

                    <label className="block font-semibold text-[#263b2b]">
                      ملاحظات
                      <textarea
                        rows={3}
                        maxLength={2000}
                        value={notes}
                        disabled={saving}
                        onChange={(event) =>
                          setNotes(event.target.value)
                        }
                        placeholder="ملاحظات داخلية عن جهة الاتصال..."
                        className={`${inputClass} mt-2`}
                      />
                    </label>

                    {modal === "edit" && (
                      <label className="block font-semibold text-[#263b2b]">
                        حالة جهة الاتصال
                        <select
                          value={
                            isActive
                              ? "active"
                              : "archived"
                          }
                          disabled={saving}
                          onChange={(event) =>
                            setIsActive(
                              event.target.value === "active",
                            )
                          }
                          className={`${inputClass} mt-2`}
                        >
                          <option value="active">
                            نشطة
                          </option>
                          <option value="archived">
                            مؤرشفة
                          </option>
                        </select>
                      </label>
                    )}
                  </>
                )}

                {formError && (
                  <p
                    role="alert"
                    className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                  >
                    {formError}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className={`${buttonClass} bg-[#eae8df] text-[#3b493b]`}
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      (modal === "delete" &&
                        !deletionConfirmed)
                    }
                    className={`${buttonClass} ${modal === "delete"
                        ? "bg-red-700 text-white hover:bg-red-800"
                        : "bg-[#346747] text-white hover:bg-[#285338]"
                      }`}
                  >
                    {saving
                      ? "جارٍ التنفيذ..."
                      : modal === "create"
                        ? "إضافة جهة الاتصال"
                        : modal === "edit"
                          ? "حفظ التعديلات"
                          : "حذف جهة الاتصال والعقارات نهائيًا"}
                  </button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
