// Hono middleware: gate mutations to the configured admin email.
// v1 single-admin pattern; multi-admin would move to a roles table or
// Cognito Group membership.

import { createMiddleware } from 'hono/factory';

import type { AppEnv } from '../types.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase().trim();
if (!ADMIN_EMAIL) throw new Error('ADMIN_EMAIL env var is required');

/** Non-middleware check for routes that branch on admin rather than reject. */
export function isAdminEmail(email: string): boolean {
  return email.toLowerCase() === ADMIN_EMAIL;
}

export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const user = c.get('user');
  if (!isAdminEmail(user.email)) {
    return c.json({ error: 'Admin only', code: 'NOT_ADMIN' }, 403);
  }
  await next();
});

// 6ix's Heaven — the owner's private room. Modeled as a reserved topic group;
// every read path must hide it from non-admins (the frontend hides the nav,
// but the API is the real gate).
export const HEAVEN_GROUP_ID = 'six-heaven';
export const HEAVEN_KEY_PREFIX = `groups/${HEAVEN_GROUP_ID}/`;
