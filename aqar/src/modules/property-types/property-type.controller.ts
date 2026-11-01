import { NextResponse } from "next/server";

import {
  propertyTypeService,
  PropertyTypeServiceError,
} from "./property-type.service";

import {
  createPropertyTypeSchema,
  updatePropertyTypeSchema,
  propertyTypeListQuerySchema,
} from "./property-type.validator";

const isValidId = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

function handleError(error: unknown) {
  if (error instanceof PropertyTypeServiceError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.statusCode },
    );
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          message: "كود نوع العقار مستخدم مسبقًا",
        },
        { status: 409 },
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          message: "نوع العقار غير موجود",
        },
        { status: 404 },
      );
    }
  }

  console.error("Property Type module error:", error);

  return NextResponse.json(
    {
      success: false,
      message: "حدث خطأ غير متوقع في الخادم",
    },
    { status: 500 },
  );
}

async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new PropertyTypeServiceError(
      "البيانات المرسلة ليست JSON صالحًا",
      400,
    );
  }
}

function invalidIdResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "معرف نوع العقار غير صالح",
    },
    { status: 400 },
  );
}

export const propertyTypeController = {
  async getAll(request: Request) {
    try {
      const { searchParams } = new URL(request.url);

      const parsed = propertyTypeListQuerySchema.safeParse({
        search: searchParams.get("search") ?? undefined,
        isActive: searchParams.get("isActive") ?? undefined,
      });

      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            message: "معايير البحث غير صحيحة",
            errors: parsed.error.flatten(),
          },
          { status: 400 },
        );
      }

      const types = await propertyTypeService.getAll(parsed.data);

      return NextResponse.json({
        success: true,
        data: types,
      });
    } catch (error) {
      return handleError(error);
    }
  },

  async getById(id: string) {
    try {
      if (!isValidId(id)) {
        return invalidIdResponse();
      }

      const type = await propertyTypeService.getById(id);

      return NextResponse.json({
        success: true,
        data: type,
      });
    } catch (error) {
      return handleError(error);
    }
  },

  async create(request: Request) {
    try {
      const body = await parseJson(request);

      const parsed = createPropertyTypeSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            message: "بيانات نوع العقار غير صحيحة",
            errors: parsed.error.flatten(),
          },
          { status: 400 },
        );
      }

      const type = await propertyTypeService.create(parsed.data);

      return NextResponse.json(
        {
          success: true,
          message: "تمت إضافة نوع العقار بنجاح",
          data: type,
        },
        { status: 201 },
      );
    } catch (error) {
      return handleError(error);
    }
  },

  async update(request: Request, id: string) {
    try {
      if (!isValidId(id)) {
        return invalidIdResponse();
      }

      const body = await parseJson(request);

      const parsed = updatePropertyTypeSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            message: "بيانات التعديل غير صحيحة",
            errors: parsed.error.flatten(),
          },
          { status: 400 },
        );
      }

      const type = await propertyTypeService.update(id, parsed.data);

      return NextResponse.json({
        success: true,
        message: "تم تعديل نوع العقار بنجاح",
        data: type,
      });
    } catch (error) {
      return handleError(error);
    }
  },
};
