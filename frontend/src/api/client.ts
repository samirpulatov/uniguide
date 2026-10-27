import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './tokenStorage';
import type { AuthResponse } from '../types';

// Vite proxies /api -> http://localhost:8081 (see vite.config.ts), which sidesteps CORS in dev.
export const apiClient = axios.create({ baseURL: '/api' });

// A second, bare instance for the refresh call itself — it must NOT go through
// the response interceptor below, or a failed refresh would try to refresh itself.
const refreshClient = axios.create({ baseURL: '/api' });

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  // Coalesce concurrent 401s into a single refresh call instead of firing one per request.
  if (!refreshPromise) {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      return Promise.reject(new Error('No refresh token available'));
    }

    refreshPromise = refreshClient
      .post<AuthResponse>('/auth/refresh', null, { params: { refreshToken } })
      .then(({ data }) => {
        tokenStorage.setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;

    if (error.response?.status !== 401 || !config || config._retry) {
      return Promise.reject(error);
    }

    config._retry = true;
    try {
      const newAccessToken = await refreshAccessToken();
      config.headers.set('Authorization', `Bearer ${newAccessToken}`);
      return apiClient(config);
    } catch (refreshError) {
      tokenStorage.clear();
      window.location.assign('/login');
      return Promise.reject(refreshError);
    }
  },
);
