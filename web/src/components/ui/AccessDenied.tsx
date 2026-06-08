'use client';

interface AccessDeniedProps {
  userEmail: string;
  signOutHref: string;
}

export function AccessDenied({ userEmail, signOutHref }: AccessDeniedProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] px-6">
      <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-full border border-white/8">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#737373" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="9" />
          <path d="M8 8a3 3 0 014.24 0" />
          <path d="M5.5 5.5l11 11" />
          <path d="M11 14v.01" />
        </svg>
      </div>

      <h1
        className="text-2xl font-normal tracking-tight text-[#f0f0f0] text-center"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        Access Restricted
      </h1>

      <p className="mt-4 max-w-sm text-center text-sm text-[#737373] leading-relaxed">
        This archive is private. <span className="text-[#f0f0f0]/60">{userEmail}</span> is not on
        the allowlist. If you think this is a mistake, contact the archive owner.
      </p>

      <div className="mt-10 flex flex-col items-center gap-3">
        <a
          href={signOutHref}
          className="flex items-center gap-2 rounded-sm border border-white/10 bg-[#111111] px-6 py-2.5 text-sm text-[#f0f0f0]/70 hover:text-[#f0f0f0] hover:border-white/20 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc]"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h3M9 9.5L12 6.5M12 6.5L9 3.5M12 6.5H5" />
          </svg>
          Sign out
        </a>
        <p className="text-[11px] text-[#404040]">Signed in as {userEmail}</p>
      </div>

      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-20 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(192,132,252,0.15), transparent)' }}
      />
    </div>
  );
}
