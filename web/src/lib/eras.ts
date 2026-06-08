// Era CRUD helpers. Eras are album/comeback cycles scoped to a group.

import { apiFetch } from './api';

export interface Era {
  id: string;
  groupId: string;
  label: string;
  releaseDate: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface EraInput {
  label: string;
  releaseDate?: string | null;
  sortOrder?: number;
}

export function listEras(groupId: string, idToken: string) {
  return apiFetch<{ eras: Era[] }>(`/groups/${groupId}/eras`, { idToken });
}

export function createEra(groupId: string, input: EraInput, idToken: string) {
  return apiFetch<{ era: Era }>(`/groups/${groupId}/eras`, {
    method: 'POST',
    idToken,
    body: input,
  });
}

export function updateEra(eraId: string, patch: Partial<EraInput>, idToken: string) {
  return apiFetch<{ era: Era }>(`/eras/${eraId}`, {
    method: 'PATCH',
    idToken,
    body: patch,
  });
}

export function deleteEra(eraId: string, idToken: string) {
  return apiFetch<{ ok: true }>(`/eras/${eraId}`, { method: 'DELETE', idToken });
}
