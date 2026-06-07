'use client';

// ============================================================
// SwingVantage — Retest Reminder Card
// ------------------------------------------------------------
// One open finding the user is being asked to retest. Shows the
// dated window, the same-condition checklist, and a single CTA to
// record a fresh swing. Honest about what a retest can prove.
// ============================================================

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw, Video, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FaultExplanation } from '@/components/faults/FaultExplanation';
import type { RetestTarget, RetestStatus } from '@/lib/retest';

const STATUS_META: Record<
  RetestStatus,
  { variant: 'default' | 'high' | 'critical'; ring: string }
> = {
  active: { variant: 'default', ring: 'border-l-border' },
  due: { variant: 'high', ring: 'border-l-warning' },
  overdue: { variant: 'critical', ring: 'border-l-error' },
};

function recordHref(sport: RetestTarget['sport']): string {
  return sport === 'golf' ? '/sessions/import' : '/video';
}

export function RetestReminderCard({
  target,
  onDismiss,
  showExplanation = false,
  className,
}: {
  target: RetestTarget;
  onDismiss?: (id: string) => void;
  /** Show the role-aware "what this means" block (used on the Retest hub). */
  showExplanation?: boolean;
  className?: string;
}) {
  const [showHow, setShowHow] = useState(false);
  const meta = STATUS_META[target.status.status];

  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border border-l-4 shadow-xs p-4',
        meta.ring,
        className,
      )}
      role="region"
      aria-label={`Retest: ${target.focus}`}
    >
      <div className="flex items-start gap-3">
        <RotateCcw size={18} className="mt-0.5 shrink-0 text-accent-secondary" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-foreground text-sm">
              {target.emoji ? `${target.emoji} ` : ''}Retest your {target.sportLabel.toLowerCase()} swing
            </p>
            {onDismiss && (
              <button
                onClick={() => onDismiss(target.id)}
                aria-label="Dismiss this retest reminder"
                className="text-muted-foreground hover:text-foreground -mt-0.5 -mr-1 p-1 rounded-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
            You were working on <span className="font-medium text-foreground">{target.focus}</span>.
            Complete your drills, then retest under the same conditions to see if it changed.
          </p>

          <div className="mt-2">
            <Badge variant={meta.variant}>{target.status.label}</Badge>
          </div>

          <button
            onClick={() => setShowHow((v) => !v)}
            aria-expanded={showHow}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {showHow ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            How to retest fairly
          </button>

          {showHow && (
            <div className="mt-2 text-xs text-muted-foreground space-y-2 bg-muted rounded-lg p-3">
              <p className="text-foreground font-medium">{target.whatToReassess}</p>
              <ul className="space-y-1">
                {target.sameConditions.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-primary" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showExplanation && (
            <div className="mt-3">
              <FaultExplanation faultId={target.faultId} faultText={target.focus} sport={target.sport} />
            </div>
          )}

          <div className="mt-3">
            <Link
              href={recordHref(target.sport)}
              onClick={() =>
                track(ANALYTICS_EVENTS.RETEST_PLAN_CLICKED, {
                  sport: target.sport,
                  days: target.window.activeWindowDays,
                })
              }
            >
              <Button size="sm">
                <Video size={14} /> Record a retest
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
