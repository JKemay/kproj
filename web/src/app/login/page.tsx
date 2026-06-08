'use client';

import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';

export default function LoginPage() {
  const auth = useAuth();

  // If already signed in, kick to dashboard.
  useEffect(() => {
    if (auth.isAuthenticated) {
      window.location.href = '/';
    }
  }, [auth.isAuthenticated]);

  const onSignIn = () => {
    void auth.signinRedirect();
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-neutral-950 text-neutral-100">
      <div className="max-w-sm w-full text-center space-y-6">
        <div>
          <h1 className="text-3xl font-serif tracking-tight">kproj</h1>
          <p className="mt-2 text-neutral-400 text-sm">private archive — invite only</p>
        </div>
        <button
          type="button"
          onClick={onSignIn}
          disabled={auth.isLoading}
          className="w-full px-4 py-3 rounded-md bg-white text-neutral-900 font-medium hover:bg-neutral-200 transition disabled:opacity-50"
        >
          {auth.isLoading ? 'Loading…' : 'Sign in with Google'}
        </button>
        {auth.error ? (
          <p className="text-sm text-red-400">{auth.error.message}</p>
        ) : null}
      </div>
    </main>
  );
}
