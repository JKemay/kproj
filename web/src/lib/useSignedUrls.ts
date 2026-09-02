// React hook: turn S3 keys into signed GET URLs with batching + caching.
//
// Multiple components rendering different keys in the same tick coalesce
// into one POST /media/sign-reads. Signed URLs are cached in-memory until
// they expire; on expiry, the next request re-signs.

'use client';

import { useEffect, useState } from 'react';

import { getSignedUrls } from './media';

// In-memory cache shared across all hook instances in this tab.
// Expiry: ~50 min (URLs are signed for 60 min server-side; 10 min slack).
const CACHE_TTL_MS = 50 * 60 * 1000;

interface CacheEntry {
  url: string;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();

// Batch coalescing — collects keys requested in the same tick.
interface PendingBatch {
  keys: Set<string>;
  resolve: (urls: Record<string, string>) => void;
  reject: (err: unknown) => void;
}
let pending: PendingBatch | null = null;

function fetchBatch(keys: string[], idToken: string): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    if (!pending) {
      pending = { keys: new Set(keys), resolve: () => {}, reject: () => {} };
      // Schedule one flush at end of microtask queue
      queueMicrotask(async () => {
        const batch = pending!;
        pending = null;
        try {
          batch.resolve(await getSignedUrls([...batch.keys], idToken));
        } catch (err) {
          // Without this, a failed sign-reads call settles nothing: every
          // caller awaiting this batch hangs forever and the UI is stuck
          // on "loading" with no error ever surfaced.
          batch.reject(err);
        }
      });
    }
    for (const k of keys) pending.keys.add(k);
    const prevResolve = pending.resolve;
    const prevReject = pending.reject;
    pending.resolve = (urls) => {
      prevResolve(urls);
      resolve(urls);
    };
    pending.reject = (err) => {
      prevReject(err);
      reject(err);
    };
  });
}

/**
 * @param keys  S3 keys to sign. Pass an empty array if not ready yet.
 * @param idToken  Cognito ID token (from useAuth()).
 * @returns map of key → signed URL. Missing entries mean still loading.
 */
export function useSignedUrls(
  keys: string[],
  idToken: string | null | undefined,
): { urls: Record<string, string>; loading: boolean; error: Error | null } {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const keyString = keys.slice().sort().join('|');

  useEffect(() => {
    if (!idToken || keys.length === 0) return;

    const now = Date.now();
    const fresh: Record<string, string> = {};
    const stale: string[] = [];
    for (const k of keys) {
      const hit = cache.get(k);
      if (hit && hit.expiresAt > now) fresh[k] = hit.url;
      else stale.push(k);
    }

    if (Object.keys(fresh).length > 0) {
      // Publishing cache hits is the point of this effect, and the guard keeps
      // it to renders that actually carry new URLs.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUrls((prev) => {
        const changed = Object.keys(fresh).some((k) => prev[k] !== fresh[k]);
        return changed ? { ...prev, ...fresh } : prev;
      });
    }

    if (stale.length === 0) return;

    let cancelled = false;
    setLoading(true);
    fetchBatch(stale, idToken)
      .then((freshUrls) => {
        if (cancelled) return;
        const expiresAt = Date.now() + CACHE_TTL_MS;
        for (const [k, v] of Object.entries(freshUrls)) {
          cache.set(k, { url: v, expiresAt });
        }
        setUrls((prev) => ({ ...prev, ...freshUrls }));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyString, idToken]);

  return { urls, loading, error };
}
