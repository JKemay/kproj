'use client';

import { useRouter } from 'next/navigation';
import { use, useEffect, useMemo, useState } from 'react';
import { useAuth } from 'react-oidc-context';

import { AppNav } from '@/components/AppNav';
import { AuthGuard, useIsAdmin } from '@/components/AuthGuard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EditEntityForm } from '@/components/ui/EditEntityForm';
import { MediaMasonry } from '@/components/ui/MediaMasonry';
import { MediaTile } from '@/components/ui/MediaTile';
import { apiFetch } from '@/lib/api';
import { updateMember } from '@/lib/entities';
import { deleteMedia, updateMediaCaption } from '@/lib/media';
import { useSignedUrls } from '@/lib/useSignedUrls';

interface Member {
  id: string;
  groupId: string;
  stageName: string;
  position: string | null;
  bio: string | null;
  profileMediaKey: string | null;
}

interface MediaRow {
  id: string;
  s3Key: string;
  kind: 'image' | 'gif' | 'video';
  caption: string | null;
}

function MemberView({ groupId, memberId }: { groupId: string; memberId: string }) {
  const router = useRouter();
  const auth = useAuth();
  const isAdmin = useIsAdmin();
  const idToken = auth.user?.id_token ?? null;

  const [member, setMember] = useState<Member | null>(null);
  const [mediaRows, setMediaRows] = useState<MediaRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [deleteTarget, setDeleteTarget] = useState<MediaRow | null>(null);
  const [captionTarget, setCaptionTarget] = useState<MediaRow | null>(null);
  const [editingMember, setEditingMember] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useMemo(
    () => () => {
      if (!idToken) return;
      Promise.all([
        apiFetch<{ member: Member }>(`/groups/${groupId}/members/${memberId}`, { idToken }),
        apiFetch<{ media: MediaRow[] }>(`/media?groupId=${groupId}&memberId=${memberId}`, { idToken }),
      ])
        .then(([m, md]) => {
          setMember(m.member);
          setMediaRows(md.media);
        })
        .catch((e) => setError(e instanceof Error ? e.message : String(e)));
    },
    [groupId, memberId, idToken],
  );

  useEffect(() => {
    load();
  }, [load]);

  const allKeys = useMemo(() => {
    const keys = mediaRows.map((m) => m.s3Key);
    if (member?.profileMediaKey) keys.push(member.profileMediaKey);
    return keys;
  }, [mediaRows, member?.profileMediaKey]);
  const { urls } = useSignedUrls(allKeys, idToken);

  const profileUrl = member?.profileMediaKey ? urls[member.profileMediaKey] : undefined;

  // ---- Actions ----
  const onSetProfile = async (m: MediaRow) => {
    if (!idToken || !member) return;
    setMember({ ...member, profileMediaKey: m.s3Key }); // optimistic
    try {
      await updateMember(groupId, memberId, { profileMediaKey: m.s3Key }, idToken);
    } catch {
      load(); // revert on failure
    }
  };

  const onConfirmDelete = async () => {
    if (!idToken || !deleteTarget) return;
    setBusy(true);
    try {
      await deleteMedia(deleteTarget.id, idToken);
      setMediaRows((rows) => rows.filter((r) => r.id !== deleteTarget.id));
      if (member?.profileMediaKey === deleteTarget.s3Key) {
        setMember({ ...member, profileMediaKey: null });
      }
      setDeleteTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onSaveCaption = async (values: Record<string, string>) => {
    if (!idToken || !captionTarget) return;
    setBusy(true);
    const next = values.caption ?? '';
    try {
      await updateMediaCaption(captionTarget.id, next || null, idToken);
      setMediaRows((rows) =>
        rows.map((r) => (r.id === captionTarget.id ? { ...r, caption: next || null } : r)),
      );
      setCaptionTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onSaveMember = async (values: Record<string, string>) => {
    if (!idToken || !member) return;
    setBusy(true);
    try {
      const res = await apiFetch<{ member: Member }>(
        `/groups/${groupId}/members/${memberId}`,
        {
          method: 'PATCH',
          idToken,
          body: {
            stageName: values.stageName,
            position: values.position || null,
            bio: values.bio || null,
          },
        },
      );
      setMember(res.member);
      setEditingMember(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const masonryItems = mediaRows
    .filter((m) => urls[m.s3Key])
    .map((m) => ({
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
          onClick={() => router.push(`/groups/${groupId}`)}
          className="flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase text-[#525252] hover:text-[#a0a0a0] transition-colors mb-10 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc] rounded-sm group"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform duration-150">
            <path d="M8 1L3 6l5 5" />
          </svg>
          Back
        </button>

        {error ? (
          <p className="text-red-400/80 text-sm">{error}</p>
        ) : !member ? (
          <p className="text-[#525252] text-sm">Loading…</p>
        ) : (
          <>
            <div className="mb-12 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 border-b border-white/[0.05] pb-10">
              <div className="aspect-[3/4] bg-[#111111] rounded-sm overflow-hidden border border-white/[0.06]">
                {profileUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileUrl} alt={member.stageName} className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[6rem] text-white/[0.06] select-none" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                      {member.stageName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div>
                {editingMember ? (
                  <div className="max-w-md">
                    <EditEntityForm
                      fields={[
                        { name: 'stageName', label: 'Stage Name', value: member.stageName, type: 'text' },
                        { name: 'position', label: 'Position', value: member.position ?? '', type: 'text' },
                        { name: 'bio', label: 'Bio', value: member.bio ?? '', type: 'textarea' },
                      ]}
                      onSave={onSaveMember}
                      onCancel={() => setEditingMember(false)}
                      saving={busy}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <h1 className="text-[2.5rem] sm:text-[3.5rem] font-normal tracking-tight text-[#f0f0f0] leading-none" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                        {member.stageName}
                      </h1>
                      {isAdmin && (
                        <button
                          onClick={() => setEditingMember(true)}
                          className="shrink-0 mt-2 text-[10px] tracking-[0.16em] uppercase text-[#525252] hover:text-[#c084fc] transition-colors"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {member.position ? (
                      <p className="mt-2 text-xs tracking-[0.14em] uppercase text-[#c084fc]/70">{member.position}</p>
                    ) : null}
                    {member.bio ? (
                      <p className="mt-5 text-[#a0a0a0] leading-relaxed whitespace-pre-wrap max-w-2xl">{member.bio}</p>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <p className="text-[10px] tracking-[0.22em] uppercase text-[#404040] shrink-0">
                {mediaRows.length} {mediaRows.length === 1 ? 'Item' : 'Items'}
              </p>
              <div className="h-px flex-1 bg-white/[0.05]" />
            </div>

            {isAdmin ? (
              mediaRows.length === 0 ? (
                <p className="text-sm text-[#525252] py-12 text-center">No media yet.</p>
              ) : (
                <div className="columns-2 gap-3 sm:columns-3 md:columns-4 lg:columns-5">
                  {mediaRows
                    .filter((m) => urls[m.s3Key])
                    .map((m) => (
                      <MediaTile
                        key={m.id}
                        item={{ signedUrl: urls[m.s3Key]!, kind: m.kind, caption: m.caption ?? undefined }}
                        isProfile={member.profileMediaKey === m.s3Key}
                        onSetProfile={() => onSetProfile(m)}
                        onDelete={() => setDeleteTarget(m)}
                        onEditCaption={() => setCaptionTarget(m)}
                      />
                    ))}
                </div>
              )
            ) : (
              <MediaMasonry items={masonryItems} />
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this media?"
        message="The file and its record will be permanently removed. This cannot be undone."
        confirmLabel={busy ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={onConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {captionTarget && (
        <CaptionModal
          initial={captionTarget.caption ?? ''}
          saving={busy}
          onSave={onSaveCaption}
          onCancel={() => setCaptionTarget(null)}
        />
      )}
    </div>
  );
}

function CaptionModal({
  initial,
  saving,
  onSave,
  onCancel,
}: {
  initial: string;
  saving: boolean;
  onSave: (values: Record<string, string>) => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={onCancel}
    >
      <div className="w-full max-w-sm rounded-[3px] border border-white/8 bg-[#111111] p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-normal text-[#f0f0f0] mb-4" style={{ fontFamily: "Georgia, serif" }}>
          Edit caption
        </h2>
        <EditEntityForm
          fields={[{ name: 'caption', label: 'Caption', value: initial, type: 'textarea' }]}
          onSave={onSave}
          onCancel={onCancel}
          saving={saving}
        />
      </div>
    </div>
  );
}

export default function MemberPage({
  params,
}: {
  params: Promise<{ groupId: string; memberId: string }>;
}) {
  const { groupId, memberId } = use(params);
  return (
    <AuthGuard>
      <MemberView groupId={groupId} memberId={memberId} />
    </AuthGuard>
  );
}
