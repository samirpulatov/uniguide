import { isAxiosError } from 'axios';
import type { ErrorResponse } from '../types';

// The backend always returns { status, error, message, path, timestamp } (see GlobalExceptionHandler).
// Pull the human-readable `message` out of it, falling back when the response isn't in that shape
// (e.g. a network error or a 401 the interceptor already redirected away from).
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ErrorResponse>(error) && error.response?.data?.message) {
    return error.response.data.message;
  }
  return fallback;
}
