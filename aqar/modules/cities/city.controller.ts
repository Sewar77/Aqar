import { NextRequest, NextResponse } from "next/server";
import { cityService } from "./city.service";
import { cityFiltersSchema, cityIdSchema } from "./city.validator";

export const cityController = {
  async getAll(request: NextRequest) {
    const rawFilters = {
      governorateId:
        request.nextUrl.searchParams.get("governorateId") ?? undefined,
      isActive: request.nextUrl.searchParams.get("isActive") ?? undefined,
    };

    const validation = cityFiltersSchema.safeParse(rawFilters);

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
      const data = await cityService.getAll(validation.data);
      if (data === null) {
        return NextResponse.json(
          {
            success: false,
            message: "Governorate not found",
          },
          { status: 404 },
        );
      }
      return NextResponse.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("GET_CITIES_ERROR:", error);

      return NextResponse.json(
        { success: false, message: "Failed to fetch cities" },
        { status: 500 },
      );
    }
  },

  async getById(id: string) {
    const validation = cityIdSchema.safeParse(id);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Invalid city ID" },
        { status: 400 },
      );
    }

    try {
      const data = await cityService.getById(validation.data);

      if (!data) {
        return NextResponse.json(
          { success: false, message: "City not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("GET_CITY_BY_ID_ERROR:", error);

      return NextResponse.json(
        { success: false, message: "Failed to fetch city" },
        { status: 500 },
      );
    }
  },
};
