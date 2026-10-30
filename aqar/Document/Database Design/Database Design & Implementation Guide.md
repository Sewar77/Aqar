AqarDesk --- Database Design & Implementation Guide
Document status: Working design --- approved business decisions,
pending schema/code review
Product: AqarDesk
Database: PostgreSQL 17
ORM: Prisma 7
Application: Next.js App Router + TypeScript
Sprint: Sprint 1 --- Property Management MVP
Last updated: 30 October 2026

1. Purpose of this document
   This document explains the database design for AqarDesk: the business
   concepts represented in the database, the purpose of each model,
   relationships, important design decisions, validation rules, and the
   migration workflow.

It is intended to be the reference document before implementing or
changing the Prisma schema.

Important: This is the agreed domain design, not a claim that the
current schema.prisma already matches it. Before creating a migration,
compare this document with the actual schema, review the generated SQL,
and resolve any differences. 2. Product context
AqarDesk is an Arabic-first, RTL property-management application used
internally by a real-estate broker in northern Jordan. The first user is
the broker (Admin). The application is primarily used on a mobile phone,
with occasional laptop use.

The system initially manages: - Properties such as land, houses,
apartments, shops, and buildings. - Property owners, co-owners, and
authorized representatives. - Sale and rental offerings and their
prices. - Property photos and, in later iterations, other documents and
media. - Future workflows such as customer requirements, inquiries,
visits, and advertisement preparation.

Sprint 1 focuses on registering, viewing, and editing properties,
associating contacts, and uploading property photos. 3. Approved business decisions
The following decisions were confirmed:

1. Buildings and units: Both independent properties and
   parent-child relationships must be supported. An apartment or shop
   may be registered independently, or linked to a building.
2. Multiple offerings: One property may have multiple offerings,
   including sale and rental offerings at the same time.
3. Area measurements: Preserve the original numeric value and unit.
   Also store a normalized square-meter value when conversion is valid.
4. Media and documents: Files should be associated with the entity
   they belong to. Sprint 1 implements property photos; broader
   document ownership must be designed with proper foreign keys when
   those workflows are added.
5. Property types: Use a PropertyType lookup table rather than a
   Prisma enum, allowing type records and labels to evolve without
   changing an enum for every adjustment.
6. Pricing: Store the owner's requested price separately from the
   advertised price. These are not interchangeable.
7. Core domain model
   4.1 PropertyType
   Purpose: Defines the type/category of a property.

Suggested fields: - id: primary key. - code: stable unique
identifier, e.g. LAND, APARTMENT, BUILDING. - nameAr: Arabic
display name. - nameEn: English display name (optional if bilingual
labels are not needed yet). - isActive: whether the type can be
selected for new records. - createdAt, updatedAt.

Why a lookup table: - Display labels can change without changing
application logic. - Types can be enabled or disabled. - Seed data can
populate the initial supported types. - A stable code can be used in
application logic while the label is displayed in Arabic.

Initial suggested codes: LAND, HOUSE, APARTMENT, SHOP,
BUILDING. Confirm whether any additional type such as
COMMERCIAL_PROPERTY is needed before seeding.
4.2 Property
Purpose: Represents the physical property, independently of whether
it is currently offered for sale or rent.

Suggested fields: - id: primary key. - typeId: foreign key to
PropertyType. - parentPropertyId: nullable self-referencing foreign
key to another Property. - title: internal title or short
identifying label. - description: optional general description. -
city: city/town. - location: general location/area description. -
latitude, longitude: optional map coordinates. - areaValue:
original numeric area value. - areaUnit: original unit,
e.g. SQUARE_METER, DUNUM, OTHER. - areaUnitLabel: optional
original/custom unit label when areaUnit = OTHER. -
areaInSquareMeters: normalized area, nullable if conversion is unknown
or invalid. - status: lifecycle status such as DRAFT, ACTIVE,
ARCHIVED. - createdAt, updatedAt.
Parent-child property relationship
Property has an optional self-relation: - A building may be the parent
property. - Apartments or shops inside it may be child properties. - An
independent apartment has parentPropertyId = null. - A child property
can have at most one direct parent in this initial design.

Do not infer that every apartment must belong to a building. The
relationship is optional.

Business rule to validate later: prevent a property from being its own
parent and prevent circular parent-child chains. A normal foreign key
does not prevent cycles; enforce this in application logic or a database
constraint/trigger if the use case requires it.
4.3 Contact
Purpose: Represents a person once, regardless of how many properties
they are connected to.

Suggested fields: - id: primary key. - fullName: person's name. -
phone: primary phone number. - alternativePhone: optional second
phone number. - email: optional. - notes: optional internal notes. -
createdAt, updatedAt.

A contact must not be duplicated simply because the same person owns
multiple properties. Reuse the same contact record and create additional
relationship records.

Do not assume phone number alone is always a safe unique identifier.
Phone numbers can be shared, changed, or entered in different formats.
Normalize phone numbers and decide on duplicate detection at the
application level.
4.4 PropertyContact
Purpose: Connects a Contact to a Property and describes that
person's role for that particular property.

