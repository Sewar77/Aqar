import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
// this is to check health only.
export async function GET() {
  try {
    await prisma.$queryRaw`select 1`;

    return NextResponse.json({ statu: "success", datbase: "connected!" });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { statu: "error", datbase: "disconnect!" },
      { status: 500 },
    );
  }
}
//get name should be capotal letters.
