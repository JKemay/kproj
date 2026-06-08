'use client';

interface Era {
  id: string;
  label: string;
  count: number;
}

interface EraTabsProps {
  eras: Era[];
  activeId: string;
  onSelect: (id: string) => void;
  onAddEra?: () => void;
}

export function EraTabs({ eras, activeId, onSelect, onAddEra }: EraTabsProps) {
  return (
    <div className="relative flex items-center gap-1 overflow-x-auto ka-scrollbar-hide border-b border-white/[0.06] pb-0">
      <div className="flex items-center gap-1 min-w-max px-0 pb-3">
        {eras.map((era) => {
          const isActive = era.id === activeId;
          return (
            <button
              key={era.id}
              onClick={() => onSelect(era.id)}
              className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.6875rem] tracking-[0.06em] whitespace-nowrap transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc] ${
                isActive
                  ? 'bg-[#c084fc]/15 border border-[#c084fc]/35 text-[#c084fc]'
                  : 'border border-white/[0.07] text-[#737373] hover:border-white/[0.14] hover:text-[#a0a0a0] hover:bg-white/[0.03]'
              }`}
            >
              {era.label}
              <sup
                className={`-mt-1.5 text-[0.55rem] tabular-nums leading-none ${
                  isActive ? 'text-[#c084fc]/70' : 'text-[#404040]'
                }`}
              >
                {era.count}
              </sup>
            </button>
          );
        })}

        {onAddEra && (
          <button
            onClick={onAddEra}
            className="flex items-center gap-1 rounded-full border border-dashed border-white/[0.1] px-3 py-1.5 text-[0.6875rem] text-[#404040] hover:border-white/[0.2] hover:text-[#737373] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc] whitespace-nowrap ml-1"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round">
              <path d="M5 1v8M1 5h8" />
            </svg>
            Add era
          </button>
        )}
      </div>
    </div>
  );
}
