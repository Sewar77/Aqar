import { governorateController } from "@/modules/governorates/governorate.controller";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    return await governorateController.getAll(request);
  } catch {
    return Response.json(
      { success: false, message: "Failed to fetch governorates" },
      { status: 500 },
    );
  }
}
