// Groups + nested Members routes.
//
// All routes here inherit verifyJwt + requireAllowed from the parent app.
// Mutations (POST) layer requireAdmin on top.

import { randomUUID } from 'node:crypto';

import { zValidator } from '@hono/zod-validator';
import { eras, groups, members } from '@kproj/db/schema';
import { and, asc, count, eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { getDb } from '../db/client.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { createEraBody } from '../schemas/eras.js';
import {
  createGroupBody,
  createMemberBody,
  updateGroupBody,
  updateMemberBody,
} from '../schemas/groups.js';
import type { AppEnv } from '../types.js';

const route = new Hono<AppEnv>();

// ---- Groups ----

// List groups, each with a memberCount (LEFT JOIN so member-less topics show 0).
route.get('/', async (c) => {
  const db = await getDb();
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      kind: groups.kind,
      debutYear: groups.debutYear,
      agency: groups.agency,
      coverMediaKey: groups.coverMediaKey,
      createdAt: groups.createdAt,
      memberCount: count(members.id),
    })
    .from(groups)
    .leftJoin(members, eq(members.groupId, groups.id))
    .groupBy(groups.id)
    .orderBy(asc(groups.name));
  return c.json({ groups: rows });
});

route.get('/:id', async (c) => {
  const id = c.req.param('id');
  const db = await getDb();
  const [row] = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ group: row });
});

route.post('/', requireAdmin, zValidator('json', createGroupBody), async (c) => {
  const body = c.req.valid('json');
  const db = await getDb();
  try {
    const [row] = await db.insert(groups).values(body).returning();
    return c.json({ group: row }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // 23505 = unique_violation in Postgres
    if (msg.includes('duplicate key') || msg.includes('23505')) {
      return c.json({ error: 'A group with that id already exists', code: 'DUPLICATE' }, 409);
    }
    throw err;
  }
});

route.patch('/:id', requireAdmin, zValidator('json', updateGroupBody), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  if (Object.keys(body).length === 0) return c.json({ error: 'No fields to update' }, 400);
  const db = await getDb();
  const [row] = await db.update(groups).set(body).where(eq(groups.id, id)).returning();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ group: row });
});

// ---- Members (nested under groups) ----

route.get('/:id/members', async (c) => {
  const groupId = c.req.param('id');
  const db = await getDb();
  const rows = await db
    .select()
    .from(members)
    .where(eq(members.groupId, groupId))
    .orderBy(asc(members.stageName));
  return c.json({ members: rows });
});

route.get('/:gid/members/:mid', async (c) => {
  const groupId = c.req.param('gid');
  const memberId = c.req.param('mid');
  const db = await getDb();
  const [row] = await db
    .select()
    .from(members)
    .where(and(eq(members.groupId, groupId), eq(members.id, memberId)))
    .limit(1);
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ member: row });
});

route.post(
  '/:id/members',
  requireAdmin,
  zValidator('json', createMemberBody),
  async (c) => {
    const groupId = c.req.param('id');
    const body = c.req.valid('json');
    const db = await getDb();

    // Confirm parent group exists for a clean 404 instead of an FK violation
    const [parent] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!parent) return c.json({ error: 'Group not found' }, 404);

    try {
      const [row] = await db
        .insert(members)
        .values({ ...body, groupId })
        .returning();
      return c.json({ member: row }, 201);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('duplicate key') || msg.includes('23505')) {
        return c.json(
          { error: 'A member with that id already exists in this group', code: 'DUPLICATE' },
          409,
        );
      }
      throw err;
    }
  },
);

route.patch(
  '/:gid/members/:mid',
  requireAdmin,
  zValidator('json', updateMemberBody),
  async (c) => {
    const groupId = c.req.param('gid');
    const memberId = c.req.param('mid');
    const body = c.req.valid('json');
    if (Object.keys(body).length === 0) return c.json({ error: 'No fields to update' }, 400);
    const db = await getDb();
    const [row] = await db
      .update(members)
      .set(body)
      .where(and(eq(members.groupId, groupId), eq(members.id, memberId)))
      .returning();
    if (!row) return c.json({ error: 'Not found' }, 404);
    return c.json({ member: row });
  },
);

// ---- Eras (group-scoped list + create) ----

route.get('/:id/eras', async (c) => {
  const groupId = c.req.param('id');
  const db = await getDb();
  const rows = await db
    .select()
    .from(eras)
    .where(eq(eras.groupId, groupId))
    .orderBy(asc(eras.sortOrder), asc(eras.label));
  return c.json({ eras: rows });
});

route.post('/:id/eras', requireAdmin, zValidator('json', createEraBody), async (c) => {
  const groupId = c.req.param('id');
  const body = c.req.valid('json');
  const db = await getDb();

  const [parent] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!parent) return c.json({ error: 'Group not found' }, 404);

  const [row] = await db
    .insert(eras)
    .values({
      id: randomUUID(),
      groupId,
      label: body.label,
      releaseDate: body.releaseDate ?? null,
      sortOrder: body.sortOrder ?? 0,
    })
    .returning();
  return c.json({ era: row }, 201);
});

export default route;
