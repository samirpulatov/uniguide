import { apiClient } from './client';
import type {
  City,
  GuideCategory,
  GuideCreationRequest,
  GuideCreationResponse,
  GuideReviewRequest,
  University,
} from '../types';

export interface GuideFilters {
  city?: City;
  category?: GuideCategory;
  university?: University;
}

export const guidesApi = {
  getAll: (filters: GuideFilters = {}) =>
    apiClient
      .get<GuideCreationResponse[]>('/guides', { params: filters })
      .then((r) => r.data),

  getMine: () => apiClient.get<GuideCreationResponse[]>('/guides/me').then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<GuideCreationResponse>(`/guides/${id}`).then((r) => r.data),

  create: (request: GuideCreationRequest) =>
    apiClient.post<GuideCreationResponse>('/guides', request).then((r) => r.data),

  update: (id: number, request: GuideCreationRequest) =>
    apiClient.put<GuideCreationResponse>(`/guides/${id}`, request).then((r) => r.data),

  remove: (id: number) => apiClient.delete<void>(`/guides/${id}`).then((r) => r.data),
};

export const adminGuidesApi = {
  getAll: () => apiClient.get<GuideCreationResponse[]>('/admin/guides').then((r) => r.data),

  review: (id: number, request: GuideReviewRequest) =>
    apiClient
      .post<GuideCreationResponse>(`/admin/guides/${id}/review`, request)
      .then((r) => r.data),
};
