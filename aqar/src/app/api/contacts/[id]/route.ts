import { contactController } from "@/src/modules/contacts/contact.controller";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  return contactController.getById(id);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return contactController.update(request, id);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  return contactController.delete(id);
}
