import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../../generated/prisma/client";

/**
 * Aqar Database Connection
 *
 * Database: Neon PostgreSQL
 * ORM: Prisma 7
 * Adapter: PrismaNeon
 *
 * DATABASE_URL:
 *   Used by the application at runtime.
 *
 * DIRECT_URL:
 *   Used separately by Prisma CLI migrations.
 */

/**
 * Extend the global object to reuse PrismaClient
 * during Next.js development and Hot Reload.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Create a Prisma Client using Neon's
 * serverless driver adapter.
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const adapter = new PrismaNeon({
    connectionString,
  });

  return new PrismaClient({
    adapter,
  });
}

/**
 * Reuse the existing PrismaClient if available.
 * Otherwise, create a new instance.
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
