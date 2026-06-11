// Media routes: sign-uploads, sign-reads, register.
// All paths require verifyJwt + requireAllowed via the parent app;
// mutations layer requireAdmin on top.

import { randomUUID } from 'node:crypto';

import { zValidator } from '@hono/zod-validator';
import { groups, media, members } from '@kproj/db/schema';
import { and, desc, eq, isNull, ne } from 'drizzle-orm';
import { Hono } from 'hono';

import { getDb } from '../db/client.js';
import {
  HEAVEN_GROUP_ID,
  HEAVEN_KEY_PREFIX,
  isAdminEmail,
  requireAdmin,
} from '../middleware/requireAdmin.js';
import {
  registerMediaBody,
  signReadsBody,
  signUploadsBody,
  updateMediaBody,
} from '../schemas/media.js';
import { buildKey, deleteObject, isAllowedMime, signRead, signUpload } from '../services/s3.js';
import type { AppEnv } from '../types.js';

const route = new Hono<AppEnv>();

// GET /media/recent?limit=N — newest media across the whole archive (allowlisted).
// Used by the dashboard's "recently added" strip.
route.get('/recent', async (c) => {
  const limitRaw = Number.parseInt(c.req.query('limit') ?? '20', 10);
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 20, 1), 50);
  const db = await getDb();
  const isAdmin = isAdminEmail(c.get('user').email);
  const rows = await db
    .select()
    .from(media)
    .where(isAdmin ? undefined : ne(media.groupId, HEAVEN_GROUP_ID))
    .orderBy(desc(media.uploadedAt))
    .limit(limit);
  return c.json({ media: rows });
});

// GET /media?groupId=X[&memberId=Y][&groupOnly=1][&eraId=Z] — list media.
// Newest-first. Caller signs s3Key → URL via /media/sign-reads.
//   memberId=Y   → media tagged to that member
//   groupOnly=1  → group-level media only (no member) — e.g. "Group Photos"
//   eraId=Z      → additionally restrict to that era
//   neither      → all media in the group
route.get('/', async (c) => {
  const groupId = c.req.query('groupId');
  const memberId = c.req.query('memberId');
  const eraId = c.req.query('eraId');
  const groupOnly = c.req.query('groupOnly') === '1';
  if (!groupId) return c.json({ error: 'groupId query param required' }, 400);
  if (groupId === HEAVEN_GROUP_ID && !isAdminEmail(c.get('user').email)) {
    return c.json({ error: 'Not found' }, 404);
  }

  const conds = [eq(media.groupId, groupId)];
  if (memberId) conds.push(eq(media.memberId, memberId));
  else if (groupOnly) conds.push(isNull(media.memberId));
  if (eraId) conds.push(eq(media.eraId, eraId));

  const db = await getDb();
  const rows = await db
    .select()
    .from(media)
    .where(and(...conds))
    .orderBy(desc(media.uploadedAt));
  return c.json({ media: rows });
});

// POST /media/sign-uploads — admin only
route.post('/sign-uploads', requireAdmin, zValidator('json', signUploadsBody), async (c) => {
  const body = c.req.valid('json');

  const results = await Promise.all(
    body.uploads.map(async (u) => {
      // contentType was validated against ALLOWED_MIMES already, but narrow the type
      if (!isAllowedMime(u.contentType)) {
        throw new Error(`unreachable: ${u.contentType} passed validator`);
      }
      const key = buildKey(u.groupId, u.memberId ?? null, u.contentType);
      const { url, fields } = await signUpload(key, u.contentType);
      return {
        clientRef: u.clientRef,
        s3Key: key,
        postUrl: url,
        fields,
      };
    }),
  );

  return c.json({ results });
});

// POST /media/sign-reads — any allowlisted user.
// Heaven keys are admin-only: a leaked key must not be signable by others.
route.post('/sign-reads', zValidator('json', signReadsBody), async (c) => {
  const body = c.req.valid('json');
  if (
    !isAdminEmail(c.get('user').email) &&
    body.keys.some(
      (k) => k.startsWith(HEAVEN_KEY_PREFIX) || k.startsWith(`derived/${HEAVEN_KEY_PREFIX}`),
    )
  ) {
    return c.json({ error: 'Not found', code: 'FORBIDDEN_KEY' }, 404);
  }
  const entries = await Promise.all(
    body.keys.map(async (key) => [key, await signRead(key)] as const),
  );
  const urls = Object.fromEntries(entries);
  return c.json({ urls });
});

// POST /media — register an uploaded blob in the DB (admin only)
// The upload itself happens in the browser via the signed POST; this call
// just records the resulting key + metadata.
route.post('/', requireAdmin, zValidator('json', registerMediaBody), async (c) => {
  const body = c.req.valid('json');
  const db = await getDb();

  const [g] = await db.select().from(groups).where(eq(groups.id, body.groupId)).limit(1);
  if (!g) return c.json({ error: 'Group not found' }, 404);

  if (body.memberId) {
    const [m] = await db
      .select()
      .from(members)
      .where(and(eq(members.groupId, body.groupId), eq(members.id, body.memberId)))
      .limit(1);
    if (!m) return c.json({ error: 'Member not found in this group' }, 404);
  }

  try {
    const [row] = await db
      .insert(media)
      .values({
        id: randomUUID(),
        s3Key: body.s3Key,
        groupId: body.groupId,
        memberId: body.memberId ?? null,
        eraId: body.eraId ?? null,
        kind: body.kind,
        caption: body.caption,
        tags: body.tags ?? [],
        uploadedBy: c.get('user').id,
      })
      .returning();
    return c.json({ media: row }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('duplicate key') || msg.includes('23505')) {
      return c.json(
        { error: 'Media already registered for this s3 key', code: 'DUPLICATE' },
        409,
      );
    }
    throw err;
  }
});

// PATCH /media/:id — edit caption (admin only).
route.patch('/:id', requireAdmin, zValidator('json', updateMediaBody), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  if (Object.keys(body).length === 0) return c.json({ error: 'No fields to update' }, 400);
  const db = await getDb();
  const [row] = await db.update(media).set(body).where(eq(media.id, id)).returning();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ media: row });
});

// DELETE /media/:id — remove the S3 object + DB row (admin only).
// Also clears any member.profileMediaKey / group.coverMediaKey that pointed at
// this object, so no dangling cover/profile references remain.
route.delete('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const db = await getDb();

  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!row) return c.json({ error: 'Not found' }, 404);

  // Clear references first (idempotent even if none match).
  await db
    .update(members)
    .set({ profileMediaKey: null })
    .where(eq(members.profileMediaKey, row.s3Key));
  await db.update(groups).set({ coverMediaKey: null }).where(eq(groups.coverMediaKey, row.s3Key));

  // Delete the DB row, then the blob. If the S3 delete fails we still removed
  // the row; the orphaned object is harmless and can be swept later.
  await db.delete(media).where(eq(media.id, id));
  try {
    await deleteObject(row.s3Key);
  } catch (err) {
    console.error('[media delete] S3 deleteObject failed for', row.s3Key, err);
  }

  return c.json({ ok: true });
});

export default route;
