# AqarDesk — Database Architecture & Design Decisions

**Document:** Database Design — Initial Draft  
**Version:** 0.2  
**Status:** Proposed — Pending Business Validation  
**Last updated:** October 30, 2026

**Stack:** Next.js, TypeScript, PostgreSQL, Prisma

---

## 1. Design Objectives

The database must support the real estate broker's daily workflow:

1. Register properties received from owners.
2. Maintain reusable owner and client contacts.
3. Support multiple property types.
4. Support selling and renting, including both simultaneously for one property.
5. Manage property photographs.
6. Generate and preserve advertisements.
7. Track interested clients.
8. Schedule property visits.
9. Maintain important business history.
10. Support efficient searching and filtering.

The database should remain relational, maintainable, and flexible.

## 2. Confirmed Architectural Decisions

| Decision                  | Selected approach             |
| ------------------------- | ----------------------------- |
| Database                  | PostgreSQL                    |
| ORM                       | Prisma                        |
| Primary keys              | UUID                          |
| Property types            | Predefined + custom           |
| Transaction types         | Sale + rental simultaneously  |
| Price management          | Current price + event history |
| Visits                    | Simple appointment management |
| Contacts                  | Reusable contacts             |
| Variable property details | JSONB                         |
| Images                    | Cloudinary                    |
| Migrations                | Prisma Migrate                |

## 3. Important Design Principles

### 3.1 Properties and Offerings Are Different Entities

A property represents a physical asset.

An offering represents the commercial opportunity associated with that property.

A property can have:

- One sale offering.
- One rental offering.
- Both simultaneously.

Each offering has its own:

- Transaction type.
- Asking price.
- Currency.
- Negotiability.
- Availability status.
- Advertisements.
- Inquiries.

This prevents duplicate property records.

### 3.2 Availability Belongs to Offerings

A physical property may be available for rent but sold as a transaction.

Therefore, availability must be maintained independently for each offering.

The `properties` table should not contain `availability_status`.

### 3.3 Reusable Contacts

A contact can be:

- An owner.
- A co-owner.
- An authorized representative.
- An interested client.

The relationship is defined by the relevant relationship or inquiry record.

### 3.4 Preserve History

Important changes should be recorded through property events.

Previous prices should remain available even when the current asking price changes.

### 3.5 Flexible Property Details

Common fields should use regular columns.

Less common property-specific fields should use validated JSONB.

---

## 4. Proposed Database Entities

The revised design contains:

1. users
2. property_types
3. contacts
4. properties
5. property_offerings
6. property_contacts
7. property_photos
8. social_posts
9. inquiries
10. property_visits
11. inquiry_activities
12. property_events

## 5. Table Design

### 5.1 users

Application administrators and brokers.

| Column        | Type      | Constraints      |
| ------------- | --------- | ---------------- |
| id            | UUID      | PK               |
| full_name     | VARCHAR   | NOT NULL         |
| email         | VARCHAR   | UNIQUE, NOT NULL |
| password_hash | VARCHAR   | NOT NULL         |
| created_at    | TIMESTAMP | NOT NULL         |
| updated_at    | TIMESTAMP | NOT NULL         |

### 5.2 property_types

Stores predefined and custom property types.

| Column     | Type      | Constraints      |
| ---------- | --------- | ---------------- |
| id         | UUID      | PK               |
| name_ar    | VARCHAR   | NOT NULL         |
| name_en    | VARCHAR   | NULL             |
| slug       | VARCHAR   | UNIQUE, NOT NULL |
| is_system  | BOOLEAN   | DEFAULT FALSE    |
| is_active  | BOOLEAN   | DEFAULT TRUE     |
| sort_order | INTEGER   | DEFAULT 0        |
| created_at | TIMESTAMP | NOT NULL         |

Initial types:

- LAND
- HOUSE
- APARTMENT
- BUILDING
- COMMERCIAL
- FARM
- OTHER

