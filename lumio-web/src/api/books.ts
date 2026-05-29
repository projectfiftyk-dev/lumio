import { apiFetch } from './client';
import type { ContentStatus } from './paths';

const BASE_URL = 'http://localhost:8080';

export interface BookResponse {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  coverImageKey: string | null;
  coverImageUrl: string | null;
  orderIndex: number;
  required: boolean;
  prerequisiteBookIds: string[];
  yamlKey: string | null;
  durationMinutes: number | null;
  level: string | null;
  language: string | null;
  author: string | null;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BookRequest {
  title: string;
  description?: string;
  coverImageKey?: string;
  orderIndex: number;
  required?: boolean;
  prerequisiteBookIds?: string[];
  durationMinutes?: number;
  level?: string;
  language?: string;
  author?: string;
  status: ContentStatus;
}

export interface BookPreviewResponse {
  title: string;
  author: string | null;
  language: string | null;
  description: string | null;
  tags: string[];
  level: string | null;
  coverImage: string | null;
  sceneCount: number | null;
  nodeCount: number | null;
  nodeTypeBreakdown: Record<string, number>;
}

export function getBooks(moduleId: string) {
  return apiFetch<BookResponse[]>(`/api/v1/modules/${moduleId}/books`);
}

export function createBook(moduleId: string, data: BookRequest) {
  return apiFetch<BookResponse>(`/api/v1/modules/${moduleId}/books`, { method: 'POST', body: data });
}

export function updateBook(moduleId: string, id: string, data: BookRequest) {
  return apiFetch<BookResponse>(`/api/v1/modules/${moduleId}/books/${id}`, { method: 'PUT', body: data });
}

export function patchBookStatus(moduleId: string, id: string, status: ContentStatus) {
  return apiFetch<BookResponse>(`/api/v1/modules/${moduleId}/books/${id}/status`, { method: 'PATCH', body: { status } });
}

export function deleteBook(moduleId: string, id: string) {
  return apiFetch<void>(`/api/v1/modules/${moduleId}/books/${id}`, { method: 'DELETE' });
}

export async function previewBookYaml(moduleId: string, file: File): Promise<BookPreviewResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE_URL}/api/v1/modules/${moduleId}/books/upload/preview`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function confirmBookYaml(
  moduleId: string,
  file: File,
  orderIndex: number,
  required: boolean,
): Promise<BookResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(
    `${BASE_URL}/api/v1/modules/${moduleId}/books/upload/confirm?orderIndex=${orderIndex}&required=${required}`,
    { method: 'POST', body: form },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}
