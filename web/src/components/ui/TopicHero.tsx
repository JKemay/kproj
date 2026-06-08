'use client';

interface TopicHeroProps {
  title: string;
  subtitle?: string;
  mediaCount: number;
}

export function TopicHero({ title, subtitle, mediaCount }: TopicHeroProps) {
  return (
    <section className="relative flex flex-col items-center justify-center border-b border-white/5 px-6 py-20 sm:py-28 text-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(ellipse at center, #c084fc, transparent 65%)' }}
        />
      </div>

      <div className="relative">
        <div className="mb-5 flex items-center justify-center gap-2">
          <div className="h-px w-10 bg-[#c084fc]/30" />
          <span className="text-[10px] tracking-[0.28em] uppercase text-[#c084fc]/60">Topic</span>
          <div className="h-px w-10 bg-[#c084fc]/30" />
        </div>

        <h1
          className="text-[3rem] sm:text-[5rem] font-normal tracking-tight text-[#f0f0f0] leading-none"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="mt-4 text-sm text-[#737373] max-w-md leading-relaxed">{subtitle}</p>
        )}

        <div className="mt-8 inline-flex items-center gap-2 rounded-sm border border-white/7 bg-[#111111] px-5 py-2.5">
          <span
            className="text-xl font-normal text-[#f0f0f0] tabular-nums"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {mediaCount.toLocaleString()}
          </span>
          <span className="text-[10px] tracking-[0.18em] uppercase text-[#737373]">
            {mediaCount === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>
    </section>
  );
}
