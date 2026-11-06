import { performance } from "node:perf_hooks";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

async function measure(name: string, operation: () => Promise<unknown>) {
  const start = performance.now();

  try {
    await operation();

    console.log(`[OK] ${name}: ${Math.round(performance.now() - start)}ms`);
  } catch (error) {
    const elapsed = Math.round(performance.now() - start);

    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "UNKNOWN";

    const message = error instanceof Error ? error.message : "Unknown error";

    console.error(`[FAILED] ${name}: ${elapsed}ms`);

    console.error(`Code: ${code}`);

    // Avoid printing SQL queries or personal data.
    console.error(`Reason: ${message.split("\n")[0]}`);
  }
}

async function main() {
  const { prisma } = await import("../src/lib/prisma");

  const { contactService } =
    await import("../src/modules/contacts/contact.service");

  const { propertyRepository, propertyInclude } =
    await import("../src/modules/properties/property.repository");

  try {
    console.log("\n--- CONNECTION ---");

    await measure("SELECT 1", () => prisma.$queryRaw`SELECT 1`);

    console.log("\n--- CONTACTS: ACTUAL SERVICE ---");

    await measure("contactService.getAll", () => contactService.getAll({}));

    console.log("\n--- PROPERTIES: RELATIONS ---");

    await measure("Properties BASIC", () =>
      prisma.property.findMany({
        take: 5,
        select: {
          id: true,
          title: true,
        },
      }),
    );

    await measure("Properties TYPE + LOCATION", () =>
      prisma.property.findMany({
        take: 5,
        include: {
          type: true,
          location: true,
        },
      }),
    );

    await measure("Properties ALL RELATIONS", () =>
      prisma.property.findMany({
        take: 5,
        include: propertyInclude,
      }),
    );

    console.log("\n--- PROPERTIES: ACTUAL REPOSITORY ---");

    await measure("propertyRepository.list", () =>
      propertyRepository.list({}, 1, 15),
    );

    console.log("\n--- SECOND REQUEST ---");

    await measure("contactService.getAll AGAIN", () =>
      contactService.getAll({}),
    );

    console.log("\n--- COMPLETED ---");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    "Diagnostic failed:",
    error instanceof Error ? error.name : "Unknown error",
  );

  process.exitCode = 1;
});
