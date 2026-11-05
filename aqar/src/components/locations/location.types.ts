/**
 * Location as returned by GET /api/locations.
 */
export type LocationListItem = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  isActive: boolean;

  _count: {
    properties: number;
  };
};

export type LocationListResponse = {
  success: boolean;
  data?: LocationListItem[];
  message?: string;
};

export type SaveLocationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };
