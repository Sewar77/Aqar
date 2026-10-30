# Location Data Model

## Status
The intended relational model consists of:
- `Governorate`: one governorate has many cities.
- `City`: belongs to one governorate and can be referenced by many properties.
- `Property`: belongs to one city through `cityId`.

## Why relational lookup tables?
Locations are not stored as free-text city values or Prisma enums because administrators should be able to manage locations without code changes. The model supports additional governorates, consistent filtering/grouping, and deactivation without breaking historical property references.

## Location fields and constraints
- Governorates and cities have Arabic names and optional English names.
- Both models have an `isActive` flag.
- City names are unique within a governorate using a composite unique constraint on `(governorateId, nameAr)`.
- A property's `address` remains free text for street, building, landmarks, and other detailed information.

## Deletion policy
Deactivate locations using `isActive`; do not physically delete locations referenced by properties. Use restrictive foreign-key behavior to protect related property records.

## Initial development seed
The initial seed data creates Irbid (`إربد` / `Irbid`) and these starter cities:
- إربد
- الحصن
- الرمثا
- المزار الشمالي
- زوبيا
- عنبة
- ارحابا

This is starter data, not an exhaustive or authoritative locality list. Confirm spelling and administrative classification before expanding it.

## Future considerations
- Support adding further governorates and cities through admin tools.
- Do not hardcode Irbid in business logic.
- Keep uniqueness scoped to the governorate, not globally across all cities.
