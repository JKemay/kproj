'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from 'react-oidc-context';

import { AppNav } from '@/components/AppNav';
import { AuthGuard, useIsAdmin } from '@/components/AuthGuard';
import { MediaEditModal } from '@/components/MediaEditModal';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { ConfirmBanner } from '@/components/ui/ConfirmBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Lightbox } from '@/components/ui/Lightbox';
import { MediaTile } from '@/components/ui/MediaTile';
import { TopicHero } from '@/components/ui/TopicHero';
import { ApiError, apiFetch } from '@/lib/api';
import { type Era, listEras } from '@/lib/eras';
import { type MediaPatch, deleteMedia, thumbKeyFor, updateMedia } from '@/lib/media';
import { useSignedUrls } from '@/lib/useSignedUrls';

// Reserved id — the backend hides this group from every non-admin read path.
const HEAVEN_ID = 'six-heaven';

interface MediaRow {
  id: string;
  s3Key: string;
  kind: 'image' | 'gif' | 'video';
  caption: string | null;
  eraId: string | null;
  tags: string[];
}

function Heaven() {
  const auth = useAuth();
  const isAdmin = useIsAdmin();
  const idToken = auth.user?.id_token ?? null;

  const [ready, setReady] = useState(false);
  const [mediaRows, setMediaRows] = useState<MediaRow[]>([]);
  const [eras, setEras] = useState<Era[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<MediaRow | null>(null);
  const [editTarget, setEditTarget] = useState<MediaRow | null>(null);
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  // Guards against a stale response clobbering fresher state (matches the
  // same pattern used on the group/member detail pages).
  const loadRequestId = useRef(0);
  const load = useMemo(
    () => () => {
      if (!idToken || !isAdmin) return;
      const requestId = ++loadRequestId.current;
      // Self-provision the reserved group on first visit, then load contents.
      apiFetch(`/groups/${HEAVEN_ID}`, { idToken })
        .catch((e) => {
          if (e instanceof ApiError && e.status === 404) {
            return apiFetch('/groups', {
              method: 'POST',
              idToken,
              body: { id: HEAVEN_ID, name: "6ix's Heaven", kind: 'topic' },
            });
          }
          throw e;
        })
        .then(() =>
          Promise.all([
            apiFetch<{ media: MediaRow[] }>(`/media?groupId=${HEAVEN_ID}&groupOnly=1`, { idToken }),
            listEras(HEAVEN_ID, idToken),
          ]),
        )
        .then(([md, er]) => {
          if (loadRequestId.current !== requestId) return;
          setMediaRows(md.media);
          setEras(er.eras);
          setReady(true);
        })
        .catch((e) => {
          if (loadRequestId.current !== requestId) return;
          setError(e instanceof Error ? e.message : String(e));
        });
    },
    [idToken, isAdmin],
  );

  useEffect(() => {
    load();
  }, [load]);

  const keys = [
    ...mediaRows.map((m) => m.s3Key),
    ...mediaRows.flatMap((m) => {
      const t = thumbKeyFor(m.s3Key, m.kind);
      return t ? [t] : [];
    }),
  ];
  const { urls } = useSignedUrls(keys, idToken);
  const viewable = mediaRows.filter((m) => urls[m.s3Key]);

  const onConfirmDelete = async () => {
    if (!idToken || !deleteTarget) return;
    setBusy(true);
    try {
      await deleteMedia(deleteTarget.id, idToken);
      setMediaRows((rows) => rows.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      setBanner({ message: 'Deleted', variant: 'success' });
    } catch (e) {
      setBanner({ message: e instanceof Error ? e.message : String(e), variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const onSaveMedia = async (patch: MediaPatch) => {
    if (!idToken || !editTarget) return;
    setBusy(true);
    try {
      await updateMedia(editTarget.id, patch, idToken);
      setMediaRows((rows) =>
        rows.map((r) =>
          r.id === editTarget.id
            ? {
                ...r,
                caption: patch.caption ?? null,
                tags: patch.tags ?? r.tags,
                eraId: patch.eraId !== undefined ? patch.eraId : r.eraId,
              }
            : r,
        ),
      );
      setEditTarget(null);
      setBanner({ message: 'Saved', variant: 'success' });
    } catch (e) {
      setBanner({ message: e instanceof Error ? e.message : String(e), variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  // Private room — only the owner. Other allowlisted users get denied.
  if (!isAdmin) {
    return <AccessDenied userEmail="" signOutHref="/signout" />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      <AppNav currentPath="heaven" />

      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 pb-10">
        <TopicHero
          title="6ix's Heaven"
          subtitle="Private room — only you can see this."
          mediaCount={mediaRows.length}
        />

        <div className="pt-10">
          {error ? (
            <p className="text-red-400/80 text-sm text-center">{error}</p>
          ) : !ready ? (
            <p className="text-[#525252] text-sm text-center">Loading…</p>
          ) : mediaRows.length === 0 ? (
            <p className="text-sm text-[#525252] py-12 text-center">
              Empty so far. Upload from <a href="/admin" className="underline hover:text-[#c084fc]">/admin</a>{' '}
              — pick &ldquo;6ix&rsquo;s Heaven&rdquo; as the group.
            </p>
          ) : (
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
                    isProfile={false}
                    starTitle="—"
                    onSetProfile={() => {}}
                    onDelete={() => setDeleteTarget(m)}
                    onEditCaption={() => setEditTarget(m)}
                    onView={() => setViewerIdx(i)}
                  />
                );
              })}
            </div>
          )}
        </div>
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

      {editTarget && (
        <MediaEditModal
          initial={{ caption: editTarget.caption, tags: editTarget.tags ?? [], eraId: editTarget.eraId }}
          eras={eras}
          saving={busy}
          onSave={onSaveMedia}
          onCancel={() => setEditTarget(null)}
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
        <ConfirmBanner message={banner.message} variant={banner.variant} onDismiss={() => setBanner(null)} />
      )}
    </div>
  );
}

export default function HeavenPage() {
  return (
    <AuthGuard>
      <Heaven />
    </AuthGuard>
  );
}
