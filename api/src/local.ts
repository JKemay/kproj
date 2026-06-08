// Local dev entrypoint — runs the Hono app on a Node HTTP server
// so you can iterate without redeploying to Lambda.
// Usage: pnpm --filter @kproj/api dev

import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();
app.get('/health', (c) => c.json({ ok: true, mode: 'local', ts: new Date().toISOString() }));

const port = Number(process.env.PORT) || 8787;
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on http://localhost:${info.port}`);
});
