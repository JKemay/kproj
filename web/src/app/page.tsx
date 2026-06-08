'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';

import { AppNav } from '@/components/AppNav';
import { AuthGuard } from '@/components/AuthGuard';
import { DashboardHero } from '@/components/ui/DashboardHero';
import { GroupCard } from '@/components/ui/GroupCard';
import { GroupCardSkeleton } from '@/components/ui/GroupCardSkeleton';
import { SearchBar } from '@/components/ui/SearchBar';
import { apiFetch } from '@/lib/api';
import { useSignedUrls } from '@/lib/useSignedUrls';

interface Group {
  id: string;
  name: string;
  agency: string | null;
  debutYear: number | null;
  coverMediaKey: string | null;
  memberCount: number;
}

interface Stats {
  groups: number;
  members: number;
  media: number;
}

function Dashboard() {
  const router = useRouter();
  const auth = useAuth();
  const ownerName = ((auth.user?.profile.name as string | undefined) ?? '').split(' ')[0];

  const [groups, setGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const idToken = auth.user?.id_token;
    if (!idToken) return;
    let cancelled = false;
    Promise.all([
      apiFetch<{ groups: Group[] }>('/groups', { idToken }),
      apiFetch<Stats>('/stats', { idToken }),
    ])
      .then(([gr, st]) => {
        if (cancelled) return;
        setGroups(gr.groups);
        setStats(st);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth.user?.id_token]);

  // Sign cover images so the cards aren't text-only.
  const coverKeys = groups.map((g) => g.coverMediaKey).filter((k): k is string => !!k);
  const { urls: coverUrls } = useSignedUrls(coverKeys, auth.user?.id_token ?? null);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      <AppNav currentPath="home" />

      <DashboardHero
        siteTitle="K-pop Archive"
        ownerName={ownerName || undefined}
        groupCount={stats?.groups ?? groups.length}
        memberCount={stats?.members ?? 0}
        mediaCount={stats?.media ?? 0}
      />

      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 py-10">
        <div className="flex items-center gap-4 mb-6">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#404040] shrink-0">
            {groups.length} {groups.length === 1 ? 'Group' : 'Groups'}
          </p>
          <div className="h-px flex-1 bg-white/[0.05]" />
          {groups.length > 0 && (
            <div className="w-48 shrink-0">
              <SearchBar value={query} onChange={setQuery} placeholder="Filter groups…" />
            </div>
          )}
          <button
            onClick={() => router.push('/admin')}
            className="text-[10px] tracking-[0.18em] uppercase text-[#525252] hover:text-[#c084fc] transition-colors shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc] rounded-sm"
          >
            + Admin
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <GroupCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <p className="text-red-400/80 text-sm py-12 text-center">{error}</p>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-[#525252] mb-1">No groups yet</p>
            <button
              onClick={() => router.push('/admin')}
              className="text-[11px] text-[#c084fc]/80 hover:text-[#c084fc] underline underline-offset-2"
            >
              Create your first group →
            </button>
          </div>
        ) : (
          (() => {
            const filtered = groups.filter((g) =>
              g.name.toLowerCase().includes(query.toLowerCase().trim()),
            );
            if (filtered.length === 0) {
              return <p className="text-sm text-[#525252] py-12 text-center">No groups match &ldquo;{query}&rdquo;.</p>;
            }
            return (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {filtered.map((g) => (
                  <GroupCard
                    key={g.id}
                    group={{
                      id: g.id,
                      name: g.name,
                      agency: g.agency ?? undefined,
                      debutYear: g.debutYear ?? undefined,
                      coverUrl: g.coverMediaKey ? coverUrls[g.coverMediaKey] : undefined,
                      memberTags:
                        g.memberCount > 0
                          ? [`${g.memberCount} ${g.memberCount === 1 ? 'member' : 'members'}`]
                          : [],
                    }}
                    onClick={() => router.push(`/groups/${g.id}`)}
                  />
                ))}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}
