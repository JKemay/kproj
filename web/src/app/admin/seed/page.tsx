'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from 'react-oidc-context';

import { AppNav } from '@/components/AppNav';
import { AuthGuard, useIsAdmin } from '@/components/AuthGuard';
import { ApiError, apiFetch } from '@/lib/api';
import { seedGroups } from '@/lib/seedData';

type LogLine = { text: string; kind: 'ok' | 'skip' | 'err' };

function SeedPanel() {
  const auth = useAuth();
  const isAdmin = useIsAdmin();
  const idToken = auth.user?.id_token ?? null;

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
        <AppNav />
        <main className="p-8 max-w-2xl mx-auto text-center pt-24">
          <h1 className="font-serif text-2xl" style={{ fontFamily: 'Georgia, serif' }}>Admin only</h1>
        </main>
      </div>
    );
  }

  const push = (line: LogLine) => setLog((l) => [...l, line]);

  const run = async () => {
    if (!idToken) return;
    setRunning(true);
    setDone(false);
    setLog([]);

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const g of seedGroups) {
      // Create the group
      try {
        await apiFetch('/groups', {
          method: 'POST',
          idToken,
          body: { id: g.id, name: g.name, kind: g.kind, debutYear: g.debutYear, agency: g.agency },
        });
        push({ text: `✓ group ${g.name}`, kind: 'ok' });
        created++;
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          push({ text: `• group ${g.name} (exists)`, kind: 'skip' });
          skipped++;
        } else {
          push({ text: `✗ group ${g.name}: ${e instanceof Error ? e.message : e}`, kind: 'err' });
          failed++;
          continue; // skip members if the group failed
        }
      }

      // Create its members
      for (const m of g.members) {
        try {
          await apiFetch(`/groups/${g.id}/members`, {
            method: 'POST',
            idToken,
            body: { id: m.id, stageName: m.stageName },
          });
          push({ text: `    ✓ ${g.name} · ${m.stageName}`, kind: 'ok' });
          created++;
        } catch (e) {
          if (e instanceof ApiError && e.status === 409) {
            push({ text: `    • ${g.name} · ${m.stageName} (exists)`, kind: 'skip' });
            skipped++;
          } else {
            push({ text: `    ✗ ${g.name} · ${m.stageName}: ${e instanceof Error ? e.message : e}`, kind: 'err' });
            failed++;
          }
        }
      }
    }

    push({ text: `— done: ${created} created, ${skipped} skipped, ${failed} failed —`, kind: failed ? 'err' : 'ok' });
    setRunning(false);
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      <AppNav />
      <main className="mx-auto max-w-3xl px-5 sm:px-8 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[2rem] font-normal tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Seed archive
          </h1>
          <Link href="/admin" className="text-sm text-[#525252] hover:text-[#c084fc]">← admin</Link>
        </div>

        <p className="text-sm text-[#737373] leading-relaxed">
          Creates {seedGroups.length} groups/topics and their members in one pass. Safe to run
          multiple times — anything that already exists is skipped. Media is never touched.
        </p>

        <button
          onClick={run}
          disabled={running}
          className="rounded-sm bg-[#c084fc] px-5 py-2.5 text-sm font-medium text-black hover:bg-[#a855f7] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {running ? 'Seeding…' : done ? 'Run again' : 'Run seed'}
        </button>

        {log.length > 0 && (
          <div className="rounded-sm border border-white/[0.06] bg-[#0d0d0d] p-4 max-h-[60vh] overflow-auto font-mono text-xs leading-relaxed">
            {log.map((l, i) => (
              <div
                key={i}
                className={
                  l.kind === 'ok' ? 'text-green-400/70' : l.kind === 'skip' ? 'text-[#525252]' : 'text-red-400/80'
                }
              >
                {l.text}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SeedPage() {
  return (
    <AuthGuard>
      <SeedPanel />
    </AuthGuard>
  );
}
