import { propertyController } from "../../../../../../modules/properties/property.controller";

type RouteContext = {
  params: Promise<{
    id: string;
    photoId: string;
  }>;
};

// DELETE /api/properties/:id/photos/:photoId
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id, photoId } = await params;

  return propertyController.removePhoto(id, photoId);
}
