// Wires the presentational ui/NavBar to real auth + Next navigation.

'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from 'react-oidc-context';

import { NavBar } from '@/components/ui/NavBar';

export function AppNav({ currentPath = 'home' }: { currentPath?: 'home' | 'heaven' | 'group' }) {
  const router = useRouter();
  const auth = useAuth();
  const email = (auth.user?.profile.email as string | undefined) ?? '';
  const picture = auth.user?.profile.picture as string | undefined;

  return (
    <NavBar
      user={email ? { email, picture } : undefined}
      siteTitle="Archive"
      currentPath={currentPath}
      onNavigateHome={() => router.push('/')}
      onNavigateHeaven={() => router.push('/heaven')}
      signOutHref="/signout"
    />
  );
}
