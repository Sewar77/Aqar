import {
  createPropertyController,
  getPropertiesController,
} from "@/modules/properties/controllers/property.controller";

export async function GET(request: Request) {
  return getPropertiesController(request);
}

export async function POST(request: Request) {
  return createPropertyController(request);
}
