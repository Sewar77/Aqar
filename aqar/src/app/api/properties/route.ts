import { propertyController } from "../../../modules/properties/property.controller";

// GET /api/properties
export async function GET(request: Request) {
  return propertyController.list(request);
}

// POST /api/properties
export async function POST(request: Request) {
  return propertyController.create(request);
}
