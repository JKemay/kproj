'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel, destructive = false }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="w-full max-w-sm rounded-[3px] border border-white/8 bg-[#111111] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-5">
          {destructive && (
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#f87171" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 4.5h11M5.5 4.5V3a.5.5 0 01.5-.5h4a.5.5 0 01.5.5v1.5M10.5 4.5l-.4 8H5.9l-.4-8" />
                <path d="M7 7.5v3M9 7.5v3" />
              </svg>
            </div>
          )}
          <h2
            id="confirm-title"
            className="text-base font-normal text-[#f0f0f0] mb-2"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {title}
          </h2>
          <p className="text-sm text-[#737373] leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center gap-2 px-6 pb-5">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 rounded-sm border border-white/10 bg-transparent px-4 py-2.5 text-sm text-[#a0a0a0] hover:text-[#f0f0f0] hover:border-white/20 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-1 ${
              destructive
                ? 'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500'
                : 'bg-[#c084fc] text-black hover:bg-[#a855f7] focus-visible:ring-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
