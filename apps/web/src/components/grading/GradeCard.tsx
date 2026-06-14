'use client';

// ============================================================
// SwingVantage — Profile-aware Grade Card (Phase 10)
// ------------------------------------------------------------
// Shows a session's grade RELATIVE to the player's profile (not pro
// standards): per-dimension grades vs the benchmark, overall, movement
// vs the player's own baseline, and what the next level needs. Always
// states which profile it graded against and lets the user change it.
// ============================================================

import { useMemo } from 'react';
import { GraduationCap, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useSwingVantageStore } from '@/store';
import type { SwingScores } from '@swingiq/core';
import { gradeSession, type Grade } from '@/lib/grading/grade';
import { GOLF_PROFILES } from '@/lib/grading/profiles';
import { useGolfProfile } from '@/lib/grading/useGolfProfile';
import { useActiveBenchmarks } from '@/lib/grading/benchmark-store';

const GRADE_CLASS: Record<Grade, string> = {
  A: 'bg-success/15 text-success',
  B: 'bg-primary/15 text-primary',
  C: 'bg-warning/15 text-warning',
  D: 'bg-error/10 text-error',
  F: 'bg-error/15 text-error',
};

const BASIS_LABEL: Record<string, string> = {
  handicap: 'from your handicap',
  skill_level: 'from your stated level',
  data: 'from your session scores',
  default: 'a starting estimate',
};

export function GradeCard({ scores, ownBaselineOverall }: { scores: SwingScores; ownBaselineOverall?: number | null }) {
  const { profileId, inference, isConfirmed, setProfile } = useGolfProfile();
  const sessions = useSwingVantageStore((s) => s.sessions);
  const benchmarks = useActiveBenchmarks();

  // Fall back to the player's typical swing score when no baseline is passed.
  const baseline = useMemo(() => {
    if (typeof ownBaselineOverall === 'number') return ownBaselineOverall;
    const scored = sessions.filter((x) => x.swing_score != null);
    if (scored.length < 2) return null;
    return scored.reduce((a, b) => a + (b.swing_score ?? 0), 0) / scored.length;
  }, [ownBaselineOverall, sessions]);

  const result = useMemo(
    () => gradeSession({ scores, profileId, benchmarks, ownBaselineOverall: baseline }),
    [scores, profileId, benchmarks, baseline],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap size={18} className="text-primary" aria-hidden="true" /> Your grade
          </CardTitle>
          <span className={cn('rounded-lg px-3 py-1 text-lg font-black', GRADE_CLASS[result.overall.grade])}>
            {result.overall.grade}
          </span>
        </div>
        {/* Which profile + change control */}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Graded against</span>
          <select
            value={profileId}
            onChange={(e) => setProfile(e.target.value as typeof profileId)}
            aria-label="Profile to grade against"
            className="rounded-md border border-border bg-card px-2 py-1 text-sm font-medium text-foreground"
          >
            {GOLF_PROFILES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <span className="text-xs">{isConfirmed ? '(you set this)' : `(auto — ${BASIS_LABEL[inference.basis]})`}</span>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Per-dimension grades */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {result.dimensions.map((d) => (
            <div key={d.dimension} className="rounded-lg border border-border p-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{d.label}</p>
                <span className={cn('rounded px-1.5 text-xs font-bold', GRADE_CLASS[d.grade])}>{d.grade}</span>
              </div>
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {d.score}
                <span className="text-xs font-normal text-muted-foreground"> vs {d.expected} target</span>
              </p>
            </div>
          ))}
        </div>

        {/* vs your own baseline */}
        {result.vsBaseline && (
          <div className="flex items-center gap-2 text-sm">
            {result.vsBaseline.direction === 'improving' ? (
              <TrendingUp size={15} className="text-success" aria-hidden="true" />
            ) : result.vsBaseline.direction === 'declining' ? (
              <TrendingDown size={15} className="text-error" aria-hidden="true" />
            ) : (
              <Minus size={15} className="text-muted-foreground" aria-hidden="true" />
            )}
            <span className="text-muted-foreground">
              {result.vsBaseline.direction === 'improving'
                ? `Up ${result.vsBaseline.delta} pts vs your recent average.`
                : result.vsBaseline.direction === 'declining'
                  ? `Down ${Math.abs(result.vsBaseline.delta)} pts vs your recent average.`
                  : 'In line with your recent average.'}
            </span>
          </div>
        )}

        {/* Explanation */}
        <div className="space-y-1">
          {result.explanation.map((line, i) => (
            <p key={i} className="text-sm text-muted-foreground">{line}</p>
          ))}
        </div>

        {/* Next level */}
        {result.nextLevel && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <ChevronRight size={15} className="text-primary" aria-hidden="true" />
              To reach {result.nextLevel.label}
            </p>
            {result.nextLevel.gaps.length === 0 ? (
              <p className="mt-1 text-xs text-success">You&rsquo;re already clearing the {result.nextLevel.label} benchmark — consider moving up.</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Close the gap on{' '}
                <span className="font-medium text-foreground">
                  {result.nextLevel.gaps.slice(0, 3).map((g) => g.label.toLowerCase()).join(', ')}
                </span>.
              </p>
            )}
          </div>
        )}

        <Badge variant="info" className="text-2xs">Graded against your level — not tour pros</Badge>
      </CardBody>
    </Card>
  );
}
