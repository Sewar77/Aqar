# AqarDesk — Database Architecture & Design Decisions

**Document:** Database Design — Initial Draft  
**Version:** 0.1  
**Status:** Proposed — Pending Business Validation  
**Database:** PostgreSQL  
**ORM:** Prisma  
**Application:** Next.js + TypeScript  
**Primary language:** Arabic  
**Date:** October 30, 2026

---

## 1. Database Design Objectives

The database should support the actual daily workflow of a real estate broker.

The primary objectives are:

1. Store property information in an organized structure.
2. Store owners and interested clients as reusable contacts.
3. Support multiple property types and custom property types.
4. Support both selling and renting.
5. Maintain advertisement history.
6. Track interested clients and their inquiries.
7. Schedule and manage property visits.
8. Preserve important business history.
9. Support efficient searching and filtering.
10. Protect private owner and client information.

The database should be relational, maintainable, and flexible enough to support future requirements without unnecessary complexity.

## 2. Technology Decisions

| Component              | Decision                                        |
| ---------------------- | ----------------------------------------------- |
| Database               | PostgreSQL                                      |
| ORM                    | Prisma                                          |
| Backend                | Next.js Server-side services and Route Handlers |
| Language               | TypeScript                                      |
| Primary keys           | UUID                                            |
| Flexible property data | JSONB                                           |
| Image storage          | Cloudinary                                      |
| Database migrations    | Prisma Migrate                                  |

## 3. Core Design Principles

### 3.1 Reusable Contacts

A person should exist only once in the contacts table.

The same person might:

- Own several properties.
- Represent another property owner.
- Inquire about multiple properties.
- Be involved in different transactions.

Their relationship with a property should be represented through relationship tables rather than duplicated contact records.

### 3.2 Separate Business Entities

Properties, contacts, advertisements, inquiries, and visits should be separate entities.

For example, an advertisement is not the property itself. A property can have multiple advertisements over time.

Likewise, an inquiry is not a contact. A contact can submit multiple inquiries.

### 3.3 Preserve History

Important changes must be recorded.

Examples:

- Price changed.
- Property sold.
- Property reserved.
- Advertisement published.
- Advertisement removed.
- Inquiry status changed.

### 3.4 Flexible Property Information

Common property fields should use regular PostgreSQL columns.

Less common property-type-specific fields can use JSONB, with backend validation according to the selected property type.

### 3.5 Optional Information

Property registration must support incomplete information.

Optional information should use nullable columns instead of artificial default values.

---

## 4. Proposed Database Entities

The initial design contains these entities:

1. users
2. property_types
3. contacts
4. properties
5. property_contacts
6. property_photos
7. social_posts
8. inquiries
9. property_visits
10. inquiry_activities
11. property_events

### Entity responsibilities

| Entity             | Responsibility                                                  |
| ------------------ | --------------------------------------------------------------- |
| users              | Application administrators and brokers                          |
| property_types     | System and custom property types                                |
| contacts           | Owners, representatives, and interested clients                 |
| properties         | Main property information                                       |
| property_contacts  | Connect contacts with properties and define their relationships |
| property_photos    | Store property image references                                 |
| social_posts       | Advertisement versions and publishing history                   |
| inquiries          | Interested clients and their inquiries                          |
| property_visits    | Scheduled and completed property visits                         |
| inquiry_activities | Communication and follow-up history                             |
| property_events    | Important property changes                                      |

---

## 5. Table Design

### 5.1 users

Stores application users.

Initial application: one administrator.

| Column        | Type      | Constraints      |
| ------------- | --------- | ---------------- |
| id            | UUID      | PK               |
| full_name     | VARCHAR   | NOT NULL         |
| email         | VARCHAR   | UNIQUE, NOT NULL |
| password_hash | VARCHAR   | NOT NULL         |
| created_at    | TIMESTAMP | NOT NULL         |
| updated_at    | TIMESTAMP | NOT NULL         |

Future support for multiple employees is possible.

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

Initial system types:

- LAND
- HOUSE
- APARTMENT
- BUILDING
- COMMERCIAL
- FARM
- OTHER

Custom types can be added without modifying the database schema.

### 5.3 contacts

Stores reusable people and their contact information.

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

Phone numbers must be strings, not numeric values.

The same contact may be an owner in one relationship and an interested client in another.

### 5.4 properties

The main entity of the application.

