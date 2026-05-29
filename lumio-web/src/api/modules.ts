import { apiFetch } from './client';
import type { ContentStatus } from './paths';

export interface ModuleResponse {
  id: string;
  pathId: string;
  title: string;
  description: string | null;
  thumbnailKey: string | null;
  thumbnail: string | null;
  orderIndex: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleRequest {
  title: string;
  description?: string;
  thumbnail?: string;
  orderIndex: number;
  status: ContentStatus;
}

export function getModules(pathId: string) {
  return apiFetch<ModuleResponse[]>(`/api/v1/paths/${pathId}/modules`);
}

export function getModule(pathId: string, id: string) {
  return apiFetch<ModuleResponse>(`/api/v1/paths/${pathId}/modules/${id}`);
}

export function createModule(pathId: string, data: ModuleRequest) {
  return apiFetch<ModuleResponse>(`/api/v1/paths/${pathId}/modules`, { method: 'POST', body: data });
}

export function updateModule(pathId: string, id: string, data: ModuleRequest) {
  return apiFetch<ModuleResponse>(`/api/v1/paths/${pathId}/modules/${id}`, { method: 'PUT', body: data });
}

export function patchModuleStatus(pathId: string, id: string, status: ContentStatus) {
  return apiFetch<ModuleResponse>(`/api/v1/paths/${pathId}/modules/${id}/status`, { method: 'PATCH', body: { status } });
}

export function deleteModule(pathId: string, id: string) {
  return apiFetch<void>(`/api/v1/paths/${pathId}/modules/${id}`, { method: 'DELETE' });
}
