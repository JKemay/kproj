// Media route — Heaven gating, with /sign-reads as the highest-value case:
// it's the endpoint that turns a leaked s3Key into an actual signed URL, so
// a non-admin must never get a signature for a Heaven (or derived/Heaven)
// key. Postgres and S3 are both mocked boundaries.
import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HEAVEN_KEY_PREFIX } from '../middleware/requireAdmin.js';
import { makeMediaRow } from '../test/fixtures.js';
import { createMockDb, queryChain, type MockDb } from '../test/mockDb.js';
import type { AppEnv, AuthUser } from '../types.js';

vi.mock('../db/client.js', () => ({ getDb: vi.fn() }));
vi.mock('../services/s3.js', () => ({
  ALLOWED_MIMES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
  isAllowedMime: (t: string) =>
    ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(t),
  buildKey: vi.fn(() => 'groups/lesserafim/built-key.png'),
  signUpload: vi.fn(async () => ({ url: 'https://s3.example/post', fields: { key: 'x' } })),
  signRead: vi.fn(async (key: string) => `https://signed.example/${key}`),
  deleteObject: vi.fn(async () => {}),
}));

const { getDb } = await import('../db/client.js');
const { buildKey, signRead, signUpload } = await import('../services/s3.js');
const { default: mediaRoute } = await import('./media.js');

const ADMIN: AuthUser = { id: 'admin-id', email: 'admin@example.com', emailVerified: true, isAllowed: true };
const NON_ADMIN: AuthUser = { id: 'user-id', email: 'user@example.com', emailVerified: true, isAllowed: true };

function buildApp(user: AuthUser, db: MockDb) {
  vi.mocked(getDb).mockResolvedValue(db as unknown as Awaited<ReturnType<typeof getDb>>);
  const app = new Hono<AppEnv>();
  app.use('*', async (c, next) => {
    c.set('user', user);
    await next();
  });
  app.route('/media', mediaRoute);
  return app;
}

function postJson(app: Hono<AppEnv>, path: string, body: unknown) {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.mocked(getDb).mockReset();
  vi.mocked(signRead).mockClear();
  vi.mocked(signUpload).mockClear();
  vi.mocked(buildKey).mockClear();
});

describe('GET /media/recent — Heaven filtering', () => {
  it("passes a groupId-<>'six-heaven' filter to the DB for a non-admin", async () => {
    const db = createMockDb();
    db.select.mockReturnValueOnce(queryChain([makeMediaRow()]));
    const res = await buildApp(NON_ADMIN, db).request('/media/recent');
    expect(res.status).toBe(200);
    const chain = db.select.mock.results[0]?.value;
    // isAdmin ? undefined : ne(media.groupId, HEAVEN_GROUP_ID) — a non-admin
    // must get a defined filter condition, not `undefined` (= no filter).
    expect(chain.where.mock.calls[0][0]).toBeDefined();
  });

  it('passes no filter for the admin (sees everything, including six-heaven)', async () => {
    const db = createMockDb();
    db.select.mockReturnValueOnce(queryChain([makeMediaRow({ groupId: 'six-heaven' })]));
    const res = await buildApp(ADMIN, db).request('/media/recent');
    expect(res.status).toBe(200);
    const chain = db.select.mock.results[0]?.value;
    expect(chain.where.mock.calls[0][0]).toBeUndefined();
  });
});

describe('GET /media?groupId=... — Heaven gate', () => {
  it('404s six-heaven for a non-admin without querying the DB', async () => {
    const db = createMockDb();
    const res = await buildApp(NON_ADMIN, db).request('/media?groupId=six-heaven');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not found' });
    expect(getDb).not.toHaveBeenCalled();
  });

  it('serves six-heaven media to the admin', async () => {
    const db = createMockDb();
    db.select.mockReturnValueOnce(queryChain([makeMediaRow({ groupId: 'six-heaven' })]));
    const res = await buildApp(ADMIN, db).request('/media?groupId=six-heaven');
    expect(res.status).toBe(200);
  });

  it('serves an ordinary group to a non-admin', async () => {
    const db = createMockDb();
    db.select.mockReturnValueOnce(queryChain([makeMediaRow()]));
    const res = await buildApp(NON_ADMIN, db).request('/media?groupId=lesserafim');
    expect(res.status).toBe(200);
  });
});

