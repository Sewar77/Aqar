import { propertyController } from "../../../../../modules/properties/property.controller";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// POST /api/properties/:id/photos
export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;

  return propertyController.addPhoto(request, id);
}
