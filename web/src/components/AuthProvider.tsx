// Client-side wrapper around react-oidc-context's AuthProvider.
// Keeps the OIDC setup out of layout.tsx (which can stay a server component).

'use client';

import { AuthProvider as OidcAuthProvider } from 'react-oidc-context';

import { cognitoConfig } from '@/lib/cognito';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <OidcAuthProvider {...cognitoConfig}>{children}</OidcAuthProvider>;
}
