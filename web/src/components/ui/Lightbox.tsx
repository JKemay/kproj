'use client';

import { useEffect, useCallback } from 'react';

interface LightboxItem {
  signedUrl: string;
  kind: 'image' | 'gif' | 'video';
  caption?: string;
}

interface LightboxProps {
  open: boolean;
  onClose: () => void;
  item: LightboxItem;
  onPrev?: () => void;
  onNext?: () => void;
}

export function Lightbox({ open, onClose, item, onPrev, onNext }: LightboxProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev?.();
      if (e.key === 'ArrowRight') onNext?.();
    },
    [open, onClose, onPrev, onNext],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc]"
        onClick={onClose}
        aria-label="Close"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1 1l12 12M13 1L1 13" />
        </svg>
      </button>

      {onPrev && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc]"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Previous"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 1L2 7l7 6" />
          </svg>
        </button>
      )}

      {onNext && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc]"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Next"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 1l7 6-7 6" />
          </svg>
        </button>
      )}

      <div
        className="relative flex flex-col items-center max-w-5xl w-full mx-12"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative max-h-[82vh] flex items-center justify-center">
          {item.kind === 'video' ? (
            <video
              src={item.signedUrl}
              muted
              loop
              autoPlay
              playsInline
              className="max-h-[82vh] max-w-full rounded-sm object-contain"
            />
          ) : (
            <img
              src={item.signedUrl}
              alt={item.caption ?? ''}
              className="max-h-[82vh] max-w-full rounded-sm object-contain"
            />
          )}
        </div>

        {item.caption && (
          <p className="mt-4 text-center text-sm text-white/40 max-w-xl leading-relaxed px-4">
            {item.caption}
          </p>
        )}
      </div>
    </div>
  );
}
