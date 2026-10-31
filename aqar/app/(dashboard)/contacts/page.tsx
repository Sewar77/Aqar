"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Search, Phone, Plus, RefreshCw, Building2 } from "lucide-react";

type Contact = {
  id: string;
  fullName: string;
  phone: string;
  alternativePhone?: string | null;
  email?: string | null;
  notes?: string | null;
  _count?: {
    properties?: number;
    propertyContacts?: number;
  };
  propertyContacts?: unknown[];
};

function extractContacts(payload: any): Contact[] {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.contacts)) return data.contacts;

  throw new Error("صيغة بيانات جهات الاتصال غير متوقعة");
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadContacts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/contacts", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("تعذر تحميل جهات الاتصال");
      }

      const payload = await response.json();
      setContacts(extractContacts(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadContacts();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return contacts.filter((contact) =>
      [contact.fullName, contact.phone, contact.alternativePhone, contact.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [contacts, search]);

  return (
    <main dir="rtl" className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">جهات الاتصال</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            إدارة المالكين والشركاء والممثلين المفوضين
          </p>
        </div>

        <button
          onClick={() => void loadContacts()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          تحديث
        </button>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">إجمالي جهات الاتصال</p>
            <p className="text-2xl font-bold">
              {contacts.length.toLocaleString("ar-JO")}
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ابحث بالاسم أو رقم الهاتف أو البريد..."
          className="w-full rounded-lg border bg-background py-2.5 pr-10 pl-3 text-sm"
        />
      </div>

      {loading ? (
        <p className="py-12 text-center text-muted-foreground">
          جاري تحميل جهات الاتصال...
        </p>
      ) : error ? (
        <div className="rounded-xl border p-6 text-center">
          <p className="text-destructive">{error}</p>
          <button
            onClick={() => void loadContacts()}
            className="mt-3 text-sm underline"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p>لا توجد جهات اتصال مطابقة</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((contact) => {
            const propertyCount =
              contact._count?.propertyContacts ??
              contact._count?.properties ??
              contact.propertyContacts?.length;

            return (
              <div key={contact.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Users className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">{contact.fullName}</h2>
                    <p className="text-sm text-muted-foreground">جهة اتصال</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span dir="ltr">{contact.phone}</span>
                  </div>

                  {contact.alternativePhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span dir="ltr">{contact.alternativePhone}</span>
                    </div>
                  )}

                  {propertyCount !== undefined && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {propertyCount.toLocaleString("ar-JO")} عقارات مرتبطة
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-5 border-t pt-4">
                  <a
                    href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
                  >
                    <Phone className="h-4 w-4" />
                    اتصال
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && (
        <p className="text-sm text-muted-foreground">
          عدد النتائج: {filtered.length.toLocaleString("ar-JO")}
        </p>
      )}
    </main>
  );
}
