import { NextRequest } from "next/server";
import { cityController } from "@/modules/cities/city.controller";

export async function GET(request: NextRequest) {
  return cityController.getAll(request);
}
