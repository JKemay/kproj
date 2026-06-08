'use client';

interface DashboardHeroProps {
  siteTitle?: string;
  ownerName?: string;
  groupCount: number;
  memberCount: number;
  mediaCount: number;
}

export function DashboardHero({
  siteTitle = 'Archive',
  ownerName,
  groupCount,
  memberCount,
  mediaCount,
}: DashboardHeroProps) {
  const stats = [
    { label: 'Groups', value: groupCount },
    { label: 'Members', value: memberCount },
    { label: 'Media', value: mediaCount },
  ];

  return (
    <section className="relative border-b border-white/5 px-6 py-16 sm:px-10 sm:py-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse at center, #c084fc, transparent 70%)' }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {ownerName && (
          <p className="mb-4 text-[11px] font-medium tracking-[0.22em] uppercase text-[#737373]">
            {ownerName}&rsquo;s Archive
          </p>
        )}

        <h1
          className="text-4xl sm:text-6xl font-normal tracking-tight text-[#f0f0f0] leading-none"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {siteTitle}
        </h1>

        <div className="mt-10 flex flex-wrap gap-px border border-white/7 rounded-sm overflow-hidden w-fit">
          {stats.map(({ label, value }, i) => (
            <div
              key={label}
              className={`flex flex-col items-start px-8 py-5 bg-[#111111] ${
                i !== stats.length - 1 ? 'border-r border-white/7' : ''
              }`}
            >
              <span
                className="text-2xl sm:text-3xl font-normal text-[#f0f0f0] tabular-nums"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                {value.toLocaleString()}
              </span>
              <span className="mt-0.5 text-[10px] tracking-[0.18em] uppercase text-[#737373]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
