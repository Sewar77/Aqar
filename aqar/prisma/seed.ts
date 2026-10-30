import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const propertyTypes = [
  { code: "LAND", nameAr: "أرض", nameEn: "Land" },
  { code: "HOUSE", nameAr: "بيت", nameEn: "House" },
  { code: "APARTMENT", nameAr: "شقة", nameEn: "Apartment" },
  { code: "SHOP", nameAr: "محل تجاري", nameEn: "Shop" },
  { code: "BUILDING", nameAr: "عمارة", nameEn: "Building" },
];

const cities = [
  "إربد",
  "الحصن",
  "الرمثا",
  "المزار الشمالي",
  "زوبيا",
  "عنبة",
  "ارحابا",
];

async function main() {
  // 1. Seed property types
  for (const type of propertyTypes) {
    await prisma.propertyType.upsert({
      where: { code: type.code },
      update: {
        nameAr: type.nameAr,
        nameEn: type.nameEn,
      },
      create: type,
    });
  }

  // 2. Create Irbid Governorate
  const irbid = await prisma.governorate.upsert({
    where: { nameAr: "إربد" },
    update: {
      nameEn: "Irbid",
      isActive: true,
    },
    create: {
      nameAr: "إربد",
      nameEn: "Irbid",
    },
  });

  // 3. Seed cities under Irbid Governorate
  for (const cityName of cities) {
    await prisma.city.upsert({
      where: {
        governorateId_nameAr: {
          governorateId: irbid.id,
          nameAr: cityName,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        nameAr: cityName,
        governorateId: irbid.id,
      },
    });
  }

  console.log("Seed completed successfully.");
  console.log(`Property types: ${propertyTypes.length}`);
  console.log(`Governorate: ${irbid.nameAr}`);
  console.log(`Cities: ${cities.length}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
