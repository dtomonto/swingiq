'use client';

// ============================================================
// SwingIQ — "Did this drill help?" feedback control
// ------------------------------------------------------------
// The closing half of the improvement loop: a one-tap verdict
// that is stored locally and feeds future DrillMatch ranking.
// Honest + low-pressure — there is no wrong answer, and "made it
// worse" is treated as valuable signal, not a failure.
// ============================================================

import { useState } from 'react';
import { ThumbsUp, Minus, ThumbsDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import { recordDrillFeedback, type DrillFeedbackValue } from '@/lib/drillmatch';
import type { SportId } from '@swingiq/core';

const OPTIONS: { value: DrillFeedbackValue; label: string; icon: typeof ThumbsUp }[] = [
  { value: 'helped', label: 'It helped', icon: ThumbsUp },
  { value: 'no_change', label: 'No change yet', icon: Minus },
  { value: 'hurt', label: 'Made it worse', icon: ThumbsDown },
];

export function DrillFeedbackControl({
  drillId,
  faultId,
  sport,
  onRecorded,
}: {
  drillId: string;
  faultId: string;
  sport: SportId;
  /** Called after a verdict is saved so the parent can re-rank. */
  onRecorded?: (value: DrillFeedbackValue) => void;
}) {
  const [chosen, setChosen] = useState<DrillFeedbackValue | null>(null);

  function choose(value: DrillFeedbackValue) {
    setChosen(value);
    recordDrillFeedback(drillId, faultId, sport, value);
    track('drill_feedback_recorded', { drill_id: drillId, fault_id: faultId, sport, value });
    onRecorded?.(value);
  }

  if (chosen) {
    return (
      <div className="flex items-center gap-2 text-sm text-primary">
        <Check size={15} className="shrink-0" />
        <span>
          Saved — SwingIQ will use this to pick better drills for you next time.
        </span>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-2">
        After you practise: did this drill help?
      </p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => choose(value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              'border-border text-foreground hover:bg-muted focus:ring-2 focus:ring-ring outline-hidden',
            )}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
