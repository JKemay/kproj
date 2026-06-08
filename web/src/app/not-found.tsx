import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-[#f0f0f0] px-6 text-center">
      <p className="text-[6rem] leading-none text-white/[0.06] select-none" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        404
      </p>
      <h1 className="mt-2 text-2xl font-normal tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        Not found
      </h1>
      <p className="mt-3 text-sm text-[#737373] max-w-sm">
        This page doesn&rsquo;t exist, or the group/member was removed.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-sm border border-white/10 bg-[#111111] px-5 py-2.5 text-sm text-[#a0a0a0] hover:text-[#f0f0f0] hover:border-white/20 transition-colors"
      >
        Back to archive
      </Link>
    </main>
  );
}
