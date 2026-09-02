// requireAllowed is the allowlist gate. Postgres (via getDb) and the
// DynamoDB-backed allowlist check are both boundaries we mock — no test here
// touches a real database or AWS.
import { Hono } from 'hono';
import type { CognitoIdTokenPayload } from 'aws-jwt-verify/jwt-model';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeIdTokenPayload, makeUserRow } from '../test/fixtures.js';
import { createMockDb, queryChain, type MockDb } from '../test/mockDb.js';
import type { AppEnv } from '../types.js';

vi.mock('../db/client.js', () => ({ getDb: vi.fn() }));
vi.mock('../services/allowlist.js', () => ({ isEmailAllowlisted: vi.fn() }));

const { getDb } = await import('../db/client.js');
const { isEmailAllowlisted } = await import('../services/allowlist.js');
const { requireAllowed } = await import('./requireAllowed.js');

function buildApp(jwt: CognitoIdTokenPayload) {
  const app = new Hono<AppEnv>();
  app.use('*', async (c, next) => {
    c.set('jwt', jwt);
    await next();
  });
  app.use('*', requireAllowed);
  app.get('/x', (c) => c.json({ user: c.get('user') }));
  return app;
}

describe('requireAllowed', () => {
  let db: MockDb;

  beforeEach(() => {
    db = createMockDb();
    vi.mocked(getDb).mockReset().mockResolvedValue(db as unknown as Awaited<ReturnType<typeof getDb>>);
    vi.mocked(isEmailAllowlisted).mockReset();
  });

  it('rejects an unverified email before ever touching the DB', async () => {
    const jwt = makeIdTokenPayload({ email_verified: false });
    const res = await buildApp(jwt).request('/x');
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: 'Email not verified by identity provider',
      code: 'EMAIL_NOT_VERIFIED',
    });
    expect(getDb).not.toHaveBeenCalled();
  });

  it('rejects a token with no email claim at all', async () => {
    const jwt = makeIdTokenPayload();
    delete (jwt as Record<string, unknown>).email;
    const res = await buildApp(jwt).request('/x');
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Token missing email claim', code: 'NO_EMAIL' });
    expect(getDb).not.toHaveBeenCalled();
  });

  it('rejects a token whose email claim is not a string', async () => {
    const jwt = makeIdTokenPayload({ email: 12345 as unknown as string });
    const res = await buildApp(jwt).request('/x');
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'NO_EMAIL' });
  });

  it('rejects first login when the email is not on the DynamoDB allowlist', async () => {
    db.select.mockReturnValueOnce(queryChain([])); // no existing users row
    vi.mocked(isEmailAllowlisted).mockResolvedValueOnce(false);
    const jwt = makeIdTokenPayload({ email: 'stranger@example.com' });
    const res = await buildApp(jwt).request('/x');
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Email not on allowlist', code: 'NOT_ALLOWLISTED' });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('inserts and allows a first login whose email is on the allowlist', async () => {
    db.select.mockReturnValueOnce(queryChain([]));
    vi.mocked(isEmailAllowlisted).mockResolvedValueOnce(true);
    const inserted = makeUserRow({ id: 'new-sub', email: 'new@example.com' });
    db.insert.mockReturnValueOnce(queryChain([inserted]));

    // Uppercase + padded on the token; the middleware must normalize before
    // checking the allowlist and before inserting.
    const jwt = makeIdTokenPayload({ sub: 'new-sub', email: '  NEW@Example.com  ' });
    const res = await buildApp(jwt).request('/x');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      user: {
        id: inserted.id,
        email: inserted.email,
        emailVerified: inserted.emailVerified,
        isAllowed: inserted.isAllowed,
      },
    });
    expect(isEmailAllowlisted).toHaveBeenCalledWith('new@example.com');
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('returns 500 if the first-login insert unexpectedly returns no row', async () => {
    db.select.mockReturnValueOnce(queryChain([]));
    vi.mocked(isEmailAllowlisted).mockResolvedValueOnce(true);
    db.insert.mockReturnValueOnce(queryChain([]));
    const jwt = makeIdTokenPayload({ email: 'new@example.com' });
    const res = await buildApp(jwt).request('/x');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'User upsert failed', code: 'UPSERT_FAILED' });
  });

  it('trusts users.is_allowed for a returning user and never re-checks the allowlist', async () => {
    const existing = makeUserRow({ isAllowed: true });
    db.select.mockReturnValueOnce(queryChain([existing]));
    const jwt = makeIdTokenPayload({ sub: existing.id, email: existing.email });
    const res = await buildApp(jwt).request('/x');
    expect(res.status).toBe(200);
    expect(isEmailAllowlisted).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('rejects a returning user whose access has been revoked', async () => {
    const existing = makeUserRow({ isAllowed: false });
    db.select.mockReturnValueOnce(queryChain([existing]));
    const jwt = makeIdTokenPayload({ sub: existing.id, email: existing.email });
    const res = await buildApp(jwt).request('/x');
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: 'Access revoked. Contact admin.',
      code: 'ACCESS_REVOKED',
    });
    expect(db.insert).not.toHaveBeenCalled();
  });
});
