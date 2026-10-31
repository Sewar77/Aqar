# AqarDesk — Development Documentation

**Project:** AqarDesk — Real Estate Management System  
**Last Updated:** October 31, 2026  
**Repository:** https://github.com/Sewar77/Aqar  
**Status:** Development in progress

---

## 1. Project Overview

AqarDesk is an internal real estate management platform designed for a real estate broker in Jordan.

The system replaces manual notebook-based recordkeeping with a centralized dashboard for managing properties, owners, locations, prices, inquiries, and advertising activities.

### Main Objectives

- Register and organize properties.
- Track properties across Jordanian governorates and cities.
- Manage property owners and their contact information.
- Support property sales and rentals.
- Store both owner-requested and advertised prices.
- Track inquiries, property visits, and negotiations.
- Prepare property advertisements for social media.
- Provide a mobile-friendly Arabic-first interface.

**Initial release:** Internal administrative system, not a public property marketplace.

## 2. Technology Stack

| Layer               | Technology             |
| ------------------- | ---------------------- |
| Frontend            | Next.js App Router     |
| Language            | TypeScript             |
| Styling             | Tailwind CSS           |
| UI Components       | shadcn/ui              |
| Icons               | Lucide                 |
| Backend             | Next.js Route Handlers |
| Database            | PostgreSQL             |
| ORM                 | Prisma 7.10.1          |
| Database Hosting    | Neon                   |
| Application Hosting | Render                 |
| Version Control     | Git / GitHub           |

### Backend Architecture

The project follows a layered architecture:

`Route Handler → Controller → Service → Repository → Prisma → PostgreSQL`

Responsibilities:

- **Route:** Defines the HTTP endpoint and delegates execution.
- **Controller:** Handles requests, validation, and HTTP responses.
- **Service:** Implements business logic.
- **Repository:** Performs database queries.
- **Prisma:** Handles database access.

This architecture should be followed for all new backend features.

## 3. Database Design

The database schema has been designed using Prisma.

### Core Models

| Model            | Responsibility                                   |
| ---------------- | ------------------------------------------------ |
| User             | Administrative accounts                          |
| Governorate      | Jordanian governorates                           |
| City             | Cities and towns belonging to governorates       |
| PropertyType     | Configurable property categories                 |
| Property         | Property information and geographical data       |
| Contact          | Owners, representatives, and other contacts      |
| PropertyContact  | Links properties to contacts with specific roles |
| PropertyOffering | Sales and rental offerings                       |
| PropertyPhoto    | Property image metadata                          |
| Inquiry          | Customer inquiries                               |
| PropertyVisit    | Scheduled property visits                        |
| SocialPost       | Social media advertising records                 |
| PropertyEvent    | Property activity history                        |

### Important Database Rules

- Every property belongs to a city.
- Every city belongs to a governorate.
- Property types are stored in a lookup table.
- Properties may have parent-child relationships.
- A contact can be linked to multiple properties.
- A property can have multiple owners or representatives.
- Owner-requested prices and advertised prices are stored separately.
- Property deletion uses soft archiving.
- Original area values and normalized square-meter values are stored.
- Database IDs are internal identifiers and must not be displayed in the UI.

## 4. Seed Data

A comprehensive Prisma seed script was prepared in:

`prisma/seed.ts`

It includes sample records for:

- Jordanian governorates and cities.
- Property types.
- Administrator account.
- Contacts.
- Properties, including parent-child properties.
- Sales and rental offerings.
- Property-contact relationships.
- Property photo metadata.
- Inquiries.
- Property visits.
- Social media posts.
- Property events.

The seed uses deterministic identifiers and upserts to support repeatable execution.

### Commands

Generate Prisma Client:

```bash
npx prisma generate --config prisma7.config.ts
```

Apply existing migrations:

```bash
npx prisma migrate deploy --config prisma7.config.ts
```

Run seed:

```bash
npx prisma db seed --config prisma7.config.ts
```

**Status:** Database migration was reported successful. The final seed execution result has not yet been confirmed.

**Security note:** The seed expects `SEED_ADMIN_PASSWORD_HASH`. Production seeding must be controlled to avoid modifying real customer records.

## 5. Dashboard Navigation

The dashboard currently includes these navigation destinations:

| Page                    | Route                      | Status                           |
| ----------------------- | -------------------------- | -------------------------------- |
| Dashboard               | `/`                        | Existing                         |
| Properties              | `/properties`              | UI code prepared                 |
| Contacts                | `/contacts`                | UI and GET API code prepared     |
| Governorates and Cities | `/locations`               | Existing                         |
| Property Details        | `/properties/[propertyId]` | Previously implemented/discussed |
| Selected Location       | `/locations/[id]`          | Existing; filtering bug reported |

### Dashboard UI Requirements

- Arabic-first interface with RTL support.
- Responsive layouts for mobile and desktop.
- Clear cards, search fields, and filters.
- Display-friendly statuses and labels.
- No database IDs displayed to end users.
- Reusable components wherever practical.

## 6. Properties Module

### Properties Listing

Route: `/properties`

The new page code includes:

- Property cards.
- Property title.
- Property type.
- City and governorate.
- Property area.
- Advertised price.
- Property status.
- Search functionality.
- Status filtering.
- Summary statistics.
- Navigation to property details.
- Refresh, loading, empty, and error states.

### API

`GET /api/properties`

The properties listing is intended to support optional filters, including `cityId`.

### Property Details

Route: `/properties/[propertyId]`

The details feature is intended to show:

- Property information.
- Type and location.
- Area and status.
- Linked contacts.
- Offerings.
- Photos.
- Property history.

### Known Issue — Location Filtering

