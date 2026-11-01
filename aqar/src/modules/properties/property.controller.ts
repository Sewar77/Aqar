import {
  propertyService,
  propertyOfferingService,
  propertyPhotoService,
} from "./property.service";

import { propertyErrorResponse } from "./property.error";

import {
  createPropertySchema,
  updatePropertySchema,
  listPropertiesQuerySchema,
  createOfferingSchema,
  updateOfferingSchema,
  addPhotoSchema,
  uuidSchema,
} from "./properties.validation";

// Native Response.json() is supported by Next.js Route Handlers.
// We don't need Express's res.json().

function success(data: unknown, status = 200): Response {
  return Response.json(
    {
      success: true,
      data,
    },
    { status },
  );
}

// Validate dynamic route parameters before passing them
// into the service or Prisma.
function parseId(id: string): string {
  return uuidSchema.parse(id);
}

export const propertyController = {
  // GET /api/properties
  async list(request: Request): Promise<Response> {
    try {
      // Next.js provides the standard Web Request object.
      const url = new URL(request.url);

      // Convert URLSearchParams into a plain object.
      const query = Object.fromEntries(url.searchParams.entries());

      const filters = listPropertiesQuerySchema.parse(query);

      const result = await propertyService.list(filters);

      return success(result);
    } catch (error: unknown) {
      return propertyErrorResponse(error);
    }
  },

  // GET /api/properties/:id
  async get(id: string): Promise<Response> {
    try {
      const result = await propertyService.get(parseId(id));

      return success(result);
    } catch (error: unknown) {
      return propertyErrorResponse(error);
    }
  },

  // POST /api/properties
  async create(request: Request): Promise<Response> {
    try {
      // request.json() is asynchronous.
      const body: unknown = await request.json();

      // .parse() checks and transforms the body.
      const input = createPropertySchema.parse(body);

      const result = await propertyService.create(input);

      return success(result, 201);
    } catch (error: unknown) {
      return propertyErrorResponse(error);
    }
  },

  // PATCH /api/properties/:id
  async update(request: Request, id: string): Promise<Response> {
    try {
      const propertyId = parseId(id);

      const body: unknown = await request.json();

      const input = updatePropertySchema.parse(body);

      const result = await propertyService.update(propertyId, input);

      return success(result);
    } catch (error: unknown) {
      return propertyErrorResponse(error);
    }
  },

  // POST /api/properties/:id/offerings
  async addOffering(request: Request, id: string): Promise<Response> {
    try {
      const propertyId = parseId(id);

      const body: unknown = await request.json();

      const input = createOfferingSchema.parse(body);

      const result = await propertyOfferingService.add(propertyId, input);

      return success(result, 201);
    } catch (error: unknown) {
      return propertyErrorResponse(error);
    }
  },

  // PATCH /api/properties/:id/offerings/:offeringId
  async updateOffering(
    request: Request,
    id: string,
    offeringId: string,
  ): Promise<Response> {
    try {
      const propertyId = parseId(id);
      const validOfferingId = parseId(offeringId);

      const body: unknown = await request.json();

      const input = updateOfferingSchema.parse(body);

      const result = await propertyOfferingService.update(
        propertyId,
        validOfferingId,
        input,
      );

      return success(result);
    } catch (error: unknown) {
      return propertyErrorResponse(error);
    }
  },

  // POST /api/properties/:id/photos
  async addPhoto(request: Request, id: string): Promise<Response> {
    try {
      const propertyId = parseId(id);

      const body: unknown = await request.json();

      const input = addPhotoSchema.parse(body);

      const result = await propertyPhotoService.add(propertyId, input);

      return success(result, 201);
    } catch (error: unknown) {
      return propertyErrorResponse(error);
    }
  },

  // DELETE /api/properties/:id/photos/:photoId
  async removePhoto(id: string, photoId: string): Promise<Response> {
    try {
      const result = await propertyPhotoService.remove(
        parseId(id),
        parseId(photoId),
      );

      return success(result);
    } catch (error: unknown) {
      return propertyErrorResponse(error);
    }
  },
};
