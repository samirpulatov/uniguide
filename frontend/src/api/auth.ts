import { apiClient } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types';

export const authApi = {
  register: (request: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', request).then((r) => r.data),

  login: (request: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', request).then((r) => r.data),
};
