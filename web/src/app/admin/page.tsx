'use client';

import { useState } from 'react';
import { useAuth } from 'react-oidc-context';

import { AppNav } from '@/components/AppNav';
import { AuthGuard, useAppUser } from '@/components/AuthGuard';
import { ConfirmBanner } from '@/components/ui/ConfirmBanner';
import { ImageDropGrid } from '@/components/ui/ImageDropGrid';
import { TagInput } from '@/components/ui/TagInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { apiFetch } from '@/lib/api';
import { type Era, createEra, deleteEra, listEras, updateEra } from '@/lib/eras';
import { type AllowedMime, registerMedia, uploadFiles } from '@/lib/media';
import { useGroups } from '@/lib/useGroups';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
const ALLOWED: AllowedMime[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

interface Member {
  id: string;
  stageName: string;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'ok'; message: string }
  | { kind: 'err'; message: string };

function AdminPanel() {
  const user = useAppUser();
  const auth = useAuth();
  const idToken = auth.user?.id_token ?? null;

  if (ADMIN_EMAIL && user.email.toLowerCase() !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
        <AppNav />
        <main className="p-8 max-w-2xl mx-auto w-full text-center pt-24">
          <h1 className="font-serif text-2xl" style={{ fontFamily: "Georgia, serif" }}>
            Admin only
          </h1>
          <p className="text-[#737373] mt-2">You&rsquo;re signed in but not the archive admin.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      <AppNav />
      <main className="mx-auto max-w-3xl w-full px-5 sm:px-8 py-10 space-y-14">
        <div className="flex items-baseline justify-between">
          <h1
            className="text-[2.5rem] font-normal tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Admin
          </h1>
          <a href="/admin/seed" className="text-[10px] tracking-[0.16em] uppercase text-[#525252] hover:text-[#c084fc] transition-colors">
            Seed archive →
          </a>
        </div>
        <CreateGroupForm idToken={idToken} />
        <CreateMemberForm idToken={idToken} />
        <ErasSection idToken={idToken} />
        <UploadSection idToken={idToken} />
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <p className="text-[10px] tracking-[0.22em] uppercase text-[#404040] shrink-0">{children}</p>
      <div className="h-px flex-1 bg-white/[0.05]" />
    </div>
  );
}

function CreateGroupForm({ idToken }: { idToken: string | null }) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [kind, setKind] = useState('group');
  const [debutYear, setDebutYear] = useState('');
  const [agency, setAgency] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) return;
    setStatus({ kind: 'busy' });
    try {
      await apiFetch('/groups', {
        method: 'POST',
        idToken,
        body: {
          id,
          name,
          kind: kind !== 'group' ? kind : undefined,
          debutYear: debutYear ? Number(debutYear) : undefined,
          agency: agency || undefined,
        },
      });
      setStatus({ kind: 'ok', message: 'Group created.' });
      setId(''); setName(''); setKind('group'); setDebutYear(''); setAgency('');
    } catch (e) {
      setStatus({ kind: 'err', message: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <section>
      <SectionLabel>Create Group</SectionLabel>
      <form onSubmit={onSubmit} className="max-w-xl space-y-3">
        <Field label="Slug (id)" value={id} onChange={setId} placeholder="lesserafim" required />
        <Field label="Name" value={name} onChange={setName} placeholder="LE SSERAFIM" required />
        <SelectField label="Type" value={kind} onChange={setKind}>
          <option value="group">Group</option>
          <option value="soloist">Soloist</option>
          <option value="topic">Topic (collection, no members)</option>
        </SelectField>
        <Field label="Debut Year" value={debutYear} onChange={setDebutYear} placeholder="2022" type="number" />
        <Field label="Agency" value={agency} onChange={setAgency} placeholder="Source Music (HYBE)" />
        <SubmitBtn status={status}>Create group</SubmitBtn>
        <StatusLine status={status} />
      </form>
    </section>
  );
}

function CreateMemberForm({ idToken }: { idToken: string | null }) {
  const { groups } = useGroups(idToken);
  const [groupId, setGroupId] = useState('');
  const [id, setId] = useState('');
  const [stageName, setStageName] = useState('');
  const [position, setPosition] = useState('');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken || !groupId) return;
    setStatus({ kind: 'busy' });
    try {
      await apiFetch(`/groups/${groupId}/members`, {
        method: 'POST',
        idToken,
        body: { id, stageName, position: position || undefined, bio: bio || undefined },
      });
      setStatus({ kind: 'ok', message: 'Member created.' });
      setId(''); setStageName(''); setPosition(''); setBio('');
    } catch (e) {
      setStatus({ kind: 'err', message: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <section>
      <SectionLabel>Create Member</SectionLabel>
      <form onSubmit={onSubmit} className="max-w-xl space-y-3">
        <SelectField label="Group" value={groupId} onChange={setGroupId} required>
          <option value="">Select group</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </SelectField>
        <Field label="Slug (id)" value={id} onChange={setId} placeholder="yunjin" required />
        <Field label="Stage Name" value={stageName} onChange={setStageName} placeholder="Yunjin" required />
        <Field label="Position" value={position} onChange={setPosition} placeholder="Main Vocal" />
        <TextAreaField label="Bio" value={bio} onChange={setBio} />
        <SubmitBtn status={status}>Create member</SubmitBtn>
        <StatusLine status={status} />
      </form>
    </section>
  );
}

function ErasSection({ idToken }: { idToken: string | null }) {
  const { groups } = useGroups(idToken);
  const [groupId, setGroupId] = useState('');
  const [eras, setEras] = useState<Era[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Era | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const loadEras = (id: string) => {
    setGroupId(id);
    setEditId(null);
    if (!idToken || !id) { setEras([]); return; }
    listEras(id, idToken).then((r) => setEras(r.eras)).catch(() => setEras([]));
  };

  const onRename = async (era: Era) => {
    if (!idToken || !editLabel.trim() || busy) return;
    setBusy(true);
    try {
      const res = await updateEra(era.id, { label: editLabel.trim() }, idToken);
      setEras((prev) => prev.map((e) => (e.id === era.id ? res.era : e)));
      setEditId(null);
      setStatus({ kind: 'ok', message: 'Era renamed.' });
    } catch (e) {
      setStatus({ kind: 'err', message: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!idToken || !deleteTarget || busy) return;
    setBusy(true);
    try {
      await deleteEra(deleteTarget.id, idToken);
      setEras((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
      setStatus({ kind: 'ok', message: 'Era deleted — its media kept, now unassigned.' });
    } catch (e) {
      setStatus({ kind: 'err', message: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <SectionLabel>Manage Eras</SectionLabel>
      <div className="max-w-xl space-y-3">
        <SelectField label="Group" value={groupId} onChange={loadEras}>
          <option value="">Select group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </SelectField>

        {groupId && eras.length === 0 && (
          <p className="text-sm text-[#525252]">No eras yet — create one in the upload form below.</p>
        )}

        {eras.length > 0 && (
          <ul className="divide-y divide-white/[0.05] rounded-sm border border-white/[0.06] bg-[#111111]">
            {eras.map((era) => (
              <li key={era.id} className="flex items-center gap-2 px-3 py-2">
                {editId === era.id ? (
                  <>
                    <input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); void onRename(era); }
                        if (e.key === 'Escape') setEditId(null);
                      }}
                      autoFocus
                      className="flex-1 rounded-sm border border-white/8 bg-[#0d0d0d] px-2 py-1 text-sm text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-[#c084fc]"
                    />
                    <button
                      type="button"
                      onClick={() => void onRename(era)}
                      disabled={busy || !editLabel.trim()}
                      className="text-[11px] text-[#c084fc] hover:text-[#a855f7] disabled:opacity-40"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="text-[11px] text-[#525252] hover:text-[#a0a0a0]"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-[#e0e0e0]">{era.label}</span>
                    <button
                      type="button"
                      onClick={() => { setEditId(era.id); setEditLabel(era.label); }}
                      className="text-[11px] text-[#525252] hover:text-[#c084fc] transition-colors"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(era)}
                      className="text-[11px] text-[#525252] hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <StatusLine status={status} />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete era "${deleteTarget?.label ?? ''}"?`}
        message="Media in this era is kept — it just becomes unassigned (no era)."
        confirmLabel={busy ? 'Deleting…' : 'Delete era'}
        destructive
        onConfirm={onConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}

// Common tags offered as suggestions in the TagInput. Purely a convenience —
// any free-form tag can still be typed.
const TAG_SUGGESTIONS = ['selca', 'fancam', 'airport', 'stage', 'photoshoot', 'behind', 'mv', 'concert'];

function UploadSection({ idToken }: { idToken: string | null }) {
  const { groups } = useGroups(idToken);
  const [members, setMembers] = useState<Member[]>([]);
  const [eras, setEras] = useState<Era[]>([]);

  const [files, setFiles] = useState<File[]>([]);
  const [groupId, setGroupId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [eraId, setEraId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [caption, setCaption] = useState('');

  // Inline "new era" mini-form
  const [newEraOpen, setNewEraOpen] = useState(false);
  const [newEraLabel, setNewEraLabel] = useState('');

  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const onGroupChange = (id: string) => {
    setGroupId(id);
    setMemberId('');
    setEraId('');
    setNewEraOpen(false);
    if (!idToken || !id) {
      setMembers([]);
      setEras([]);
      return;
    }
    apiFetch<{ members: Member[] }>(`/groups/${id}/members`, { idToken })
      .then((r) => setMembers(r.members))
      .catch(() => setMembers([]));
    listEras(id, idToken)
      .then((r) => setEras(r.eras))
      .catch(() => setEras([]));
  };

  const onCreateEra = async () => {
    if (!idToken || !groupId || !newEraLabel.trim()) return;
    try {
      const res = await createEra(groupId, { label: newEraLabel.trim() }, idToken);
      setEras((prev) => [...prev, res.era]);
      setEraId(res.era.id);
      setNewEraLabel('');
      setNewEraOpen(false);
    } catch (e) {
      setBanner({ message: e instanceof Error ? e.message : String(e), variant: 'error' });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken || !groupId || files.length === 0 || busy) return;

    const valid = files.filter((f) => ALLOWED.includes(f.type as AllowedMime));
    const rejected = files.length - valid.length;
    if (valid.length === 0) {
      setBanner({ message: 'No supported files — JPEG, PNG, WebP, GIF, or AVIF only.', variant: 'error' });
      return;
    }

    setBusy(true);
    try {
      const specs = valid.map((file) => ({
        clientRef: crypto.randomUUID(),
        file,
        groupId,
        memberId: memberId || undefined,
        contentType: file.type as AllowedMime,
      }));
      const keys = await uploadFiles(specs, idToken);

      await Promise.all(
        specs.map((spec) => {
          const s3Key = keys[spec.clientRef];
          if (!s3Key) return Promise.resolve();
          return registerMedia(
            {
              s3Key,
              groupId,
              memberId: memberId || undefined,
              eraId: eraId || undefined,
              kind: spec.contentType === 'image/gif' ? 'gif' : 'image',
              caption: caption || undefined,
              tags: tags.length > 0 ? tags : undefined,
            },
            idToken,
          );
        }),
      );

      setBanner({
        message:
          `Uploaded ${valid.length} file${valid.length > 1 ? 's' : ''}` +
          (rejected > 0 ? ` · skipped ${rejected} unsupported` : ''),
        variant: 'success',
      });
      setFiles([]);
      setCaption('');
      setTags([]);
    } catch (e) {
      setBanner({ message: e instanceof Error ? e.message : String(e), variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <SectionLabel>Upload Media</SectionLabel>
      <form onSubmit={onSubmit} className="max-w-xl space-y-4">
        <ImageDropGrid files={files} onFilesChange={setFiles} maxPreview={20} />

        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Group *" value={groupId} onChange={onGroupChange} required>
            <option value="">Select group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </SelectField>
          <SelectField label="Member" value={memberId} onChange={setMemberId}>
            <option value="">— group photo —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.stageName}</option>
            ))}
          </SelectField>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <label className="text-[11px] tracking-[0.12em] uppercase text-[#737373]">Era</label>
            {groupId && (
              <button
                type="button"
                onClick={() => setNewEraOpen((v) => !v)}
                className="text-[10px] text-[#525252] hover:text-[#c084fc] transition-colors"
              >
                {newEraOpen ? 'cancel' : '+ new era'}
              </button>
            )}
          </div>
          {newEraOpen ? (
            <div className="flex gap-2">
              <input
                value={newEraLabel}
                onChange={(e) => setNewEraLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); void onCreateEra(); }
                }}
                placeholder="2024 · Crazy"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => void onCreateEra()}
                disabled={!newEraLabel.trim()}
                className="shrink-0 rounded-sm bg-[#c084fc] px-4 text-sm font-medium text-black hover:bg-[#a855f7] disabled:opacity-30 transition-all"
              >
                Add
              </button>
            </div>
          ) : (
            <select
              value={eraId}
              onChange={(e) => setEraId(e.target.value)}
              className={`${fieldClass} appearance-none cursor-pointer`}
            >
              <option value="">— no era —</option>
              {eras.map((er) => (
                <option key={er.id} value={er.id}>{er.label}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-[11px] tracking-[0.12em] uppercase text-[#737373] mb-1.5">Tags</label>
          <TagInput tags={tags} onChange={setTags} suggestions={TAG_SUGGESTIONS} />
        </div>

        <TextAreaField label="Caption (applies to all files)" value={caption} onChange={setCaption} />

        <button
          type="submit"
          disabled={busy || !groupId || files.length === 0}
          className="rounded-sm bg-[#c084fc] px-5 py-2.5 text-sm font-medium text-black hover:bg-[#a855f7] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {busy
            ? 'Uploading…'
            : files.length > 0
              ? `Upload ${files.length} file${files.length > 1 ? 's' : ''}`
              : 'Upload'}
        </button>
      </form>

      {banner && (
        <ConfirmBanner
          message={banner.message}
          variant={banner.variant}
          onDismiss={() => setBanner(null)}
        />
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------

const fieldClass =
  'w-full rounded-sm border border-white/8 bg-[#111111] px-3 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#404040] focus:outline-none focus:ring-1 focus:ring-[#c084fc] focus:border-[#c084fc]/60 transition-colors';
const labelClass = 'block text-[11px] tracking-[0.12em] uppercase text-[#737373] mb-1.5';

function Field({
  label, value, onChange, type = 'text', required, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: 'text' | 'number'; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type} required={required} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} className={fieldClass}
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, children, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  children: React.ReactNode; required?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <select
        required={required} value={value} onChange={(e) => onChange(e.target.value)}
        className={`${fieldClass} appearance-none cursor-pointer`}
      >
        {children}
      </select>
    </div>
  );
}

function TextAreaField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <textarea
        rows={3} value={value} onChange={(e) => onChange(e.target.value)}
        className={`${fieldClass} resize-none leading-relaxed`}
      />
    </div>
  );
}

function SubmitBtn({ status, children }: { status: Status; children: React.ReactNode }) {
  const busy = status.kind === 'busy';
  return (
    <button
      type="submit" disabled={busy}
      className="rounded-sm bg-[#c084fc] px-5 py-2.5 text-sm font-medium text-black hover:bg-[#a855f7] disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
    >
      {busy ? 'Working…' : children}
    </button>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (status.kind === 'ok') return <p className="text-sm text-green-400/80">{status.message}</p>;
  if (status.kind === 'err') return <p className="text-sm text-red-400/80">{status.message}</p>;
  return null;
}

export default function AdminPage() {
  return (
    <AuthGuard>
      <AdminPanel />
    </AuthGuard>
  );
}
