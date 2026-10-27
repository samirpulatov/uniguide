import { apiClient } from './client';
import type { HousingPhotoResponse } from '../types';

// All photo endpoints require login. The image bytes go through apiClient (not a plain <img src>),
// so the JWT is attached and an expired token is refreshed like for any other request.
export const housingPhotosApi = {
  // oldest first
  getPhotos: (housingId: number) =>
    apiClient.get<HousingPhotoResponse[]>(`/housing/${housingId}/photos`).then((r) => r.data),

  getPhotoBlob: (photoId: string, signal?: AbortSignal) =>
    apiClient.get<Blob>(`/housing/photos/${photoId}`, { responseType: 'blob', signal }).then((r) => r.data),

  uploadPhoto: (housingId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<HousingPhotoResponse>(`/housing/${housingId}/photos`, formData).then((r) => r.data);
  },

  deletePhoto: (housingId: number, photoId: string) =>
    apiClient.delete<void>(`/housing/${housingId}/photos/${photoId}`).then((r) => r.data),
};
