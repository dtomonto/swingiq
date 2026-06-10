'use client';

// ============================================================
// SwingVantage — Motion Lab: Continuous Movement Summary
// ------------------------------------------------------------
// The rally-sport answer to "how did I prepare, move, contact, recover
// and get ready for the next ball?". Renders the four movement
// checkpoints (ready → spacing → recovery → next-ready), the blended
// efficiency score, and the single most valuable focus — only for
// tennis / pickleball / padel, where the discrete swing pipeline stops
// short at contact.
//
// HONESTY: scores are single-camera proxies; a checkpoint reads
// "Not enough footage" (never a fake number) when the clip is too
// short to see it. Confidence is shown, not hidden.
// ============================================================

import { Activity, Target, Repeat, Crosshair, ChevronsRight } from 'lucide-react';
import type { ContinuousMovementSummary, MovementCheckpoint } from '@/lib/motion-lab';
import { movementModelLabel } from '@/lib/motion-lab';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const ICONS: Record<MovementCheckpoint['id'], typeof Activity> = {
  readiness: Activity,
  spacing: Crosshair,
  recovery: Repeat,
  recentering: ChevronsRight,
};

const STATUS_STYLES: Record<MovementCheckpoint['status'], { dot: string; label: string; text: string }> = {
  good: { dot: 'bg-success', label: 'Good', text: 'text-success' },
  watch: { dot: 'bg-warning', label: 'Watch', text: 'text-warning' },
  needs_work: { dot: 'bg-error', label: 'Needs work', text: 'text-error' },
  not_available: { dot: 'bg-muted-foreground/50', label: 'Not visible', text: 'text-muted-foreground' },
};

interface Props {
  summary: ContinuousMovementSummary;
  accent?: string;
}

export function ContinuousMovementSummary({ summary, accent = '#0EA5E9' }: Props) {
  const { checkpoints, efficiencyScore, headline, confidence, contactEvents, splitStepDetected, notes } = summary;

  return (
    <Card className="border-sky-500/30 bg-sky-500/5">
      <CardBody className="space-y-4">
        <div className="flex items-start gap-2">
          <Target className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }} />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>
              Movement intelligence · {movementModelLabel(summary.movementModel)}
            </p>
            <p className="text-sm text-foreground mt-0.5 leading-relaxed">{headline}</p>
          </div>
          {efficiencyScore != null && (
            <div className="ml-auto text-right shrink-0">
              <p className="text-2xl font-bold tabular-nums" style={{ color: accent }}>{efficiencyScore}</p>
              <p className="text-[10px] text-muted-foreground -mt-0.5">movement / 100</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {checkpoints.map((cp) => {
            const Icon = ICONS[cp.id];
            const s = STATUS_STYLES[cp.status];
            return (
              <div key={cp.id} className="rounded-lg border border-border bg-card/60 p-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">{cp.label}</span>
                  <span className={cn('ml-auto inline-flex items-center gap-1 text-[10px] font-medium', s.text)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} aria-hidden />
                    {cp.score != null ? `${cp.score}` : s.label}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{cp.detail}</p>
                {cp.score != null && (
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">Confidence {Math.round(cp.confidence * 100)}%</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span>{contactEvents.length} contact{contactEvents.length === 1 ? '' : 's'} detected</span>
          <span>·</span>
          <span>Split-step / loaded ready: {splitStepDetected ? 'seen' : 'not seen'}</span>
          <span>·</span>
          <span>Overall confidence {Math.round(confidence * 100)}%</span>
        </div>

        {notes.length > 0 && (
          <ul className="text-[11px] text-muted-foreground/90 list-disc pl-4 space-y-0.5">
            {notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        )}

        <p className="text-[10px] text-muted-foreground/80">
          Movement reads are single-camera estimates of where your body is before, during and after contact —
          training guidance, not a lab measurement or medical assessment.
        </p>
      </CardBody>
    </Card>
  );
}
