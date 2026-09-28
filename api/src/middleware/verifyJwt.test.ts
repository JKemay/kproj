// verifyJwt's own job is narrow: parse the Authorization header, hand the
// token to aws-jwt-verify, and translate the result into a 401 or a `c.set`.
// Actual signature/claims verification is aws-jwt-verify's responsibility,
// not ours, so we mock the library at the boundary and test the middleware's
// contract around it.
import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeIdTokenPayload } from '../test/fixtures.js';
import type { AppEnv } from '../types.js';

const mockVerify = vi.hoisted(() => vi.fn());
const mockCacheJwks = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() =>
  vi.fn(() => ({ cacheJwks: mockCacheJwks, verify: mockVerify })),
);

vi.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: { create: mockCreate },
}));

const { verifyJwt } = await import('./verifyJwt.js');

// Captured immediately after import, before any beforeEach can run — this is
// the one call that happens at module load, not per-request.
const jwksCacheCallsAtLoad = mockCacheJwks.mock.calls.length;

function buildApp() {
  const app = new Hono<AppEnv>();
  app.use('*', verifyJwt);
  app.get('/x', (c) => c.json({ jwt: c.get('jwt') }));
  return app;
}

describe('verifyJwt', () => {
  beforeEach(() => {
    mockVerify.mockReset();
  });

  it('pre-caches the bundled JWKS at module load instead of fetching it', () => {
    // Regression guard for the NAT-less-VPC constraint documented at the top
    // of verifyJwt.ts: if this ever regresses to a runtime fetch, the
    // Cognito IDP VPC endpoint doesn't serve /.well-known/jwks.json and the
    // Lambda hangs until timeout on every request.
    expect(jwksCacheCallsAtLoad).toBe(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userPoolId: 'us-east-1_testPool',
        clientId: 'test-client-id',
        tokenUse: 'id',
      }),
    );
  });

  it('rejects a request with no Authorization header', async () => {
    const res = await buildApp().request('/x');
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Missing or malformed Authorization header' });
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('rejects a non-Bearer Authorization header', async () => {
    const res = await buildApp().request('/x', { headers: { Authorization: 'Basic dXNlcjpwYXNz' } });
    expect(res.status).toBe(401);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('rejects a Bearer token that is empty after trimming', async () => {
    // A plain trailing-space token ("Bearer   ") won't reach this branch:
    // the Fetch Headers implementation strips trailing ASCII whitespace from
    // header values before the app ever sees them, collapsing it to a bare
    // "Bearer" that fails the startsWith("Bearer ") check instead. A non-breaking
    // space (not stripped by Headers, but stripped by JS's String#trim) is
    // what actually exercises the "empty after trim" branch.
    const res = await buildApp().request('/x', { headers: { Authorization: 'Bearer  ' } });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Empty Bearer token' });
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('rejects a token the verifier fails on, surfacing its message', async () => {
    mockVerify.mockRejectedValueOnce(new Error('Token expired'));
    const res = await buildApp().request('/x', {
      headers: { Authorization: 'Bearer bad.jwt.here' },
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Token expired' });
  });

  it('falls back to a generic message when the verifier throws a non-Error', async () => {
    mockVerify.mockRejectedValueOnce('nope');
    const res = await buildApp().request('/x', {
      headers: { Authorization: 'Bearer bad.jwt.here' },
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Token verification failed' });
  });

  it('sets c.jwt and continues the chain on a verified token', async () => {
    const payload = makeIdTokenPayload({ email: 'ok@example.com' });
    mockVerify.mockResolvedValueOnce(payload);
    const res = await buildApp().request('/x', {
      headers: { Authorization: 'Bearer good.jwt.here' },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ jwt: payload });
    expect(mockVerify).toHaveBeenCalledWith('good.jwt.here');
  });
});