Suggested fields: - id: primary key, or a composite key if
appropriate. - propertyId: foreign key to Property. - contactId:
foreign key to Contact. - role: OWNER, CO_OWNER, or
AUTHORIZED_REPRESENTATIVE. - isPrimary: whether this is the primary
contact for this property. - canSharePhone: whether the contact's
phone may be shared with interested customers, if this business rule is
retained. - createdAt, updatedAt.

Relationship: - One property can have many property-contact records. -
One contact can have many property-contact records. - This join model
implements the many-to-many relationship.

Recommended integrity rule: prevent duplicate links for the same
(propertyId, contactId) pair with a unique constraint.

The role belongs on the relationship, not on Contact, because the
same person can be an owner for one property and an authorized
representative for another.
4.5 PropertyOffering
Purpose: Represents a specific commercial opportunity to sell or
rent a physical property.

Suggested fields: - id: primary key. - propertyId: foreign key to
Property. - transactionType: SALE or RENT. - ownerPrice: price
requested by the owner. - advertisedPrice: price presented to
prospective customers. - currency: default JOD. - rentalPeriod:
relevant only for rental offerings, e.g. monthly or yearly. -
allowNegotiation: whether negotiation is allowed. - status:
e.g. AVAILABLE, RESERVED, UNDER_NEGOTIATION, SOLD, RENTED,
WITHDRAWN. - createdAt, updatedAt.

A property can have multiple offerings. For example, the same apartment
may have one sale offering and one rental offering.

Important rules: - Never treat ownerPrice and advertisedPrice as the
same field. - Do not expose internal owner pricing automatically in
public advertisements. - rentalPeriod should be required for rental
offerings and absent for sale offerings; validate this in application
logic and, if needed, with a database check constraint. - Do not add a
unique constraint that allows only one offering per property unless the
business later explicitly requires it. - The business must decide
whether multiple simultaneous offerings of the same transaction type are
allowed. The current decision only confirms multiple offerings in
general.
4.6 PropertyMedia (Sprint 1 scope: property photos)
Purpose: Stores metadata for a file stored outside PostgreSQL.

Suggested fields: - id: primary key. - propertyId: foreign key to
Property for Sprint 1 property photos. - storageKey: storage
provider key/path; do not store the binary file in PostgreSQL. -
fileName: original or display filename. - mediaType: e.g. IMAGE,
VIDEO, DOCUMENT. - mimeType: optional content type. - sizeBytes:
optional file size. - isPrimary: whether this is the primary property
image. - sortOrder: display order. - createdAt, updatedAt.

The actual file is stored in external object storage (for example,
Cloudinary or another selected provider). PostgreSQL stores the file
reference and metadata.

Sprint 1 only needs property photos. Do not implement a generic
polymorphic ownerType + ownerId relation without database-enforced
foreign keys. When owner documents or offering documents are
implemented, choose either: - separate relation models with real foreign
keys, or - a deliberately designed asset/attachment model with explicit
supported relations.
4.7 Future models (not required to complete Sprint 1)

- PropertyEvent: audit/history records, including important changes
  and price changes.
- CustomerRequirement: a customer's general property search
  criteria; separate from an inquiry about a specific offering.
- Inquiry: a customer's inquiry about a particular offering.
- PropertyVisit: scheduled visits associated with an offering and
  optionally an inquiry/contact.
- SocialPost: prepared or published advertisement content associated
  with an offering.
- PropertyType-specific detail models: land, apartment/house, shop,
  and building specifications, after requirements are validated with
  the broker.
  Do not add all future models simply because they are listed here. Add
  them when their sprint and requirements are ready.

5. Relationship summary
   Parent / source Relationship Child / target Meaning
   PropertyType 1-to-many Property One type
   classifies many
   properties

Property self 1-to-many Property One building may
contain multiple
units

Property 1-to-many PropertyContact A property can
have multiple
related people

Contact 1-to-many PropertyContact A person can be
linked to
multiple
properties

Property 1-to-many PropertyOffering A property can
have multiple
offers
Property 1-to-many PropertyMedia A property can
have multiple
photos/media
records
The Property--`Contact` relationship is many-to-many through
PropertyContact. 6. Data types and constraints
Recommended PostgreSQL/Prisma choices: - IDs: UUIDs
(String @id @default(uuid()) in Prisma, depending on the project's
established convention). - Prices: Decimal, not floating-point
numbers. - Areas: Decimal, not floating-point numbers. - Coordinates:
Decimal or Float based on required precision and query needs. -
Timestamps: DateTime with a consistent timezone strategy; store
timestamps in UTC and display in the user's local timezone. - Optional
information: nullable fields rather than fake empty strings. - Foreign
keys: use Prisma relations with explicit fields and references. -
Index foreign keys and fields used frequently for filtering, such as
typeId, city, status, propertyId, and contactId.

