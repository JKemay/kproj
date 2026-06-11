'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';

import { AppNav } from '@/components/AppNav';
import { AuthGuard, useIsAdmin } from '@/components/AuthGuard';
import { MediaEditModal } from '@/components/MediaEditModal';
import { ConfirmBanner } from '@/components/ui/ConfirmBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EditEntityForm } from '@/components/ui/EditEntityForm';
import { EraTabs } from '@/components/ui/EraTabs';
import { Lightbox } from '@/components/ui/Lightbox';
import { MediaMasonry } from '@/components/ui/MediaMasonry';
import { MediaTile } from '@/components/ui/MediaTile';
import { MemberCard } from '@/components/ui/MemberCard';
import { MemberCardSkeleton } from '@/components/ui/MemberCardSkeleton';
import { TopicHero } from '@/components/ui/TopicHero';
import { apiFetch } from '@/lib/api';
import { updateGroup } from '@/lib/entities';
import { type Era, listEras } from '@/lib/eras';
import { type MediaPatch, deleteMedia, thumbKeyFor, updateMedia } from '@/lib/media';
import { useSignedUrls } from '@/lib/useSignedUrls';

interface Group {
  id: string;
  name: string;
  kind: 'group' | 'soloist' | 'topic';
  agency: string | null;
  debutYear: number | null;
  coverMediaKey: string | null;
}

interface Member {
  id: string;
  stageName: string;
  position: string | null;
  profileMediaKey: string | null;
}

