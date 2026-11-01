import { propertyController } from "../../../../modules/properties/property.controller";

// In current Next.js App Router versions,
// dynamic route params are asynchronous.

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/properties/:id
export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  return propertyController.get(id);
}

// PATCH /api/properties/:id
export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;

  return propertyController.update(request, id);
}
