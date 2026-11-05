/** The minimal view model returned by GET /api/contacts. */
export type ContactListItem = {
  id: string;
  fullName: string;
  phone: string;
  alternativePhone: string | null;
  email: string | null;
  notes: string | null;
  propertyCount: number;
};

export type ContactPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ContactListResponse = {
  success: boolean;
  data: ContactListItem[];
  pagination: ContactPagination;
  message?: string;
};

export type SaveContactResult =
  | { ok: true }
  | {
      ok: false;
      status: number;
      message: string;
    };
