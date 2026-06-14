'use client';

// ============================================================
// SwingVantage — Athletic Journey: milestone panel
// ------------------------------------------------------------
// Stage-specific, measurable milestones. Measurable ones auto-track
// from data; all can be toggled by the athlete. Premium and athletic
// — not childish badges.
// ============================================================

import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import type { SportId } from '@swingiq/core';
import type { MilestoneState } from '@/lib/athletic-journey';
import { toggleMilestone } from '@/lib/athletic-journey/store';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

function Row({ m, sport }: { m: MilestoneState; sport: SportId }) {
  const done = m.status === 'completed';
  const Icon = done ? CheckCircle2 : m.status === 'in_progress' ? Loader2 : Circle;
  return (
    <div className="flex items-start gap-3 py-2">
      <button
        type="button"
        aria-label={done ? `Mark ${m.name} incomplete` : `Mark ${m.name} complete`}
        onClick={() => {
          if (!done) track(ANALYTICS_EVENTS.JOURNEY_MILESTONE_COMPLETED, { sport, milestone: m.id });
          toggleMilestone(sport, m.id);
        }}
        className="mt-0.5 shrink-0"
      >
        <Icon size={18} className={done ? 'text-success' : m.status === 'in_progress' ? 'text-warning' : 'text-muted-foreground'} aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium', done ? 'text-muted-foreground line-through' : 'text-foreground')}>
          {m.name}
        </p>
        <p className="text-xs text-muted-foreground">{m.description}</p>
        {m.progress !== null && !done && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-warning" style={{ width: `${Math.round(m.progress * 100)}%` }} />
            </div>
            {m.currentValue !== null && m.targetValue !== null && (
              <span className="text-3xs text-muted-foreground tabular-nums">
                {m.currentValue}/{m.targetValue}{m.unit ? ` ${m.unit}` : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function MilestonePanel({ sport, milestones }: { sport: SportId; milestones: MilestoneState[] }) {
  if (!milestones.length) {
    return <p className="text-sm text-muted-foreground">No milestones for this stage yet.</p>;
  }
  const completed = milestones.filter((m) => m.status === 'completed').length;
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">
        {completed} of {milestones.length} complete at this stage
      </p>
      <div className="divide-y divide-border">
        {milestones.map((m) => (
          <Row key={m.id} m={m} sport={sport} />
        ))}
      </div>
    </div>
  );
}
