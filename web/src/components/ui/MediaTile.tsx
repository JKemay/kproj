'use client';

interface MediaTileItem {
  signedUrl: string;
  kind: 'image' | 'gif' | 'video';
  caption?: string;
}

interface MediaTileProps {
  item: MediaTileItem;
  isProfile: boolean;
  onSetProfile: () => void;
  onDelete: () => void;
  onEditCaption: () => void;
  /** Click on the media itself (not the control buttons) — e.g. open a lightbox. */
  onView?: () => void;
  /** Tooltip for the star action; defaults to profile-photo wording. */
  starTitle?: string;
  starActiveTitle?: string;
}

export function MediaTile({
  item,
  isProfile,
  onSetProfile,
  onDelete,
  onEditCaption,
  onView,
  starTitle = 'Set as profile photo',
  starActiveTitle = 'Profile photo',
}: MediaTileProps) {
  return (
    <div
      onClick={onView}
      className={`group relative block w-full overflow-hidden rounded-sm bg-[#111111] border border-white/5 break-inside-avoid mb-3 ${onView ? 'cursor-zoom-in' : ''}`}
    >
      {item.kind === 'video' ? (
        <video
          src={item.signedUrl}
          muted
          loop
          autoPlay
          playsInline
          className="w-full object-cover"
        />
      ) : (
        <img
          src={item.signedUrl}
          alt={item.caption ?? ''}
          loading="lazy"
          className="w-full object-cover"
        />
      )}

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 pointer-events-none" />

      <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={(e) => { e.stopPropagation(); onSetProfile(); }}
          title={isProfile ? starActiveTitle : starTitle}
          className={`flex h-7 w-7 items-center justify-center rounded-[3px] border transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc] ${
            isProfile
              ? 'border-[#c084fc]/50 bg-[#c084fc]/20 text-[#c084fc]'
              : 'border-white/15 bg-black/60 text-white/60 hover:text-[#c084fc] hover:border-[#c084fc]/40 hover:bg-[#c084fc]/10'
          }`}
        >
          {isProfile ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <polygon points="6,1 7.5,4.2 11,4.5 8.5,6.8 9.2,10.2 6,8.5 2.8,10.2 3.5,6.8 1,4.5 4.5,4.2" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="6,1 7.5,4.2 11,4.5 8.5,6.8 9.2,10.2 6,8.5 2.8,10.2 3.5,6.8 1,4.5 4.5,4.2" />
            </svg>
          )}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onEditCaption(); }}
          title="Edit caption"
          className="flex h-7 w-7 items-center justify-center rounded-[3px] border border-white/15 bg-black/60 text-white/60 hover:text-white hover:border-white/30 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc]"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.5 1.5a1.06 1.06 0 011.5 1.5L3 9 1 9.5l.5-2 6-6z" />
          </svg>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete"
          className="flex h-7 w-7 items-center justify-center rounded-[3px] border border-white/15 bg-black/60 text-white/60 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.5 3h8M4 3V2h3v1M9 3l-.6 6.5a.5.5 0 01-.5.5H3.1a.5.5 0 01-.5-.5L2 3" />
          </svg>
        </button>
      </div>

      {item.kind === 'video' && (
        <div className="absolute top-2 left-2 flex h-5 items-center gap-1 rounded-sm bg-black/70 px-1.5">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="white"><path d="M2 1.5l5 2.5-5 2.5V1.5z" /></svg>
          <span className="text-[10px] text-white font-medium">VIDEO</span>
        </div>
      )}

      {item.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <p className="text-[11px] text-white/70 leading-snug line-clamp-2">{item.caption}</p>
        </div>
      )}
    </div>
  );
}
