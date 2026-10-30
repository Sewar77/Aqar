import { NextResponse } from "next/server";

import {
  createPropertySchema,
  updatePropertySchema,
  propertyIdSchema,
} from "../validations/property.validation";

import {
  archiveProperty,
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
} from "../services/property.service";

function handleError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

  const statusMap: Record<string, number> = {
    PROPERTY_NOT_FOUND: 404,
    INVALID_PROPERTY_TYPE: 400,
    PARENT_PROPERTY_NOT_FOUND: 404,
    PROPERTY_CANNOT_BE_ITS_OWN_PARENT: 400,
    PROPERTY_ALREADY_ARCHIVED: 409,
  };

  return NextResponse.json(
    { success: false, message },
    { status: statusMap[message] ?? 500 },
  );
}

export async function createPropertyController(request: Request) {
  try {
    const body: unknown = await request.json();
    const validation = createPropertySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const property = await createProperty(validation.data);

    return NextResponse.json(
      {
        success: true,
        message: "Property created successfully",
        data: property,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function getPropertiesController(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid pagination parameters" },
        { status: 400 },
      );
    }

    const result = await getProperties({
      search: searchParams.get("search") ?? undefined,
      typeId: searchParams.get("typeId") ?? undefined,
      city: searchParams.get("city") ?? undefined,
      status:
        (searchParams.get("status") as
          | "DRAFT"
          | "ACTIVE"
          | "ARCHIVED"
          | null) ?? undefined,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function getPropertyByIdController(id: string) {
  try {
    const validId = propertyIdSchema.safeParse(id);

    if (!validId.success) {
      return NextResponse.json(
        { success: false, message: "Invalid property ID" },
        { status: 400 },
      );
    }

    const property = await getPropertyById(id);

    return NextResponse.json({
      success: true,
      data: property,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function updatePropertyController(request: Request, id: string) {
  try {
    const validId = propertyIdSchema.safeParse(id);

    if (!validId.success) {
      return NextResponse.json(
        { success: false, message: "Invalid property ID" },
        { status: 400 },
      );
    }

    const body: unknown = await request.json();
    const validation = updatePropertySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const property = await updateProperty(id, validation.data);

    return NextResponse.json({
      success: true,
      message: "Property updated successfully",
      data: property,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function archivePropertyController(id: string) {
  try {
    const validId = propertyIdSchema.safeParse(id);

    if (!validId.success) {
      return NextResponse.json(
        { success: false, message: "Invalid property ID" },
        { status: 400 },
      );
    }

    const property = await archiveProperty(id);

    return NextResponse.json({
      success: true,
      message: "Property archived successfully",
      data: property,
    });
  } catch (error) {
    return handleError(error);
  }
}
