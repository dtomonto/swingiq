'use client';

// ============================================================
// SwingVantage — Athletic Journey: sport selector
// ------------------------------------------------------------
// Shows Available Now (Golf, Tennis) and In Development (Baseball,
// Fast-Pitch, Slow-Pitch). In-development sports are visibly present
// and clearly labeled — never hidden, never faked.
// ============================================================

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, Hammer } from 'lucide-react';
import type { SportId } from '@swingiq/core';
import {
  AVAILABLE_SPORTS,
  IN_DEVELOPMENT_SPORTS,
  getSportAvailability,
} from '@/lib/athletic-journey';

function SportButton({
  sport,
  active,
  onSelect,
}: {
  sport: SportId;
  active: boolean;
  onSelect: (s: SportId) => void;
}) {
  const a = getSportAvailability(sport);
  const live = a.journeyEnabled;
  return (
    <button
      type="button"
      onClick={() => onSelect(sport)}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-3 rounded-theme border p-3 text-left transition-all',
        'focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
        active
          ? 'border-primary ring-2 ring-primary/40 bg-primary/5'
          : 'border-border bg-card hover:border-primary/50 hover:bg-muted',
      )}
    >
      <span className="text-2xl leading-none" aria-hidden="true">{a.emoji}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground truncate">{a.displayName}</span>
        <span className="block text-[11px] text-muted-foreground truncate">{a.tagline}</span>
      </span>
      {live ? (
        <CheckCircle2 size={16} className="ml-auto shrink-0 text-success" aria-hidden="true" />
      ) : (
        <Hammer size={15} className="ml-auto shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
    </button>
  );
}

export function SportSelector({
  viewSport,
  onSelect,
}: {
  viewSport: SportId;
  onSelect: (s: SportId) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available now</p>
          <Badge variant="success">Live</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {AVAILABLE_SPORTS.map((s) => (
            <SportButton key={s} sport={s} active={s === viewSport} onSelect={onSelect} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">In development</p>
          <Badge variant="medium">Coming soon</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {IN_DEVELOPMENT_SPORTS.map((s) => (
            <SportButton key={s} sport={s} active={s === viewSport} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}
