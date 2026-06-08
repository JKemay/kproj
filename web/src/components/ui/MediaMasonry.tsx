'use client';

import { useState } from 'react';
import { Lightbox } from './Lightbox';

interface MediaItem {
  key: string;
  signedUrl: string;
  kind: 'image' | 'gif' | 'video';
  caption?: string;
}

interface MediaMasonryProps {
  items: MediaItem[];
}

export function MediaMasonry({ items }: MediaMasonryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const open = lightboxIndex !== null;
  const activeItem = lightboxIndex !== null ? items[lightboxIndex] : null;

  const handlePrev = () =>
    setLightboxIndex((i) => (i !== null ? Math.max(0, i - 1) : null));
  const handleNext = () =>
    setLightboxIndex((i) => (i !== null ? Math.min(items.length - 1, i + 1) : null));

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/8 bg-white/3">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#737373" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="16" height="12" rx="1.5" />
            <path d="M2 14l4.5-4.5a1 1 0 011.4 0L10 11.5l2.5-2.5a1 1 0 011.4 0L17 12" />
            <circle cx="13.5" cy="7.5" r="1" />
          </svg>
        </div>
        <p className="text-sm text-[#737373]">No media yet</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="columns-2 gap-3 sm:columns-3 md:columns-4 lg:columns-5"
        style={{ columnFill: 'balance' }}
      >
        {items.map((item, idx) => (
          <button
            key={item.key}
            onClick={() => setLightboxIndex(idx)}
            className="group relative mb-3 block w-full overflow-hidden rounded-sm bg-[#111111] border border-white/5 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc] break-inside-avoid"
            aria-label={item.caption ?? `Media ${idx + 1}`}
          >
            {item.kind === 'video' ? (
              <video
                src={item.signedUrl}
                muted
                loop
                autoPlay
                playsInline
                preload="metadata"
                className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <img
                src={item.signedUrl}
                alt={item.caption ?? ''}
                loading="lazy"
                className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            )}

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 border border-white/20">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 6h8M6 2l4 4-4 4" />
                </svg>
              </div>
            </div>

            {item.kind === 'video' && (
              <div className="absolute top-2 left-2 flex h-5 items-center gap-1 rounded-sm bg-black/70 px-1.5">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
                  <path d="M2 1.5l5 2.5-5 2.5V1.5z" />
                </svg>
                <span className="text-[10px] text-white font-medium">VIDEO</span>
              </div>
            )}

            {item.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                <p className="text-[11px] text-white/70 leading-snug line-clamp-2">{item.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {open && activeItem && (
        <Lightbox
          open={open}
          onClose={() => setLightboxIndex(null)}
          item={activeItem}
          onPrev={lightboxIndex! > 0 ? handlePrev : undefined}
          onNext={lightboxIndex! < items.length - 1 ? handleNext : undefined}
        />
      )}
    </>
  );
}
