import { Prisma } from "../../../generated/prisma/client";
import { ZodError } from "zod";

import { LocationService, LocationServiceError } from "./location.service";

import {
  locationIdSchema,
  createLocationSchema,
  updateLocationSchema,
  locationListQuerySchema,
  deleteLocationSchema,
} from "./location.validators";

function handleError(error: unknown): Response {
  if (error instanceof LocationServiceError) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    return Response.json(
      {
        success: false,
        message: "البيانات المدخلة غير صحيحة",
        errors: error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return Response.json(
        {
          success: false,
          message: "هذه المنطقة مسجلة بالفعل",
        },
        { status: 409 },
      );
    }

    if (error.code === "P2003") {
      return Response.json(
        {
          success: false,
          message: "لا يمكن حذف المنطقة لأنها مرتبطة بعقارات",
        },
        { status: 409 },
      );
    }

    if (error.code === "P2025") {
      return Response.json(
        {
          success: false,
          message: "المنطقة غير موجودة",
        },
        { status: 404 },
      );
    }
  }

  console.error("Locations API error:", error);

  return Response.json(
    {
      success: false,
      message: "حدث خطأ غير متوقع في الخادم",
    },
    { status: 500 },
  );
}

async function parseJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new LocationServiceError("يرجى إرسال JSON صالح", 400);
  }
}

export const locationController = {
  async getAll(request: Request): Promise<Response> {
    try {
      const params = new URL(request.url).searchParams;

      const filters = locationListQuerySchema.parse({
        search: params.get("search") ?? undefined,
        isActive: params.get("isActive") ?? undefined,
        page: params.get("page") ?? undefined,
        limit: params.get("limit") ?? undefined,
      });

      const result = await LocationService.getAll(filters);

      return Response.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return handleError(error);
    }
  },
  async getById(id: string): Promise<Response> {
    try {
      const locationId = locationIdSchema.parse(id);

      const location = await LocationService.getById(locationId);

      return Response.json({
        success: true,
        data: location,
      });
    } catch (error) {
      return handleError(error);
    }
  },

  async create(request: Request): Promise<Response> {
    try {
      const body = await parseJson(request);

      const input = createLocationSchema.parse(body);

      const location = await LocationService.create(input);

      return Response.json(
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

  async update(request: Request, id: string): Promise<Response> {
    try {
      const locationId = locationIdSchema.parse(id);

      const body = await parseJson(request);

      const input = updateLocationSchema.parse(body);

      const location = await LocationService.update(locationId, input);

      return Response.json({
        success: true,
        message: "تم تعديل المنطقة بنجاح",
        data: location,
      });
    } catch (error) {
      return handleError(error);
    }
  },

  async delete(request: Request, id: string): Promise<Response> {
    try {
      const locationId = locationIdSchema.parse(id);

      const body = await parseJson(request);

      const input = deleteLocationSchema.parse(body);

      const result = await LocationService.delete(locationId, input);

      return Response.json({
        success: true,
        message:
          result.deletedPropertiesCount > 0
            ? `تم حذف المنطقة و${result.deletedPropertiesCount} عقار مرتبط بها بنجاح`
            : "تم حذف المنطقة بنجاح",
        data: result,
      });
    } catch (error) {
      return handleError(error);
    }
  },
};
