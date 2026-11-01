import { propertyController } from "../../../../../modules/properties/property.controller";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// POST /api/properties/:id/offerings
export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;

  return propertyController.addOffering(request, id);
}
