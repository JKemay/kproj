// Era routes addressed by era id: PATCH /eras/:id, DELETE /eras/:id.
// (Group-scoped list/create live under /groups/:gid/eras in the groups route.)
//
// Deleting an era does NOT delete its media — media.era_id is set NULL by the
// FK, so the photos fall back to "no era".

import { zValidator } from '@hono/zod-validator';
import { eras } from '@kproj/db/schema';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { getDb } from '../db/client.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { updateEraBody } from '../schemas/eras.js';
import type { AppEnv } from '../types.js';

const route = new Hono<AppEnv>();

route.patch('/:id', requireAdmin, zValidator('json', updateEraBody), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  if (Object.keys(body).length === 0) return c.json({ error: 'No fields to update' }, 400);
  const db = await getDb();
  const [row] = await db.update(eras).set(body).where(eq(eras.id, id)).returning();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ era: row });
});

route.delete('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const db = await getDb();
  const [row] = await db.delete(eras).where(eq(eras.id, id)).returning();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

export default route;
