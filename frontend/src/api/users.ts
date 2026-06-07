import { apiClient } from './client';
import type { GetUserResponse, UpdateUserRequest, UpdateUserResponse } from '../types';

export const usersApi = {
  getMe: () => apiClient.get<GetUserResponse>('/users/me').then((r) => r.data),

  updateMe: (request: UpdateUserRequest) =>
    apiClient.put<UpdateUserResponse>('/users/me', request).then((r) => r.data),
};
