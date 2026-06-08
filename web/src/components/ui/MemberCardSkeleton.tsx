'use client';

export function MemberCardSkeleton() {
  return (
    <>
      <style>{`
        @keyframes ka-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .ka-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%);
          animation: ka-shimmer 1.6s ease-in-out infinite;
        }
      `}</style>
      <div>
        <div className="relative overflow-hidden rounded-[3px] bg-[#111111] border border-white/[0.06] aspect-[3/4] ka-shimmer">
          <div className="absolute inset-0 bg-gradient-to-br from-[#141414] to-[#0d0d0d]" />
        </div>
        <div className="mt-2 px-0.5 space-y-1.5">
          <div className="relative overflow-hidden rounded-[2px] bg-[#1a1a1a] h-3 w-3/4 ka-shimmer" />
          <div className="relative overflow-hidden rounded-[2px] bg-[#161616] h-2 w-1/2 ka-shimmer" />
        </div>
      </div>
    </>
  );
}
