// Group + member mutation helpers (edit, set cover/profile image).

import { apiFetch } from './api';

export interface GroupPatch {
  name?: string;
  debutYear?: number | null;
  agency?: string | null;
  coverMediaKey?: string | null;
}

export interface MemberPatch {
  stageName?: string;
  position?: string | null;
  bio?: string | null;
  profileMediaKey?: string | null;
}

export function updateGroup(id: string, patch: GroupPatch, idToken: string) {
  return apiFetch<{ group: unknown }>(`/groups/${id}`, {
    method: 'PATCH',
    idToken,
    body: patch,
  });
}

export function updateMember(
  groupId: string,
  memberId: string,
  patch: MemberPatch,
  idToken: string,
) {
  return apiFetch<{ member: unknown }>(`/groups/${groupId}/members/${memberId}`, {
    method: 'PATCH',
    idToken,
    body: patch,
  });
}

/** Convenience: set a member's profile photo to an already-uploaded media key. */
export function setMemberProfile(
  groupId: string,
  memberId: string,
  s3Key: string,
  idToken: string,
) {
  return updateMember(groupId, memberId, { profileMediaKey: s3Key }, idToken);
}
