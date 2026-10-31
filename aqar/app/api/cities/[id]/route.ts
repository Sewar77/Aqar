import { cityController } from "@/modules/cities/city.controller";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return cityController.getById(id);
}
