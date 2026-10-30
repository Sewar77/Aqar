/*
  Warnings:

  - You are about to drop the column `city` on the `properties` table. All the data in the column will be lost.
  - Added the required column `city_id` to the `properties` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "properties_city_idx";

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "city",
ADD COLUMN     "city_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "governorates" (
    "id" UUID NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "governorates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" UUID NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT,
    "governorate_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "governorates_name_ar_key" ON "governorates"("name_ar");

-- CreateIndex
CREATE INDEX "cities_governorate_id_idx" ON "cities"("governorate_id");

-- CreateIndex
CREATE UNIQUE INDEX "cities_governorate_id_name_ar_key" ON "cities"("governorate_id", "name_ar");

-- CreateIndex
CREATE INDEX "properties_city_id_idx" ON "properties"("city_id");

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_governorate_id_fkey" FOREIGN KEY ("governorate_id") REFERENCES "governorates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
