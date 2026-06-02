import { apiFetch } from './client';

export type Vertical = 'language' | 'kids' | 'learners' | 'reader';
export type ContentStatus = 'draft' | 'published' | 'archived';

export interface PathResponse {
  id: string;
  title: string;
  description: string | null;
  vertical: Vertical;
  thumbnailKey: string | null;
  thumbnail: string | null;
  theme: string | null;
  status: ContentStatus;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface PathRequest {
  title: string;
  description?: string;
  vertical: Vertical;
  thumbnail?: string;
  theme?: string;
  status: ContentStatus;
  metadata?: Record<string, unknown>;
}

export function getPaths(params?: { search?: string; vertical?: Vertical; status?: ContentStatus }) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.vertical) qs.set('vertical', params.vertical);
  if (params?.status) qs.set('status', params.status);
  const query = qs.toString();
  return apiFetch<PathResponse[]>(`/api/v1/paths${query ? `?${query}` : ''}`);
}

export function getPath(id: string) {
  return apiFetch<PathResponse>(`/api/v1/paths/${id}`);
}

export function createPath(data: PathRequest) {
  return apiFetch<PathResponse>('/api/v1/paths', { method: 'POST', body: data });
}

export function updatePath(id: string, data: PathRequest) {
  return apiFetch<PathResponse>(`/api/v1/paths/${id}`, { method: 'PUT', body: data });
}

export function patchPathStatus(id: string, status: ContentStatus) {
  return apiFetch<PathResponse>(`/api/v1/paths/${id}/status`, { method: 'PATCH', body: { status } });
}

export function deletePath(id: string) {
  return apiFetch<void>(`/api/v1/paths/${id}`, { method: 'DELETE' });
}