Validation should happen at two levels: 1. Application boundary using
Zod (or the project's established validation library). 2. Database
constraints for rules that must remain true regardless of which
application writes to the database.

Examples: - Area must be greater than zero when supplied. - Prices must
not be negative. - A property cannot be its own parent. - A
contact-property pair should not be duplicated. - Only one primary
property photo should exist per property, if that is the chosen rule.

For rules such as "only one primary photo per property", consider a
PostgreSQL partial unique index. Prisma's schema may not express every
database-specific constraint directly; use a reviewed custom SQL
migration when necessary. 7. Area conversion
Preserve both the original input and normalized value: - areaValue:
number entered by the user. - areaUnit: controlled unit code. -
areaUnitLabel: optional custom unit label. - areaInSquareMeters:
normalized value if conversion is known.

For Jordanian dunum, use the confirmed conversion: -
1 dunum = 1,000 square meters.

Do not assume every custom unit can be converted. If conversion is
unknown, retain the original value and unit and leave the normalized
value null. 8. Pricing and currency
Store owner-requested price and advertised price separately on each
offering.

Use a fixed-precision decimal type, such as Decimal(12,2), after
confirming the expected maximum price and precision.

Currency should be explicit, with JOD as the initial default. Do not
calculate commission implicitly as advertisedPrice - ownerPrice; the
difference may be negotiation margin and is not necessarily the broker's
agreed commission.

Price history is a future requirement. When implemented, record old and
new values, the offering, timestamp, and actor/source. Updating a price
should not silently erase the previous value. 9. Security and privacy

- Never commit .env or database credentials.
- Do not paste passwords or connection strings into chat, source
  control, screenshots, or documentation.
- Keep owner-requested prices and internal notes private.
- Public advertisement content must use an explicit allowlist of
  fields; never serialize the full property/offering/contact record
  into a public response.
- Do not expose owner phone numbers unless the broker has chosen to
  share them.
- Validate uploaded file type and size on the server; do not trust the
  filename or browser-supplied MIME type alone.
- Store secrets in environment variables and rotate any credential
  that has been exposed.

10. Prisma 7 and migration workflow
    This project uses Prisma 7. Keep its existing configuration conventions.
    In the current setup, the database URL is configured through
    prisma7.config.ts, while the datasource in schema.prisma declares
    the provider.

Typical commands:

# Format the Prisma schema

npx prisma format

# Validate schema and configuration

npx prisma validate

# Generate the Prisma Client

npx prisma generate

# Create and apply a development migration

npx prisma migrate dev --name init

# Check migration status

npx prisma migrate status

# Apply existing migrations in production

npx prisma migrate deploy
Important distinctions: - prisma generate generates the client; it
does not create database tables. - prisma migrate dev creates a
migration and applies it to the development database. -
prisma migrate deploy applies already-created migrations in deployment
environments. - Do not use prisma db push as a substitute for the
migration workflow. - Do not use prisma db pull to test
connectivity. - Review every generated migration SQL before applying
it. - Do not edit an already-applied migration to change database
history. Create a new migration instead. - Use additive, carefully
reviewed migrations for later changes, and back up important data before
risky production changes. 11. Sprint 1 implementation sequence

1. Inspect the existing schema.prisma, Prisma config, generated
   client setup, and database connection.
2. Compare existing models with this document. Reuse or amend existing
   models; do not duplicate them.
3. Finalize field names, nullability, delete behavior, and indexes.
4. Implement PropertyType and seed the initial type records.
5. Implement Property and its optional parent-child relation.
6. Implement Contact and PropertyContact.
7. Implement PropertyOffering.
8. Implement PropertyMedia for property photos.
9. Run prisma format, prisma validate, and prisma generate.
10. Review the generated SQL migration.
11. Create and apply the first migration.
12. Test the database relationships with representative records before
    building the API and UI.
13. Test scenarios before calling the database design complete
    The design should support these scenarios:
14. Register an independent land property with no parent.
15. Register a building and link two apartment properties to it.
16. Register the same owner once and link that contact to multiple
    properties.
17. Link two owners to one property.
18. Link an authorized representative to a property without marking them
    as an owner.
19. Create both a sale offering and a rental offering for the same
    property.
20. Store an area in dunums and retain both the original value and
    normalized square meters.
21. Store an area with an unknown custom unit and leave the normalized
    value null.
22. Attach multiple photos to one property and select a primary photo.
23. Archive a property without deleting its contacts, offerings, or
    media history unintentionally.
24. Open decisions to resolve before or during implementation
    These questions should be answered when the relevant feature is reached:

- Are multiple simultaneous offerings of the same transaction type
  allowed for one property?
- Can a unit have a parent other than a building, or must the parent
  always be a building?
- Should a building's area and its units' areas be stored
  independently? (Recommended: yes, each record describes its own
  physical entity.)
- Which exact area units and custom labels does the broker use?
- What exactly does "جوشان" refer to, and should it be attached to the
  property, owner, or another record?
- Should one property have at most one primary photo? (Recommended:
  yes.)
- Which document types belong to a property, contact, or offering?
- What are the exact deletion/archiving rules for contacts and media?
  Do not block the initial property workflow on future requirements that
  are not needed for Sprint 1.
  Working principle: Model the real estate business first, enforce
  important data integrity in PostgreSQL, keep the Prisma schema readable,
  and introduce future entities only when their workflows are ready.