**Problem:** Visiting `/locations/[id]` currently shows properties from all locations instead of only the selected location.

**Expected behavior:**

- `/properties` displays all properties.
- `/locations/[cityId]` displays properties belonging to the selected city.
- A governorate-specific view, if implemented, should display properties across its cities.

**Proposed backend change:**

Support `cityId` filtering directly in the repository:

```ts
where: {
  ...(cityId ? { cityId } : {}),
}
```

The controller should read `cityId` from the query parameters and pass it through the service to the repository.

**Status:** Fix proposed, not confirmed implemented or tested.

## 7. Contacts Module

### Contacts Page

Route: `/contacts`

The UI code was prepared to display:

- Contact full name.
- Primary phone number.
- Alternative phone number.
- Number of associated property relationships.
- Search by name, phone number, or email.
- Direct telephone links.
- Refresh functionality.
- Loading, error, and empty states.

### GET Contacts API

Endpoint: `GET /api/contacts`

A `404 Not Found` error was encountered because the API route did not exist at the time.

The following backend implementation was supplied:

```text
app/api/contacts/route.ts
features/contacts/contacts.controller.ts
features/contacts/contacts.service.ts
features/contacts/contacts.repository.ts
```

### Expected API Response

```json
{
  "success": true,
  "data": [
    {
      "id": "internal-uuid",
      "fullName": "Example Contact",
      "phone": "0790000000",
      "alternativePhone": null,
      "email": null,
      "notes": null,
      "propertyCount": 2
    }
  ]
}
```

The repository reads contacts from Prisma and calculates associated property relationship counts.

**Status:** GET endpoint code provided; successful execution has not yet been confirmed.

### Remaining Contacts Features

- Create contact.
- Update contact.
- Contact detail page.
- Contact validation.
- Associate existing contacts with properties.
- Display all properties belonging to a contact.
- Prevent duplicate contacts where appropriate.
- Handle deletion safely when relationships exist.

## 8. Deployment

### Database Hosting — Neon

PostgreSQL is hosted on Neon.

The application connects through the `DATABASE_URL` environment variable.

### Application Hosting — Render

A Render Web Service was created for the Next.js application.

The deployment uses the GitHub repository and the `sprint-1` branch.

A previous deployment failed because Render could not find `package.json` at its configured root directory. The Render Root Directory must match the application folder.

### Prisma Deployment Commands

Migration and build:

```bash
npm install && npx prisma migrate deploy --config prisma7.config.ts && npx prisma generate --config prisma7.config.ts && npm run build
```

One-time seed and build:

```bash
npm install && npx prisma generate --config prisma7.config.ts && npx prisma db seed --config prisma7.config.ts && npm run build
```

Because Render's free plan does not provide an interactive shell, the build command was used as a way to trigger Prisma operations.

**Deployment note:** Seeding should not remain permanently in the production build command. Migrations should also be managed carefully to prevent concurrent deployments from introducing conflicts.

### Environment Variables

Relevant environment variables include:

- `DATABASE_URL`
- `SEED_ADMIN_PASSWORD_HASH` when running the seed
- Any additional application-specific settings

Never commit actual secrets to GitHub.

## 9. Security Considerations

The system manages private owner information, including telephone numbers and property details.

The following security requirements remain important:

- Implement authentication.
- Enforce authorization on the server.
- Protect all administrative API routes.
- Do not expose private contact information to unauthorized users.
- Do not expose owner-requested prices in public advertisements.
- Do not expose sensitive parcel or basin information in public advertisements.
- Validate all API inputs.
- Do not depend on hidden frontend controls as a security mechanism.

**Current limitation:** Authentication and server-side authorization have not yet been confirmed implemented. The system should not be considered ready for unrestricted public access.

## 10. Development Status

| Feature                           | Status                              |
| --------------------------------- | ----------------------------------- |
| Prisma database schema            | Designed                            |
| Database migrations               | Reported successful                 |
| Seed script                       | Prepared, execution unverified      |
| Dashboard homepage                | Existing                            |
| Governorates and cities           | Existing                            |
| Properties listing                | UI prepared, integration unverified |
| Property details                  | Previously implemented/discussed    |
| Contacts listing                  | UI prepared, integration unverified |
| Contacts GET API                  | Code prepared, testing unverified   |
| Location-based property filtering | Fix pending                         |
| Contact creation and editing      | Pending                             |
| Authentication and authorization  | Pending                             |
| Production security review        | Pending                             |

## 11. Next Development Priorities

1. **Fix location filtering:** Ensure each selected city displays only its own properties.
2. **Complete Contacts CRUD:** Add create, update, and safe delete operations with validation.
3. **Finish property-contact integration:** Support multiple owners and authorized representatives.
4. **Improve the dashboard:** Add real counts, recent property activity, and useful business statistics.
5. **Implement authentication and authorization:** Protect all administrative routes before production use.

## 12. Development Conventions

All future changes should follow these conventions:

- Use the established layered architecture.
- Keep database queries inside repositories.
- Keep business rules inside services.
- Keep HTTP handling inside controllers.
- Use TypeScript types and dedicated validation files.
- Use Prisma migrations for database changes.
- Do not introduce destructive database changes without reviewing them.
- Keep the UI Arabic-first and RTL.
- Never display internal database IDs.
- Prefer reusing existing components rather than duplicating logic.
- Verify TypeScript and application builds after implementation.
- Do not claim features are complete until they have been tested.

---

**Documentation note:** This report is based on the implementation work and code discussed through October 31, 2026. It is not a fresh audit of the GitHub repository. Unverified features are explicitly marked to avoid treating proposed code as tested functionality.
