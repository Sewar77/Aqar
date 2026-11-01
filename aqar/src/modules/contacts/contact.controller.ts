import { NextResponse } from "next/server";

import { contactService, ContactServiceError } from "./contact.service";
import {
  contactListQuerySchema,
  createContactSchema,
  updateContactSchema,
} from "./contact.validators";

const isValidId = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

function handleError(error: unknown) {
  if (error instanceof ContactServiceError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.statusCode },
    );
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    if (error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          message: "جهة الاتصال غير موجودة",
        },
        { status: 404 },
      );
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          message: "رقم الهاتف مسجل مسبقًا لجهة اتصال أخرى",
        },
        { status: 409 },
      );
    }
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          message: "لا يمكن حذف جهة اتصال مرتبطة بعقارات",
        },
        { status: 409 },
      );
    }
  }

  console.error("Contact module error:", error);

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
    throw new ContactServiceError("البيانات المرسلة ليست JSON صالحًا", 400);
  }
}

function invalidIdResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "معرف جهة الاتصال غير صالح",
    },
    { status: 400 },
  );
}

export const contactController = {
  async getAll(request: Request) {
    try {
      const { searchParams } = new URL(request.url);

      const parsed = contactListQuerySchema.safeParse({
        search: searchParams.get("search") ?? undefined,
        page: searchParams.get("page") ?? undefined,
        limit: searchParams.get("limit") ?? undefined,
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

      const result = await contactService.getAll(parsed.data);

      return NextResponse.json({
        success: true,
        ...result,
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

      const contact = await contactService.getById(id);

      return NextResponse.json({
        success: true,
        data: contact,
      });
    } catch (error) {
      return handleError(error);
    }
  },

  async create(request: Request) {
    try {
      const body = await parseJson(request);

      const parsed = createContactSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            message: "بيانات جهة الاتصال غير صحيحة",
            errors: parsed.error.flatten(),
          },
          { status: 400 },
        );
      }

      const contact = await contactService.create(parsed.data);

      return NextResponse.json(
        {
          success: true,
          message: "تمت إضافة جهة الاتصال بنجاح",
          data: contact,
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

      const parsed = updateContactSchema.safeParse(body);

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

      const contact = await contactService.update(id, parsed.data);

      return NextResponse.json({
        success: true,
        message: "تم تعديل جهة الاتصال بنجاح",
        data: contact,
      });
    } catch (error) {
      return handleError(error);
    }
  },

  async delete(id: string) {
    try {
      if (!isValidId(id)) {
        return invalidIdResponse();
      }

      const result = await contactService.delete(id);

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (error) {
      return handleError(error);
    }
  },
};
