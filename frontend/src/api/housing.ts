import { apiClient } from './client';
import type { City, HouseType, HousingRequest, HousingResponse } from '../types';

// Query params of GET /housing (HousingFilter on the backend). Omitted = no filter.
// Rent bounds are inclusive, minArea is inclusive, maxArea is exclusive.
export interface HousingFilters {
  city?: City;
  houseType?: HouseType;
  minWarmRent?: number;
  maxWarmRent?: number;
  minArea?: number;
  maxArea?: number;
}

// Every housing endpoint requires login
export const housingApi = {
  getAll: (filters: HousingFilters = {}) =>
    apiClient.get<HousingResponse[]>('/housing', { params: filters }).then((r) => r.data),

  // listings of the current user (from the JWT)
  getMine: () => apiClient.get<HousingResponse[]>('/housing/me').then((r) => r.data),

  getById: (id: number) => apiClient.get<HousingResponse>(`/housing/${id}`).then((r) => r.data),

  create: (request: HousingRequest) =>
    apiClient.post<HousingResponse>('/housing', request).then((r) => r.data),

  // full replacement: every field is sent, not only the changed ones
  update: (id: number, request: HousingRequest) =>
    apiClient.put<HousingResponse>(`/housing/${id}`, request).then((r) => r.data),

  // also deletes the listing's photos on the backend
  remove: (id: number) => apiClient.delete<void>(`/housing/${id}`).then((r) => r.data),
};
