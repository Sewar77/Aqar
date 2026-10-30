import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Context = {
  params: Promise<{
    id: string;
    propertyContactId: string;
  }>;
};

const updateSchema = z
  .object({
    role: z.enum(["OWNER", "CO_OWNER", "AUTHORIZED_REPRESENTATIVE"]).optional(),
    isPrimary: z.boolean().optional(),
    canSharePhone: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0);

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const { id, propertyContactId } = await params;
    const body = await request.json();

    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.propertyContact.findFirst({
      where: {
        id: propertyContactId,
        propertyId: id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "جهة الاتصال غير مرتبطة بهذا العقار" },
        { status: 404 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      if (validation.data.isPrimary === true) {
        await tx.propertyContact.updateMany({
          where: { propertyId: id },
          data: { isPrimary: false },
        });
      }

      return tx.propertyContact.update({
        where: { id: propertyContactId },
        data: validation.data,
        include: { contact: true },
      });
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "تم تعديل جهة الاتصال",
    });
  } catch (error) {
    console.error("UPDATE_PROPERTY_CONTACT_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "تعذر تعديل جهة الاتصال" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const { id, propertyContactId } = await params;

    const existing = await prisma.propertyContact.findFirst({
      where: {
        id: propertyContactId,
        propertyId: id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "جهة الاتصال غير مرتبطة بهذا العقار" },
        { status: 404 },
      );
    }

    await prisma.propertyContact.delete({
      where: { id: propertyContactId },
    });

    return NextResponse.json({
      success: true,
      message: "تم إزالة جهة الاتصال من العقار",
    });
  } catch (error) {
    console.error("DELETE_PROPERTY_CONTACT_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "تعذر إزالة جهة الاتصال" },
      { status: 500 },
    );
  }
}
