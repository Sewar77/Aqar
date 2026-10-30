# Location Read API

## Purpose
Provide active governorates and cities for property forms, filters, and listing pages.

## `GET /api/governorates`
Returns active governorates and their active cities.

Example response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nameAr": "إربد",
      "nameEn": "Irbid",
      "cities": [
        {
          "id": "uuid",
          "nameAr": "الحصن",
          "nameEn": null
        }
      ]
    }
  ]
}
```

## `GET /api/cities`
Returns active cities with a compact governorate object.

## `GET /api/cities?governorateId=<uuid>`
Filters active cities by governorate.

## Code organization
- `lib/services/location.service.ts`
  - `getActiveGovernorates()`
  - `getActiveCities(governorateId?)`
- `app/api/governorates/route.ts`
  - `GET`
- `app/api/cities/route.ts`
  - `GET`

Keep Prisma queries in the service layer. Route handlers should handle HTTP input/output and error responses.

## Behavior
- Return active governorates only.
- Return active cities only.
- Do not return cities whose governorate is inactive.
- `governorateId` is optional.
- Validate UUID query parameters and return HTTP 400 for malformed values rather than leaking database errors as HTTP 500.
- Keep response envelopes consistent.

## Security
Do not expose private property data or administrative write operations before authentication and authorization are implemented.

## Planned, not yet implemented
Admin create/update/deactivate operations for governorates and cities.
