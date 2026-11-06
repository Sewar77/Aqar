
import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ImageIcon,
  MapPin,
  Phone,
  Ruler,
  ScrollText,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { PropertyDetailsActions } from "@/components/properties/property-details-actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fieldNames: Record<string, string> = {
  locationDetails: "تفاصيل الموقع",
  areas: "تفاصيل المساحات",
  features: "ميزات العقار",
  basinName: "اسم الحوض",
  basinNumber: "رقم الحوض",
  parcelNumber: "رقم القطعة",
  googleMapsUrl: "رابط خرائط جوجل",
  directions: "وصف الطريق",
  landmarks: "معالم قريبة",
  nearbyServices: "الشوارع والخدمات القريبة",
  landAreaSqm: "مساحة الأرض (م²)",
  buildingAreaSqm: "مساحة البناء (م²)",
  gardenAreaSqm: "مساحة الحديقة (م²)",
  roofAreaSqm: "مساحة السطح (م²)",
  frontageMeters: "طول الواجهة (متر)",
  cultivatedAreaSqm: "المساحة المزروعة (م²)",
  rooms: "عدد الغرف الإجمالي",
  bedrooms: "غرف النوم",
  bathrooms: "الحمامات",
  livingRooms: "الصالونات",
  kitchens: "المطابخ",
  floorNumber: "رقم الطابق",
  totalFloors: "عدد الطوابق",
  apartmentCount: "عدد الشقق",
  buildingAgeYears: "عمر البناء (سنوات)",
  parkingSpaces: "مواقف السيارات",
  treeCount: "عدد الأشجار",
  streetWidthMeters: "عرض الشارع (متر)",
  zoning: "التنظيم",
  landUse: "استعمال الأرض",
  condition: "حالة العقار / التشطيب",
  roomDetails: "تفاصيل الغرف",
  apartments: "تفاصيل الشقق",
  floorAreas: "مساحات الطوابق",
  label: "تسمية الوحدة",
  nameAr: "الاسم",
  count: "العدد",
  areaSqm: "المساحة (م²)",
  description: "الوصف",
  floor: "الطابق",
  hasElevator: "مصعد",
  hasParking: "كراج",
  isFurnished: "مفروش",
  hasBalcony: "بلكونة",
  hasWaterWell: "بئر ماء",
  availableServices: "الخدمات المتوفرة",
  extras: "تفاصيل إضافية",
};

const statusNames: Record<string, string> = {
  DRAFT: "مسودة",
  ACTIVE: "نشط",
  ARCHIVED: "مؤرشف",
  AVAILABLE: "متاح",
  RESERVED: "محجوز",
  UNDER_NEGOTIATION: "قيد التفاوض",
  SOLD: "مباع",
  RENTED: "مؤجر",
  WITHDRAWN: "مسحوب",
  SALE: "بيع",
  RENT: "إيجار",
  DAILY: "يومي",
  WEEKLY: "أسبوعي",
  MONTHLY: "شهري",
  YEARLY: "سنوي",
  OTHER: "أخرى",
  OWNER: "مالك",
  CO_OWNER: "شريك بالملكية",
  AUTHORIZED_REPRESENTATIVE: "مفوّض",
  CREATED: "إنشاء العقار",
  UPDATED: "تعديل العقار",
  PRICE_CHANGED: "تغيير السعر",
  STATUS_CHANGED: "تغيير الحالة",
  CONTACT_CHANGED: "تغيير الملاك",
  PHOTO_CHANGED: "تغيير الصور",
  NOTE_ADDED: "إضافة ملاحظة",
};

function nameOf(value: string) {
  return fieldNames[value] ?? statusNames[value] ?? value;
}

