// Hono middleware: enforce that the JWT-authenticated user is allowed to
// access the app.
//
// First-login flow:
//   1. Look up users.id (Cognito sub) in Postgres.
//   2. If not found, verify against the DynamoDB allowlist (defense-in-depth
//      against a misconfigured Pre-SignUp trigger). Then INSERT the user row
//      with is_allowed=true.
//   3. If found, trust users.is_allowed as the source of truth.
//
// Returns 403 with a structured error code on any rejection so the frontend
// can render a useful access-denied state.

import { users } from '@kproj/db/schema';
import { eq } from 'drizzle-orm';
import { createMiddleware } from 'hono/factory';

import { getDb } from '../db/client.js';
import { isEmailAllowlisted } from '../services/allowlist.js';
import type { AppEnv } from '../types.js';

export const requireAllowed = createMiddleware<AppEnv>(async (c, next) => {
  const jwt = c.get('jwt');

  if (!jwt.email_verified) {
    return c.json({ error: 'Email not verified by identity provider', code: 'EMAIL_NOT_VERIFIED' }, 403);
  }
  // jwt.email is loosely typed as any JSON value; narrow it explicitly.
  if (typeof jwt.email !== 'string' || !jwt.email) {
    return c.json({ error: 'Token missing email claim', code: 'NO_EMAIL' }, 403);
  }
  const email = jwt.email.toLowerCase().trim();

  const db = await getDb();
  const existing = await db.select().from(users).where(eq(users.id, jwt.sub)).limit(1);
  let row = existing[0];

  if (!row) {
    // First login — verify against DynamoDB allowlist before inserting
    const allowed = await isEmailAllowlisted(email);
    if (!allowed) {
      return c.json(
        { error: 'Email not on allowlist', code: 'NOT_ALLOWLISTED' },
        403,
      );
    }
    const inserted = await db
      .insert(users)
      .values({
        id: jwt.sub,
        email,
        emailVerified: true,
        isAllowed: true,
      })
      .returning();
    row = inserted[0];
    if (!row) {
      return c.json({ error: 'User upsert failed', code: 'UPSERT_FAILED' }, 500);
    }
  }

  if (!row.isAllowed) {
    return c.json(
      { error: 'Access revoked. Contact admin.', code: 'ACCESS_REVOKED' },
      403,
    );
  }

  c.set('user', {
    id: row.id,
    email: row.email,
    emailVerified: row.emailVerified,
    isAllowed: row.isAllowed,
  });
  await next();
});
