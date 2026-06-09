'use client';

// ============================================================
// SwingVantage — Improvement Record (issue → drill → outcome)
// ------------------------------------------------------------
// A read-only view of the moat dataset: every fault the athlete has worked,
// the drills they tried + how those landed, and the retest outcome when one
// exists. Honest-first: built only from the athlete's own logged practice, with
// small samples shown alongside their counts. No fabrication, no global claims.
// ============================================================
import { Repeat, CheckCircle2, MinusCircle, AlertTriangle } from 'lucide-react';
import { useImprovementLoops } from '@/lib/improvement-loops';
import type { DrillFeedbackValue } from '@/lib/drillmatch';
import type { RetestOutcome } from '@/lib/retest';
import { cn } from '@/lib/utils';

const VERDICT: Record<DrillFeedbackValue, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  helped: { label: 'helped', cls: 'bg-primary/10 text-primary border-primary/30', Icon: CheckCircle2 },
  no_change: { label: 'no change', cls: 'bg-muted text-muted-foreground border-border', Icon: MinusCircle },
  hurt: { label: 'not a fit', cls: 'bg-warning/10 text-warning border-warning/30', Icon: AlertTriangle },
};

const OUTCOME_CLS: Record<RetestOutcome, string> = {
  improved: 'bg-primary/10 text-primary border-primary/30',
  persisting: 'bg-warning/10 text-warning border-warning/30',
  inconclusive: 'bg-muted text-muted-foreground border-border',
  regressed: 'bg-error/10 text-error border-error/30',
};

function VerdictChip({ value }: { value: DrillFeedbackValue }) {
  const v = VERDICT[value];
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-sm border', v.cls)}>
      <v.Icon className="w-3 h-3" />
      {v.label}
    </span>
  );
}

export function ImprovementLoopsCard() {
  const { ready, loops, effectiveness, retestedCount } = useImprovementLoops();
  // North-star: a "completed improvement loop" is an issue carried all the way
  // to a retest (issue → drill → measured outcome). The rest are still in flight.
  const inProgress = Math.max(0, loops.length - retestedCount);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start gap-2">
        <Repeat className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="text-base font-bold text-foreground">Your Improvement Record</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every issue you&apos;ve worked, the drills you tried, and how the retest landed — built
            only from your own logged practice. This is the start of your personal benchmark of
            what actually works for you.
          </p>
        </div>
      </div>

      {!ready ? (
        <p className="text-sm text-muted-foreground">Loading your record…</p>
      ) : loops.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground">
          Nothing logged yet. On a <span className="font-medium text-foreground">Fix Stack</span>,
          mark whether a drill helped — then retest it. Each loop you complete is recorded here as
          <span className="whitespace-nowrap"> issue → drill → outcome</span>.
        </div>
      ) : (
        <>
          {/* North-star: completed improvement loops (the one number to watch) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-center">
              <p className="text-2xl font-bold text-primary leading-none">{retestedCount}</p>
              <p className="text-[11px] font-medium text-primary/90 mt-1 leading-tight">Loops completed</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold text-foreground leading-none">{loops.length}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-tight">Issues worked</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold text-foreground leading-none">{inProgress}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-tight">In progress</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-1">
            A <span className="font-medium text-foreground">completed loop</span> is an issue you
            carried all the way to a retest — issue → drill → measured outcome. It&apos;s the truest
            signal that your practice is actually working.
          </p>

          {/* Per-fault loops */}
          <ul className="space-y-3">
            {loops.slice(0, 6).map((loop) => (
              <li key={loop.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{loop.faultName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{loop.context.sport}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border capitalize',
                      loop.retestOutcome ? OUTCOME_CLS[loop.retestOutcome] : 'bg-muted text-muted-foreground border-border',
                    )}
                  >
                    {loop.stage === 'retested' ? 'retested' : 'practicing'}
                  </span>
                </div>

                <p className="text-sm text-foreground mt-1.5">{loop.outcomeLabel}</p>

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {loop.drills.slice(0, 4).map((d) => (
                    <span key={d.drillId} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="truncate max-w-[10rem] text-foreground">{d.drillName}</span>
                      <VerdictChip value={d.verdict} />
                      {d.attempts > 1 && <span className="text-muted-foreground">×{d.attempts}</span>}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          {/* Effectiveness seed — honest about small samples */}
          {effectiveness.length > 0 && (
            <div className="pt-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Which drills work for you
              </p>
              <ul className="space-y-1.5">
                {effectiveness.slice(0, 5).map((e) => (
                  <li key={`${e.faultId}:${e.drillId}`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-foreground">
                      {e.drillName} <span className="text-muted-foreground">· {e.faultName}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      helped {e.helped}/{e.total}
                      {e.total >= 3 && <span className="text-foreground font-medium"> ({Math.round(e.helpRate * 100)}%)</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                From your own logs so far — percentages show once a drill has at least 3 verdicts, so
                a single try is never dressed up as a trend.
                {retestedCount > 0 && ` ${retestedCount} of these have been confirmed with a retest.`}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
