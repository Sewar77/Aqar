# AqarDesk — Sprint 1 Requirements

**Sprint:** 01  
**Duration:** 14 days  
**Product:** AqarDesk  
**Primary Actor:** Admin (Real Estate Broker)

## 1. Sprint Goal

Build the first usable version of AqarDesk that allows the administrator to register properties, manage their basic information and associated contacts, upload property photos, and view or edit property records.

The application must be usable on mobile devices.

## 2. Actors

- **Admin:** The real estate broker who manages property records.
- **System:** Validates submitted information and maintains relationships between records.

## 3. Functional Requirements

### FR-01 — Property Management

- View all active properties.
- Register a new property.
- View property details.
- Edit existing property information.
- Archive a property without permanently deleting its data.

### FR-02 — Property Information

A property record should support:

- Property type.
- City and general location.
- Area value and original measurement unit.
- Normalized area in square meters when conversion is possible.
- Description and internal notes.
- Optional location coordinates.
- Optional parent property relationship for units inside buildings.

### FR-03 — Contact Management

- Register a contact with a name and phone number.
- Support an alternative phone number.
- Associate multiple contacts with a property.
- Identify the relationship as owner, co-owner, or authorized representative.
- Identify the primary contact.

### FR-04 — Property Photos

- Upload multiple property photos.
- Preview uploaded photos.
- Select a primary photo.
- Remove an uploaded photo.

### FR-05 — Property Pricing

- Store the owner's requested price.
- Store the advertised price separately.
- Keep both values private to the internal system unless explicitly selected for advertisement generation in a future feature.

## 4. Use Cases

| ID    | Use Case                        | Priority |
| ----- | ------------------------------- | -------- |
| UC-01 | View Properties                 | Must     |
| UC-02 | Add Property                    | Must     |
| UC-03 | Add Contact                     | Must     |
| UC-04 | Associate Contact with Property | Must     |
| UC-05 | Upload Property Photos          | Must     |
| UC-06 | View Property Details           | Must     |
| UC-07 | Edit Property                   | Must     |
| UC-08 | Search and Filter Properties    | Should   |
| UC-09 | Archive Property                | Could    |

## 5. Acceptance Criteria

A Sprint 1 release is accepted when:

1. The administrator can add a property with valid required information.
2. The administrator can associate one or more contacts with that property.
3. Each contact relationship has an appropriate role.
4. The administrator can upload multiple photos and select a primary photo.
5. The administrator can view all saved property information.
6. The administrator can edit an existing property without losing its associated contacts or photos.
7. The administrator can access the property list from a mobile device.
8. Invalid data is rejected with understandable validation messages.

## 6. Out of Scope

The following features are postponed:

- Customer requirements and property matching.
- Property visits and appointment scheduling.
- Facebook advertisement generation.
- Advanced price history and commission management.
- Detailed property-type-specific specifications.
- Advanced reporting and dashboards.
- Multiple user accounts and permissions.

## 7. Technical Constraints

- Next.js App Router.
- TypeScript.
- PostgreSQL.
- Prisma ORM.
- Database changes must use migrations.
- Validate incoming data at the application boundary.
- Store uploaded file metadata in PostgreSQL and actual files in external storage.
- Design the domain model to support future property types and relationships.

## 8. Sprint Demo

The administrator should be able to:

1. Open AqarDesk on a phone.
2. Add a real property.
3. Enter its location and area.
4. Add its owner and contact information.
5. Upload property photos.
6. View the property details.
7. Edit the property and save changes.

**Definition of Done:** The complete workflow works with real test data, passes basic validation and is demonstrated to the client.
