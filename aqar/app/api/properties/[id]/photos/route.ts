import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Context = {
  params: Promise<{ id: string }>;
};

const photoSchema = z.object({
  storageKey: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().optional(),
  sizeBytes: z.number().int().positive().optional(),
  sortOrder: z.number().int().default(0),
  isPrimary: z.boolean().default(false),
});

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;

    const photos = await prisma.propertyPhoto.findMany({
      where: { propertyId: id },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: photos,
    });
  } catch (error) {
    console.error("GET_PROPERTY_PHOTOS_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "تعذر جلب الصور" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = photoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "بيانات الصورة غير صحيحة",
          errors: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

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

    const data = validation.data;

    const photo = await prisma.$transaction(async (tx) => {
      if (data.isPrimary) {
        await tx.propertyPhoto.updateMany({
          where: { propertyId: id },
          data: { isPrimary: false },
        });
      }

      return tx.propertyPhoto.create({
        data: {
          propertyId: id,
          storageKey: data.storageKey,
          fileName: data.fileName,
          mimeType: data.mimeType,
          sizeBytes: data.sizeBytes,
          sortOrder: data.sortOrder,
          isPrimary: data.isPrimary,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم حفظ بيانات الصورة",
        data: photo,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("ADD_PROPERTY_PHOTO_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "تعذر حفظ الصورة" },
      { status: 500 },
    );
  }
}
