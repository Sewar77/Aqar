-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PropertyContactRole" AS ENUM ('OWNER', 'CO_OWNER', 'AUTHORIZED_REPRESENTATIVE');

-- CreateEnum
CREATE TYPE "AreaUnit" AS ENUM ('SQUARE_METER', 'DUNUM', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SALE', 'RENT');

-- CreateEnum
CREATE TYPE "OfferingStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'UNDER_NEGOTIATION', 'SOLD', 'RENTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "RentalPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'OTHER');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'VISIT_SCHEDULED', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST', 'NO_RESPONSE');

-- CreateEnum
CREATE TYPE "InquiryChannel" AS ENUM ('PHONE', 'WHATSAPP', 'FACEBOOK', 'WEBSITE', 'WALK_IN', 'OTHER');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "SocialPostStatus" AS ENUM ('DRAFT', 'READY', 'PUBLISHED', 'REMOVED');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyEventType" AS ENUM ('CREATED', 'UPDATED', 'PRICE_CHANGED', 'STATUS_CHANGED', 'OFFERING_CREATED', 'OFFERING_CLOSED', 'NOTE_ADDED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_types" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type_id" UUID NOT NULL,
    "parent_property_id" UUID,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "area_value" DECIMAL(12,2),
    "area_unit" "AreaUnit",
    "area_unit_label" TEXT,
    "area_in_square_meters" DECIMAL(14,2),
    "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternative_phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_contacts" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "role" "PropertyContactRole" NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "can_share_phone" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_offerings" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "owner_price" DECIMAL(12,2) NOT NULL,
    "advertised_price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JOD',
    "rental_period" "RentalPeriod",
    "allow_negotiation" BOOLEAN NOT NULL DEFAULT true,
    "status" "OfferingStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_photos" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" UUID NOT NULL,
    "offering_id" UUID NOT NULL,
    "contact_id" UUID,
    "channel" "InquiryChannel" NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "message" TEXT,
    "notes" TEXT,
    "follow_up_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_visits" (
    "id" UUID NOT NULL,
    "offering_id" UUID NOT NULL,
    "inquiry_id" UUID,
    "contact_id" UUID,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_posts" (
    "id" UUID NOT NULL,
    "offering_id" UUID NOT NULL,
    "platform" "SocialPlatform" NOT NULL DEFAULT 'FACEBOOK',
    "status" "SocialPostStatus" NOT NULL DEFAULT 'DRAFT',
    "content" TEXT NOT NULL,
    "post_url" TEXT,
    "published_at" TIMESTAMP(3),
    "last_copied_at" TIMESTAMP(3),
    "copy_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_events" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "offering_id" UUID,
    "event_type" "PropertyEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "old_price" DECIMAL(12,2),
    "new_price" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "property_types_code_key" ON "property_types"("code");

-- CreateIndex
CREATE INDEX "properties_type_id_idx" ON "properties"("type_id");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE INDEX "properties_city_idx" ON "properties"("city");

-- CreateIndex
CREATE INDEX "properties_parent_property_id_idx" ON "properties"("parent_property_id");

-- CreateIndex
CREATE INDEX "contacts_phone_idx" ON "contacts"("phone");

-- CreateIndex
CREATE INDEX "property_contacts_contact_id_idx" ON "property_contacts"("contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "property_contacts_property_id_contact_id_role_key" ON "property_contacts"("property_id", "contact_id", "role");

-- CreateIndex
CREATE INDEX "property_offerings_property_id_idx" ON "property_offerings"("property_id");

-- CreateIndex
CREATE INDEX "property_offerings_transaction_type_status_idx" ON "property_offerings"("transaction_type", "status");

-- CreateIndex
CREATE INDEX "property_photos_property_id_sort_order_idx" ON "property_photos"("property_id", "sort_order");

-- CreateIndex
CREATE INDEX "inquiries_offering_id_idx" ON "inquiries"("offering_id");

-- CreateIndex
CREATE INDEX "inquiries_contact_id_idx" ON "inquiries"("contact_id");

-- CreateIndex
CREATE INDEX "inquiries_status_follow_up_at_idx" ON "inquiries"("status", "follow_up_at");

-- CreateIndex
CREATE INDEX "property_visits_offering_id_idx" ON "property_visits"("offering_id");

-- CreateIndex
CREATE INDEX "property_visits_inquiry_id_idx" ON "property_visits"("inquiry_id");

-- CreateIndex
CREATE INDEX "property_visits_contact_id_idx" ON "property_visits"("contact_id");

-- CreateIndex
CREATE INDEX "property_visits_scheduled_at_status_idx" ON "property_visits"("scheduled_at", "status");

-- CreateIndex
CREATE INDEX "social_posts_offering_id_idx" ON "social_posts"("offering_id");

-- CreateIndex
CREATE INDEX "social_posts_status_idx" ON "social_posts"("status");

-- CreateIndex
CREATE INDEX "social_posts_platform_status_idx" ON "social_posts"("platform", "status");

-- CreateIndex
CREATE INDEX "property_events_property_id_created_at_idx" ON "property_events"("property_id", "created_at");

-- CreateIndex
CREATE INDEX "property_events_offering_id_created_at_idx" ON "property_events"("offering_id", "created_at");

-- CreateIndex
CREATE INDEX "property_events_event_type_idx" ON "property_events"("event_type");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "property_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_parent_property_id_fkey" FOREIGN KEY ("parent_property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_contacts" ADD CONSTRAINT "property_contacts_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_contacts" ADD CONSTRAINT "property_contacts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_offerings" ADD CONSTRAINT "property_offerings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_photos" ADD CONSTRAINT "property_photos_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "property_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_visits" ADD CONSTRAINT "property_visits_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "property_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_visits" ADD CONSTRAINT "property_visits_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_visits" ADD CONSTRAINT "property_visits_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "property_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_events" ADD CONSTRAINT "property_events_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_events" ADD CONSTRAINT "property_events_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "property_offerings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
