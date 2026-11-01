import { NextResponse } from "next/server";
import { LocationService, LocationServiceError } from "./location.service";

import {
  createLocationSchema,
  updateLocationSchema,
  locationListQuerySchema,
} from "./location.validators";

const isValidId = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

function handleError(error: unknown) {
  if (error instanceof LocationServiceError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.statusCode },
    );
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "ههذ المنطقة مسجلة بالفعل",
      },
      { status: 409 },
    );
  }
  console.error("location module error", error);
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
    throw new LocationServiceError("البيانات المرسلة ليست JSON صالحًا", 400);
  }
}

export const locationController = {
  async getAll(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const parsed = locationListQuerySchema.safeParse({
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
      const locations = await LocationService.getAll(parsed.data);
      return NextResponse.json({
        success: true,
        data: locations,
      });
    } catch (error) {
      return handleError(error);
    }
  },
  async getById(id: string) {
    try {
      if (!isValidId(id)) {
        return NextResponse.json(
          {
            success: false,
            message: "معرف المنطقة غير صالح",
          },
          { status: 400 },
        );
      }

      const location = await LocationService.getById(id);

      return NextResponse.json({
        success: true,
        data: location,
      });
    } catch (error) {
      return handleError(error);
    }
  },

  async create(request: Request) {
    try {
      const body = await parseJson(request);
      const parsed = createLocationSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            message: "بيانات المنطقة غير صحيحة",
            errors: parsed.error.flatten(),
          },
          { status: 400 },
        );
      }

      const location = await LocationService.create(parsed.data);

      return NextResponse.json(
        {
          success: true,
          message: "تمت إضافة المنطقة بنجاح",
          data: location,
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
        return NextResponse.json(
          {
            success: false,
            message: "معرف المنطقة غير صالح",
          },
          { status: 400 },
        );
      }

      const body = await parseJson(request);
      const parsed = updateLocationSchema.safeParse(body);

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

      const location = await LocationService.update(id, parsed.data);

      return NextResponse.json({
        success: true,
        message: "تم تعديل المنطقة بنجاح",
        data: location,
      });
    } catch (error) {
      return handleError(error);
    }
  },
};
