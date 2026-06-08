'use client';

import { useRouter } from 'next/navigation';

import { AppNav } from '@/components/AppNav';
import { AuthGuard, useIsAdmin } from '@/components/AuthGuard';
import { AccessDenied } from '@/components/ui/AccessDenied';

function Heaven() {
  const router = useRouter();
  const isAdmin = useIsAdmin();

  // Private room — only the owner. Other allowlisted users get denied.
  if (!isAdmin) {
    return <AccessDenied userEmail="" signOutHref="/signout" />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      <AppNav currentPath="heaven" />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-44px)] px-6 text-center">
        <div className="relative mb-8">
          <div
            className="absolute inset-0 -m-12 rounded-full opacity-[0.06] blur-2xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, #c084fc, transparent 70%)' }}
          />
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="relative text-[#c084fc]/40">
            <polygon
              points="16,2 19.5,11 29.5,11.5 22,18 24.5,28 16,23 7.5,28 10,18 2.5,11.5 12.5,11"
              fill="currentColor"
            />
          </svg>
        </div>
        <h1
          className="text-[2.5rem] sm:text-[4rem] font-normal tracking-tight text-[#f0f0f0] leading-none mb-4"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          6ix&rsquo;s Heaven
        </h1>
        <p className="text-[11px] tracking-[0.22em] uppercase text-[#383838] mb-12">Coming soon</p>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase text-[#404040] hover:text-[#737373] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c084fc] rounded-sm group"
        >
          <svg
            width="11" height="11" viewBox="0 0 11 11" fill="none"
            stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"
            className="group-hover:-translate-x-0.5 transition-transform duration-150"
          >
            <path d="M7 1L2 5.5 7 10" />
          </svg>
          Back to archive
        </button>
      </div>
    </div>
  );
}

export default function HeavenPage() {
  return (
    <AuthGuard>
      <Heaven />
    </AuthGuard>
  );
}
