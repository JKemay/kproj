'use client';

import { useEffect, useState } from 'react';

interface ConfirmBannerProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  variant?: 'success' | 'error';
}

export function ConfirmBanner({ message, actionLabel, onAction, onDismiss, variant = 'success' }: ConfirmBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);
    return () => { cancelAnimationFrame(enter); clearTimeout(timer); };
  }, [onDismiss]);

  const isError = variant === 'error';

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 transition-all duration-300 ease-out ${
        visible ? '-translate-x-1/2 translate-y-0 opacity-100' : '-translate-x-1/2 translate-y-4 opacity-0'
      }`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex items-center gap-3 rounded-sm border shadow-2xl px-4 py-2.5 text-sm ${
          isError
            ? 'border-red-500/25 bg-[#1a0f0f] text-[#fca5a5]'
            : 'border-white/10 bg-[#141414] text-[#d0d0d0]'
        }`}
      >
        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${isError ? 'bg-red-500/20' : 'bg-[#c084fc]/20'}`}>
          {isError ? (
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l6 6M7 1L1 7" />
            </svg>
          ) : (
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1.5 4l2 2 3-3.5" />
            </svg>
          )}
        </span>

        <span className="whitespace-nowrap">{message}</span>

        {actionLabel && onAction && (
          <>
            <div className="h-3.5 w-px bg-white/10" />
            <button
              onClick={() => { onAction(); setVisible(false); setTimeout(onDismiss, 300); }}
              className={`text-sm font-medium underline underline-offset-2 whitespace-nowrap hover:no-underline transition-all focus:outline-none ${
                isError ? 'text-[#fca5a5]' : 'text-[#c084fc]'
              }`}
            >
              {actionLabel}
            </button>
          </>
        )}

        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
          aria-label="Dismiss"
          className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/30 hover:text-white/60 transition-colors focus:outline-none"
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M1 1l7 7M8 1L1 8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
