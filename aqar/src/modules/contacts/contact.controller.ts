import { Prisma } from "../../../generated/prisma/client";
import { ZodError } from "zod";

import { contactService, ContactServiceError } from "./contact.service";

import {
  contactIdSchema,
  contactListQuerySchema,
  createContactSchema,
  updateContactSchema,
  deleteContactSchema,
} from "./contact.validators";

function handleError(error: unknown): Response {
  if (error instanceof ContactServiceError) {
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
          message: "رقم الهاتف مسجل مسبقًا",
        },
        { status: 409 },
      );
    }

    if (error.code === "P2003") {
      return Response.json(
        {
          success: false,
          message: "تعذّر الحذف بسبب وجود علاقات مرتبطة. لم تكتمل العملية.",
        },
        { status: 409 },
      );
    }

    if (error.code === "P2025") {
      return Response.json(
        {
          success: false,
          message: "جهة الاتصال غير موجودة",
        },
        { status: 404 },
      );
    }

    if (error.code === "P2028") {
      console.error("Contacts transaction error:", error);

      return Response.json(
        {
          success: false,
          message:
            "تعذّر إتمام العملية بسبب الاتصال بقاعدة البيانات. تحققي من السجلات قبل إعادة المحاولة.",
        },
        { status: 503 },
      );
    }
  }

  console.error("Contacts API error:", error);

  return Response.json(
    {
      success: false,
      message: "حدث خطأ في الخادم. تحققي من البيانات قبل إعادة المحاولة.",
    },
    { status: 500 },
  );
}

async function parseBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ContactServiceError("يرجى إرسال بيانات JSON صحيحة", 400);
  }
}

export const contactController = {
  async getAll(request: Request): Promise<Response> {
    try {
      const params = new URL(request.url).searchParams;

      const filters = contactListQuerySchema.parse({
        search: params.get("search") ?? undefined,
        isActive: params.get("isActive") ?? undefined,
        page: params.get("page") ?? undefined,
        limit: params.get("limit") ?? undefined,
      });

      const result = await contactService.getAll(filters);

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
      const contactId = contactIdSchema.parse(id);

      const data = await contactService.getById(contactId);

      return Response.json({
        success: true,
        data,
      });
    } catch (error) {
      return handleError(error);
    }
  },

  async create(request: Request): Promise<Response> {
    try {
      const body = await parseBody(request);

      const input = createContactSchema.parse(body);

      const data = await contactService.create(input);

      return Response.json(
        {
          success: true,
          message: "تمت إضافة جهة الاتصال بنجاح",
          data,
        },
        { status: 201 },
      );
    } catch (error) {
      return handleError(error);
    }
  },

  async update(request: Request, id: string): Promise<Response> {
    try {
      const contactId = contactIdSchema.parse(id);

      const body = await parseBody(request);

      const input = updateContactSchema.parse(body);

      const data = await contactService.update(contactId, input);

      return Response.json({
        success: true,
        message: "تم تعديل جهة الاتصال بنجاح",
        data,
      });
    } catch (error) {
      return handleError(error);
    }
  },

  async delete(request: Request, id: string): Promise<Response> {
    try {
      const contactId = contactIdSchema.parse(id);

      const body = await parseBody(request);

      const input = deleteContactSchema.parse(body);

      const result = await contactService.delete(contactId, input);

      return Response.json({
        success: true,

        message:
          result.deletedPropertiesCount > 0
            ? `تم حذف جهة الاتصال و${result.deletedPropertiesCount} عقار مرتبط بها`
            : "تم حذف جهة الاتصال بنجاح",

        data: result,
      });
    } catch (error) {
      return handleError(error);
    }
  },
};
