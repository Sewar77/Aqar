import { governorateController } from "@/modules/governorates/governorate.controller";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return await governorateController.getById(id);
  } catch {
    return Response.json(
      { success: false, message: "Failed to fetch governorate" },
      { status: 500 },
    );
  }
}
