import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const propertyTypes = [
  { code: "LAND", nameAr: "أرض", nameEn: "Land" },
  { code: "HOUSE", nameAr: "منزل", nameEn: "House" },
  { code: "APARTMENT", nameAr: "شقة", nameEn: "Apartment" },
  { code: "BUILDING", nameAr: "عمارة", nameEn: "Building" },
  { code: "COMMERCIAL", nameAr: "عقار تجاري", nameEn: "Commercial" },
  { code: "FARM", nameAr: "مزرعة", nameEn: "Farm" },
  { code: "OTHER", nameAr: "أخرى", nameEn: "Other" },
];

async function main() {
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

  console.log("Property types seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
