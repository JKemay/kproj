'use client';

interface RecentItem {
  id: string;
  signedUrl: string;
  kind: 'image' | 'gif' | 'video';
  label?: string;
}

interface RecentStripProps {
  items: RecentItem[];
  onItemClick: (id: string) => void;
}

export function RecentStrip({ items, onItemClick }: RecentStripProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 py-3">
        <div className="h-px flex-1 bg-white/[0.04]" />
        <span className="text-[11px] tracking-[0.14em] uppercase text-[#2e2e2e] shrink-0">Nothing added yet</span>
        <div className="h-px flex-1 bg-white/[0.04]" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="flex gap-2.5 overflow-x-auto pb-1 ka-scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className="group relative shrink-0 snap-start overflow-hidden rounded-[3px] bg-[#111111] border border-white/[0.06] hover:border-white/[0.14] transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc]"
            style={{ width: 96, height: 140 }}
          >
            {item.kind === 'video' ? (
              <video
                src={item.signedUrl}
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <img
                src={item.signedUrl}
                alt={item.label ?? ''}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            {(item.kind === 'video' || item.kind === 'gif') && (
              <div className="absolute top-1.5 left-1.5 flex h-4 items-center gap-0.5 rounded-[2px] bg-black/70 px-1">
                {item.kind === 'video' ? (
                  <>
                    <svg width="6" height="6" viewBox="0 0 6 6" fill="white"><path d="M1 0.5l4 2.5-4 2.5V0.5z" /></svg>
                    <span className="text-[8px] text-white font-medium tracking-wide">VID</span>
                  </>
                ) : (
                  <span className="text-[8px] text-white font-medium tracking-wide">GIF</span>
                )}
              </div>
            )}

            {item.label && (
              <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <p className="text-[9px] text-white/70 leading-snug line-clamp-2">{item.label}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="pointer-events-none absolute left-0 top-0 bottom-1 w-6 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
    </div>
  );
}
