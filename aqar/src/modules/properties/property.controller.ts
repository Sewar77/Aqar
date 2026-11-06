import {
  propertyService,
  propertyOfferingService,
  propertyPhotoService,
} from "./property.service";

import { propertyEditService } from "./property-edit.service";

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

function success(data: unknown, status = 200): Response {
  return Response.json(
    {
      success: true,
      data,
    },
    { status },
  );
}

function parseId(id: string): string {
  return uuidSchema.parse(id);
}

export const propertyController = {
  // GET /api/properties
  async list(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);

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
      const propertyId = parseId(id);

      const result = await propertyService.get(propertyId);

      return success(result);
    } catch (error: unknown) {
      return propertyErrorResponse(error);
    }
  },

  // POST /api/properties
  async create(request: Request): Promise<Response> {
    try {
      const body: unknown = await request.json();

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

      // Advanced changes to contacts, hierarchy,
      // or new locations retain their original
      // specialized transaction logic.
      const complexUpdate =
        input.contacts !== undefined ||
        input.parentPropertyId !== undefined ||
        (input.location !== undefined && "new" in input.location);

      const result = complexUpdate
        ? await propertyService.update(propertyId, input)
        : await propertyEditService.updateBasic(propertyId, input);

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

      const result = await propertyEditService.updateOffering(
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
