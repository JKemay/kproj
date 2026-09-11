// Group + member mutation helpers (edit, set cover/profile image).

import type { Group, Member } from '@kproj/db/schema';

import { apiFetch } from './api';

// The API sends these rows through Hono's c.json (JSON.stringify), which
// serializes Date columns to ISO strings on the wire. @kproj/db's inferred
// types use `Date` for `createdAt` because that's the shape drizzle-orm
// hands back server-side, before serialization — so the wire type isn't
// quite the db type. Model that honestly rather than casting straight to
// the db row type.
export type ApiGroup = Omit<Group, 'createdAt'> & { createdAt: string };
export type ApiMember = Omit<Member, 'createdAt'> & { createdAt: string };

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
  return apiFetch<{ group: ApiGroup }>(`/groups/${id}`, {
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
  return apiFetch<{ member: ApiMember }>(`/groups/${groupId}/members/${memberId}`, {
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
