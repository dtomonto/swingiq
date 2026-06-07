'use client';

// ============================================================
// SwingVantage — /team · TeamOS (Team Intelligence)
// Cross-sport capability roster → the team's shared focus.
// Complements /coach (Motion Lab roster) with a capability-level read.
// ============================================================

import Link from 'next/link';
import { Users, ArrowRight } from 'lucide-react';
import { useTeam } from '@/lib/team';
import { TeamPulseCard } from '@/components/team/TeamPulseCard';
import { TeamRoster } from '@/components/team/TeamRoster';

export default function TeamPage() {
  const { pulse } = useTeam();

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Users size={20} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-foreground">Team Intelligence</h1>
          <p className="text-xs text-muted-foreground">One shared language across every athlete and sport</p>
        </div>
      </div>

      <TeamPulseCard pulse={pulse} />
      <TeamRoster />

      <Link
        href="/coach"
        className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-sm hover:bg-muted transition-colors"
      >
        <span className="text-foreground">
          Looking for video sessions by athlete? Open the <span className="font-semibold">Motion Lab roster</span>.
        </span>
        <ArrowRight size={16} className="shrink-0 text-muted-foreground" />
      </Link>
    </div>
  );
}
