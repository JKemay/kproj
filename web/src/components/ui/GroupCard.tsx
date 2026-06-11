'use client';

import { FallbackImg } from './FallbackImg';

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    debutYear?: number;
    agency?: string;
    coverUrl?: string;
    /** Original-size URL used if coverUrl (a thumbnail) 404s. */
    coverFallbackUrl?: string;
    memberTags?: string[];
  };
  onClick?: () => void;
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  const hasImage = Boolean(group.coverUrl);
  const tags = group.memberTags ?? [];

  return (
    <button
      onClick={onClick}
      className="group relative block w-full overflow-hidden rounded-[3px] bg-[#111111] border border-white/[0.06] aspect-[3/4] cursor-pointer text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.14] hover:shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
      aria-label={`${group.name}${group.agency ? ` — ${group.agency}` : ''}`}
    >
      {hasImage ? (
        <>
          <FallbackImg
            src={group.coverUrl!}
            fallback={group.coverFallbackUrl}
            alt={group.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-[#141414] to-[#0d0d0d]" />
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 10px)',
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
            <p
              className="text-center text-[1.35rem] leading-snug tracking-tight text-[#f0f0f0]/90 group-hover:text-white transition-colors"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {group.name}
            </p>
          </div>
        </>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3">
        {hasImage && (
          <p
            className="text-[1rem] font-normal leading-snug text-white tracking-tight mb-2"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {group.name}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-[2px] border border-white/10 bg-black/40 px-1.5 py-0.5 text-[9px] tracking-[0.1em] uppercase text-white/50 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="inline-block px-1 py-0.5 text-[9px] text-white/30">
                +{tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c084fc]/0 to-transparent group-hover:via-[#c084fc]/40 transition-all duration-300" />
    </button>
  );
}
