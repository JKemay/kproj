// requireAdmin needs no boundary mocks — it only compares against the
// ADMIN_EMAIL env var stubbed in src/test/setup.ts.
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import type { AppEnv, AuthUser } from '../types.js';
import { HEAVEN_GROUP_ID, HEAVEN_KEY_PREFIX, isAdminEmail, requireAdmin } from './requireAdmin.js';

describe('isAdminEmail', () => {
  it('matches the configured admin regardless of case', () => {
    expect(isAdminEmail('admin@example.com')).toBe(true);
    expect(isAdminEmail('Admin@Example.com')).toBe(true);
    expect(isAdminEmail('ADMIN@EXAMPLE.COM')).toBe(true);
  });

  it('rejects every other address, including near-misses', () => {
    expect(isAdminEmail('someone@example.com')).toBe(false);
    expect(isAdminEmail('admin@example.com.evil.com')).toBe(false);
    expect(isAdminEmail('notadmin@example.com')).toBe(false);
    expect(isAdminEmail('')).toBe(false);
  });
});

describe('requireAdmin middleware', () => {
  function buildApp(email: string) {
    const user: AuthUser = { id: 'u1', email, emailVerified: true, isAllowed: true };
    const app = new Hono<AppEnv>();
    app.use('*', async (c, next) => {
      c.set('user', user);
      await next();
    });
    app.use('*', requireAdmin);
    app.get('/x', (c) => c.json({ ok: true }));
    return app;
  }

  it('lets the configured admin through', async () => {
    const res = await buildApp('admin@example.com').request('/x');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('rejects a non-admin allowlisted user with 403 NOT_ADMIN', async () => {
    const res = await buildApp('member@example.com').request('/x');
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Admin only', code: 'NOT_ADMIN' });
  });
});

// The single-admin gate is only half the Heaven story — every read path also
// has to independently apply this prefix/id. Pinning the literal values here
// means a typo in either constant shows up as a test failure, not a leak.
describe('Heaven constants', () => {
  it('are the values every read-path guard is built from', () => {
    expect(HEAVEN_GROUP_ID).toBe('six-heaven');
    expect(HEAVEN_KEY_PREFIX).toBe('groups/six-heaven/');
    expect(HEAVEN_KEY_PREFIX).toBe(`groups/${HEAVEN_GROUP_ID}/`);
  });
});
