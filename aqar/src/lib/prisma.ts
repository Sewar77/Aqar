import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
// prismaclient allows us to query the database
// prismapg connect the postegresql using pg driver adapter.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}
const adapter = new PrismaPg({ connectionString });
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
// globalForPrisma => prevent nextjs dev hot reloads from creating too many db connections
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