function dateOf(value: Date | null | undefined) {
  if (!value) return "غير محدد";

  return new Intl.DateTimeFormat("ar-JO", {
    timeZone: "Asia/Amman",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function numberOf(value: unknown) {
  if (value == null || value === "") return "غير محدد";

  const n = Number(value);

  return Number.isFinite(n)
    ? new Intl.NumberFormat("ar-JO").format(n)
    : String(value);
}

function priceOf(value: unknown, currency = "JOD") {
  return value == null
    ? "غير محدد"
    : `${numberOf(value)} ${currency === "JOD" ? "د.أ" : currency
    }`;
}

function formatArea(
  unit: string | null | undefined,
  custom: string | null | undefined,
) {
  return unit === "SQUARE_METER"
    ? "م²"
    : unit === "DUNUM"
      ? "دونم"
      : custom || "";
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function textOf(value: unknown): ReactNode {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "غير محدد";
  }

  if (typeof value === "boolean") {
    return value ? "نعم" : "لا";
  }

  if (typeof value === "number") {
    return numberOf(value);
  }

  const text = String(value);

  if (/^https:\/\//i.test(text)) {
    return (
      <a
        href={text}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all font-semibold text-[#346747] underline"
      >
        فتح الرابط
      </a>
    );
  }

  return statusNames[text] ?? text;
}

function Info({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-[#f6f7f3] px-4 py-3">
      <dt className="mb-1 text-xs font-semibold text-[#788476]">
        {label}
      </dt>

      <dd className="break-words whitespace-pre-wrap text-sm font-semibold leading-7 text-[#2d4431]">
        {children ?? "غير محدد"}
      </dd>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-[#e5e8df] bg-white p-5 shadow-sm md:p-6">
      <h2 className="flex items-center gap-2 border-b border-[#edf0e8] pb-3 text-xl font-bold text-[#29442f]">
        {icon}
        {title}
      </h2>

      {children}
    </section>
  );
}

// Displays all nested JSON fields,
// including custom fields added in the future.
function DetailValue({
  value,
  depth = 0,
}: {
  value: unknown;
  depth?: number;
}) {
  if (depth > 12) {
    return <span>تفاصيل متداخلة</span>;
  }

  if (Array.isArray(value)) {
    if (!value.length) {
      return (
        <p className="text-sm text-[#829080]">
          لا توجد عناصر مسجلة
        </p>
      );
    }

    if (
      value.every(
        (item) =>
          !isRecord(item) && !Array.isArray(item),
      )
    ) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, i) => (
            <span
              key={i}
              className="rounded-full bg-[#e8f0e3] px-3 py-1.5 text-sm font-medium text-[#315a3b]"
            >
              {textOf(item)}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="grid gap-3 md:grid-cols-2">
        {value.map((item, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#e3e9df] bg-[#fbfcf9] p-4"
          >
            <div className="mb-3 text-sm font-bold text-[#346747]">
              العنصر {i + 1}
            </div>

            <DetailValue
              value={item}
              depth={depth + 1}
            />
          </div>
        ))}
      </div>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);

    if (!entries.length) {
      return (
        <p className="text-sm text-[#829080]">
          لا توجد تفاصيل إضافية
        </p>
      );
    }

    return (
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(([key, child]) =>
          isRecord(child) || Array.isArray(child) ? (
            <div
              key={key}
              className="space-y-3 sm:col-span-2 lg:col-span-3"
            >
              <h3 className="font-bold text-[#446247]">
                {nameOf(key)}
              </h3>

              <DetailValue
                value={child}
                depth={depth + 1}
              />
            </div>
          ) : (
            <Info key={key} label={nameOf(key)}>
              {textOf(child)}
            </Info>
          ),
        )}
      </dl>
    );
  }

  return (
    <span className="text-sm font-semibold text-[#29442f]">
      {textOf(value)}
    </span>
  );
}

function photoUrl(
  storageKey: string,
  cloud: string | undefined,
) {
  if (
    storageKey.startsWith(
      "https://res.cloudinary.com/",
    )
  ) {
    return storageKey;
  }

  if (
    !cloud ||
    !/^[a-zA-Z0-9_-]+$/.test(cloud)
  ) {
    return null;
  }

  const safePath = storageKey
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return `https://res.cloudinary.com/${cloud}/image/upload/${safePath}`;
}

async function Content({ params }: PageProps) {
  await connection();

  const { id } = await params;

  if (!uuidPattern.test(id)) {
    notFound();
  }

  // Owner information is private.
  // Block public production access until ADMIN auth exists.
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const property = await prisma.property.findUnique({
    where: { id },

    include: {
      type: {
        select: {
          id: true,
          code: true,
          nameAr: true,
        },
      },

      location: {
        select: {
          id: true,
          nameAr: true,
        },
      },

      contacts: {
        orderBy: [
          { isPrimary: "desc" },
          { createdAt: "asc" },
        ],

        include: {
          contact: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              alternativePhone: true,
              notes: true,
              createdAt: true,
            },
          },
        },
      },

      offerings: {
        orderBy: {
          createdAt: "desc",
        },
      },

      photos: {
        orderBy: [
          { isPrimary: "desc" },
          { sortOrder: "asc" },
        ],
      },

      events: {
        orderBy: {
          createdAt: "desc",
        },
      },

      parentProperty: {
        select: {
          id: true,
          propertyCode: true,
          title: true,
        },
      },

      childProperties: {
        select: {
          id: true,
          propertyCode: true,
          title: true,
        },
      },
    },
  });

  if (!property) {
    notFound();
  }

  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME;

  const details: Record<string, unknown> =
    isRecord(property.details)
      ? property.details
      : {};

  const locations = isRecord(details.locationDetails)
    ? details.locationDetails
    : {};

  const areaDetails = isRecord(details.areas)
    ? details.areas
    : {};

  const {
    locationDetails: _locationDetails,
    areas: _areas,
    ...typeDetails
  } = details;

  void _locationDetails;
  void _areas;

  const latitude =
    property.latitude == null
      ? null
      : Number(property.latitude);

  const longitude =
    property.longitude == null
      ? null
      : Number(property.longitude);

  const validCoordinates =
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  const mapsUrl = validCoordinates
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : typeof locations.googleMapsUrl === "string" &&
      /^https:\/\//.test(locations.googleMapsUrl)
      ? locations.googleMapsUrl
      : null;

  const mapEmbed = validCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude! - 0.006
    }%2C${latitude! - 0.006}%2C${longitude! + 0.006
    }%2C${latitude! + 0.006
    }&layer=mapnik&marker=${latitude}%2C${longitude}`
    : null;

  const images = property.photos.map((photo) => ({
    ...photo,
    url: photoUrl(photo.storageKey, cloudName),
  }));

  const primary = images.find((photo) => photo.url);

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-7xl space-y-6 pb-14"
    >
      <Link
        href="/properties"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#346747] hover:underline"
      >
        <ArrowRight size={16} />
        العودة إلى العقارات
      </Link>

      {/* Header and primary image */}
      <div className="overflow-hidden rounded-2xl border border-[#e5e8df] bg-white shadow-sm">
        {primary ? (
          <a
            href={primary.url!}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[#edf1e9]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={primary.url!}
              alt={`الصورة الرئيسية: ${property.title}`}
              className="h-60 w-full object-contain md:h-96"
            />
          </a>
        ) : (
          <div className="flex h-32 items-center justify-center gap-2 bg-[#edf1e9] text-[#6b806e]">
            <ImageIcon size={22} />

            {property.photos.length
              ? "الصور محفوظة لكن إعداد Cloudinary مطلوب لعرضها"
              : "لا توجد صور للعقار"}
          </div>
        )}

        <div className="space-y-4 p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold text-[#788476]">
                {property.propertyCode}
              </p>

              <h1 className="text-2xl font-bold text-[#253c2a] md:text-3xl">
                {property.title}
              </h1>

              <p className="mt-2 flex items-center gap-2 text-sm text-[#6c7c6d]">
                <MapPin size={15} />
                {property.location.nameAr} ·{" "}
                {property.type.nameAr}
              </p>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-sm font-bold ${property.status === "ACTIVE"
                ? "bg-[#e3f1e1] text-[#326141]"
                : "bg-[#f1eee8] text-[#765f46]"
                }`}
            >
              {nameOf(property.status)}
            </span>
          </div>

          <PropertyDetailsActions
            property={{
              id: property.id,
              title: property.title,
              description: property.description,
              internalNotes: property.internalNotes,
              address: property.address,
              status: property.status,
              latitude,
              longitude,
              areaValue:
                property.areaValue == null
                  ? null
                  : Number(property.areaValue),
              areaUnit: property.areaUnit,
              areaUnitLabel: property.areaUnitLabel,
              details: JSON.parse(
                JSON.stringify(details),
              ) as Record<string, unknown>,
              updatedAt: property.updatedAt.toISOString(),
              contactsCount: property.contacts.length,
              offeringsCount: property.offerings.length,
              photosCount: property.photos.length,
              childPropertiesCount:
                property.childProperties.length,
            }}
          />

          <p className="whitespace-pre-wrap leading-8 text-[#536553]">
            {property.description ||
              "لم يُضف وصف عام لهذا العقار."}
          </p>
        </div>
      </div>

      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#748173]">
            <Building2 size={18} />
            النوع
          </div>
          <div className="mt-3 text-lg font-bold">
            {property.type.nameAr}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#748173]">
            <MapPin size={18} />
            المنطقة
          </div>
          <div className="mt-3 text-lg font-bold">
            {property.location.nameAr}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#748173]">
            <Ruler size={18} />
            المساحة الرئيسية
          </div>
          <div className="mt-3 text-lg font-bold">
            {numberOf(property.areaValue)}{" "}
            {formatArea(
              property.areaUnit,
              property.areaUnitLabel,
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#748173]">
            <Phone size={18} />
            جهات الاتصال
          </div>
          <div className="mt-3 text-lg font-bold">
            {property.contacts.length}
          </div>
        </div>
      </div>

      {/* Basic information */}
      <Section
        title="المعلومات الأساسية"
        icon={<Building2 size={20} />}
      >
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="الاسم">
            {property.title}
          </Info>

          <Info label="نوع العقار">
            {property.type.nameAr}
          </Info>

          <Info label="حالة السجل">
            {nameOf(property.status)}
          </Info>

          <Info label="رقم العقار الداخلي">
            {property.propertyCode}
          </Info>

          <Info label="تاريخ التسجيل">
            {dateOf(property.createdAt)}
          </Info>

          <Info label="آخر تعديل">
            {dateOf(property.updatedAt)}
          </Info>

          <Info label="الوصف">
            {property.description || "غير محدد"}
          </Info>
        </dl>
      </Section>

      {/* Location and map */}
      <Section
        title="الموقع بالتفصيل والخريطة"
        icon={<MapPin size={20} />}
      >
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="المنطقة">
            {property.location.nameAr}
          </Info>

          <Info label="العنوان التفصيلي">
            {property.address || "غير محدد"}
          </Info>

          <Info label="خط العرض">
            {latitude == null
              ? "غير محدد"
              : String(latitude)}
          </Info>

          <Info label="خط الطول">
            {longitude == null
              ? "غير محدد"
              : String(longitude)}
          </Info>
        </dl>

        <DetailValue value={locations} />

        {mapEmbed ? (
          <iframe
            title="موقع العقار على الخريطة"
            src={mapEmbed}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-72 w-full rounded-xl border border-[#e2e7df] md:h-96"
          />
        ) : (
          <p className="rounded-xl bg-[#f6f7f3] p-4 text-sm text-[#718071]">
            لم تُحفظ إحداثيات صالحة لعرض خريطة تفاعلية.
          </p>
        )}

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-xl bg-[#346747] px-5 py-3 text-sm font-semibold text-white hover:bg-[#285338]"
          >
            فتح موقع العقار في الخرائط
          </a>
        )}
      </Section>

      {/* Areas */}
      <Section
        title="المساحات والمقاسات"
        icon={<Ruler size={20} />}
      >
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="المساحة الرئيسية">
            {numberOf(property.areaValue)}{" "}
            {formatArea(
              property.areaUnit,
              property.areaUnitLabel,
            )}
          </Info>

          <Info label="المساحة بالمتر المربع">
            {numberOf(property.areaInSquareMeters)} م²
          </Info>

          <Info label="وحدة المساحة">
            {formatArea(
              property.areaUnit,
              property.areaUnitLabel,
            ) || "غير محددة"}
          </Info>
        </dl>

        <DetailValue value={areaDetails} />
      </Section>

      {/* Every type-specific field, nested structure and tag */}
      <Section
        title={`التفاصيل الكاملة — ${property.type.nameAr}`}
        icon={<ScrollText size={20} />}
      >
        <DetailValue value={typeDetails} />
      </Section>

      {/* All photos */}
      <Section
        title={`معرض الصور (${images.length})`}
        icon={<ImageIcon size={20} />}
      >
        {images.length === 0 ? (
          <p className="text-[#748173]">
            لم تتم إضافة صور لهذا العقار.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((photo) => (
              <div
                key={photo.id}
                className="overflow-hidden rounded-xl border border-[#e3e9e0]"
              >
                {photo.url ? (
                  <a
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.fileName}
                      loading="lazy"
                      className="h-48 w-full bg-[#f1f4ec] object-contain"
                    />
                  </a>
                ) : (
                  <div className="flex h-48 items-center justify-center bg-[#f1f4ec] text-sm text-[#748173]">
                    الصورة غير متاحة للعرض
                  </div>
                )}

                <div className="space-y-1 p-3 text-xs text-[#657565]">
                  <p className="break-all font-semibold text-[#29442f]">
                    {photo.fileName}
                  </p>

                  {photo.isPrimary && (
                    <p className="font-bold text-[#346747]">
                      الصورة الرئيسية
                    </p>
                  )}

                  <p>
                    الترتيب: {numberOf(photo.sortOrder)}
                  </p>

                  <p>
                    النوع: {photo.mimeType || "غير محدد"}
                  </p>

                  <p>
                    الحجم:{" "}
                    {photo.sizeBytes == null
                      ? "غير محدد"
                      : `${numberOf(
                        Math.round(
                          photo.sizeBytes / 1024,
                        ),
                      )} كيلوبايت`}
                  </p>

                  <p>
                    أُضيفت: {dateOf(photo.createdAt)}
                  </p>

                  <details>
                    <summary className="cursor-pointer">
                      المعرّف التقني للصورة
                    </summary>

                    <code className="block break-all">
                      {photo.id} · {photo.storageKey}
                    </code>
                  </details>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* All owners / contacts */}
      <Section
        title={`الملاك وجهات الاتصال (${property.contacts.length})`}
        icon={<UserRound size={20} />}
      >
        {property.contacts.length === 0 ? (
          <p className="text-[#748173]">
            لا توجد جهات اتصال مرتبطة.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {property.contacts.map((item) => (
              <div
                key={item.id}
                className="space-y-3 rounded-xl border border-[#e4e9df] bg-[#fbfcf9] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/contacts/${item.contact.id}`}
                    className="text-lg font-bold text-[#346747] hover:underline"
                  >
                    {item.contact.fullName}
                  </Link>

                  {item.isPrimary && (
                    <span className="rounded-full bg-[#e6f2e3] px-3 py-1 text-xs font-bold text-[#376440]">
                      جهة الاتصال الرئيسية
                    </span>
                  )}
                </div>

                <dl className="grid gap-2 sm:grid-cols-2">
                  <Info label="الصفة">
                    {nameOf(item.role)}
                  </Info>

                  <Info label="رقم الهاتف">
                    <a
                      href={`tel:${item.contact.phone}`}
                      dir="ltr"
                      className="text-[#346747] underline"
                    >
                      {item.contact.phone}
                    </a>
                  </Info>

                  <Info label="هاتف إضافي">
                    {item.contact.alternativePhone ||
                      "غير محدد"}
                  </Info>

                  <Info label="السماح بمشاركة الرقم">
                    {item.canSharePhone ? "نعم" : "لا"}
                  </Info>

                  <Info label="ملاحظات عن الشخص">
                    {item.contact.notes || "لا توجد"}
                  </Info>

                  <Info label="تاريخ الربط بالعقار">
                    {dateOf(item.createdAt)}
                  </Info>
                </dl>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-[#9a6844]">
          أرقام الملاك وملاحظاتهم معلومات داخلية؛
          لا تُستخدم في الإعلانات تلقائيًا.
        </p>
      </Section>

      {/* All sale/rental offerings */}
      <Section
        title={`عروض البيع والإيجار (${property.offerings.length})`}
        icon={<Building2 size={20} />}
      >
        {property.offerings.length === 0 ? (
          <p className="text-[#748173]">
            لا توجد عروض مسجلة.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {property.offerings.map((offer) => (
              <div
                key={offer.id}
                className="space-y-4 rounded-xl border border-[#e4e9df] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-[#29442f]">
                    {offer.transactionType === "SALE"
                      ? "عرض بيع"
                      : "عرض إيجار"}
                  </h3>

                  <span className="rounded-full bg-[#e7eee2] px-3 py-1.5 text-sm font-bold text-[#346747]">
                    {nameOf(offer.status)}
                  </span>
                </div>

                <dl className="grid gap-3 sm:grid-cols-2">
                  <Info label="سعر المالك">
                    {priceOf(
                      offer.ownerPrice,
                      offer.currency,
                    )}
                  </Info>

                  <Info label="السعر المعلن">
                    {priceOf(
                      offer.advertisedPrice,
                      offer.currency,
                    )}
                  </Info>

                  <Info label="السعر النهائي">
                    {priceOf(
                      offer.finalPrice,
                      offer.currency,
                    )}
                  </Info>

                  <Info label="العملة">
                    {offer.currency === "JOD"
                      ? "دينار أردني"
                      : offer.currency}
                  </Info>

                  <Info label="قابل للتفاوض">
                    {offer.allowNegotiation
                      ? "نعم"
                      : "لا"}
                  </Info>

                  <Info label="مدة الإيجار">
                    {offer.rentalPeriod
                      ? nameOf(offer.rentalPeriod)
                      : "لا ينطبق"}
                  </Info>

                  <Info label="تاريخ إغلاق العرض">
                    {dateOf(offer.closedAt)}
                  </Info>

                  <Info label="تاريخ إنشاء العرض">
                    {dateOf(offer.createdAt)}
                  </Info>

                  <Info label="آخر تعديل للعرض">
                    {dateOf(offer.updatedAt)}
                  </Info>

                  <Info label="الملاحظات">
                    {offer.notes || "لا توجد"}
                  </Info>
                </dl>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Parent and children */}
      <Section
        title="العقارات الرئيسية والتابعة"
        icon={<Building2 size={20} />}
      >
        {property.parentProperty ? (
          <p className="text-sm">
            العقار الرئيسي:{" "}
            <Link
              href={`/properties/${property.parentProperty.id}`}
              className="font-bold text-[#346747] underline"
            >
              {property.parentProperty.title} —{" "}
              {property.parentProperty.propertyCode}
            </Link>
          </p>
        ) : (
          <p className="text-sm text-[#748173]">
            هذا العقار ليس تابعًا لعقار رئيسي.
          </p>
        )}

        {property.childProperties.length > 0 ? (
          <ul className="list-disc space-y-2 pr-6">
            {property.childProperties.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/properties/${child.id}`}
                  className="font-semibold text-[#346747] underline"
                >
                  {child.title} — {child.propertyCode}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#748173]">
            لا توجد عقارات تابعة مسجلة.
          </p>
        )}
      </Section>

      {/* Private notes */}
      <Section title="الملاحظات الداخلية">
        <p className="min-h-16 whitespace-pre-wrap rounded-xl bg-[#f6f7f3] p-4 leading-8 text-[#334c36]">
          {property.internalNotes ||
            "لا توجد ملاحظات داخلية."}
        </p>
      </Section>

      {/* Complete event history */}
      <Section
        title={`سجل التغييرات (${property.events.length})`}
        icon={<CalendarDays size={20} />}
      >
        {property.events.length === 0 ? (
          <p className="text-[#748173]">
            لم تُسجّل أحداث بعد.
          </p>
        ) : (
          <ol className="space-y-3 border-r-2 border-[#e1e9dd] pr-5">
            {property.events.map((event) => (
              <li
                key={event.id}
                className="rounded-xl bg-[#f7f9f4] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-[#31583b]">
                    {event.title}
                  </h3>

                  <time className="text-xs text-[#748173]">
                    {dateOf(event.createdAt)}
                  </time>
                </div>

                <p className="mt-1 text-xs text-[#778577]">
                  {nameOf(event.eventType)}
                </p>

                {event.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {event.description}
                  </p>
                )}

                {(event.oldPrice != null ||
                  event.newPrice != null) && (
                    <p className="mt-2 text-sm">
                      السعر السابق:{" "}
                      {priceOf(event.oldPrice)} | السعر
                      الجديد: {priceOf(event.newPrice)}
                    </p>
                  )}
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* Internal technical information */}
      <Section
        title="المعلومات التقنية الكاملة"
        icon={<ScrollText size={20} />}
      >
        <dl className="grid gap-3 sm:grid-cols-2">
          <Info label="معرّف العقار">
            {property.id}
          </Info>

          <Info label="معرّف نوع العقار">
            {property.typeId}
          </Info>

          <Info label="معرّف المنطقة">
            {property.locationId}
          </Info>

          <Info label="معرّف العقار الرئيسي">
            {property.parentPropertyId || "لا يوجد"}
          </Info>
        </dl>

        <details className="rounded-xl border border-[#e3e9df] p-4">
          <summary className="cursor-pointer font-semibold text-[#346747]">
            عرض جميع تفاصيل JSON المحفوظة
            (للمراجعة التقنية)
          </summary>

          <pre
            dir="ltr"
            className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-[#f4f6f0] p-4 text-xs text-[#35483a]"
          >
            {JSON.stringify(property.details, null, 2)}
          </pre>
        </details>
      </Section>

      <p className="text-center text-xs text-[#849080]">
        الإعلانات والاستفسارات ستُضاف في Sprint 2.
      </p>
    </main>
  );
}

export default function PropertyDetailsPage(
  props: PageProps,
) {
  return (
    <Suspense
      fallback={
        <div
          dir="rtl"
          role="status"
          className="rounded-2xl bg-white p-10 text-center text-[#607564]"
        >
          جارٍ تحميل جميع تفاصيل العقار...
        </div>
      }
    >
      <Content {...props} />
    </Suspense>
  );
}