Custom types can be added without changing the database schema.

### 5.3 contacts

Stores reusable people.

| Column            | Type      | Constraints |
| ----------------- | --------- | ----------- |
| id                | UUID      | PK          |
| full_name         | VARCHAR   | NOT NULL    |
| phone             | VARCHAR   | NOT NULL    |
| alternative_phone | VARCHAR   | NULL        |
| email             | VARCHAR   | NULL        |
| notes             | TEXT      | NULL        |
| created_at        | TIMESTAMP | NOT NULL    |
| updated_at        | TIMESTAMP | NOT NULL    |

Phone numbers are strings.

Do not assume that every contact has a unique phone number.

### 5.4 properties

Represents the physical property.

| Column           | Type      | Constraints      |
| ---------------- | --------- | ---------------- |
| id               | UUID      | PK               |
| property_code    | VARCHAR   | UNIQUE, NOT NULL |
| property_type_id | UUID      | FK               |
| title            | VARCHAR   | NULL             |
| description      | TEXT      | NULL             |
| governorate      | VARCHAR   | NULL             |
| district         | VARCHAR   | NULL             |
| area_name        | VARCHAR   | NULL             |
| basin_name       | VARCHAR   | NULL             |
| basin_number     | VARCHAR   | NULL             |
| parcel_number    | VARCHAR   | NULL             |
| address_details  | TEXT      | NULL             |
| map_url          | TEXT      | NULL             |
| area_value       | DECIMAL   | NULL             |
| area_unit        | VARCHAR   | NULL             |
| area_m2          | DECIMAL   | NULL             |
| details          | JSONB     | NULL             |
| internal_notes   | TEXT      | NULL             |
| record_status    | ENUM      | DEFAULT DRAFT    |
| created_by       | UUID      | FK               |
| created_at       | TIMESTAMP | NOT NULL         |
| updated_at       | TIMESTAMP | NOT NULL         |
| archived_at      | TIMESTAMP | NULL             |

Record statuses:

- DRAFT
- ACTIVE
- ARCHIVED

The table does not contain transaction type, asking price, or availability status. These belong to `property_offerings`.

### 5.5 property_offerings

Represents an individual sale or rental opportunity.

This is a central addition to version 0.2.

| Column           | Type      | Constraints       |
| ---------------- | --------- | ----------------- |
| id               | UUID      | PK                |
| property_id      | UUID      | FK                |
| transaction_type | ENUM      | NOT NULL          |
| asking_price     | DECIMAL   | NULL              |
| currency         | VARCHAR   | DEFAULT JOD       |
| rental_period    | ENUM      | NULL              |
| is_negotiable    | BOOLEAN   | DEFAULT FALSE     |
| status           | ENUM      | DEFAULT AVAILABLE |
| created_at       | TIMESTAMP | NOT NULL          |
| updated_at       | TIMESTAMP | NOT NULL          |

Transaction types:

- SALE
- RENT

Rental periods (proposed):

- DAILY
- WEEKLY
- MONTHLY
- YEARLY
- OTHER

Offering statuses:

- AVAILABLE
- RESERVED
- UNDER_NEGOTIATION
- SOLD
- RENTED
- WITHDRAWN

Rules:

- A property may have a SALE offering and a RENT offering simultaneously.
- A property should not have duplicate active offerings of the same transaction type.
- A sale offering cannot use RENTED as its final status.
- A rental offering cannot use SOLD as its final status.
- Each offering has its own current asking price.
- Price changes are recorded in property events.

The exact rental periods and status transitions require final validation.

### 5.6 property_contacts

Connects contacts to properties.

| Column          | Type      | Constraints   |
| --------------- | --------- | ------------- |
| id              | UUID      | PK            |
| property_id     | UUID      | FK            |
| contact_id      | UUID      | FK            |
| relationship    | ENUM      | NOT NULL      |
| is_primary      | BOOLEAN   | DEFAULT FALSE |
| can_share_phone | BOOLEAN   | DEFAULT FALSE |
| created_at      | TIMESTAMP | NOT NULL      |

