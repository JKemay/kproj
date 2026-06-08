'use client';

export function GroupCardSkeleton() {
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
      <div className="relative block w-full overflow-hidden rounded-[3px] bg-[#111111] border border-white/[0.06] aspect-[3/4] ka-shimmer">
        <div className="absolute inset-0 bg-gradient-to-br from-[#141414] to-[#0d0d0d]" />
      </div>
    </>
  );
}
