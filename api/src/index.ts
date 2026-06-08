// Main API Lambda — Hono router behind API Gateway HTTP API.
//
// Route layers:
//   /health           — public, used by uptime checks + smoke tests
//   /                 — public, lists the API surface (no secrets)
//   /*                — protected by verifyJwt + requireAllowed
//
// Add new route modules under src/routes/ and mount them after the
// `app.use(...)` middleware lines below.

import { groups, media, members } from '@kproj/db/schema';
import { count } from 'drizzle-orm';
import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';

import { getDb } from './db/client.js';
import { requireAllowed } from './middleware/requireAllowed.js';
import { verifyJwt } from './middleware/verifyJwt.js';
import erasRoute from './routes/eras.js';
import groupsRoute from './routes/groups.js';
import mediaRoute from './routes/media.js';
import type { AppEnv } from './types.js';

const app = new Hono<AppEnv>();

// CORS preflights: API Gateway routes ANY methods (including OPTIONS) to
// this Lambda, so we need to short-circuit OPTIONS before the auth chain
// runs. API Gateway's CORS config stamps the response headers; we just
// need to return 2xx.
app.options('*', (c) => c.body(null, 204));

// ---- Public routes ----
app.get('/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }));
app.get('/', (c) =>
  c.json({
    name: 'kproj-api',
    endpoints: ['/health', '/me', '/stats', '/groups', '/groups/:id', '/media/sign-uploads', '/media/sign-reads'],
  }),
);

// ---- All routes below this line require auth + allowlist ----
app.use('*', verifyJwt);
app.use('*', requireAllowed);

// ---- Protected routes ----
app.get('/me', (c) => c.json({ user: c.get('user') }));

// Archive-wide counts for the dashboard hero.
app.get('/stats', async (c) => {
  const db = await getDb();
  const [[g], [m], [md]] = await Promise.all([
    db.select({ c: count() }).from(groups),
    db.select({ c: count() }).from(members),
    db.select({ c: count() }).from(media),
  ]);
  return c.json({ groups: g?.c ?? 0, members: m?.c ?? 0, media: md?.c ?? 0 });
});

app.route('/groups', groupsRoute);
app.route('/media', mediaRoute);
app.route('/eras', erasRoute);

export const handler = handle(app);
