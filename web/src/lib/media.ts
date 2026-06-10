// Media helpers — batch-shaped from day one so future galleries don't
// trigger N+1 sign-read calls.

import { apiFetch } from './api';

// ----- Types matching the API surface -----

export type AllowedMime =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif'
  | 'image/avif';

export interface UploadSpec {
  clientRef: string;
  file: File;
  groupId: string;
  memberId?: string;
  contentType: AllowedMime;
}

interface SignUploadResult {
  clientRef: string;
  s3Key: string;
  postUrl: string;
  fields: Record<string, string>;
}

interface SignReadsResponse {
  urls: Record<string, string>;
}

interface RegisterMediaBody {
  s3Key: string;
  groupId: string;
  memberId?: string;
  eraId?: string | null;
  kind: 'image' | 'gif' | 'video';
  caption?: string;
  tags?: string[];
}

// ----- Sign + upload (admin only on the server) -----

/**
 * Uploads a batch of files end-to-end:
 *  1. Calls POST /media/sign-uploads to get signed POSTs (one per file).
 *  2. Uploads each file directly to S3 with the signed POST.
 *  3. Returns the s3Keys keyed by clientRef so the caller can register them.
 *
 * Does NOT call POST /media for registration — that's a separate step that
 * usually needs additional metadata (kind, caption) from the UI.
 */
export async function uploadFiles(
  specs: UploadSpec[],
  idToken: string,
): Promise<Record<string, string>> {
  if (specs.length === 0) return {};

  const signed = await apiFetch<{ results: SignUploadResult[] }>('/media/sign-uploads', {
    method: 'POST',
    idToken,
    body: {
      uploads: specs.map((s) => ({
        clientRef: s.clientRef,
        groupId: s.groupId,
        memberId: s.memberId,
        contentType: s.contentType,
        sizeBytes: s.file.size,
      })),
    },
  });

  const byRef = new Map(signed.results.map((r) => [r.clientRef, r]));
  const keys: Record<string, string> = {};

  await Promise.all(
    specs.map(async (spec) => {
      const sig = byRef.get(spec.clientRef);
      if (!sig) throw new Error(`No signed POST for clientRef ${spec.clientRef}`);

      const form = new FormData();
      for (const [k, v] of Object.entries(sig.fields)) form.append(k, v);
      form.append('file', spec.file);

      const res = await fetch(sig.postUrl, { method: 'POST', body: form });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`S3 upload failed (${res.status}): ${body.slice(0, 200)}`);
      }
      keys[spec.clientRef] = sig.s3Key;
    }),
  );

  return keys;
}

export function registerMedia(body: RegisterMediaBody, idToken: string) {
  return apiFetch<{ media: unknown }>('/media', {
    method: 'POST',
    idToken,
    body,
  });
}

// ----- Sign reads (batch) -----

export async function getSignedUrls(
  keys: string[],
  idToken: string,
): Promise<Record<string, string>> {
  if (keys.length === 0) return {};
  // Dedupe — caller might pass dupes from a render loop
  const unique = Array.from(new Set(keys));
  const res = await apiFetch<SignReadsResponse>('/media/sign-reads', {
    method: 'POST',
    idToken,
    body: { keys: unique },
  });
  return res.urls;
}

// ----- Mutations -----

export function deleteMedia(id: string, idToken: string) {
  return apiFetch<{ ok: true }>(`/media/${id}`, { method: 'DELETE', idToken });
}

export interface MediaPatch {
  caption?: string | null;
  eraId?: string | null;
  tags?: string[];
}

/** General media update — caption, era assignment, and/or tags. */
export function updateMedia(id: string, patch: MediaPatch, idToken: string) {
  return apiFetch<{ media: unknown }>(`/media/${id}`, {
    method: 'PATCH',
    idToken,
    body: patch,
  });
}

export function updateMediaCaption(id: string, caption: string | null, idToken: string) {
  return updateMedia(id, { caption }, idToken);
}
