'use client';

import Link from 'next/link';
import { Hand, Dumbbell, RefreshCw } from 'lucide-react';
import { FixStackPanel } from '@/components/drillmatch';
import { CuratedSwingDrills } from '@/components/coach-mix/CuratedSwingDrills';

const LOOP_STEPS = [
  { icon: Hand, title: 'Feel it', body: 'One simple body cue you can actually feel — not a checklist of ten swing thoughts.' },
  { icon: Dumbbell, title: 'Drill it', body: 'The single best-matched drill for your issue, your level, and the gear you have.' },
  { icon: RefreshCw, title: 'Retest it', body: 'A fair before/after so you know the fix actually worked — not just that you practised.' },
];

export default function FixStackPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Fix Stack</h1>
        <p className="text-muted-foreground text-sm mt-1">
          One fix at a time. SwingVantage finds your highest-impact issue and turns it into a
          feel cue, the right drill, and an honest retest — then learns from what worked.
        </p>
      </div>

      <FixStackPanel />

      {/* Coach Mix — curated, coach-influenced drills. Flag-gated OFF
          (NEXT_PUBLIC_COACH_MIX_USER_MODULE): renders nothing until the owner
          enables it. Before turning it on in production, pass the user's live
          sport + diagnosed faultId so it reflects their actual top issue. */}
      <CuratedSwingDrills />

      {/* The loop, explained */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LOOP_STEPS.map(({ icon: Icon, title, body }, i) => (
          <div key={title} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold">
                {i + 1}
              </span>
              <Icon size={15} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">{title}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Want the full week?{' '}
        <Link href="/practice" className="text-primary hover:underline">
          Build a practice schedule
        </Link>{' '}
        around your fix.
      </p>
    </div>
  );
}
