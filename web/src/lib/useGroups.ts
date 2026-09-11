// React hook: fetch the full groups list once an ID token is available.
//
// Several admin forms (create member, manage eras, upload media) each need
// a group picker. Every call to this hook fetches independently — there is
// no shared cache, and fetch timing (only once idToken is truthy) matches
// the effects this was extracted from exactly.

'use client';

import { useEffect, useState } from 'react';

import { apiFetch } from './api';

export interface GroupOption {
  id: string;
  name: string;
}

/**
 * @param idToken  Cognito ID token (from useAuth()). Fetch is skipped until set.
 * @returns the groups list, populated once the fetch resolves. Stays empty
 *   before idToken is available or if the fetch fails (errors are swallowed,
 *   matching the original call sites' behavior).
 */
export function useGroups(idToken: string | null): { groups: GroupOption[] } {
  const [groups, setGroups] = useState<GroupOption[]>([]);

  useEffect(() => {
    if (!idToken) return;
    apiFetch<{ groups: GroupOption[] }>('/groups', { idToken })
      .then((r) => setGroups(r.groups))
      .catch(() => {});
  }, [idToken]);

  return { groups };
}
