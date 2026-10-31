import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adminPasswordHash = process.env.SEED_ADMIN_PASSWORD_HASH;

if (!adminPasswordHash) {
  throw new Error(
    "SEED_ADMIN_PASSWORD_HASH is required. Provide a valid password hash generated with your application's password hashing library.",
  );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const id = (number: number) =>
  `a2000000-0000-4000-8000-${String(number).padStart(12, "0")}`;

const propertyId = (number: number) =>
  `a1000000-0000-4000-8000-${String(number).padStart(12, "0")}`;

const propertyTypes = [
  { code: "LAND", nameAr: "أرض", nameEn: "Land" },
  { code: "HOUSE", nameAr: "بيت", nameEn: "House" },
  { code: "APARTMENT", nameAr: "شقة", nameEn: "Apartment" },
  { code: "SHOP", nameAr: "محل تجاري", nameEn: "Shop" },
  { code: "BUILDING", nameAr: "عمارة", nameEn: "Building" },
];

const governorates = [
  { nameAr: "عمّان", nameEn: "Amman" },
  { nameAr: "إربد", nameEn: "Irbid" },
  { nameAr: "الزرقاء", nameEn: "Zarqa" },
  { nameAr: "البلقاء", nameEn: "Balqa" },
  { nameAr: "المفرق", nameEn: "Mafraq" },
  { nameAr: "جرش", nameEn: "Jerash" },
  { nameAr: "عجلون", nameEn: "Ajloun" },
  { nameAr: "مادبا", nameEn: "Madaba" },
  { nameAr: "الكرك", nameEn: "Karak" },
  { nameAr: "الطفيلة", nameEn: "Tafilah" },
  { nameAr: "معان", nameEn: "Ma'an" },
  { nameAr: "العقبة", nameEn: "Aqaba" },
];

const citiesByGovernorate: Record<string, string[]> = {
  عمّان: ["عمّان", "سحاب", "ناعور", "الجبيهة", "وادي السير"],
  إربد: [
    "إربد",
    "الحصن",
    "الرمثا",
    "المزار الشمالي",
    "زوبيا",
    "عنبة",
    "ارحابا",
    "بني عبيد",
    "الطيبة",
    "كفر يوبا",
  ],
  الزرقاء: ["الزرقاء", "الرصيفة", "الهاشمية", "الأزرق"],
  البلقاء: ["السلط", "الفحيص", "ماحص", "عين الباشا"],
  المفرق: ["المفرق", "الرويشد", "رحاب"],
  جرش: ["جرش", "سوف", "ساكب"],
  عجلون: ["عجلون", "كفرنجة", "عنجره"],
  مادبا: ["مادبا", "ذيبان"],
  الكرك: ["الكرك", "المزار الجنوبي", "مؤتة"],
  الطفيلة: ["الطفيلة", "بصيرا"],
  معان: ["معان", "الشوبك", "البتراء"],
  العقبة: ["العقبة", "القويرة", "الديسة"],
};

const date = (value: string) => new Date(value);

async function seedLocations() {
  for (const governorate of governorates) {
    const savedGovernorate = await prisma.governorate.upsert({
      where: { nameAr: governorate.nameAr },
      update: {
        nameEn: governorate.nameEn,
        isActive: true,
      },
      create: {
        ...governorate,
        isActive: true,
      },
    });

    const cityNames = citiesByGovernorate[governorate.nameAr] ?? [];

    for (const nameAr of cityNames) {
      await prisma.city.upsert({
        where: {
          governorateId_nameAr: {
            governorateId: savedGovernorate.id,
            nameAr,
          },
        },
        update: { isActive: true },
        create: {
          nameAr,
          governorateId: savedGovernorate.id,
          isActive: true,
        },
      });
    }
  }

  console.log("Locations seeded.");
}

async function seedPropertyTypes() {
  for (const type of propertyTypes) {
    await prisma.propertyType.upsert({
      where: { code: type.code },
      update: {
        nameAr: type.nameAr,
        nameEn: type.nameEn,
        isActive: true,
      },
      create: {
        ...type,
        isActive: true,
      },
    });
  }

  console.log("Property types seeded.");
}

async function seedUsers() {
  await prisma.user.upsert({
    where: { email: "admin@aqardesk.local" },
    update: {
      fullName: "مدير النظام",
      role: "ADMIN",
      isActive: true,
      passwordHash: adminPasswordHash!,
    },
    create: {
      fullName: "مدير النظام",
      email: "admin@aqardesk.local",
      passwordHash: adminPasswordHash!,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("Development admin seeded.");
}

async function seedContacts() {
  const contacts = [
    {
      id: id(101),
      fullName: "محمد أحمد العزام",
      phone: "0799000101",
      alternativePhone: "0789000101",
      email: "mohammad@example.test",
      notes: "مالك عدة عقارات في إربد.",
    },
    {
      id: id(102),
      fullName: "أحمد خالد بني ياسين",
      phone: "0799000102",
      alternativePhone: null,
      email: "ahmad@example.test",
      notes: "يفضل التواصل عبر واتساب.",
    },
    {
      id: id(103),
      fullName: "سارة محمود الشرايري",
      phone: "0799000103",
      alternativePhone: "0789000103",
      email: "sara@example.test",
      notes: "مهتمة بشراء شقة سكنية.",
    },
    {
      id: id(104),
      fullName: "خالد يوسف التل",
      phone: "0799000104",
      alternativePhone: null,
      email: null,
      notes: "مالك محل تجاري.",
    },
    {
      id: id(105),
      fullName: "ليث عمر عبيدات",
      phone: "0799000105",
      alternativePhone: null,
      email: "laith@example.test",
      notes: "مستثمر مهتم بالأراضي.",
    },
    {
      id: id(106),
      fullName: "نور فواز البطاينة",
      phone: "0799000106",
      alternativePhone: "0789000106",
      email: "noor@example.test",
      notes: "تبحث عن شقة للإيجار.",
    },
    {
      id: id(107),
      fullName: "عمر إبراهيم الخصاونة",
      phone: "0799000107",
      alternativePhone: null,
      email: null,
      notes: "ممثل مفوض عن أحد الملاك.",
    },
    {
      id: id(108),
      fullName: "رنا سمير الزعبي",
      phone: "0799000108",
      alternativePhone: null,
      email: "rana@example.test",
      notes: "مهتمة باستئجار محل تجاري.",
    },
  ];

  for (const contact of contacts) {
    await prisma.contact.upsert({
      where: { id: contact.id },
      update: {
        fullName: contact.fullName,
        phone: contact.phone,
        alternativePhone: contact.alternativePhone,
        email: contact.email,
        notes: contact.notes,
      },
      create: contact,
    });
  }

  console.log("Contacts seeded.");
}

async function seedProperties() {
  const irbid = await prisma.governorate.findUniqueOrThrow({
    where: { nameAr: "إربد" },
  });

  const city = async (nameAr: string) =>
    prisma.city.findUniqueOrThrow({
      where: {
        governorateId_nameAr: {
          governorateId: irbid.id,
          nameAr,
        },
      },
    });

  const type = async (code: string) =>
    prisma.propertyType.findUniqueOrThrow({
      where: { code },
    });

  const samples = [
    {
      number: 1,
      city: "إربد",
      type: "APARTMENT",
      title: "شقة للبيع في إربد - الحي الشرقي",
      description: "شقة سكنية مناسبة للعائلات، بتشطيب جيد.",
      address: "إربد، الحي الشرقي",
      area: 150,
      transaction: "SALE" as const,
      ownerPrice: 65000,
      advertisedPrice: 70000,
      status: "ACTIVE" as const,
    },
    {
      number: 2,
      city: "إربد",
      type: "LAND",
      title: "أرض سكنية للبيع في إربد",
      description: "أرض سكنية بموقع مناسب.",
      address: "إربد، قرب شارع الجامعة",
      area: 500,
      transaction: "SALE" as const,
      ownerPrice: 45000,
      advertisedPrice: 48000,
      status: "ACTIVE" as const,
    },
    {
      number: 3,
      city: "إربد",
      type: "SHOP",
      title: "محل تجاري للإيجار",
      description: "محل تجاري على شارع حيوي.",
      address: "إربد، وسط البلد",
      area: 60,
      transaction: "RENT" as const,
      ownerPrice: 250,
      advertisedPrice: 280,
      status: "ACTIVE" as const,
    },
    {
      number: 4,
      city: "المزار الشمالي",
      type: "LAND",
      title: "قطعة أرض للبيع في المزار الشمالي",
      description: "أرض مناسبة للبناء.",
      address: "المزار الشمالي",
      area: 1000,
      transaction: "SALE" as const,
      ownerPrice: 22000,
      advertisedPrice: 25000,
      status: "ACTIVE" as const,
    },
    {
      number: 5,
      city: "المزار الشمالي",
      type: "HOUSE",
      title: "منزل مستقل للبيع في المزار الشمالي",
      description: "منزل مستقل مع مساحة خارجية.",
      address: "المزار الشمالي، المنطقة السكنية",
      area: 180,
      transaction: "SALE" as const,
      ownerPrice: 55000,
      advertisedPrice: 58000,
      status: "ACTIVE" as const,
    },
    {
      number: 6,
      city: "المزار الشمالي",
      type: "APARTMENT",
      title: "شقة للإيجار في المزار الشمالي",
      description: "شقة سكنية مناسبة لعائلة صغيرة.",
      address: "المزار الشمالي",
      area: 120,
      transaction: "RENT" as const,
      ownerPrice: 150,
      advertisedPrice: 170,
      status: "ACTIVE" as const,
    },
    {
      number: 7,
      city: "الحصن",
      type: "HOUSE",
      title: "منزل للبيع في الحصن",
      description: "منزل عائلي بموقع هادئ.",
      address: "الحصن",
      area: 200,
      transaction: "SALE" as const,
      ownerPrice: 70000,
      advertisedPrice: 75000,
      status: "ACTIVE" as const,
    },
    {
      number: 8,
      city: "الرمثا",
      type: "APARTMENT",
      title: "شقة للبيع في الرمثا",
      description: "شقة بتقسيم عملي.",
      address: "الرمثا",
      area: 135,
      transaction: "SALE" as const,
      ownerPrice: 40000,
      advertisedPrice: 43000,
      status: "ACTIVE" as const,
    },
    {
      number: 9,
      city: "الرمثا",
      type: "BUILDING",
      title: "عمارة سكنية للبيع في الرمثا",
      description: "عمارة سكنية مناسبة للاستثمار.",
      address: "الرمثا، منطقة سكنية",
      area: 400,
      transaction: "SALE" as const,
      ownerPrice: 150000,
      advertisedPrice: 165000,
      status: "ACTIVE" as const,
    },
    {
      number: 10,
      city: "إربد",
      type: "APARTMENT",
      title: "شقة عائلية واسعة للبيع في إربد",
      description: "شقة واسعة مع إضاءة طبيعية وموقف سيارة.",
      address: "إربد، شارع البتراء",
      area: 175,
      transaction: "SALE" as const,
      ownerPrice: 72000,
      advertisedPrice: 76000,
      status: "ACTIVE" as const,
    },
    {
      number: 11,
      city: "الحصن",
      type: "LAND",
      title: "أرض زراعية في الحصن",
      description: "أرض مناسبة للاستثمار الزراعي.",
      address: "الحصن، المنطقة الزراعية",
      area: 2,
      transaction: "SALE" as const,
      ownerPrice: 30000,
      advertisedPrice: 33000,
      status: "ACTIVE" as const,
      areaUnit: "DUNUM" as const,
      areaUnitLabel: "دونم",
      areaInSquareMeters: 2000,
    },
    {
      number: 12,
      city: "الرمثا",
      type: "BUILDING",
      title: "عمارة سكنية متعددة الوحدات",
      description: "عمارة تحتوي على وحدات سكنية مستقلة.",
      address: "الرمثا، منطقة سكنية",
      area: 500,
      transaction: "SALE" as const,
      ownerPrice: 180000,
      advertisedPrice: 195000,
      status: "ACTIVE" as const,
    },
  ];

  for (const sample of samples) {
    const selectedCity = await city(sample.city);
    const selectedType = await type(sample.type);

    const areaUnit = "areaUnit" in sample ? sample.areaUnit : "SQUARE_METER";
    const areaUnitLabel =
      "areaUnitLabel" in sample ? sample.areaUnitLabel : "متر مربع";
    const areaInSquareMeters =
      "areaInSquareMeters" in sample ? sample.areaInSquareMeters : sample.area;

    await prisma.property.upsert({
      where: { id: propertyId(sample.number) },
      update: {
        title: sample.title,
        description: sample.description,
        address: sample.address,
        cityId: selectedCity.id,
        typeId: selectedType.id,
        areaValue: sample.area,
        areaUnit,
        areaUnitLabel,
        areaInSquareMeters,
        status: sample.status,
      },
      create: {
        id: propertyId(sample.number),
        title: sample.title,
        description: sample.description,
        address: sample.address,
        cityId: selectedCity.id,
        typeId: selectedType.id,
        areaValue: sample.area,
        areaUnit,
        areaUnitLabel,
        areaInSquareMeters,
        status: sample.status,
      },
    });

    await prisma.propertyOffering.upsert({
      where: { id: id(200 + sample.number) },
      update: {
        transactionType: sample.transaction,
        ownerPrice: sample.ownerPrice,
        advertisedPrice: sample.advertisedPrice,
        currency: "JOD",
        rentalPeriod: sample.transaction === "RENT" ? "MONTHLY" : null,
        allowNegotiation: true,
        status: "AVAILABLE",
      },
      create: {
        id: id(200 + sample.number),
        propertyId: propertyId(sample.number),
        transactionType: sample.transaction,
        ownerPrice: sample.ownerPrice,
        advertisedPrice: sample.advertisedPrice,
        currency: "JOD",
        rentalPeriod: sample.transaction === "RENT" ? "MONTHLY" : null,
        allowNegotiation: true,
        status: "AVAILABLE",
      },
    });
  }

  // Building units: properties 13 and 14 belong to building 12.
  const ramtha = await city("الرمثا");
  const apartmentType = await type("APARTMENT");

  for (const unit of [
    {
      number: 13,
      title: "شقة الطابق الأول - العمارة السكنية",
      area: 140,
      address: "الرمثا، العمارة السكنية، الطابق الأول",
    },
    {
      number: 14,
      title: "شقة الطابق الثاني - العمارة السكنية",
      area: 145,
      address: "الرمثا، العمارة السكنية، الطابق الثاني",
    },
  ]) {
    await prisma.property.upsert({
      where: { id: propertyId(unit.number) },
      update: {
        title: unit.title,
        address: unit.address,
        cityId: ramtha.id,
        typeId: apartmentType.id,
        parentPropertyId: propertyId(12),
        areaValue: unit.area,
        areaUnit: "SQUARE_METER",
        areaUnitLabel: "متر مربع",
        areaInSquareMeters: unit.area,
        status: "ACTIVE",
      },
      create: {
        id: propertyId(unit.number),
        title: unit.title,
        address: unit.address,
        cityId: ramtha.id,
        typeId: apartmentType.id,
        parentPropertyId: propertyId(12),
        areaValue: unit.area,
        areaUnit: "SQUARE_METER",
        areaUnitLabel: "متر مربع",
        areaInSquareMeters: unit.area,
        status: "ACTIVE",
      },
    });

    await prisma.propertyOffering.upsert({
      where: { id: id(200 + unit.number) },
      update: {
        transactionType: "RENT",
        ownerPrice: 220,
        advertisedPrice: 250,
        currency: "JOD",
        rentalPeriod: "MONTHLY",
        status: "AVAILABLE",
      },
      create: {
        id: id(200 + unit.number),
        propertyId: propertyId(unit.number),
        transactionType: "RENT",
        ownerPrice: 220,
        advertisedPrice: 250,
        currency: "JOD",
        rentalPeriod: "MONTHLY",
        status: "AVAILABLE",
      },
    });
  }

  console.log("Properties and offerings seeded.");
}

async function seedPropertyContacts() {
  const relations = [
    {
      property: 1,
      contact: 101,
      role: "OWNER" as const,
      primary: true,
      share: true,
    },
    {
      property: 1,
      contact: 102,
      role: "AUTHORIZED_REPRESENTATIVE" as const,
      primary: false,
      share: true,
    },
    {
      property: 2,
      contact: 105,
      role: "OWNER" as const,
      primary: true,
      share: true,
    },
    {
      property: 3,
      contact: 104,
      role: "OWNER" as const,
      primary: true,
      share: true,
    },
    {
      property: 4,
      contact: 105,
      role: "OWNER" as const,
      primary: true,
      share: true,
    },
    {
      property: 5,
      contact: 101,
      role: "OWNER" as const,
      primary: true,
      share: true,
    },
    {
      property: 5,
      contact: 107,
      role: "AUTHORIZED_REPRESENTATIVE" as const,
      primary: false,
      share: false,
    },
    {
      property: 6,
      contact: 102,
      role: "OWNER" as const,
      primary: true,
      share: true,
    },
    {
      property: 7,
      contact: 104,
      role: "OWNER" as const,
      primary: true,
      share: true,
    },
    {
      property: 8,
      contact: 103,
      role: "OWNER" as const,
      primary: true,
      share: true,
    },
    {
      property: 9,
      contact: 105,
      role: "OWNER" as const,
      primary: true,
      share: true,
    },
    {
      property: 9,
      contact: 101,
      role: "CO_OWNER" as const,
      primary: false,
      share: true,
    },
    {
      property: 10,
      contact: 103,
      role: "OWNER" as const,
      primary: true,
      share: true,
    },
    {
      property: 11,
      contact: 105,
      role: "OWNER" as const,
      primary: true,
      share: true,
    },
    {
      property: 12,
      contact: 101,
      role: "OWNER" as const,
      primary: true,
      share: true,
    },
    {
      property: 13,
      contact: 101,
      role: "OWNER" as const,
      primary: true,
      share: true,
    },
    {
      property: 14,
      contact: 101,
      role: "OWNER" as const,
      primary: true,
      share: true,
    },
  ];

  for (const relation of relations) {
    await prisma.propertyContact.upsert({
      where: {
        propertyId_contactId_role: {
          propertyId: propertyId(relation.property),
          contactId: id(relation.contact),
          role: relation.role,
        },
      },
      update: {
        isPrimary: relation.primary,
        canSharePhone: relation.share,
      },
      create: {
        propertyId: propertyId(relation.property),
        contactId: id(relation.contact),
        role: relation.role,
        isPrimary: relation.primary,
        canSharePhone: relation.share,
      },
    });
  }

  console.log("Property contacts seeded.");
}

async function seedPhotos() {
  const photos = [
    { number: 1, property: 1, file: "apartment-irbid-1.jpg", primary: true },
    { number: 2, property: 1, file: "apartment-irbid-2.jpg", primary: false },
    { number: 3, property: 2, file: "land-irbid-1.jpg", primary: true },
    { number: 4, property: 3, file: "shop-irbid-1.jpg", primary: true },
    { number: 5, property: 4, file: "land-mazar-1.jpg", primary: true },
    { number: 6, property: 5, file: "house-mazar-1.jpg", primary: true },
    { number: 7, property: 9, file: "building-ramtha-1.jpg", primary: true },
    { number: 8, property: 9, file: "building-ramtha-2.jpg", primary: false },
    { number: 9, property: 12, file: "building-units-1.jpg", primary: true },
  ];

  for (const photo of photos) {
    await prisma.propertyPhoto.upsert({
      where: { id: id(300 + photo.number) },
      update: {
        fileName: photo.file,
        sortOrder: photo.number,
        isPrimary: photo.primary,
      },
      create: {
        id: id(300 + photo.number),
        propertyId: propertyId(photo.property),
        storageKey: `development/properties/${photo.file}`,
        fileName: photo.file,
        mimeType: "image/jpeg",
        sizeBytes: 250000 + photo.number * 10000,
        sortOrder: photo.number,
        isPrimary: photo.primary,
      },
    });
  }

  console.log("Property photo metadata seeded.");
}

async function seedInquiries() {
  const inquiries = [
    {
      number: 1,
      offering: 201,
      contact: 103,
      channel: "WHATSAPP" as const,
      status: "VISIT_SCHEDULED" as const,
      message: "هل الشقة ما زالت متاحة؟ وهل يوجد مجال للتفاوض؟",
      notes: "تم التواصل مع العميل وتحديد موعد للزيارة.",
      followUpAt: date("2026-11-02T10:00:00.000Z"),
    },
    {
      number: 2,
      offering: 202,
      contact: 106,
      channel: "PHONE" as const,
      status: "CONTACTED" as const,
      message: "أرغب بمعرفة تفاصيل الأرض.",
      notes: "تم إرسال الموقع والمساحة.",
      followUpAt: date("2026-11-04T10:00:00.000Z"),
    },
    {
      number: 3,
      offering: 203,
      contact: 108,
      channel: "FACEBOOK" as const,
      status: "NEGOTIATING" as const,
      message: "هل يمكن استئجار المحل لمدة سنة؟",
      notes: "العميل مهتم بعقد سنوي.",
      followUpAt: date("2026-11-05T10:00:00.000Z"),
    },
    {
      number: 4,
      offering: 204,
      contact: 102,
      channel: "WEBSITE" as const,
      status: "NEW" as const,
      message: "أرغب بمعرفة تفاصيل قطعة الأرض.",
      notes: null,
      followUpAt: null,
    },
    {
      number: 5,
      offering: 206,
      contact: 106,
      channel: "WALK_IN" as const,
      status: "CONTACTED" as const,
      message: "أبحث عن شقة للإيجار.",
      notes: "تم شرح تفاصيل العقار.",
      followUpAt: date("2026-11-06T10:00:00.000Z"),
    },
    {
      number: 6,
      offering: 209,
      contact: 103,
      channel: "PHONE" as const,
      status: "CLOSED_LOST" as const,
      message: "هل العمارة متاحة؟",
      notes: "العميل اعتذر عن إكمال الإجراءات.",
      followUpAt: null,
    },
  ];

  for (const inquiry of inquiries) {
    await prisma.inquiry.upsert({
      where: { id: id(400 + inquiry.number) },
      update: {
        channel: inquiry.channel,
        status: inquiry.status,
        message: inquiry.message,
        notes: inquiry.notes,
        followUpAt: inquiry.followUpAt,
      },
      create: {
        id: id(400 + inquiry.number),
        offeringId: id(inquiry.offering),
        contactId: id(inquiry.contact),
        channel: inquiry.channel,
        status: inquiry.status,
        message: inquiry.message,
        notes: inquiry.notes,
        followUpAt: inquiry.followUpAt,
      },
    });
  }

  console.log("Inquiries seeded.");
}

async function seedVisits() {
  const visits = [
    {
      number: 1,
      offering: 201,
      inquiry: 401,
      contact: 103,
      scheduledAt: "2026-11-02T10:00:00.000Z",
      status: "SCHEDULED" as const,
      notes: "زيارة لمعاينة الشقة.",
    },
    {
      number: 2,
      offering: 202,
      inquiry: 402,
      contact: 106,
      scheduledAt: "2026-10-25T11:00:00.000Z",
      status: "COMPLETED" as const,
      notes: "تمت معاينة الأرض والعميل طلب مهلة للتفكير.",
    },
    {
      number: 3,
      offering: 203,
      inquiry: 403,
      contact: 108,
      scheduledAt: "2026-11-03T12:00:00.000Z",
      status: "SCHEDULED" as const,
      notes: "معاينة المحل التجاري.",
    },
    {
      number: 4,
      offering: 206,
      inquiry: 405,
      contact: 106,
      scheduledAt: "2026-10-20T09:00:00.000Z",
      status: "COMPLETED" as const,
      notes: "العميلة أعجبت بالشقة.",
    },
    {
      number: 5,
      offering: 209,
      inquiry: 406,
      contact: 103,
      scheduledAt: "2026-10-18T14:00:00.000Z",
      status: "CANCELLED" as const,
      notes: "تم إلغاء الموعد بناء على طلب العميل.",
    },
  ];

  for (const visit of visits) {
    await prisma.propertyVisit.upsert({
      where: { id: id(500 + visit.number) },
      update: {
        scheduledAt: date(visit.scheduledAt),
        status: visit.status,
        notes: visit.notes,
      },
      create: {
        id: id(500 + visit.number),
        offeringId: id(visit.offering),
        inquiryId: id(400 + visit.inquiry - 400),
        contactId: id(visit.contact),
        scheduledAt: date(visit.scheduledAt),
        status: visit.status,
        notes: visit.notes,
      },
    });
  }

  console.log("Property visits seeded.");
}

async function seedSocialPosts() {
  const posts = [
    {
      number: 1,
      offering: 201,
      platform: "FACEBOOK" as const,
      status: "PUBLISHED" as const,
      content:
        "شقة مميزة للبيع في إربد، بمساحة 150 متر مربع وتشطيب جيد. للاستفسار والتواصل معنا.",
      postUrl: "https://www.facebook.com/",
      publishedAt: date("2026-10-20T10:00:00.000Z"),
      copyCount: 4,
    },
    {
      number: 2,
      offering: 202,
      platform: "INSTAGRAM" as const,
      status: "READY" as const,
      content:
        "فرصة لامتلاك أرض سكنية في إربد بموقع مناسب ومساحة 500 متر مربع.",
      postUrl: null,
      publishedAt: null,
      copyCount: 2,
    },
    {
      number: 3,
      offering: 203,
      platform: "FACEBOOK" as const,
      status: "DRAFT" as const,
      content: "محل تجاري للإيجار في وسط إربد، مناسب لمختلف الأنشطة التجارية.",
      postUrl: null,
      publishedAt: null,
      copyCount: 0,
    },
    {
      number: 4,
      offering: 204,
      platform: "INSTAGRAM" as const,
      status: "PUBLISHED" as const,
      content: "قطعة أرض للبيع في المزار الشمالي، مساحة 1000 متر مربع.",
      postUrl: "https://www.instagram.com/",
      publishedAt: date("2026-10-22T10:00:00.000Z"),
      copyCount: 3,
    },
    {
      number: 5,
      offering: 209,
      platform: "FACEBOOK" as const,
      status: "REMOVED" as const,
      content: "عمارة سكنية للبيع في الرمثا.",
      postUrl: null,
      publishedAt: null,
      copyCount: 1,
    },
  ];

  for (const post of posts) {
    await prisma.socialPost.upsert({
      where: { id: id(600 + post.number) },
      update: {
        platform: post.platform,
        status: post.status,
        content: post.content,
        postUrl: post.postUrl,
        publishedAt: post.publishedAt,
        copyCount: post.copyCount,
      },
      create: {
        id: id(600 + post.number),
        offeringId: id(post.offering),
        platform: post.platform,
        status: post.status,
        content: post.content,
        postUrl: post.postUrl,
        publishedAt: post.publishedAt,
        lastCopiedAt:
          post.copyCount > 0 ? date("2026-10-25T10:00:00.000Z") : null,
        copyCount: post.copyCount,
      },
    });
  }

  console.log("Social posts seeded.");
}

async function seedPropertyEvents() {
  const events = [
    {
      number: 1,
      property: 1,
      offering: 201,
      eventType: "CREATED" as const,
      title: "إضافة العقار",
      description: "تمت إضافة الشقة إلى النظام.",
      oldPrice: null,
      newPrice: null,
      createdAt: "2026-10-15T09:00:00.000Z",
    },
    {
      number: 2,
      property: 1,
      offering: 201,
      eventType: "OFFERING_CREATED" as const,
      title: "إضافة عرض بيع",
      description: "تم تسجيل عرض بيع جديد للعقار.",
      oldPrice: null,
      newPrice: 70000,
      createdAt: "2026-10-15T09:10:00.000Z",
    },
    {
      number: 3,
      property: 1,
      offering: 201,
      eventType: "PRICE_CHANGED" as const,
      title: "تعديل السعر المعلن",
      description: "تم تخفيض السعر المعلن بعد التواصل مع المالك.",
      oldPrice: 75000,
      newPrice: 70000,
      createdAt: "2026-10-20T11:00:00.000Z",
    },
    {
      number: 4,
      property: 2,
      offering: 202,
      eventType: "CREATED" as const,
      title: "إضافة أرض جديدة",
      description: "تمت إضافة الأرض إلى قائمة العقارات.",
      oldPrice: null,
      newPrice: null,
      createdAt: "2026-10-16T09:00:00.000Z",
    },
    {
      number: 5,
      property: 3,
      offering: 203,
      eventType: "NOTE_ADDED" as const,
      title: "إضافة ملاحظة",
      description: "المالك يفضل مستأجراً بعقد سنوي.",
      oldPrice: null,
      newPrice: null,
      createdAt: "2026-10-18T09:00:00.000Z",
    },
    {
      number: 6,
      property: 4,
      offering: 204,
      eventType: "CREATED" as const,
      title: "إضافة قطعة أرض",
      description: "تم تسجيل قطعة الأرض في المزار الشمالي.",
      oldPrice: null,
      newPrice: null,
      createdAt: "2026-10-19T09:00:00.000Z",
    },
    {
      number: 7,
      property: 9,
      offering: 209,
      eventType: "STATUS_CHANGED" as const,
      title: "تحديث حالة العرض",
      description: "تم تحديث حالة العرض بعد انتهاء الإعلان.",
      oldPrice: null,
      newPrice: null,
      createdAt: "2026-10-24T09:00:00.000Z",
    },
  ];

  for (const event of events) {
    await prisma.propertyEvent.upsert({
      where: { id: id(700 + event.number) },
      update: {
        eventType: event.eventType,
        title: event.title,
        description: event.description,
        oldPrice: event.oldPrice,
        newPrice: event.newPrice,
        createdAt: date(event.createdAt),
      },
      create: {
        id: id(700 + event.number),
        propertyId: propertyId(event.property),
        offeringId: event.offering ? id(event.offering) : null,
        eventType: event.eventType,
        title: event.title,
        description: event.description,
        oldPrice: event.oldPrice,
        newPrice: event.newPrice,
        createdAt: date(event.createdAt),
      },
    });
  }

  console.log("Property events seeded.");
}

async function main() {
  console.log("Starting AqarDesk development seed...");

  await seedLocations();
  await seedPropertyTypes();
  await seedUsers();
  await seedContacts();
  await seedProperties();
  await seedPropertyContacts();
  await seedPhotos();
  await seedInquiries();
  await seedVisits();
  await seedSocialPosts();
  await seedPropertyEvents();

  console.log("AqarDesk development seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
