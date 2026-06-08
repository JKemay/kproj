'use client';

interface StatItem {
  label: string;
  value: string | number;
}

interface StatStripProps {
  stats: StatItem[];
}

export function StatStrip({ stats }: StatStripProps) {
  return (
    <div className="flex items-center gap-0 flex-wrap">
      {stats.map((stat, i) => (
        <div key={stat.label} className="flex items-center">
          <div className="flex flex-col items-start px-4 py-1 first:pl-0">
            <span
              className="text-[1.1rem] font-normal leading-tight text-[#e0e0e0] tabular-nums"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            </span>
            <span className="text-[9px] tracking-[0.16em] uppercase text-[#525252] mt-0.5">
              {stat.label}
            </span>
          </div>
          {i < stats.length - 1 && (
            <div className="h-7 w-px bg-white/[0.06] mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}
