import { apiUpload } from './client';

export interface MediaUploadResponse {
  key: string;
  url: string;
}

export function uploadMedia(file: File) {
  return apiUpload<MediaUploadResponse>('/api/v1/media/upload', file);
}
