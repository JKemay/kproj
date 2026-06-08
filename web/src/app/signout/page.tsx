// Sign-out route. Clears the local OIDC session, then bounces to Cognito's
// Hosted UI logout (which clears the Cognito session and redirects to /login).
// Using a route means presentational components can sign out via a plain href.

'use client';

import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';

import { buildLogoutUrl } from '@/lib/cognito';

export default function SignOutPage() {
  const auth = useAuth();

  useEffect(() => {
    void (async () => {
      await auth.removeUser();
      window.location.href = buildLogoutUrl();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-[#737373]">
      <p className="text-sm">Signing out…</p>
    </main>
  );
}
