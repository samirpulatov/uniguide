import { apiClient } from './client';
import type {
  AuthResponse,
  ChangePasswordRequest,
  GetUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
} from '../types';

export const usersApi = {
  getMe: () => apiClient.get<GetUserResponse>('/users/me').then((r) => r.data),

  updateMe: (request: UpdateUserRequest) =>
    apiClient.put<UpdateUserResponse>('/users/me', request).then((r) => r.data),

  // returns a fresh token pair — the backend rotates the refresh token on password change
  changePassword: (request: ChangePasswordRequest) =>
    apiClient.put<AuthResponse>('/users/me/password', request).then((r) => r.data),
};