| Column              | Type      | Constraints       |
| ------------------- | --------- | ----------------- |
| id                  | UUID      | PK                |
| property_code       | VARCHAR   | UNIQUE, NOT NULL  |
| property_type_id    | UUID      | FK                |
| transaction_type    | ENUM      | NOT NULL          |
| title               | VARCHAR   | NULL              |
| description         | TEXT      | NULL              |
| governorate         | VARCHAR   | NULL              |
| district            | VARCHAR   | NULL              |
| area_name           | VARCHAR   | NULL              |
| basin_name          | VARCHAR   | NULL              |
| basin_number        | VARCHAR   | NULL              |
| parcel_number       | VARCHAR   | NULL              |
| address_details     | TEXT      | NULL              |
| map_url             | TEXT      | NULL              |
| area_value          | DECIMAL   | NULL              |
| area_unit           | VARCHAR   | NULL              |
| area_m2             | DECIMAL   | NULL              |
| asking_price        | DECIMAL   | NULL              |
| currency            | VARCHAR   | DEFAULT JOD       |
| is_negotiable       | BOOLEAN   | DEFAULT FALSE     |
| details             | JSONB     | NULL              |
| internal_notes      | TEXT      | NULL              |
| record_status       | ENUM      | DEFAULT DRAFT     |
| availability_status | ENUM      | DEFAULT AVAILABLE |
| created_by          | UUID      | FK                |
| created_at          | TIMESTAMP | NOT NULL          |
| updated_at          | TIMESTAMP | NOT NULL          |
| archived_at         | TIMESTAMP | NULL              |

Proposed transaction types:

- SALE
- RENT

Proposed record statuses:

- DRAFT
- ACTIVE
- ARCHIVED

Proposed availability statuses:

- AVAILABLE
- RESERVED
- UNDER_NEGOTIATION
- SOLD
- RENTED
- WITHDRAWN

Rental-specific information and additional pricing rules remain subject to confirmation.

### 5.5 property_contacts

Connects properties to their associated contacts.

This is a many-to-many relationship.

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

A property may have multiple owners.

A contact may own multiple properties.

The primary contact should be identifiable for normal business operations.

### 5.6 property_photos

Stores references to property images.

| Column      | Type      | Constraints   |
| ----------- | --------- | ------------- |
| id          | UUID      | PK            |
| property_id | UUID      | FK            |
| storage_key | VARCHAR   | NOT NULL      |
| file_name   | VARCHAR   | NULL          |
| sort_order  | INTEGER   | DEFAULT 0     |
| is_primary  | BOOLEAN   | DEFAULT FALSE |
| created_at  | TIMESTAMP | NOT NULL      |

Images are uploaded to Cloudinary.

The database stores image identifiers and metadata, not image binaries.

### 5.7 social_posts

Stores advertisements independently from properties.

| Column         | Type      | Constraints   |
| -------------- | --------- | ------------- |
| id             | UUID      | PK            |
| property_id    | UUID      | FK            |
| platform       | VARCHAR   | NOT NULL      |
| content        | TEXT      | NOT NULL      |
| template_type  | VARCHAR   | NULL          |
| status         | ENUM      | DEFAULT DRAFT |
| last_copied_at | TIMESTAMP | NULL          |
| copy_count     | INTEGER   | DEFAULT 0     |
| published_at   | TIMESTAMP | NULL          |
| post_url       | TEXT      | NULL          |
| created_at     | TIMESTAMP | NOT NULL      |
| updated_at     | TIMESTAMP | NOT NULL      |

Statuses:

- DRAFT
- READY
- PUBLISHED
- REMOVED

Important rules:

- Copying content does not mean publishing.
- Publication requires explicit confirmation.
- Published content must remain unchanged as a historical record.
- Editing an existing advertisement should create a new version rather than overwrite published content.

### 5.8 inquiries

Represents an interested person's inquiry about a property.

| Column       | Type      | Constraints |
| ------------ | --------- | ----------- |
| id           | UUID      | PK          |
| property_id  | UUID      | FK          |
| contact_id   | UUID      | FK, NULL    |
| channel      | VARCHAR   | NULL        |
| status       | ENUM      | DEFAULT NEW |
| message      | TEXT      | NULL        |
| notes        | TEXT      | NULL        |
| follow_up_at | TIMESTAMP | NULL        |
| created_at   | TIMESTAMP | NOT NULL    |
| updated_at   | TIMESTAMP | NOT NULL    |

Statuses:

- NEW
- CONTACTED
- VISIT_SCHEDULED
- NEGOTIATING
- CLOSED_WON
- CLOSED_LOST
- NO_RESPONSE

The same contact can have inquiries about multiple properties.

An inquiry can initially exist without a known contact identity.

### 5.9 property_visits

Dedicated entity for property visits.

