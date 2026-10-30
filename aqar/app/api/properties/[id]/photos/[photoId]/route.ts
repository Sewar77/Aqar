import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{
    id: string;
    photoId: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const { id, photoId } = await params;
    const body = await request.json();

    if (typeof body.isPrimary !== "boolean") {
      return NextResponse.json(
        { success: false, message: "isPrimary يجب أن تكون Boolean" },
        { status: 400 },
      );
    }

    const photo = await prisma.propertyPhoto.findFirst({
      where: {
        id: photoId,
        propertyId: id,
      },
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, message: "الصورة غير موجودة" },
        { status: 404 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (body.isPrimary) {
        await tx.propertyPhoto.updateMany({
          where: { propertyId: id },
          data: { isPrimary: false },
        });
      }

      return tx.propertyPhoto.update({
        where: { id: photoId },
        data: { isPrimary: body.isPrimary },
      });
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "تم تحديث الصورة",
    });
  } catch (error) {
    console.error("UPDATE_PROPERTY_PHOTO_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "تعذر تحديث الصورة" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const { id, photoId } = await params;

    const photo = await prisma.propertyPhoto.findFirst({
      where: {
        id: photoId,
        propertyId: id,
      },
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, message: "الصورة غير موجودة" },
        { status: 404 },
      );
    }

    await prisma.propertyPhoto.delete({
      where: { id: photoId },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف بيانات الصورة",
      storageKey: photo.storageKey,
    });
  } catch (error) {
    console.error("DELETE_PROPERTY_PHOTO_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "تعذر حذف الصورة" },
      { status: 500 },
    );
  }
}
