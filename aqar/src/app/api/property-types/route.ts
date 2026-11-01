import { propertyTypeController } from "@/modules/property-types/property-type.controller";

export async function GET(request: Request) {
  return propertyTypeController.getAll(request);
}

export async function POST(request: Request) {
  return propertyTypeController.create(request);
}