describe('POST /media/sign-reads — Heaven key refusal (leaked key -> real file)', () => {
  const heavenKey = `${HEAVEN_KEY_PREFIX}photo.jpg`;
  const heavenDerivedKey = `derived/${HEAVEN_KEY_PREFIX}photo.jpg.thumb.webp`;
  const normalKey = 'groups/lesserafim/photo.jpg';

  it('refuses a Heaven key for a non-admin with a 404 (not 403 — no existence leak)', async () => {
    const db = createMockDb();
    const res = await postJson(buildApp(NON_ADMIN, db), '/media/sign-reads', { keys: [heavenKey] });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not found', code: 'FORBIDDEN_KEY' });
    expect(signRead).not.toHaveBeenCalled();
  });

  it('refuses a derived/ Heaven thumbnail key for a non-admin', async () => {
    const db = createMockDb();
    const res = await postJson(buildApp(NON_ADMIN, db), '/media/sign-reads', {
      keys: [heavenDerivedKey],
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not found', code: 'FORBIDDEN_KEY' });
    expect(signRead).not.toHaveBeenCalled();
  });

  it('refuses an entire mixed batch if even one key is a Heaven key', async () => {
    const db = createMockDb();
    const res = await postJson(buildApp(NON_ADMIN, db), '/media/sign-reads', {
      keys: [normalKey, heavenKey],
    });
    expect(res.status).toBe(404);
    expect(signRead).not.toHaveBeenCalled();
  });

  it('signs an ordinary key for a non-admin', async () => {
    const db = createMockDb();
    const res = await postJson(buildApp(NON_ADMIN, db), '/media/sign-reads', { keys: [normalKey] });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { urls: Record<string, string> };
    expect(body.urls[normalKey]).toBe(`https://signed.example/${normalKey}`);
  });

  it('lets the admin sign both a Heaven key and its derived thumbnail', async () => {
    const db = createMockDb();
    const res = await postJson(buildApp(ADMIN, db), '/media/sign-reads', {
      keys: [heavenKey, heavenDerivedKey],
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { urls: Record<string, string> };
    expect(Object.keys(body.urls).sort()).toEqual([heavenDerivedKey, heavenKey].sort());
    expect(signRead).toHaveBeenCalledTimes(2);
  });

  it('a key that merely starts with a similar-looking string is not treated as Heaven', async () => {
    // Guards against an overly loose prefix check regressing to something
    // like .includes() — "groups/six-heaven-fanclub/x.jpg" is a different
    // group and must sign normally for a non-admin.
    const db = createMockDb();
    const lookalike = 'groups/six-heaven-fanclub/x.jpg';
    const res = await postJson(buildApp(NON_ADMIN, db), '/media/sign-reads', { keys: [lookalike] });
    expect(res.status).toBe(200);
  });
});

describe('POST /media/sign-uploads — admin only', () => {
  const uploadBody = {
    uploads: [{ clientRef: 'r1', groupId: 'lesserafim', contentType: 'image/png', sizeBytes: 100 }],
  };

  it('rejects a non-admin before any key is built or signed', async () => {
    const db = createMockDb();
    const res = await postJson(buildApp(NON_ADMIN, db), '/media/sign-uploads', uploadBody);
    expect(res.status).toBe(403);
    expect(buildKey).not.toHaveBeenCalled();
  });

  it('signs an upload for the admin using a server-built key, not client input', async () => {
    const db = createMockDb();
    const res = await postJson(buildApp(ADMIN, db), '/media/sign-uploads', uploadBody);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { results: Array<{ s3Key: string }> };
    expect(body.results[0]?.s3Key).toBe('groups/lesserafim/built-key.png');
  });
});
