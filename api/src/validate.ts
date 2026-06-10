// S3-event Lambda: magic-byte validation for uploaded media.
//
// The presigned-POST upload flow can only enforce the *declared* Content-Type;
// a renamed .exe with Content-Type: image/png sails through. This Lambda runs
// after every ObjectCreated event, reads the first 32 bytes with a ranged GET,
// and checks them against the extension the server put on the key. On a
// mismatch it deletes the object and any media row that references it.
//
// Runs in the VPC (subnet B) so it can reach RDS; S3 via the gateway endpoint.

import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { media } from '@kproj/db/schema';
import type { S3Event } from 'aws-lambda';
import { eq } from 'drizzle-orm';

import { getDb } from './db/client.js';

const s3 = new S3Client({});

type Check = (b: Uint8Array) => boolean;

const ascii = (b: Uint8Array, start: number, text: string) =>
  text.split('').every((ch, i) => b[start + i] === ch.charCodeAt(0));

// extension (from the server-generated key) → magic-byte check
const CHECKS: Record<string, Check> = {
  jpg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  png: (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  gif: (b) => ascii(b, 0, 'GIF87a') || ascii(b, 0, 'GIF89a'),
  webp: (b) => ascii(b, 0, 'RIFF') && ascii(b, 8, 'WEBP'),
  // ISO-BMFF: bytes 4-7 "ftyp", brand at 8-11 is avif or avis (image sequence)
  avif: (b) => ascii(b, 4, 'ftyp') && (ascii(b, 8, 'avif') || ascii(b, 8, 'avis')),
};

async function headBytes(bucket: string, key: string): Promise<Uint8Array | null> {
  try {
    const res = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key, Range: 'bytes=0-31' }),
    );
    const body = await res.Body?.transformToByteArray();
    return body ?? null;
  } catch (err) {
    console.error(`[validate] ranged GET failed for ${key}:`, err);
    return null;
  }
}

export const handler = async (event: S3Event) => {
  for (const record of event.Records ?? []) {
    const bucket = record.s3.bucket.name;
    // S3 event keys are URL-encoded (spaces become '+')
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    const ext = key.split('.').pop()?.toLowerCase() ?? '';
    const check = CHECKS[ext];
    if (!check) {
      // Unknown extension — server-side key generation should make this
      // impossible; delete defensively.
      console.warn(`[validate] unknown extension on ${key} — deleting`);
      await remove(bucket, key);
      continue;
    }

    const bytes = await headBytes(bucket, key);
    if (!bytes || bytes.length < 12) {
      console.warn(`[validate] unreadable/too-short object ${key} — deleting`);
      await remove(bucket, key);
      continue;
    }

    if (!check(bytes)) {
      console.warn(`[validate] magic-byte mismatch for ${key} (claims .${ext}) — deleting`);
      await remove(bucket, key);
      continue;
    }

    console.log(`[validate] ok: ${key}`);
  }
  return { ok: true };
};

async function remove(bucket: string, key: string) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    console.error(`[validate] S3 delete failed for ${key}:`, err);
  }
  try {
    const db = await getDb();
    await db.delete(media).where(eq(media.s3Key, key));
  } catch (err) {
    console.error(`[validate] DB row delete failed for ${key}:`, err);
  }
}
