import {
  archivePropertyController,
  getPropertyByIdController,
  updatePropertyController,
} from "@/modules/properties/controllers/property.controller";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return getPropertyByIdController(id);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return updatePropertyController(request, id);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return archivePropertyController(id);
}
