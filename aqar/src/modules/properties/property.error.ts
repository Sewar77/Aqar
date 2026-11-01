import { Prisma } from "../../../generated/prisma/client";
import { ZodError } from "zod";

// Custom errors for expected business failures.
//
// Example:
// throw new PropertyHttpError("Contact not found", 404);

export class PropertyHttpError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "PropertyHttpError";
  }
}

// TypeScript concept: unknown is safer than any.
//
// We don't know what was thrown until we check
// its runtime type with instanceof.

export function propertyErrorResponse(error: unknown): Response {
  if (error instanceof PropertyHttpError) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return Response.json(
      {
        success: false,
        message: "Invalid input",
        errors: error.issues,
      },
      { status: 400 },
    );
  }

  if (error instanceof SyntaxError) {
    return Response.json(
      {
        success: false,
        message: "Invalid JSON",
      },
      { status: 400 },
    );
  }

  // Prisma's known request errors have error codes.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return Response.json(
        {
          success: false,
          message: "A unique value already exists.",
        },
        { status: 409 },
      );
    }

    if (error.code === "P2003") {
      return Response.json(
        {
          success: false,
          message: "Invalid related record.",
        },
        { status: 400 },
      );
    }

    if (error.code === "P2025") {
      return Response.json(
        {
          success: false,
          message: "Record not found.",
        },
        { status: 404 },
      );
    }
  }

  // Unexpected errors should be logged server-side.
  // Don't expose SQL queries or internal details to clients.
  console.error("Properties API error:", error);

  return Response.json(
    {
      success: false,
      message: "Internal server error",
    },
    { status: 500 },
  );
}
