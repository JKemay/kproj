// Hono middleware: verify the incoming Cognito ID token via aws-jwt-verify.
//
// IMPORTANT: the JWKS is pre-cached from a bundled JSON file rather than
// fetched at runtime. Reason: this Lambda runs in a NAT-less VPC, and the
// Cognito IDP VPC interface endpoint does NOT serve the public
// `/.well-known/jwks.json` path (it only proxies the signed AWS API). A
// runtime fetch therefore hangs until timeout. Cognito signing keys are
// stable (they only change if you explicitly rotate the pool's signing key),
// so embedding them is safe and also removes a network hop from the hot path.
//
// To refresh after a key rotation:
//   curl -s https://cognito-idp.us-east-1.amazonaws.com/<POOL_ID>/.well-known/jwks.json \
//     -o api/src/cognito-jwks.json
//   then redeploy.

import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { createMiddleware } from 'hono/factory';

import jwks from '../cognito-jwks.json' with { type: 'json' };
import type { AppEnv } from '../types.js';

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_APP_CLIENT_ID = process.env.COGNITO_APP_CLIENT_ID;
if (!COGNITO_USER_POOL_ID) throw new Error('COGNITO_USER_POOL_ID env var is required');
if (!COGNITO_APP_CLIENT_ID) throw new Error('COGNITO_APP_CLIENT_ID env var is required');

const verifier = CognitoJwtVerifier.create({
  userPoolId: COGNITO_USER_POOL_ID,
  tokenUse: 'id', // We need email claims, which only the ID token carries
  clientId: COGNITO_APP_CLIENT_ID,
});

// Pre-populate the JWKS cache so verify() never reaches over the network.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
verifier.cacheJwks(jwks as any);

export const verifyJwt = createMiddleware<AppEnv>(async (c, next) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or malformed Authorization header' }, 401);
  }
  const token = auth.slice(7).trim();
  if (!token) {
    return c.json({ error: 'Empty Bearer token' }, 401);
  }
  try {
    const payload = await verifier.verify(token);
    c.set('jwt', payload);
    await next();
    return;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Token verification failed';
    return c.json({ error: msg }, 401);
  }
});
