'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SelectOption {
  id: string;
  name: string;
}

interface UploadFormShellProps {
  groups: SelectOption[];
  members: SelectOption[];
  onUpload: (files: File[], groupId: string, memberId: string, caption: string) => void;
  /** Called when the selected group changes, so the parent can load that group's members. */
  onGroupChange?: (groupId: string) => void;
  /** Optional status line under the submit button. */
  status?: { kind: 'idle' | 'busy' | 'ok' | 'err'; message?: string };
  /** Bump to clear the file selection (e.g. after a successful upload). */
  resetToken?: number;
}

export function UploadFormShell({
  groups,
  members,
  onUpload,
  onGroupChange,
  status,
  resetToken,
}: UploadFormShellProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [groupId, setGroupId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [caption, setCaption] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resetToken !== undefined) {
      setFiles([]);
      setCaption('');
    }
  }, [resetToken]);

  const previewUrl = files[0] ? URL.createObjectURL(files[0]) : null;
  const isVideo = files[0]?.type.startsWith('video/');

  const accept = (incoming: FileList | null) => {
    if (!incoming) return;
    setFiles(Array.from(incoming));
  };

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Without an explicit copy dropEffect, some OS/browser combos treat the
    // drop as disallowed and silently swallow it.
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    accept(e.dataTransfer.files);
  }, []);

  const handleGroup = (id: string) => {
    setGroupId(id);
    setMemberId('');
    onGroupChange?.(id);
  };

  const busy = status?.kind === 'busy';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length || !groupId || busy) return;
    onUpload(files, groupId, memberId, caption);
  };

  const selectClass =
    'w-full rounded-sm border border-white/8 bg-[#111111] px-3 py-2.5 text-sm text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-[#c084fc] focus:border-[#c084fc]/60 transition-colors appearance-none cursor-pointer';

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl rounded-sm border border-white/7 bg-[#111111] p-6 space-y-5"
    >
      <div>
        <h2
          className="text-base font-normal text-[#f0f0f0] mb-0.5"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Upload Media
        </h2>
        <p className="text-xs text-[#737373]">JPEG, PNG, WebP, GIF, or AVIF.</p>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-sm border-2 border-dashed p-10 cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc] ${
          isDragOver
            ? 'border-[#c084fc]/60 bg-[#c084fc]/5'
            : 'border-white/10 hover:border-white/20 bg-transparent'
        }`}
        aria-label="Drop files here or click to browse"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="sr-only"
          onChange={(e) => accept(e.target.files)}
        />

        {previewUrl ? (
          <div className="w-full max-h-48 overflow-hidden rounded-sm">
            {isVideo ? (
              <video
                src={previewUrl}
                muted
                loop
                autoPlay
                playsInline
                className="w-full max-h-48 object-contain rounded-sm"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full max-h-48 object-contain rounded-sm"
              />
            )}
          </div>
        ) : (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/3">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#737373" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12V4M6 7l3-3 3 3" />
                <path d="M3 13v1a1 1 0 001 1h10a1 1 0 001-1v-1" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm text-[#f0f0f0]">
                Drop files here, or{' '}
                <span className="text-[#c084fc] underline underline-offset-2">browse</span>
              </p>
              <p className="mt-1 text-[11px] text-[#737373]">JPEG · PNG · WebP · GIF · AVIF, up to 25 MB</p>
            </div>
          </>
        )}

        {files.length > 0 && (
          <p className="text-xs text-[#c084fc]">
            {files.length === 1 ? files[0].name : `${files.length} files selected`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] tracking-[0.12em] uppercase text-[#737373]">Group *</label>
          <div className="relative">
            <select
              value={groupId}
              onChange={(e) => handleGroup(e.target.value)}
              required
              className={selectClass}
            >
              <option value="">Select group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#737373]">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4l3 3 3-3" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] tracking-[0.12em] uppercase text-[#737373]">Member</label>
          <div className="relative">
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className={selectClass}
            >
              <option value="">All members</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#737373]">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4l3 3 3-3" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] tracking-[0.12em] uppercase text-[#737373]">Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          placeholder="Optional note about this media…"
          className="w-full resize-none rounded-sm border border-white/8 bg-[#111111] px-3 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#404040] focus:outline-none focus:ring-1 focus:ring-[#c084fc] focus:border-[#c084fc]/60 transition-colors leading-relaxed"
        />
      </div>

      <button
        type="submit"
        disabled={!files.length || !groupId || busy}
        className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#c084fc] px-5 py-2.5 text-sm font-medium text-black transition-all hover:bg-[#a855f7] disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 10V3M4 6l3-3 3 3" />
          <path d="M1 11v1a1 1 0 001 1h10a1 1 0 001-1v-1" />
        </svg>
        {busy ? 'Uploading…' : `Upload ${files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : ''}`}
      </button>

      {status && status.kind !== 'idle' && status.kind !== 'busy' && status.message && (
        <p className={`text-sm ${status.kind === 'ok' ? 'text-green-400/80' : 'text-red-400/80'}`}>
          {status.message}
        </p>
      )}
    </form>
  );
}
