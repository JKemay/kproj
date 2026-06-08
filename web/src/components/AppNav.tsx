// Wires the presentational ui/NavBar to real auth + Next navigation.

'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from 'react-oidc-context';

import { useIsAdmin } from '@/components/AuthGuard';
import { NavBar } from '@/components/ui/NavBar';

export function AppNav({ currentPath = 'home' }: { currentPath?: 'home' | 'heaven' | 'group' }) {
  const router = useRouter();
  const auth = useAuth();
  const isAdmin = useIsAdmin();
  const email = (auth.user?.profile.email as string | undefined) ?? '';
  const picture = auth.user?.profile.picture as string | undefined;

  return (
    <NavBar
      user={email ? { email, picture } : undefined}
      siteTitle="Archive"
      currentPath={currentPath}
      showHeaven={isAdmin}
      onNavigateHome={() => router.push('/')}
      onNavigateHeaven={() => router.push('/heaven')}
      signOutHref="/signout"
    />
  );
}
