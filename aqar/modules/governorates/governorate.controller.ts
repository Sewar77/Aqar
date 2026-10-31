import { NextRequest, NextResponse } from "next/server";
import { governorateService } from "./governorate.service";
import {
  governorateFiltersSchema,
  governorateIdSchema,
} from "./governorate.validator";

export const governorateController = {
  async getAll(request: NextRequest) {
    const rawFilters = {
      isActive: request.nextUrl.searchParams.get("isActive") ?? undefined,
    };

    const validation = governorateFiltersSchema.safeParse(rawFilters);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid query parameters",
          errors: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    try {
      const data = await governorateService.getAll(validation.data);

      return NextResponse.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("GET_GOVERNORATES_ERROR:", error);

      return NextResponse.json(
        { success: false, message: "Failed to fetch governorates" },
        { status: 500 },
      );
    }
  },

  async getById(id: string) {
    const validation = governorateIdSchema.safeParse(id);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Invalid governorate ID" },
        { status: 400 },
      );
    }

    try {
      const data = await governorateService.getById(validation.data);

      if (!data) {
        return NextResponse.json(
          { success: false, message: "Governorate not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("GET_GOVERNORATE_BY_ID_ERROR:", error);

      return NextResponse.json(
        { success: false, message: "Failed to fetch governorate" },
        { status: 500 },
      );
    }
  },
};
