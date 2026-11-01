import { locationController } from "@/modules/locations/location.controller";

export async function GET(request: Request) {
  return locationController.getAll(request);
}

export async function POST(request: Request) {
  return locationController.create(request);
}
