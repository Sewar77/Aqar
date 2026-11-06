import { propertyCreateController } from "@/modules/properties/create/property-create.controller";
import { propertyController } from "../../../modules/properties/property.controller";


export async function GET(request: Request) {
  return propertyController.list(request);
}

export async function POST(request: Request) {
  return propertyCreateController.create(request);
}
