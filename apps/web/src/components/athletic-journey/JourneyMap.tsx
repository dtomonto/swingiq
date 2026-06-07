'use client';

// ============================================================
// SwingVantage — Athletic Journey: journey map
// ------------------------------------------------------------
// The full beginner→professional pathway. Completed, current, next,
// and locked stages are visually distinct; each stage expands to its
// definition, goals, common weaknesses, and unlock criteria.
// ============================================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ChevronDown, Check, MapPin, Lock, Flag } from 'lucide-react';
import type { SportId } from '@swingiq/core';
import { getStages, type StageDefinition } from '@/lib/athletic-journey';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

type StageStatus = 'completed' | 'current' | 'next' | 'locked';

function statusFor(stage: StageDefinition, currentOrder: number, nextOrder: number | null): StageStatus {
  if (stage.order < currentOrder) return 'completed';
  if (stage.order === currentOrder) return 'current';
  if (nextOrder !== null && stage.order === nextOrder) return 'next';
  return 'locked';
}

const DOT: Record<StageStatus, { icon: typeof Check; ring: string; text: string }> = {
  completed: { icon: Check, ring: 'bg-success text-success-foreground', text: 'text-success' },
  current: { icon: MapPin, ring: 'bg-primary text-primary-foreground', text: 'text-primary' },
  next: { icon: Flag, ring: 'bg-warning text-warning-foreground', text: 'text-warning' },
  locked: { icon: Lock, ring: 'bg-muted text-muted-foreground', text: 'text-muted-foreground' },
};

function StageRow({
  stage,
  status,
  isLast,
  sport,
}: {
  stage: StageDefinition;
  status: StageStatus;
  isLast: boolean;
  sport: SportId;
}) {
  const [open, setOpen] = useState(status === 'current');
  const meta = DOT[status];
  const Icon = meta.icon;

  return (
    <div className="flex gap-3">
      {/* Rail */}
      <div className="flex flex-col items-center">
        <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', meta.ring)}>
          <Icon size={14} aria-hidden="true" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border my-1" />}
      </div>

      {/* Content */}
      <div className={cn('flex-1 pb-3', isLast && 'pb-0')}>
        <button
          type="button"
          onClick={() => {
            setOpen((o) => !o);
            if (!open) track(ANALYTICS_EVENTS.JOURNEY_STAGE_VIEWED, { sport, stage_code: stage.code });
          }}
          className="flex w-full items-center gap-2 text-left"
          aria-expanded={open}
        >
          <span className="text-[11px] font-mono font-semibold text-muted-foreground">{stage.code}</span>
          <span className={cn('text-sm font-semibold', status === 'current' ? 'text-foreground' : 'text-foreground/90')}>
            {stage.name}
          </span>
          {status === 'current' && <Badge variant="info">You are here</Badge>}
          {status === 'next' && <Badge variant="warning">Next</Badge>}
          <ChevronDown
            size={15}
            aria-hidden="true"
            className={cn('ml-auto shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
          />
        </button>

        {stage.anchors.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {stage.anchors.map((an, i) => (
              <span key={i} className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                {an.ratingType === 'golf_handicap' ? 'HCP' : an.ratingType.toUpperCase()} {an.label}
              </span>
            ))}
          </div>
        )}

        {open && (
          <div className="mt-2 space-y-3 rounded-theme border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">{stage.description}</p>
            <div>
              <p className="text-[11px] font-semibold text-foreground mb-1">Primary goals</p>
              <ul className="space-y-0.5">
                {stage.primaryGoals.map((g, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                    <span className="text-success mt-px">›</span> {g}
                  </li>
                ))}
              </ul>
            </div>
            {stage.unlockCriteria.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-foreground mb-1">To unlock the next stage</p>
                <ul className="space-y-0.5">
                  {stage.unlockCriteria.map((u) => (
                    <li key={u.id} className="text-xs text-muted-foreground flex gap-1.5">
                      <span className="text-warning mt-px">→</span> {u.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function JourneyMap({
  sport,
  currentOrder,
  nextOrder,
}: {
  sport: SportId;
  currentOrder: number;
  nextOrder: number | null;
}) {
  const stages = getStages(sport);
  return (
    <div>
      {stages.map((stage, i) => (
        <StageRow
          key={stage.code}
          stage={stage}
          status={statusFor(stage, currentOrder, nextOrder)}
          isLast={i === stages.length - 1}
          sport={sport}
        />
      ))}
    </div>
  );
}
