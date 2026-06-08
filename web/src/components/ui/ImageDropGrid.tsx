'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface ImageDropGridProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxPreview?: number;
}

export function ImageDropGrid({ files, onFilesChange, maxPreview = 20 }: ImageDropGridProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const merge = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files];
    Array.from(incoming).forEach((f) => {
      if (!next.some((x) => x.name === f.name && x.size === f.size)) next.push(f);
    });
    onFilesChange(next.slice(0, maxPreview));
  };

  const remove = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Without an explicit copy dropEffect, some OS/browser combos reject the drop.
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      merge(e.dataTransfer.files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files],
  );

  const previews = files.slice(0, maxPreview);
  const canAddMore = files.length < maxPreview;

  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
      className={`rounded-sm border-2 border-dashed p-3 transition-colors duration-150 ${
        isDragOver ? 'border-[#c084fc]/50 bg-[#c084fc]/5' : 'border-white/10'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="sr-only"
        onChange={(e) => merge(e.target.files)}
      />

      {previews.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 py-8 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc] rounded-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/3">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#737373" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 10V3M5.5 5.5L8 3l2.5 2.5" />
              <path d="M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm text-[#f0f0f0]">Drop files or <span className="text-[#c084fc] underline underline-offset-2">browse</span></p>
            <p className="mt-0.5 text-[11px] text-[#525252]">Up to {maxPreview} files</p>
          </div>
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
          {previews.map((file, idx) => (
            <Thumb key={`${file.name}-${file.size}`} file={file} onRemove={() => remove(idx)} />
          ))}

          {canAddMore && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="group relative aspect-square rounded-[3px] border border-dashed border-white/[0.1] bg-[#111111] flex flex-col items-center justify-center gap-1 hover:border-white/[0.2] hover:bg-[#141414] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc]"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#525252" strokeWidth="1.25" strokeLinecap="round" className="group-hover:stroke-[#737373] transition-colors">
                <path d="M7 1v12M1 7h12" />
              </svg>
              <span className="text-[9px] text-[#404040] group-hover:text-[#525252] transition-colors leading-none">add</span>
            </button>
          )}
        </div>
      )}

      {previews.length > 0 && (
        <p className="mt-2 text-[10px] text-[#404040]">{files.length} file{files.length !== 1 ? 's' : ''} selected{files.length >= maxPreview ? ` (max ${maxPreview})` : ''}</p>
      )}
    </div>
  );
}

function Thumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  // Create the object URL once per file (in render via useMemo) and revoke it
  // on unmount — otherwise every render leaks a new blob URL into memory.
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const isVideo = file.type.startsWith('video/');

  return (
    <div className="group relative aspect-square rounded-[3px] overflow-hidden bg-[#111111] border border-white/[0.06]">
      {isVideo ? (
        <video src={url} muted playsInline className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <img src={url} alt={file.name} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-150" />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove file"
        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white focus:outline-none"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1 1l6 6M7 1L1 7" />
        </svg>
      </button>
    </div>
  );
}
