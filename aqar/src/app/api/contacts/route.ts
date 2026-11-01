import { contactController } from "@/modules/contacts/contact.controller";

export async function GET(request: Request) {
  return contactController.getAll(request);
}

export async function POST(request: Request) {
  return contactController.create(request);
}
