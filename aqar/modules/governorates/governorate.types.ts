export interface GovernorateFilters {
  isActive?: boolean;
}
export interface GovernorateResponse {
  id: string;
  nameAr: string;
  nameEn: string;
  isActive: true;
  createdAt: Date;
  updatedAt: Date;
}

export interface GovernorateWithCitites extends GovernorateResponse {
  cities: {
    id: string;
    nameAr: string;
    nameEn: string;
    isActive: true;
  }[];
}
