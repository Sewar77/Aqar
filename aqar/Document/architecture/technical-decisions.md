# AqarDesk — Technical Decisions

## Stack
- Next.js App Router and TypeScript
- PostgreSQL
- Prisma 7 with `@prisma/adapter-pg`
- Tailwind CSS and shadcn/ui

## Database access
Use the shared Prisma client from `lib/prisma.ts`. Do not instantiate separate Prisma clients in route handlers or services.

Run Prisma CLI commands from the project root and include `--config prisma7.config.ts`.

## Schema and migrations
- Keep `schema.prisma` as the data-model source of truth.
- Use Prisma migrations for schema changes.
- Review generated SQL before applying migrations that affect existing data.
- Never use `migrate reset` on a database whose data must be retained.
- Do not use `db push` as a replacement for migration history.
- Do not run destructive SQL or reset shared/production databases without explicit review.

## Domain decisions
- Property types are lookup records, not hardcoded UI values.
- Properties reference a `City` through `cityId`.
- `address` remains free text for detailed address information.
- Property deletion is soft archival (`status = ARCHIVED`).
- Owner price and advertised/customer-facing price are separate.
- Do not expose private owner pricing or parcel/basin identifiers in public advertisements.
- Store photo metadata in PostgreSQL; store image files externally.

## Security
- Do not expose private or administrative APIs without authentication and authorization.
- Validate request data at API boundaries.
- Never return password hashes or secrets from APIs.
- Never commit `.env` files or credentials.
