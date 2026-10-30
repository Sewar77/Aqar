# AqarDesk — Current Development Progress

_Last updated: 2026-10-31_

## Established
- Next.js App Router and TypeScript project.
- PostgreSQL connection through Prisma 7 and `@prisma/adapter-pg`.
- Shared Prisma client in `lib/prisma.ts`.
- Prisma CLI configuration in `prisma7.config.ts`.
- Dashboard shell, sidebar, and header.
- Property types modeled as lookup records and seeded: LAND, HOUSE, APARTMENT, SHOP, BUILDING.
- Location model designed with `Governorate`, `City`, and `Property.cityId`.
- Seed script prepared to upsert Irbid, starter cities, and property types.
- Location service and read endpoints prepared:
  - `getActiveGovernorates()`
  - `getActiveCities(governorateId?)`
  - `GET /api/governorates`
  - `GET /api/cities`

## Local verification
Run from the project root:

```powershell
npx prisma migrate status --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
npx prisma db seed --config prisma7.config.ts
npx tsc --noEmit
npm run dev
```

Check:
- `GET http://localhost:3000/api/governorates`
- `GET http://localhost:3000/api/cities`
- `GET http://localhost:3000/api/cities?governorateId=<governorate-uuid>`

## Not yet completed
- Admin CRUD APIs and UI for governorates/cities.
- Input validation for location endpoints.
- Authentication and authorization.
- Properties service and CRUD APIs.
- Property listing page grouped/filtered by city.
- Property create/edit forms with governorate and city selection.

## Database reset note
The local development database was reset during the location-model change at the user's request. Previous local records may have been removed. Seed data is lookup data only; it does not recreate previous property records.
