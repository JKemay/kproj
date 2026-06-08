// Hono middleware: gate mutations to the configured admin email.
// v1 single-admin pattern; multi-admin would move to a roles table or
// Cognito Group membership.

import { createMiddleware } from 'hono/factory';

import type { AppEnv } from '../types.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase().trim();
if (!ADMIN_EMAIL) throw new Error('ADMIN_EMAIL env var is required');

export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const user = c.get('user');
  if (user.email.toLowerCase() !== ADMIN_EMAIL) {
    return c.json({ error: 'Admin only', code: 'NOT_ADMIN' }, 403);
  }
  await next();
});
