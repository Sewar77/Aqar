export type CreateLocationInput = {
  nameAr: string;
  nameEn?: string | null;
};

export type UpdateLocationInput = {
  nameAr?: string;
  nameEn?: string | null;
  isActive?: boolean;
};

export type LocationListFilters = {
  search?: string;
  isActive?: boolean;
  //   filter active/inactive locations
};