interface MediaRow {
  id: string;
  s3Key: string;
  kind: 'image' | 'gif' | 'video';
  caption: string | null;
  eraId: string | null;
  tags: string[];
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
  const [groupMedia, setGroupMedia] = useState<MediaRow[]>([]);
  const [eras, setEras] = useState<Era[]>([]);
  const [activeEraId, setActiveEraId] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaRow | null>(null);
  const [captionTarget, setCaptionTarget] = useState<MediaRow | null>(null);
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

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
      apiFetch<{ media: MediaRow[] }>(`/media?groupId=${groupId}&groupOnly=1`, { idToken }),
      listEras(groupId, idToken),
    ])
      .then(([g, m, md, er]) => {
        if (cancelled) return;
        setGroup(g.group);
        setMembers(m.members);
        setGroupMedia(md.media);
        setEras(er.eras);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [groupId, idToken]);

  // Sign member profile keys + group photo keys (+ thumbs) + cover in one batch.
  const signKeys = [
    ...members.map((m) => m.profileMediaKey).filter((k): k is string => !!k),
    ...groupMedia.map((m) => m.s3Key),
    ...groupMedia.flatMap((m) => {
      const t = thumbKeyFor(m.s3Key, m.kind);
      return t ? [t] : [];
    }),
    ...(group?.coverMediaKey ? [group.coverMediaKey] : []),
  ];
  const { urls } = useSignedUrls(signKeys, idToken);

  // ---- Group-photo actions ----
  const onSetCover = async (m: MediaRow) => {
    if (!idToken || !group) return;
    setGroup({ ...group, coverMediaKey: m.s3Key }); // optimistic
    try {
      await updateGroup(groupId, { coverMediaKey: m.s3Key }, idToken);
    } catch {
      // reload group to revert
      apiFetch<{ group: Group }>(`/groups/${groupId}`, { idToken })
        .then((r) => setGroup(r.group))
        .catch(() => {});
    }
  };

  const onConfirmDelete = async () => {
    if (!idToken || !deleteTarget) return;
    setBusy(true);
    try {
      await deleteMedia(deleteTarget.id, idToken);
      setGroupMedia((rows) => rows.filter((r) => r.id !== deleteTarget.id));
      if (group?.coverMediaKey === deleteTarget.s3Key) {
        setGroup({ ...group, coverMediaKey: null });
      }
      setDeleteTarget(null);
      setBanner({ message: 'Photo deleted', variant: 'success' });
    } catch (e) {
      setBanner({ message: e instanceof Error ? e.message : String(e), variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const onSaveMedia = async (patch: MediaPatch) => {
    if (!idToken || !captionTarget) return;
    setBusy(true);
    try {
      await updateMedia(captionTarget.id, patch, idToken);
      setGroupMedia((rows) =>
        rows.map((r) =>
          r.id === captionTarget.id
            ? {
                ...r,
                caption: patch.caption ?? null,
                tags: patch.tags ?? r.tags,
                eraId: patch.eraId !== undefined ? patch.eraId : r.eraId,
              }
            : r,
        ),
      );
      setCaptionTarget(null);
      setBanner({ message: 'Saved', variant: 'success' });
    } catch (e) {
      setBanner({ message: e instanceof Error ? e.message : String(e), variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  // ---- Era filter for Group Photos ----
  const eraCounts = new Map<string, number>();
  for (const m of groupMedia) {
    if (m.eraId) eraCounts.set(m.eraId, (eraCounts.get(m.eraId) ?? 0) + 1);
  }
  const eraTabs = [
    { id: 'all', label: 'All', count: groupMedia.length },
    ...eras
      .filter((er) => eraCounts.has(er.id))
      .map((er) => ({ id: er.id, label: er.label, count: eraCounts.get(er.id)! })),
  ];
  const visibleMedia =
    activeEraId === 'all' ? groupMedia : groupMedia.filter((m) => m.eraId === activeEraId);

  // Same array drives the admin grid, masonry, and lightbox navigation.
  const viewable = visibleMedia.filter((m) => urls[m.s3Key]);

  const groupMasonryItems = viewable.map((m) => ({
    key: m.s3Key,
    signedUrl: urls[m.s3Key]!,
    kind: m.kind,
    caption: m.caption ?? undefined,
  }));

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
              ) : group.kind === 'topic' ? (
                <div className="relative">
                  <TopicHero title={group.name} mediaCount={groupMedia.length} />
                  {isAdmin && (
                    <button
                      onClick={() => setEditing(true)}
                      className="absolute top-0 right-0 text-[10px] tracking-[0.16em] uppercase text-[#525252] hover:text-[#c084fc] transition-colors"
                    >
                      Edit
                    </button>
                  )}
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

            {members.length > 0 && (
              <div className="mb-14">
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

            {/* Group Photos — media uploaded to the group (no member selected). */}
            {(groupMedia.length > 0 || isAdmin) && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <p className="text-[10px] tracking-[0.22em] uppercase text-[#404040] shrink-0">
                    {group.kind === 'topic' ? 'Collection' : 'Group Photos'}
                  </p>
                  <div className="h-px flex-1 bg-white/[0.05]" />
                  {isAdmin && (
                    <span className="text-[10px] text-[#383838] shrink-0">
                      ★ sets the card cover
                    </span>
                  )}
                </div>
                {eraTabs.length > 1 && groupMedia.length > 0 && (
                  <div className="mb-6">
                    <EraTabs eras={eraTabs} activeId={activeEraId} onSelect={setActiveEraId} />
                  </div>
                )}
                {groupMedia.length === 0 ? (
                  <p className="text-sm text-[#525252] py-8 text-center">
                    No group photos yet. Upload from{' '}
                    <Link className="underline hover:text-[#c084fc]" href="/admin">
                      /admin
                    </Link>{' '}
                    without selecting a member.
                  </p>
                ) : isAdmin ? (
                  <div className="columns-2 gap-3 sm:columns-3 md:columns-4 lg:columns-5">
                    {viewable.map((m, i) => {
                      const tk = thumbKeyFor(m.s3Key, m.kind);
                      const thumbUrl = tk ? urls[tk] : undefined;
                      return (
                        <MediaTile
                          key={m.id}
                          item={{
                            signedUrl: thumbUrl ?? urls[m.s3Key]!,
                            fallbackUrl: urls[m.s3Key],
                            kind: m.kind,
                            caption: m.caption ?? undefined,
                          }}
                          isProfile={group.coverMediaKey === m.s3Key}
                          starTitle="Set as group cover"
                          starActiveTitle="Group cover"
                          onSetProfile={() => onSetCover(m)}
                          onDelete={() => setDeleteTarget(m)}
                          onEditCaption={() => setCaptionTarget(m)}
                          onView={() => setViewerIdx(i)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <MediaMasonry items={groupMasonryItems} />
                )}
              </div>
            )}

            {members.length === 0 && groupMedia.length === 0 && !isAdmin && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-sm text-[#525252]">Nothing here yet.</p>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this photo?"
        message="The file and its record will be permanently removed. This cannot be undone."
        confirmLabel={busy ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={onConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {captionTarget && (
        <MediaEditModal
          initial={{
            caption: captionTarget.caption,
            tags: captionTarget.tags ?? [],
            eraId: captionTarget.eraId,
          }}
          eras={eras}
          saving={busy}
          onSave={onSaveMedia}
          onCancel={() => setCaptionTarget(null)}
        />
      )}

      {viewerIdx !== null && viewable[viewerIdx] && (
        <Lightbox
          open
          onClose={() => setViewerIdx(null)}
          item={{
            signedUrl: urls[viewable[viewerIdx].s3Key]!,
            kind: viewable[viewerIdx].kind,
            caption: viewable[viewerIdx].caption ?? undefined,
          }}
          onPrev={viewerIdx > 0 ? () => setViewerIdx(viewerIdx - 1) : undefined}
          onNext={viewerIdx < viewable.length - 1 ? () => setViewerIdx(viewerIdx + 1) : undefined}
        />
      )}

      {banner && (
        <ConfirmBanner
          message={banner.message}
          variant={banner.variant}
          onDismiss={() => setBanner(null)}
        />
      )}
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
