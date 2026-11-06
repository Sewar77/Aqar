import { ZodError } from "zod";

import { propertyCreateSchema } from "./property-create.validation";

import {
  propertyCreateService,
  PropertyCreateError,
} from "./property-create.service";
import { Prisma } from "../../../../generated/prisma/browser";
function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  const code = error.code;

  return typeof code === "string" && /^P\d{4}$/.test(code) ? code : null;
}
export const propertyCreateController = {
  async create(request: Request): Promise<Response> {
    // Until ADMIN authentication exists,
    // do not expose creation on production.
    if (process.env.NODE_ENV === "production") {
      return Response.json(
        {
          success: false,
          message:
            "إضافة العقارات معطّلة مؤقتًا حتى تفعيل تسجيل الدخول والصلاحيات",
        },
        { status: 403 },
      );
    }

    try {
      let body: unknown;

      try {
        body = await request.json();
      } catch {
        return Response.json(
          {
            success: false,
            message: "أرسلي بيانات صحيحة",
          },
          { status: 400 },
        );
      }

      const input = propertyCreateSchema.parse(body);

      const data = await propertyCreateService.create(input);

      return Response.json(
        {
          success: true,
          data,
        },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof ZodError) {
        return Response.json(
          {
            success: false,
            message: "راجعي حقول العقار المطلوبة",
            errors: error.issues.map((issue) => ({
              path: issue.path,
              message: issue.message,
            })),
          },
          { status: 400 },
        );
      }

      if (error instanceof PropertyCreateError) {
        return Response.json(
          {
            success: false,
            message: error.message,
          },
          { status: error.statusCode },
        );
      }

      const prismaErrorCode = getPrismaErrorCode(error);

      if (prismaErrorCode === "P2002") {
        return Response.json(
          {
            success: false,
            message: "هناك اسم منطقة أو رقم هاتف مسجل مسبقًا",
          },
          { status: 409 },
        );
      }

      if (prismaErrorCode === "P2003" || prismaErrorCode === "P2025") {
        return Response.json(
          {
            success: false,
            message: "أحد المراجع المختارة لم يعد موجودًا",
          },
          { status: 409 },
        );
      }

      if (prismaErrorCode === "P2028") {
        return Response.json(
          {
            success: false,
            message:
              "تعذّر إتمام العملية بسبب مشكلة في قاعدة البيانات. تحققي من العقارات قبل إعادة المحاولة.",
          },
          { status: 503 },
        );
      }

      console.error("Property creation error:", error);

      return Response.json(
        {
          success: false,
          message: "تعذّر حفظ العقار. تحققي من القائمة قبل إعادة المحاولة.",
        },
        { status: 500 },
      );
    }
  },
};
