import { locationController } from "@/modules/locations/location.controller";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return locationController.getById(id);
}
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return locationController.update(request, id);
}
