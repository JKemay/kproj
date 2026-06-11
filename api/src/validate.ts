// S3-event Lambda: magic-byte validation + thumbnail generation.
//
// Validation: the presigned-POST upload flow can only enforce the *declared*
// Content-Type; a renamed .exe with Content-Type: image/png sails through.
// This Lambda runs after every ObjectCreated event, reads the first 32 bytes
// with a ranged GET, and checks them against the extension the server put on
// the key. On a mismatch it deletes the object and any media row referencing it.
//
// Thumbnails: originals that pass validation (except GIFs — resizing would
// lose animation) get a 480px-wide WebP written to derived/<key>.thumb.webp.
// Keys under derived/ are skipped entirely, which is also the recursion guard
// for this Lambda's own writes. sharp comes from the kproj-sharp layer.
//
// Runs in the VPC (subnet B) so it can reach RDS; S3 via the gateway endpoint.

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { groups, media, members } from '@kproj/db/schema';
import type { S3Event } from 'aws-lambda';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';

import { getDb } from './db/client.js';

const s3 = new S3Client({});

export const DERIVED_PREFIX = 'derived/';
const THUMB_WIDTH = 480;
const THUMB_QUALITY = 78;
// Extensions worth thumbnailing. GIFs keep their animation by serving the original.
const THUMBABLE = new Set(['jpg', 'png', 'webp', 'avif']);

export function thumbKey(originalKey: string): string {
  return `${DERIVED_PREFIX}${originalKey}.thumb.webp`;
}

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

    // Our own derivative writes — never reprocess (recursion guard).
    if (key.startsWith(DERIVED_PREFIX)) continue;

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

    if (THUMBABLE.has(ext)) {
      await makeThumb(bucket, key);
    }
  }
  return { ok: true };
};

async function makeThumb(bucket: string, key: string) {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const body = await res.Body?.transformToByteArray();
    if (!body) return;

    const thumb = await sharp(body)
      .rotate() // respect EXIF orientation
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY })
      .toBuffer();

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: thumbKey(key),
        Body: thumb,
        ContentType: 'image/webp',
        CacheControl: 'max-age=31536000, immutable',
      }),
    );
    console.log(`[thumb] ${key} → ${thumbKey(key)} (${thumb.length}b)`);
  } catch (err) {
    // Valid magic bytes but undecodable (truncated, exotic features) — keep
    // the original, just skip the derivative. Grids fall back to the original.
    console.error(`[thumb] failed for ${key}:`, err);
  }
}

async function remove(bucket: string, key: string) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    console.error(`[validate] S3 delete failed for ${key}:`, err);
  }
  try {
    const db = await getDb();
    // Clear any profile/cover references first so nothing dangles (mirrors
    // the API's DELETE /media/:id behavior), then drop the row itself.
    await db.update(members).set({ profileMediaKey: null }).where(eq(members.profileMediaKey, key));
    await db.update(groups).set({ coverMediaKey: null }).where(eq(groups.coverMediaKey, key));
    await db.delete(media).where(eq(media.s3Key, key));
  } catch (err) {
    console.error(`[validate] DB cleanup failed for ${key}:`, err);
  }
}