Relationships:

- OWNER
- CO_OWNER
- AUTHORIZED_REPRESENTATIVE

One property can have multiple associated contacts.

One contact can be associated with multiple properties.

### 5.7 property_photos

| Column      | Type      | Constraints   |
| ----------- | --------- | ------------- |
| id          | UUID      | PK            |
| property_id | UUID      | FK            |
| storage_key | VARCHAR   | NOT NULL      |
| file_name   | VARCHAR   | NULL          |
| sort_order  | INTEGER   | DEFAULT 0     |
| is_primary  | BOOLEAN   | DEFAULT FALSE |
| created_at  | TIMESTAMP | NOT NULL      |

Images are stored in Cloudinary. The database stores references and metadata.

### 5.8 social_posts

Advertisements are associated with a specific offering rather than just the physical property.

| Column               | Type      | Constraints   |
| -------------------- | --------- | ------------- |
| id                   | UUID      | PK            |
| property_offering_id | UUID      | FK            |
| platform             | VARCHAR   | NOT NULL      |
| content              | TEXT      | NOT NULL      |
| template_type        | VARCHAR   | NULL          |
| status               | ENUM      | DEFAULT DRAFT |
| last_copied_at       | TIMESTAMP | NULL          |
| copy_count           | INTEGER   | DEFAULT 0     |
| published_at         | TIMESTAMP | NULL          |
| post_url             | TEXT      | NULL          |
| created_at           | TIMESTAMP | NOT NULL      |
| updated_at           | TIMESTAMP | NOT NULL      |

Statuses:

- DRAFT
- READY
- PUBLISHED
- REMOVED

Rules:

- Copying does not mean publishing.
- Publication requires explicit confirmation.
- Published content must be preserved.
- Editing a published advertisement creates a new version or a separate advertisement record.
- An advertisement must never automatically include private owner information.

### 5.9 inquiries

Represents a client's interest in a specific offering.

| Column               | Type      | Constraints |
| -------------------- | --------- | ----------- |
| id                   | UUID      | PK          |
| property_offering_id | UUID      | FK          |
| contact_id           | UUID      | FK, NULL    |
| channel              | VARCHAR   | NULL        |
| status               | ENUM      | DEFAULT NEW |
| message              | TEXT      | NULL        |
| notes                | TEXT      | NULL        |
| follow_up_at         | TIMESTAMP | NULL        |
| created_at           | TIMESTAMP | NOT NULL    |
| updated_at           | TIMESTAMP | NOT NULL    |

Statuses:

- NEW
- CONTACTED
- VISIT_SCHEDULED
- NEGOTIATING
- CLOSED_WON
- CLOSED_LOST
- NO_RESPONSE

The same contact may inquire about multiple offerings.

An inquiry may initially have no identified contact.

### 5.10 property_visits

Stores simple property appointments.

| Column       | Type      | Constraints       |
| ------------ | --------- | ----------------- |
| id           | UUID      | PK                |
| inquiry_id   | UUID      | FK                |
| scheduled_at | TIMESTAMP | NOT NULL          |
| status       | ENUM      | DEFAULT SCHEDULED |
| notes        | TEXT      | NULL              |
| created_by   | UUID      | FK                |
| created_at   | TIMESTAMP | NOT NULL          |
| updated_at   | TIMESTAMP | NOT NULL          |

Statuses:

- SCHEDULED
- COMPLETED
- CANCELLED
- NO_SHOW

The property and interested client are obtained through the inquiry relationship.

The owner is obtained through the property's contact relationships.

The broker arranging the visit is represented by `created_by`.

This model avoids storing duplicate property and contact information.

### 5.11 inquiry_activities

Maintains communication history.

