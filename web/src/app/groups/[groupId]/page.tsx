'use client';

import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';

import { AppNav } from '@/components/AppNav';
import { AuthGuard, useIsAdmin } from '@/components/AuthGuard';
import { EditEntityForm } from '@/components/ui/EditEntityForm';
import { MemberCard } from '@/components/ui/MemberCard';
import { MemberCardSkeleton } from '@/components/ui/MemberCardSkeleton';
import { apiFetch } from '@/lib/api';
import { updateGroup } from '@/lib/entities';
import { useSignedUrls } from '@/lib/useSignedUrls';

interface Group {
  id: string;
  name: string;
  agency: string | null;
  debutYear: number | null;
}

interface Member {
  id: string;
  stageName: string;
  position: string | null;
  profileMediaKey: string | null;
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] tracking-[0.2em] uppercase text-[#404040]">{label}</span>
      <span className="text-sm text-[#a0a0a0]">{children}</span>
    </div>
  );
}

function GroupView({ groupId }: { groupId: string }) {
  const router = useRouter();
  const auth = useAuth();
  const isAdmin = useIsAdmin();
  const idToken = auth.user?.id_token ?? null;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const onSaveGroup = async (values: Record<string, string>) => {
    if (!idToken || !group) return;
    setSaving(true);
    try {
      const res = await updateGroup(
        groupId,
        {
          name: values.name,
          debutYear: values.debutYear ? Number(values.debutYear) : null,
          agency: values.agency || null,
        },
        idToken,
      );
      setGroup(res.group as Group);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!idToken) return;
    let cancelled = false;
    Promise.all([
      apiFetch<{ group: Group }>(`/groups/${groupId}`, { idToken }),
      apiFetch<{ members: Member[] }>(`/groups/${groupId}/members`, { idToken }),
    ])
      .then(([g, m]) => {
        if (cancelled) return;
        setGroup(g.group);
        setMembers(m.members);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [groupId, idToken]);

  const profileKeys = members.map((m) => m.profileMediaKey).filter((k): k is string => !!k);
  const { urls } = useSignedUrls(profileKeys, idToken);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      <AppNav currentPath="group" />

      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 py-10">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase text-[#525252] hover:text-[#a0a0a0] transition-colors mb-10 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc] rounded-sm group"
        >
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"
            className="group-hover:-translate-x-0.5 transition-transform duration-150"
          >
            <path d="M8 1L3 6l5 5" />
          </svg>
          All groups
        </button>

        {error ? (
          <p className="text-red-400/80 text-sm">{error}</p>
        ) : !group ? (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <MemberCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="mb-12 border-b border-white/[0.05] pb-10">
              {editing ? (
                <div className="max-w-md">
                  <EditEntityForm
                    fields={[
                      { name: 'name', label: 'Name', value: group.name, type: 'text' },
                      { name: 'debutYear', label: 'Debut Year', value: group.debutYear ?? '', type: 'number' },
                      { name: 'agency', label: 'Agency', value: group.agency ?? '', type: 'text' },
                    ]}
                    onSave={onSaveGroup}
                    onCancel={() => setEditing(false)}
                    saving={saving}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <h1
                      className="text-[2.75rem] sm:text-[4rem] font-normal tracking-tight text-[#f0f0f0] leading-none"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      {group.name}
                    </h1>
                    {isAdmin && (
                      <button
                        onClick={() => setEditing(true)}
                        className="shrink-0 mt-2 text-[10px] tracking-[0.16em] uppercase text-[#525252] hover:text-[#c084fc] transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-5">
                    {group.agency && <MetaItem label="Agency">{group.agency}</MetaItem>}
                    {group.debutYear && <MetaItem label="Debut">{group.debutYear}</MetaItem>}
                    <MetaItem label="Members">{members.length}</MetaItem>
                  </div>
                </>
              )}
            </div>

            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-sm text-[#525252]">No members listed yet.</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <p className="text-[10px] tracking-[0.22em] uppercase text-[#404040] shrink-0">Members</p>
                  <div className="h-px flex-1 bg-white/[0.05]" />
                </div>
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                  {members.map((m) => (
                    <MemberCard
                      key={m.id}
                      member={{
                        id: m.id,
                        stageName: m.stageName,
                        position: m.position ?? '',
                        profileUrl: m.profileMediaKey ? urls[m.profileMediaKey] : undefined,
                      }}
                      onClick={() => router.push(`/groups/${groupId}/members/${m.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  return (
    <AuthGuard>
      <GroupView groupId={groupId} />
    </AuthGuard>
  );
}
