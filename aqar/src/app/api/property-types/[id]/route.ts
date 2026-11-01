import { propertyTypeController } from "@/modules/property-types/property-type.controller";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  return propertyTypeController.getById(id);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return propertyTypeController.update(request, id);
}
