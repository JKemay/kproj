// Groups route — Heaven gating. verifyJwt/requireAllowed are exercised in
// their own test files; here the auth chain is stubbed to inject an already
// -authenticated user directly, per Hono's own testing guidance
// (app.request(...) against a router mounted in isolation).
import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeGroupRow, makeMemberRow } from '../test/fixtures.js';
import { createMockDb, queryChain, type MockDb } from '../test/mockDb.js';
import type { AppEnv, AuthUser } from '../types.js';

vi.mock('../db/client.js', () => ({ getDb: vi.fn() }));

const { getDb } = await import('../db/client.js');
const { default: groupsRoute } = await import('./groups.js');

const ADMIN: AuthUser = { id: 'admin-id', email: 'admin@example.com', emailVerified: true, isAllowed: true };
const NON_ADMIN: AuthUser = { id: 'user-id', email: 'user@example.com', emailVerified: true, isAllowed: true };

function buildApp(user: AuthUser, db: MockDb) {
  vi.mocked(getDb).mockResolvedValue(db as unknown as Awaited<ReturnType<typeof getDb>>);
  const app = new Hono<AppEnv>();
  app.use('*', async (c, next) => {
    c.set('user', user);
    await next();
  });
  app.route('/groups', groupsRoute);
  return app;
}

beforeEach(() => {
  vi.mocked(getDb).mockReset();
});

describe('GET /groups — list filtering', () => {
  const heaven = { ...makeGroupRow({ id: 'six-heaven', name: 'Heaven' }), memberCount: 3 };
  const normal = { ...makeGroupRow({ id: 'lesserafim', name: 'LE SSERAFIM' }), memberCount: 5 };

  it('hides six-heaven from a non-admin', async () => {
    const db = createMockDb();
    db.select.mockReturnValueOnce(queryChain([heaven, normal]));
    const res = await buildApp(NON_ADMIN, db).request('/groups');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { groups: Array<{ id: string }> };
    expect(body.groups.map((g) => g.id)).toEqual(['lesserafim']);
  });

  it('shows six-heaven to the admin', async () => {
    const db = createMockDb();
    db.select.mockReturnValueOnce(queryChain([heaven, normal]));
    const res = await buildApp(ADMIN, db).request('/groups');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { groups: Array<{ id: string }> };
    expect(body.groups.map((g) => g.id).sort()).toEqual(['lesserafim', 'six-heaven']);
  });
});

describe('GET /groups/:id — single-fetch gate', () => {
  it('404s for a non-admin requesting six-heaven, confirming existence to no one', async () => {
    const db = createMockDb();
    const res = await buildApp(NON_ADMIN, db).request('/groups/six-heaven');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not found' });
    // The 404 for a real-but-hidden group must be indistinguishable from a
    // truly nonexistent one — including never reaching the DB to check.
    expect(getDb).not.toHaveBeenCalled();
  });

  it('serves six-heaven to the admin', async () => {
    const db = createMockDb();
    const row = makeGroupRow({ id: 'six-heaven', name: 'Heaven' });
    db.select.mockReturnValueOnce(queryChain([row]));
    const res = await buildApp(ADMIN, db).request('/groups/six-heaven');
    expect(res.status).toBe(200);
    expect(((await res.json()) as { group: { id: string } }).group.id).toBe('six-heaven');
  });

  it('serves an ordinary group to a non-admin', async () => {
    const db = createMockDb();
    const row = makeGroupRow();
    db.select.mockReturnValueOnce(queryChain([row]));
    const res = await buildApp(NON_ADMIN, db).request(`/groups/${row.id}`);
    expect(res.status).toBe(200);
  });

  it('404s an ordinary nonexistent group the same way as Heaven-for-non-admin', async () => {
    const db = createMockDb();
    db.select.mockReturnValueOnce(queryChain([]));
    const res = await buildApp(NON_ADMIN, db).request('/groups/does-not-exist');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not found' });
  });
});

describe('GET /groups/:id/eras — Heaven gate', () => {
  it('404s for a non-admin without querying the DB', async () => {
    const db = createMockDb();
    const res = await buildApp(NON_ADMIN, db).request('/groups/six-heaven/eras');
    expect(res.status).toBe(404);
    expect(getDb).not.toHaveBeenCalled();
  });

  it('is reachable by the admin', async () => {
    const db = createMockDb();
    db.select.mockReturnValueOnce(queryChain([]));
    const res = await buildApp(ADMIN, db).request('/groups/six-heaven/eras');
    expect(res.status).toBe(200);
  });
});

// --- Reported, not fixed: see the PR description / final report for detail.
//
// Every other read path in this file (list, single-fetch, eras) checks
// `id === HEAVEN_GROUP_ID && !isAdminEmail(...)` before touching the DB.
// GET /groups/:id/members and GET /groups/:gid/members/:mid have no such
// check at all — a non-admin who knows (or guesses) the "six-heaven" slug
// can list, and individually fetch, its members even though /groups/six-heaven
// itself 404s them. This directly contradicts the design note in
// requireAdmin.ts ("every read path must hide it from non-admins").
//
// These two tests characterize the *current* behavior for regression
// tracking. They are not an endorsement of it — do not use them as a
// reference for "correct" behavior when fixing the gap.
describe('members routes are gated on Heaven like every sibling read path', () => {
  it('hides six-heaven members from a non-admin', async () => {
    const db = createMockDb();
    const member = makeMemberRow({ groupId: 'six-heaven', id: 'secret-member' });
    db.select.mockReturnValueOnce(queryChain([member]));
    const res = await buildApp(NON_ADMIN, db).request('/groups/six-heaven/members');
    expect(res.status).toBe(404);
  });

  it('hides a single six-heaven member from a non-admin', async () => {
    const db = createMockDb();
    const member = makeMemberRow({ groupId: 'six-heaven', id: 'secret-member' });
    db.select.mockReturnValueOnce(queryChain([member]));
    const res = await buildApp(NON_ADMIN, db).request('/groups/six-heaven/members/secret-member');
    expect(res.status).toBe(404);
  });

  it('still serves six-heaven members to the admin', async () => {
    const db = createMockDb();
    const member = makeMemberRow({ groupId: 'six-heaven', id: 'secret-member' });
    db.select.mockReturnValueOnce(queryChain([member]));
    const res = await buildApp(ADMIN, db).request('/groups/six-heaven/members');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { members: Array<{ id: string }> };
    expect(body.members[0]?.id).toBe('secret-member');
  });

  it('leaves ordinary groups readable by a non-admin', async () => {
    const db = createMockDb();
    const member = makeMemberRow({ groupId: 'aespa', id: 'karina' });
    db.select.mockReturnValueOnce(queryChain([member]));
    const res = await buildApp(NON_ADMIN, db).request('/groups/aespa/members');
    expect(res.status).toBe(200);
  });
});
