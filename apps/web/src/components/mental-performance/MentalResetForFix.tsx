'use client';

// On the Fix Stack: the mechanical fix is half the job. If the mistake got in
// the athlete's head, map their diagnosed fault → the matching reset routine
// (routineForContext) and hand off to the Mental Performance coach.

import Link from 'next/link';
import { Brain, ArrowRight } from 'lucide-react';
import { useAgentContext } from '@/hooks/useAgentContext';
import { routineForContext } from '@/lib/mental-performance/routines';
import type { MentalSport } from '@/lib/mental-performance/types';

export function MentalResetForFix() {
  const { ready, ctx } = useAgentContext();
  if (process.env.NEXT_PUBLIC_MENTAL_PERFORMANCE === 'false') return null;
  if (!ready || !ctx) return null;

  const sport = (ctx.activeSport ?? 'golf') as MentalSport;
  const fault = ctx.latestDiagnosedSession?.primaryFocus ?? ctx.latestSession?.primaryFocus ?? null;
  const routine = routineForContext(sport, fault ?? undefined);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Brain size={15} aria-hidden="true" />
        </span>
        <h2 className="text-sm font-semibold text-foreground">Reset your head, too</h2>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Fixing the mechanics is half of it. If {fault ? `“${fault}”` : 'a mistake'} got in your head,
        a quick reset keeps one miss from becoming three.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={`/mental-performance/${routine.sports[0]}/${routine.slug}`}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary"
        >
          {routine.title} <ArrowRight size={13} aria-hidden="true" />
        </Link>
        <Link href="/mental?intent=mistake" className="text-xs font-medium text-primary hover:underline">
          Open the coach
        </Link>
      </div>
    </div>
  );
}
