// Three-state route guard:
//   1. OIDC still loading       → spinner
//   2. Not authenticated         → kick to Cognito Hosted UI
//   3. Authenticated             → call GET /me to confirm allowlist
//        200 → render children, expose user via useAppUser()
//        403 → <AccessDenied />
//        error → inline error block (debuggable, never blank)

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';

import { ApiError, apiFetch } from '@/lib/api';
import { AccessDenied } from '@/components/ui/AccessDenied';

interface AppUser {
  id: string;
  email: string;
  emailVerified: boolean;
  isAllowed: boolean;
}

const AppUserContext = createContext<AppUser | null>(null);

export function useAppUser(): AppUser {
  const u = useContext(AppUserContext);
  if (!u) throw new Error('useAppUser must be used inside an AuthGuard');
  return u;
}

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();

/** True if the current user is the configured admin. Backend enforces this
 *  independently; this only toggles UI affordances. */
export function useIsAdmin(): boolean {
  const u = useContext(AppUserContext);
  if (!u || !ADMIN_EMAIL) return false;
  return u.email.toLowerCase() === ADMIN_EMAIL;
}

type State =
  | { kind: 'loading' }
  | { kind: 'denied'; reason?: string }
  | { kind: 'error'; message: string }
  | { kind: 'allowed'; user: AppUser };

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [state, setState] = useState<State>({ kind: 'loading' });

  // Kick unauthenticated visitors to Cognito.
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator && !auth.error) {
      void auth.signinRedirect();
    }
  }, [auth]);

  // Once we have a token, validate against our backend's /me.
  useEffect(() => {
    if (!auth.isAuthenticated) return;
    const idToken = auth.user?.id_token;
    if (!idToken) return;

    let cancelled = false;
    setState({ kind: 'loading' });
    apiFetch<{ user: AppUser }>('/me', { idToken })
      .then((res) => {
        if (!cancelled) setState({ kind: 'allowed', user: res.user });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) {
          setState({ kind: 'denied', reason: err.message });
        } else {
          setState({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [auth.isAuthenticated, auth.user?.id_token]);

  if (auth.error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-[#0a0a0a] text-[#f0f0f0]">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-xl font-medium">Sign-in error</h1>
          <p className="text-[#737373] text-sm">{auth.error.message}</p>
        </div>
      </main>
    );
  }

  if (auth.isLoading || !auth.isAuthenticated || state.kind === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-[#737373]">
        <p className="text-sm">Loading…</p>
      </main>
    );
  }

  if (state.kind === 'denied') {
    const email = (auth.user?.profile.email as string | undefined) ?? '';
    return <AccessDenied userEmail={email} signOutHref="/signout" />;
  }

  if (state.kind === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-[#0a0a0a] text-[#f0f0f0]">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-xl font-medium">Something went wrong</h1>
          <p className="text-[#737373] text-sm">{state.message}</p>
        </div>
      </main>
    );
  }

  return <AppUserContext.Provider value={state.user}>{children}</AppUserContext.Provider>;
}
