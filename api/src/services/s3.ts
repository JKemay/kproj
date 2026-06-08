// S3 signing helpers — server is the only entity that ever produces an S3 key
// or signs a URL. The client never controls the path and never sees AWS creds.

import { randomUUID } from 'node:crypto';

import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET: string = (() => {
  const v = process.env.S3_BUCKET;
  if (!v) throw new Error('S3_BUCKET env var is required');
  return v;
})();

const REGION = process.env.AWS_REGION ?? 'us-east-1';
const s3 = new S3Client({ region: REGION });

// Allowlist of MIME → extension. Extension is derived server-side from MIME;
// we never trust the original filename's extension.
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

export type AllowedMime = keyof typeof MIME_EXT;

export const ALLOWED_MIMES = Object.keys(MIME_EXT) as AllowedMime[];

export function isAllowedMime(t: string): t is AllowedMime {
  return t in MIME_EXT;
}

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB
const UPLOAD_TTL_SECONDS = 300; // 5 min — also enforced by the POST policy
const READ_TTL_SECONDS = 3600; // 1 hr — within the bucket policy's signatureAge ceiling

/**
 * Build a server-controlled S3 key. The client supplies group + (optional)
 * member identifiers and we generate the rest. UUID + MIME-derived extension
 * eliminate collisions and prevent extension spoofing.
 */
export function buildKey(groupId: string, memberId: string | null, mime: AllowedMime): string {
  const ext = MIME_EXT[mime];
  const uuid = randomUUID();
  return memberId
    ? `groups/${groupId}/members/${memberId}/${uuid}.${ext}`
    : `groups/${groupId}/${uuid}.${ext}`;
}

/**
 * Pre-signed POST with size + content-type enforcement at the S3 edge.
 * The browser uses the returned URL + fields to upload directly.
 */
export async function signUpload(key: string, contentType: AllowedMime) {
  return createPresignedPost(s3, {
    Bucket: BUCKET,
    Key: key,
    Conditions: [
      ['content-length-range', 1, MAX_UPLOAD_BYTES],
      ['eq', '$Content-Type', contentType],
    ],
    Fields: { 'Content-Type': contentType },
    Expires: UPLOAD_TTL_SECONDS,
  });
}

/** Short-lived signed GET. The bucket policy caps signature age at 1h regardless. */
export async function signRead(key: string): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn: READ_TTL_SECONDS,
  });
}

/** Permanently delete an object. Versioning is on, so a delete marker is added. */
export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
