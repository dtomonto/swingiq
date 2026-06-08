'use client';

// ============================================================
// SwingVantage — Drill Track Record (trust signal at the decision point)
// ------------------------------------------------------------
// "You've found this drill helpful before" — the athlete's OWN history with a
// drill for a fault, surfaced on the Fix Stack so the data captured by the
// feedback loop (the improvement-loops moat) becomes useful right where they
// choose what to practise. Honest-first: renders nothing until there's real
// history, and never fabricates a verdict.
// ============================================================
import { CheckCircle2, Minus, AlertTriangle } from 'lucide-react';
import { localDrillFeedbackRepo } from '@/lib/drillmatch';
import { drillFaultTrackRecord } from '@/lib/improvement-loops';
import { cn } from '@/lib/utils';
import type { SportId } from '@swingiq/core';

const times = (n: number) => `${n} ${n === 1 ? 'time' : 'times'}`;

export function DrillTrackRecord({
  drillId,
  faultId,
  sport,
}: {
  drillId: string;
  faultId: string;
  sport: SportId;
}) {
  const rec = drillFaultTrackRecord(localDrillFeedbackRepo.all(), sport, faultId, drillId);
  if (!rec) return null;

  let Icon = CheckCircle2;
  let cls = 'bg-primary/10 text-primary border-primary/20';
  let text: string;
  if (rec.helped > 0) {
    text = `You've found this helpful ${rec.helped} of ${times(rec.total)}`;
  } else if (rec.latestVerdict === 'hurt') {
    Icon = AlertTriangle;
    cls = 'bg-warning/10 text-warning border-warning/20';
    text = 'This didn’t suit you last time — a gentler option may fit better';
  } else {
    Icon = Minus;
    cls = 'bg-muted text-muted-foreground border-border';
    text = `You've tried this ${times(rec.total)} — no change reported yet`;
  }

  return (
    <div className="mt-2">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium rounded-full border px-2 py-0.5',
          cls,
        )}
      >
        <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
        {text}
      </span>
    </div>
  );
}
