import { apiFetch, apiUpload } from './client';
import type { ContentStatus } from './paths';

const BASE_URL = 'http://localhost:8080';

export interface BookResponse {
  id: string;
  moduleId: string;
  pathId: string;
  title: string;
  description: string | null;
  coverImageKey: string | null;
  coverImageUrl: string | null;
  orderIndex: number;
  required: boolean;
  prerequisiteBookIds: string[];
  yamlKey: string | null;
  yamlUrl: string | null;
  durationMinutes: number | null;
  level: string | null;
  language: string | null;
  author: string | null;
  status: ContentStatus;
  assets: Record<string, string>;
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

export interface BookValidationResponse {
  ready: boolean;
  structuralErrors: string[];
  warnings: string[];
  checklist: Record<string, boolean>;
}

export interface CharacterDataDto {
  slug: string;
  name: string;
  personality: string | null;
}

export interface CharacterConflictDto {
  status: 'NEW' | 'IDENTICAL' | 'CONFLICT';
  characterId: string | null;
  existing: CharacterDataDto | null;
  incoming: CharacterDataDto;
  diff: Record<string, { existing: string | null; incoming: string | null }> | null;
}

export interface ImportPreviewResponse {
  scenesCount: number;
  nodesCount: number;
  charactersInYaml: CharacterDataDto[];
  characterConflicts: CharacterConflictDto[];
  structuralErrors: string[];
  warnings: string[];
}

export interface CharacterResolutionDto {
  characterId: string;
  resolution: 'KEEP_EXISTING' | 'USE_INCOMING';
}

export interface ImportCommitRequest {
  yaml: string;
  characterResolutions: CharacterResolutionDto[];
}

function booksBase(pathId: string, moduleId: string) {
  return `/api/v1/paths/${pathId}/modules/${moduleId}/books`;
}

export function getBooks(pathId: string, moduleId: string) {
  return apiFetch<BookResponse[]>(booksBase(pathId, moduleId));
}

export function createBook(pathId: string, moduleId: string, data: BookRequest) {
  return apiFetch<BookResponse>(booksBase(pathId, moduleId), { method: 'POST', body: data });
}

export function updateBook(pathId: string, moduleId: string, id: string, data: BookRequest) {
  return apiFetch<BookResponse>(`${booksBase(pathId, moduleId)}/${id}`, { method: 'PUT', body: data });
}

export function patchBookStatus(pathId: string, moduleId: string, id: string, status: ContentStatus) {
  return apiFetch<BookResponse>(`${booksBase(pathId, moduleId)}/${id}/status`, { method: 'PATCH', body: { status } });
}

export function deleteBook(pathId: string, moduleId: string, id: string) {
  return apiFetch<void>(`${booksBase(pathId, moduleId)}/${id}`, { method: 'DELETE' });
}

export function validateBook(pathId: string, moduleId: string, id: string) {
  return apiFetch<BookValidationResponse>(`${booksBase(pathId, moduleId)}/${id}/validate`);
}

export async function importPreview(pathId: string, moduleId: string, id: string, file: File): Promise<ImportPreviewResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE_URL}${booksBase(pathId, moduleId)}/${id}/import/preview`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export function importCommit(pathId: string, moduleId: string, id: string, body: ImportCommitRequest) {
  return apiFetch<BookResponse>(`${booksBase(pathId, moduleId)}/${id}/import/commit`, { method: 'POST', body });
}

export async function previewBookYaml(pathId: string, moduleId: string, file: File): Promise<BookPreviewResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE_URL}${booksBase(pathId, moduleId)}/upload/preview`, {
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
  pathId: string,
  moduleId: string,
  file: File,
  orderIndex: number,
  required: boolean,
): Promise<BookResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(
    `${BASE_URL}${booksBase(pathId, moduleId)}/upload/confirm?orderIndex=${orderIndex}&required=${required}`,
    { method: 'POST', body: form },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function uploadBookCover(pathId: string, moduleId: string, id: string, file: File): Promise<BookResponse> {
  return apiUpload<BookResponse>(`${booksBase(pathId, moduleId)}/${id}/cover`, file);
}

export async function uploadBookYaml(pathId: string, moduleId: string, id: string, file: File): Promise<BookResponse> {
  return apiUpload<BookResponse>(`${booksBase(pathId, moduleId)}/${id}/yaml`, file);
}
