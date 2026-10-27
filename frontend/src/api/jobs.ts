import { apiClient } from './client';
import type { City, JobType, JobVacancyRequest, JobVacancyResponse } from '../types';

// Query params of GET /jobs (JobVacancyFilter on the backend). Omitted = no filter.
// minSalaryPerHour is inclusive.
export interface JobFilters {
  city?: City;
  jobType?: JobType;
  minSalaryPerHour?: number;
}

// Reading is public; /jobs/me and every write need a login
export const jobsApi = {
  // newest first
  getAll: (filters: JobFilters = {}) =>
    apiClient.get<JobVacancyResponse[]>('/jobs', { params: filters }).then((r) => r.data),

  // vacancies of the current user (from the JWT)
  getMine: () => apiClient.get<JobVacancyResponse[]>('/jobs/me').then((r) => r.data),

  getById: (id: number) => apiClient.get<JobVacancyResponse>(`/jobs/${id}`).then((r) => r.data),

  create: (request: JobVacancyRequest) =>
    apiClient.post<JobVacancyResponse>('/jobs', request).then((r) => r.data),

  // full replacement: every field is sent, not only the changed ones
  update: (id: number, request: JobVacancyRequest) =>
    apiClient.put<JobVacancyResponse>(`/jobs/${id}`, request).then((r) => r.data),

  remove: (id: number) => apiClient.delete<void>(`/jobs/${id}`).then((r) => r.data),
};
