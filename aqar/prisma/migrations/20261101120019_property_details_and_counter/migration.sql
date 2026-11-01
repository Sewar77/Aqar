-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "details" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "property_code_counters" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "property_code_counters_pkey" PRIMARY KEY ("id")
);