| Column         | Type      | Constraints |
| -------------- | --------- | ----------- |
| id             | UUID      | PK          |
| inquiry_id     | UUID      | FK          |
| user_id        | UUID      | FK          |
| activity_type  | VARCHAR   | NOT NULL    |
| notes          | TEXT      | NULL        |
| next_follow_up | TIMESTAMP | NULL        |
| created_at     | TIMESTAMP | NOT NULL    |

Examples:

- Called client.
- Sent photos.
- Discussed price.
- Arranged property visit.
- Scheduled follow-up.

### 5.12 property_events

Records important changes.

| Column               | Type      | Constraints |
| -------------------- | --------- | ----------- |
| id                   | UUID      | PK          |
| property_id          | UUID      | FK          |
| property_offering_id | UUID      | FK, NULL    |
| user_id              | UUID      | FK          |
| event_type           | VARCHAR   | NOT NULL    |
| old_value            | JSONB     | NULL        |
| new_value            | JSONB     | NULL        |
| notes                | TEXT      | NULL        |
| created_at           | TIMESTAMP | NOT NULL    |

Examples:

- PROPERTY_CREATED
- PRICE_CHANGED
- OFFERING_CREATED
- OFFERING_STATUS_CHANGED
- PROPERTY_ARCHIVED

When a price changes, the event should reference the relevant offering and preserve the previous and new prices.

---

## 6. Relationship Overview

- One property type has many properties.
- One property has many offerings.
- One property has many associated contacts.
- One contact has many property relationships.
- One property has many photos.
- One offering has many advertisements.
- One offering has many inquiries.
- One contact has many inquiries.
- One inquiry has many visits.
- One inquiry has many activities.
- One property has many events.
- One offering may have many associated events.

## 7. Constraints and Indexes

Important constraints:

- Unique property code.
- Unique property type slug.
- Unique property and transaction-type combination for active offerings.
- Valid offering status for its transaction type.
- Nonnegative prices.
- Positive areas.
- Positive advertisement copy count.
- Only one primary photo per property.
- Only one primary owner relationship per property where appropriate.
- Valid foreign keys.

Recommended indexes:

- properties.property_code
- properties.property_type_id
- properties.record_status
- properties.area_name
- properties.created_at
- property_offerings.property_id
- property_offerings.transaction_type
- property_offerings.status
- property_offerings.asking_price
- contacts.phone
- contacts.full_name
- social_posts.property_offering_id
- inquiries.property_offering_id
- inquiries.contact_id
- inquiries.status
- inquiries.follow_up_at
- property_visits.scheduled_at

## 8. Security

- Secure authentication and authorization.
- Password hashing.
- HTTP-only secure cookies.
- Backend validation.
- Protected private information.
- No owner phone numbers in advertisements by default.
- Restricted image uploads.
- Database backups.
- Tested restoration procedure.
- Preserve historical records.

## 9. Remaining Questions

The following still require business validation:

1. Rental-specific fields.
2. Whether rental prices are always monthly or can use other periods.
3. Exact fields for every property type.
4. Local location hierarchy.
5. Whether previous owners and ownership changes need historical tracking.
6. Whether one contact can share a phone number with another contact.
7. Whether multiple advertisements can be published simultaneously.
8. Whether final transaction prices and commissions should be stored.
9. Whether visit rescheduling needs a history.
10. Whether an offering should be automatically withdrawn when its property is archived.

## 10. Current Status

Version 0.2 establishes the main database architecture.

The most important change is the introduction of `property_offerings`, separating the physical property from its sale and rental opportunities.

This is still a logical database design, not a finalized Prisma schema.

Next steps:

1. Review real notebook records.
2. Finalize property fields.
3. Validate rental requirements.
4. Finalize ERD.
5. Prepare Prisma schema.
6. Review migration and database constraints.
7. Define implementation acceptance criteria.

**Implementation remains on hold until the design is approved.**
