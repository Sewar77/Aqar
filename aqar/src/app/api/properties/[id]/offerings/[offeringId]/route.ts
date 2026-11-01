import { propertyController } from "../../../../../../modules/properties/property.controller";

type RouteContext = {
  params: Promise<{
    id: string;
    offeringId: string;
  }>;
};

// PATCH /api/properties/:id/offerings/:offeringId
export async function PATCH(request: Request, { params }: RouteContext) {
  const { id, offeringId } = await params;

  return propertyController.updateOffering(request, id, offeringId);
}
