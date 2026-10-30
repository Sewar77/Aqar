import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const propertyTypes = await prisma.propertyType.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        nameAr: true,
        nameEn: true,
      },
      orderBy: {
        nameAr: "asc",
      },
    });
    return NextResponse.json({
      success: true,
      data: propertyTypes,
    });
  } catch (error) {
    console.error("error getting propetry types", error);
    return NextResponse.json(
      {
        success: false,
        message: "خطأ جلب انواع العقارات ",
      },
      { status: 500 },
    );
  }
}
