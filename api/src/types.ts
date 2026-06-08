// Shared Hono env types so middleware can attach typed values to `c.set()`
// and handlers can `c.get()` them with full TypeScript inference.

import type { CognitoIdTokenPayload } from 'aws-jwt-verify/jwt-model';

export interface AuthUser {
  id: string; // Cognito sub
  email: string;
  emailVerified: boolean;
  isAllowed: boolean;
}

export type AppVariables = {
  jwt: CognitoIdTokenPayload;
  user: AuthUser;
};

export type AppEnv = { Variables: AppVariables };
