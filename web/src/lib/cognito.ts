// Cognito OIDC client configuration.
// `oidc-client-ts` is the lower-level library; `react-oidc-context` wraps it
// in an <AuthProvider> + useAuth() hook.

import { WebStorageStateStore } from 'oidc-client-ts';
import type { AuthProviderProps } from 'react-oidc-context';

const env = {
  authority: process.env.NEXT_PUBLIC_COGNITO_AUTHORITY!,
  domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN!,
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
  redirectUri: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI!,
  logoutUri: process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI!,
};

for (const [k, v] of Object.entries(env)) {
  if (!v) throw new Error(`Missing NEXT_PUBLIC_COGNITO_* env: ${k}`);
}

export const cognitoConfig: AuthProviderProps = {
  authority: env.authority,
  client_id: env.clientId,
  redirect_uri: env.redirectUri,
  post_logout_redirect_uri: env.logoutUri,
  response_type: 'code',
  scope: 'openid email profile',
  // Persist tokens in localStorage so refreshes don't kick the user out.
  // (sessionStorage would log them out on every tab close.)
  userStore:
    typeof window !== 'undefined'
      ? new WebStorageStateStore({ store: window.localStorage })
      : undefined,
  // Strip the ?code=... from the URL after exchange so it isn't bookmarkable.
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

/**
 * Builds the Cognito Hosted UI sign-out URL.
 * Cognito clears its session when the user hits /logout with redirect params.
 */
export function buildLogoutUrl(): string {
  const url = new URL(`${env.domain}/logout`);
  url.searchParams.set('client_id', env.clientId);
  url.searchParams.set('logout_uri', env.logoutUri);
  return url.toString();
}
