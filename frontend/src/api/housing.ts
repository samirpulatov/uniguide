import { apiClient } from './client';
import type { City, HouseType, HousingResponse } from '../types';

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
};
