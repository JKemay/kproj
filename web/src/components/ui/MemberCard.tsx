'use client';

import { FallbackImg } from './FallbackImg';

interface MemberCardProps {
  member: {
    id: string;
    stageName: string;
    position: string;
    profileUrl?: string;
    /** Original-size URL used if profileUrl (a thumbnail) 404s. */
    profileFallbackUrl?: string;
  };
  onClick?: () => void;
}

export function MemberCard({ member, onClick }: MemberCardProps) {
  const hasImage = Boolean(member.profileUrl);
  const initial = member.stageName.charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className="group block w-full text-left cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc] rounded-[3px]"
      aria-label={`${member.stageName} — ${member.position}`}
    >
      <div className="relative overflow-hidden rounded-[3px] bg-[#111111] border border-white/[0.06] aspect-[3/4] transition-all duration-200 group-hover:border-white/[0.14] group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
        {hasImage ? (
          <>
            <FallbackImg
              src={member.profileUrl!}
              fallback={member.profileFallbackUrl}
              alt={member.stageName}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#141414] to-[#0d0d0d]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-[5rem] font-normal leading-none text-white/[0.06] select-none group-hover:text-white/[0.09] transition-colors"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                {initial}
              </span>
            </div>
          </>
        )}

        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c084fc]/0 to-transparent group-hover:via-[#c084fc]/30 transition-all duration-300" />
      </div>

      <div className="mt-2 px-0.5">
        <p
          className="text-[0.8125rem] font-normal text-[#e0e0e0] tracking-tight truncate leading-snug group-hover:text-white transition-colors"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {member.stageName}
        </p>
        <p className="mt-0.5 text-[0.65rem] tracking-[0.14em] uppercase text-[#525252] group-hover:text-[#c084fc]/70 transition-colors duration-200 truncate">
          {member.position}
        </p>
      </div>
    </button>
  );
}
