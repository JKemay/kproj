'use client';

import { useState, useRef, useEffect } from 'react';

interface NavBarUser {
  email: string;
  picture?: string;
}

interface NavBarProps {
  user?: NavBarUser;
  siteTitle?: string;
  onNavigateHome?: () => void;
  onNavigateHeaven?: () => void;
  signOutHref?: string;
  currentPath?: 'home' | 'heaven' | 'group';
  /** 6ix's Heaven is the owner's private room — only show its nav entry to admins. */
  showHeaven?: boolean;
}

export function NavBar({
  user,
  siteTitle = 'Archive',
  onNavigateHome,
  onNavigateHeaven,
  signOutHref = '/signout',
  currentPath = 'home',
  showHeaven = false,
}: NavBarProps) {
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.email.charAt(0).toUpperCase() ?? '?';

  return (
    <nav className="sticky top-0 z-40 flex h-11 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-md px-5 sm:px-8">
      <button
        onClick={onNavigateHome}
        className="shrink-0 text-[0.8125rem] font-normal text-[#a0a0a0] hover:text-[#f0f0f0] transition-colors tracking-widest uppercase focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc] rounded-sm"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: '0.18em' }}
      >
        {siteTitle}
      </button>

      <div className="flex items-center gap-2">
        {showHeaven && (
          <button
            onClick={onNavigateHeaven}
            className={`relative flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[0.6875rem] tracking-[0.18em] uppercase transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc] ${
              currentPath === 'heaven'
                ? 'bg-[#c084fc]/10 border border-[#c084fc]/30 text-[#c084fc]'
                : 'border border-white/[0.08] text-[#737373] hover:border-[#c084fc]/25 hover:text-[#c084fc] hover:bg-[#c084fc]/5'
            }`}
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
              <polygon points="4.5,0.5 5.7,3.2 8.6,3.4 6.5,5.3 7.1,8.1 4.5,6.6 1.9,8.1 2.5,5.3 0.4,3.4 3.3,3.2" />
            </svg>
            6ix&rsquo;s Heaven
          </button>
        )}

        {user && (
          <div ref={userRef} className="relative">
            <button
              onClick={() => setUserOpen((v) => !v)}
              className="flex items-center justify-center h-7 w-7 rounded-full border border-white/10 bg-[#111111] hover:border-white/20 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc]"
              aria-label="User menu"
            >
              {user.picture ? (
                <img src={user.picture} alt={user.email} className="h-full w-full rounded-full object-cover" />
              ) : (
                <span className="text-[11px] font-medium text-[#c084fc]">{initials}</span>
              )}
            </button>

            {userOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-[3px] border border-white/8 bg-[#111111] shadow-xl py-1 z-50">
                <div className="px-3 py-2 border-b border-white/5 mb-1">
                  <p className="text-[11px] text-[#525252] truncate">{user.email}</p>
                </div>
                <a
                  href={signOutHref}
                  className="flex items-center gap-2 px-3 py-2 text-[11px] text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-white/4 transition-colors cursor-pointer"
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 1.5H2a1 1 0 00-1 1v6a1 1 0 001 1h2M7.5 7.5L10 5.5M10 5.5L7.5 3.5M10 5.5H4" />
                  </svg>
                  Sign out
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
