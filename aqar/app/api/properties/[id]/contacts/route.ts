import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Context = {
  params: Promise<{ id: string }>;
};

const contactSchema = z
  .object({
    contactId: z.string().uuid().optional(),

    fullName: z.string().trim().min(2).optional(),
    phone: z.string().trim().min(5).optional(),
    alternativePhone: z.string().trim().optional(),
    email: z.string().email().optional(),

    role: z.enum(["OWNER", "CO_OWNER", "AUTHORIZED_REPRESENTATIVE"]),

    isPrimary: z.boolean().default(false),
    canSharePhone: z.boolean().default(false),
  })
  .refine((data) => data.contactId || (data.fullName && data.phone), {
    message: "أدخل contactId أو الاسم ورقم الهاتف",
  });

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;

    const property = await prisma.property.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, message: "العقار غير موجود" },
        { status: 404 },
      );
    }

    const contacts = await prisma.propertyContact.findMany({
      where: { propertyId: id },
      include: { contact: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error("GET_PROPERTY_CONTACTS_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "تعذر جلب جهات الاتصال" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = contactSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "بيانات جهة الاتصال غير صحيحة",
          errors: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = validation.data;

    const property = await prisma.property.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, message: "العقار غير موجود" },
        { status: 404 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let contactId = data.contactId;

      if (contactId) {
        const existingContact = await tx.contact.findUnique({
          where: { id: contactId },
        });

        if (!existingContact) {
          throw new Error("CONTACT_NOT_FOUND");
        }
      } else {
        const contact = await tx.contact.create({
          data: {
            fullName: data.fullName!,
            phone: data.phone!,
            alternativePhone: data.alternativePhone,
            email: data.email,
          },
        });

        contactId = contact.id;
      }

      const duplicate = await tx.propertyContact.findFirst({
        where: {
          propertyId: id,
          contactId,
          role: data.role,
        },
      });

      if (duplicate) {
        throw new Error("PROPERTY_CONTACT_ALREADY_EXISTS");
      }

      if (data.isPrimary) {
        await tx.propertyContact.updateMany({
          where: { propertyId: id },
          data: { isPrimary: false },
        });
      }

      return tx.propertyContact.create({
        data: {
          propertyId: id,
          contactId,
          role: data.role,
          isPrimary: data.isPrimary,
          canSharePhone: data.canSharePhone,
        },
        include: { contact: true },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم ربط جهة الاتصال بالعقار",
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "CONTACT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "جهة الاتصال غير موجودة" },
        { status: 404 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "PROPERTY_CONTACT_ALREADY_EXISTS"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "جهة الاتصال مرتبطة بالعقار مسبقاً بنفس الصفة",
        },
        { status: 409 },
      );
    }

    console.error("ADD_PROPERTY_CONTACT_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء ربط جهة الاتصال" },
      { status: 500 },
    );
  }
}
