
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
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { PaginationControls } from "@/components/shared/pagination-controls";
import type { PaginationMeta } from "@/lib/pagination";

type Location = {
  id: string;
  nameAr: string;
  isActive: boolean;
  _count: {
    properties: number;
  };
  createdAt: string;
  updatedAt: string;
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
      "حدث خطأ في الخادم. حدّث القائمة وتحقق من " +
      "البيانات قبل إعادة المحاولة."
    );
  }

  return (
    body.errors?.[0]?.message ??
    body.message ??
    "تعذّر تنفيذ العملية"
  );
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);

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
  const [selected, setSelected] = useState<Location | null>(
    null,
  );

  const [nameAr, setNameAr] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [confirmName, setConfirmName] = useState("");
  const [acknowledgeDeletion, setAcknowledgeDeletion] =
    useState(false);
  const [previewLoading, setPreviewLoading] =
    useState(false);

  const previewController = useRef<AbortController | null>(
    null,
  );

  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(
    null,
  );
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  // Load only the selected page from the backend.
  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      async function loadLocations() {
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
            `/api/locations?${params.toString()}`,
            {
              cache: "no-store",
              signal: controller.signal,
            },
          );

          const body =
            await readResponse<Location[]>(response);

          if (
            !response.ok ||
            !body.success ||
            !Array.isArray(body.data) ||
            !body.pagination
          ) {
            throw new Error(
              body.message ?? "تعذّر تحميل المناطق",
            );
          }

          if (controller.signal.aborted) return;

          // Handle a deleted last item on the last page.
          if (page > body.pagination.totalPages) {
            correctingPage = true;
            setPage(body.pagination.totalPages);
            return;
          }

          setLocations(body.data);
          setPagination(body.pagination);
          setLoadError("");
        } catch (error) {
          if (controller.signal.aborted) return;

          setLoadError(
            error instanceof Error
              ? error.message
              : "تعذّر تحميل المناطق",
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

      void loadLocations();
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
    setPreviewLoading(false);
  }

  function openCreate() {
    resetPreview();
    setSelected(null);
    setNameAr("");
    setIsActive(true);
    setFormError("");
    setNotice("");
    setModal("create");
  }

  function openEdit(location: Location) {
    resetPreview();
    setSelected(location);
    setNameAr(location.nameAr);
    setIsActive(location.isActive);
    setFormError("");
    setNotice("");
    setModal("edit");
  }

  async function openDelete(location: Location) {
    resetPreview();

    setSelected(location);
    setModal("delete");
    setConfirmName("");
    setAcknowledgeDeletion(false);
    setPreviewLoading(true);
    setFormError("");
    setNotice("");

    const controller = new AbortController();
    previewController.current = controller;

    try {
      // Get the latest linked-property count
      // before asking for destructive confirmation.
      const response = await fetch(
        `/api/locations/${location.id}`,
        {
          cache: "no-store",
          signal: controller.signal,
        },
      );

      const body =
        await readResponse<Location>(response);

      if (
        !response.ok ||
        !body.success ||
        !body.data
      ) {
        throw new Error(
          body.message ??
          "تعذّر تحميل بيانات المنطقة قبل الحذف",
        );
      }

      if (!controller.signal.aborted) {
        setSelected(body.data);
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
    setFormError("");
    setConfirmName("");
    setAcknowledgeDeletion(false);
  }

  async function toggleArchive(location: Location) {
    if (workingId !== null) return;

    setWorkingId(location.id);
    setNotice("");
    setLoadError("");

    try {
      const response = await fetch(
        `/api/locations/${location.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !location.isActive,
          }),
        },
      );

      const body =
        await readResponse<Location>(response);

      if (!response.ok || !body.success) {
        throw new Error(responseError(response, body));
      }

      setNotice(
        location.isActive
          ? "تمت أرشفة المنطقة بنجاح"
          : "تم استرجاع المنطقة بنجاح",
      );

      refresh();
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "تعذّر تغيير حالة المنطقة",
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
        url = "/api/locations";
        method = "POST";
        payload = {
          nameAr: nameAr.trim(),
        };
      } else if (modal === "edit" && selected) {
        url = `/api/locations/${selected.id}`;
        method = "PATCH";
        payload = {
          nameAr: nameAr.trim(),
          isActive,
        };
      } else if (modal === "delete" && selected) {
        if (
          previewLoading ||
          formError ||
          confirmName.trim() !== selected.nameAr ||
          !acknowledgeDeletion
        ) {
          throw new Error(
            "يجب التحقق من العقارات وتأكيد الحذف أولًا",
          );
        }

        url = `/api/locations/${selected.id}`;
        method = "DELETE";

        payload = {
          confirm: true,
          confirmName: selected.nameAr,
          deleteRelatedProperties: true,
          expectedPropertyCount:
            selected._count.properties,
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
      setNotice(
        body.message ?? "تم تنفيذ العملية بنجاح",
      );

      refresh();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء حفظ العملية",
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
    selected !== null &&
    !previewLoading &&
    !formError &&
    confirmName.trim() === selected.nameAr &&
    acknowledgeDeletion;

  const modalTitle =
    modal === "create"
      ? "إضافة منطقة جديدة"
      : modal === "edit"
        ? "تعديل المنطقة"
        : "تأكيد الحذف النهائي";

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-6xl space-y-6 pb-12"
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#263b2b]">
            إدارة المناطق
          </h1>

          <p className="mt-2 text-[#667568]">
            إضافة المناطق وتعديلها وأرشفتها والبحث عنها.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className={`${buttonClass} bg-[#346747] text-white hover:bg-[#285338]`}
        >
          <Plus size={19} aria-hidden="true" />
          إضافة منطقة
        </button>
      </header>

      {notice && (
        <p
          role="status"
          className="rounded-xl bg-[#e6f0e5] px-5 py-4 text-[#285338]"
        >
          {notice}
        </p>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">
              البحث عن منطقة
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
              placeholder="ابحث باسم المنطقة..."
              className={`${inputClass} pr-11`}
            />
          </label>

          <label className="min-w-[180px]">
            <span className="sr-only">
              تصفية المناطق
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
              <option value="all">جميع المناطق</option>
              <option value="active">النشطة</option>
              <option value="archived">المؤرشفة</option>
            </select>
          </label>
        </div>
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

      <section
        aria-label="قائمة المناطق"
        className="overflow-hidden rounded-2xl bg-white shadow-sm"
      >
        <div className="flex items-center justify-between border-b border-[#eeeae1] px-5 py-4">
          <h2 className="text-lg font-bold text-[#263b2b]">
            المناطق المسجلة
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
            جارٍ تحميل المناطق...
          </div>
        ) : loadError ? (
          <div className="p-10 text-center text-[#667568]">
            تعذّر عرض القائمة. استخدم إعادة المحاولة.
          </div>
        ) : locations.length === 0 ? (
          <div className="p-12 text-center">
            <MapPin
              size={36}
              aria-hidden="true"
              className="mx-auto mb-3 text-[#859885]"
            />
            <p className="font-semibold text-[#263b2b]">
              لا توجد مناطق مطابقة
            </p>
            <p className="mt-2 text-sm text-[#667568]">
              جرّب تغيير البحث أو الفلتر.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0ede7]">
            {locations.map((location) => (
              <article
                key={location.id}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-5"
              >
                <div className="flex min-w-[200px] items-center gap-3">
                  <span className="rounded-xl bg-[#edf1e8] p-3 text-[#346747]">
                    <MapPin size={20} aria-hidden="true" />
                  </span>

                  <div>
                    <h3 className="text-lg font-bold text-[#263b2b]">
                      {location.nameAr}
                    </h3>

                    <p className="mt-1 text-sm text-[#667568]">
                      العقارات المرتبطة:{" "}
                      {location._count.properties}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${location.isActive
                      ? "bg-[#e6f0e5] text-[#346747]"
                      : "bg-[#f1eee8] text-[#796f5d]"
                      }`}
                  >
                    {location.isActive
                      ? "نشطة"
                      : "مؤرشفة"}
                  </span>

                  <button
                    type="button"
                    onClick={() => openEdit(location)}
                    className={`${buttonClass} bg-[#edf1e8] text-[#346747] hover:bg-[#dfe8d9]`}
                  >
                    <Pencil size={16} aria-hidden="true" />
                    تعديل
                  </button>

                  <button
                    type="button"
                    disabled={workingId !== null}
                    onClick={() =>
                      void toggleArchive(location)
                    }
                    className={`${buttonClass} bg-[#f1eee8] text-[#5e685c] hover:bg-[#e7e2d7]`}
                  >
                    {location.isActive ? (
                      <Archive size={16} aria-hidden="true" />
                    ) : (
                      <RotateCcw size={16} aria-hidden="true" />
                    )}

                    {location.isActive
                      ? "أرشفة"
                      : "استرجاع"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void openDelete(location)
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

                {modal === "delete" && selected ? (
                  <>
                    <Dialog.Description className="leading-7 text-[#4a584c]">
                      أنت على وشك حذف منطقة{" "}
                      <strong>{selected.nameAr}</strong>{" "}
                      نهائيًا.
                    </Dialog.Description>

                    {previewLoading ? (
                      <p role="status">
                        جارٍ التحقق من العقارات المرتبطة...
                      </p>
                    ) : (
                      <div
                        role="alert"
                        className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
                      >
                        <p className="text-lg font-bold">
                          تحذير: حذف نهائي
                        </p>

                        <p>
                          سيتم حذف{" "}
                          <strong>
                            {selected._count.properties}
                          </strong>{" "}
                          عقار مرتبط بهذه المنطقة.
                        </p>

                        <p className="text-sm leading-7">
                          سيتم أيضًا حذف عروض تلك العقارات،
                          وسجلات صورها، وتاريخ تغييراتها،
                          وعلاقاتها بالملاك. لن يتم حذف
                          جهات الاتصال نفسها.
                        </p>

                        <p className="text-sm">
                          قد تبقى ملفات الصور في التخزين
                          الخارجي إلى حين تنظيفها بصورة منفصلة.
                        </p>
                      </div>
                    )}

                    {!previewLoading && !formError && (
                      <>
                        <label className="block font-semibold text-[#263b2b]">
                          اكتب اسم المنطقة للتأكيد:
                          <strong className="mr-2 text-red-700">
                            {selected.nameAr}
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
                            أفهم أن حذف المنطقة سيحذف جميع
                            العقارات المرتبطة بها وبياناتها
                            التابعة نهائيًا.
                          </span>
                        </label>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Dialog.Description className="text-sm text-[#667568]">
                      أدخل اسم المنطقة باللغة العربية.
                    </Dialog.Description>

                    <label className="block font-semibold text-[#263b2b]">
                      اسم المنطقة *
                      <input
                        autoFocus
                        required
                        maxLength={120}
                        value={nameAr}
                        disabled={saving}
                        onChange={(event) =>
                          setNameAr(event.target.value)
                        }
                        placeholder="مثال: إيدون"
                        className={`${inputClass} mt-2`}
                      />
                    </label>

                    {modal === "edit" && (
                      <label className="block font-semibold text-[#263b2b]">
                        حالة المنطقة
                        <select
                          value={
                            isActive ? "active" : "archived"
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
                    disabled={saving}
                    onClick={closeModal}
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
                        ? "إضافة المنطقة"
                        : modal === "edit"
                          ? "حفظ التعديلات"
                          : "حذف المنطقة والعقارات نهائيًا"}
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
