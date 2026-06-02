import { apiFetch } from './client';

export interface CharacterResponse {
  id: string;
  pathId: string;
  slug: string;
  name: string;
  description: string | null;
  personality: string | null;
  avatarPath: string | null;
  voiceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterRequest {
  slug: string;
  name: string;
  description?: string;
  personality?: string;
}

function charsBase(pathId: string) {
  return `/api/v1/paths/${pathId}/characters`;
}

export function getCharacters(pathId: string) {
  return apiFetch<CharacterResponse[]>(charsBase(pathId));
}

export function getCharacter(pathId: string, id: string) {
  return apiFetch<CharacterResponse>(`${charsBase(pathId)}/${id}`);
}

export function createCharacter(pathId: string, data: CharacterRequest) {
  return apiFetch<CharacterResponse>(charsBase(pathId), { method: 'POST', body: data });
}

export function updateCharacter(pathId: string, id: string, data: CharacterRequest) {
  return apiFetch<CharacterResponse>(`${charsBase(pathId)}/${id}`, { method: 'PUT', body: data });
}

export function deleteCharacter(pathId: string, id: string) {
  return apiFetch<void>(`${charsBase(pathId)}/${id}`, { method: 'DELETE' });
}
