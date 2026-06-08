// OIDC callback target. react-oidc-context's AuthProvider auto-handles the
// code exchange when it sees ?code=... in the URL. This page just shows a
// loading state and redirects to / once tokens are stored.

'use client';

import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';

export default function AuthCallbackPage() {
  const auth = useAuth();

  useEffect(() => {
    if (auth.isAuthenticated) {
      // Replace so this URL isn't in history
      window.location.replace('/');
    }
  }, [auth.isAuthenticated]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-400">
      <div className="text-center space-y-2">
        <p>Finishing sign-in…</p>
        {auth.error ? <p className="text-sm text-red-400">{auth.error.message}</p> : null}
      </div>
    </main>
  );
}