| Column           | Type      | Constraints       |
| ---------------- | --------- | ----------------- |
| id               | UUID      | PK                |
| property_id      | UUID      | FK                |
| inquiry_id       | UUID      | FK, NULL          |
| scheduled_at     | TIMESTAMP | NOT NULL          |
| meeting_location | TEXT      | NULL              |
| status           | ENUM      | DEFAULT SCHEDULED |
| notes            | TEXT      | NULL              |
| created_by       | UUID      | FK                |
| created_at       | TIMESTAMP | NOT NULL          |
| updated_at       | TIMESTAMP | NOT NULL          |

Statuses:

- SCHEDULED
- COMPLETED
- CANCELLED
- NO_SHOW

The visit is associated with a property and optionally an inquiry.

The broker arranging the visit is represented by `created_by`.

The property owner is determined through the property's contact relationships.

The interested client is determined through the linked inquiry.

This avoids unnecessarily duplicating owner and client information.

If future discovery shows that different participants need independent attendance tracking, we can introduce a `property_visit_participants` junction table.

### 5.10 inquiry_activities

Maintains communication history for inquiries.

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

- Called the interested client.
- Sent additional photos.
- Discussed the price.
- Arranged a visit.
- Follow-up scheduled.

### 5.11 property_events

Maintains important property history.

| Column      | Type      | Constraints |
| ----------- | --------- | ----------- |
| id          | UUID      | PK          |
| property_id | UUID      | FK          |
| user_id     | UUID      | FK          |
| event_type  | VARCHAR   | NOT NULL    |
| old_value   | JSONB     | NULL        |
| new_value   | JSONB     | NULL        |
| notes       | TEXT      | NULL        |
| created_at  | TIMESTAMP | NOT NULL    |

Examples:

- PROPERTY_CREATED
- PRICE_CHANGED
- AVAILABILITY_CHANGED
- PROPERTY_SOLD
- PROPERTY_RENTED
- PROPERTY_ARCHIVED

These events should be generated by backend business services, not manually supplied by the client.

---

## 6. Entity Relationships

Proposed relationships:

- One property type has many properties.
- One property has many property-contact relationships.
- One contact has many property-contact relationships.
- One property has many photos.
- One property has many advertisements.
- One property has many inquiries.
- One contact has many inquiries.
- One property has many visits.
- One inquiry can have many visits.
- One inquiry has many activities.
- One property has many historical events.
- One user can create many properties, visits, activities, and events.

## 7. Important Constraints and Indexes

Proposed constraints:

- Unique property code.
- Unique property type slug.
- Foreign keys for all relationships.
- Nonnegative asking price.
- Positive area value when provided.
- Positive copy count.
- Only one primary photo per property.
- Only one primary owner/contact per property where applicable.
- Valid transaction and availability combinations.
- Valid advertisement publication timestamps.

Recommended indexes:

- properties.property_code
- properties.property_type_id
- properties.transaction_type
- properties.record_status
- properties.availability_status
- properties.area_name
- properties.asking_price
- properties.created_at
- contacts.phone
- contacts.full_name
- inquiries.property_id
- inquiries.contact_id
- inquiries.status
- inquiries.follow_up_at
- property_visits.scheduled_at
- social_posts.property_id

Indexes should be refined according to actual search patterns.

## 8. Important Security Rules

1. Never expose owner contact information in public advertisement output automatically.
2. Keep internal notes separate from advertisement content.
3. Validate all input on the backend.
4. Protect all application routes and APIs.
5. Use secure server-managed authentication.
6. Use database transactions for operations affecting multiple related records.
7. Never allow a property update to erase historical advertisements.
8. Do not hard-delete important business records casually.
9. Restrict image upload types and sizes.
10. Maintain backups and test database restoration.

## 9. Decisions Still Pending

The following decisions must be validated before finalizing the Prisma schema:

- Rental-specific fields and rental payment periods.
- Exact property information for every property type.
- Whether a property can have multiple transaction arrangements simultaneously.
- Whether an owner can be replaced while preserving the previous relationship history.
- Whether visits need attendance records.
- Whether appointments can be rescheduled and how rescheduling history is preserved.
- Whether properties can have multiple published advertisements simultaneously.
- Whether final sale prices and rental agreements should be recorded.
- Whether brokerage commissions need to be tracked.
- Exact location hierarchy used in northern Jordan.
- Whether contact phone numbers should be unique or allow shared family numbers.

## 10. Current Design Status

This is a preliminary logical database design.

It establishes the major entities and relationships but is not yet the final Prisma schema.

The next step is to validate the actual property records and business rules, then produce:

1. Final ERD.
2. Final field definitions and data types.
3. Prisma schema.
4. Migration plan.
5. Database acceptance criteria.

**No implementation or migrations should be started until the design has been reviewed and approved.**
