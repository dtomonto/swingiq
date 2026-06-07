'use client';

// ============================================================
// SwingVantage — Athletic Journey: skill tree
// ------------------------------------------------------------
// Sport-specific branches with their current score, evidence count,
// development flags, and a quick 1–5 self-rating that feeds back into
// the classifier (clearly a self-report signal).
// ============================================================

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle } from 'lucide-react';
import type { SportId } from '@swingiq/core';
import type { SkillBranchState } from '@/lib/athletic-journey';
import { setSelfAssessment, useJourneyStoreData } from '@/lib/athletic-journey/store';
import { ScoreBar, scoreTextClass } from './_shared';

function SelfRate({ sport, branchId, value }: { sport: SportId; branchId: string; value: number | null }) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Self-rate this skill 1 to 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} of 5`}
          aria-pressed={value === n}
          onClick={() => setSelfAssessment(sport, branchId, n)}
          className={cn(
            'h-3.5 w-3.5 rounded-full border transition-colors',
            value !== null && n <= value
              ? 'bg-accent-secondary border-accent-secondary'
              : 'bg-transparent border-border hover:border-accent-secondary/60',
          )}
        />
      ))}
    </div>
  );
}

export function SkillTree({ sport, branches }: { sport: SportId; branches: SkillBranchState[] }) {
  const store = useJourneyStoreData();
  const assessments = store.selfAssessments[sport] ?? [];
  const ratingFor = (branchId: string) => assessments.find((a) => a.branchId === branchId)?.rating ?? null;

  return (
    <div className="space-y-3">
      {branches.map((b) => (
        <div key={b.id} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
              {b.name}
              {b.flagged && (
                <span title="Development priority">
                  <AlertTriangle size={13} className="text-warning" aria-label="Development priority" />
                </span>
              )}
            </span>
            <span className={cn('text-sm font-semibold tabular-nums', scoreTextClass(b.score))}>
              {b.score === null ? '—' : b.score}
              <span className="text-[10px] text-muted-foreground font-normal">/100</span>
            </span>
          </div>
          <ScoreBar score={b.score} />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground">
              {b.evidenceCount > 0 ? `${b.evidenceCount} signal${b.evidenceCount === 1 ? '' : 's'}` : 'No data yet'}
              {b.score === null && b.evidenceCount === 0 && <span> · self-rate to seed it</span>}
            </span>
            <SelfRate sport={sport} branchId={b.id} value={ratingFor(b.id)} />
          </div>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground pt-1">
        Dots are your own 1–5 self-rating (a self-reported signal). Scores also rise as you upload
        videos, log play, and complete benchmarks.
      </p>
      <Badge variant="default">Self-ratings are weighted lightly on purpose</Badge>
    </div>
  );
}
