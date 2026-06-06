'use client';

// ============================================================
// SwingVantage — Re-engagement OS: in-app nudge card
// ------------------------------------------------------------
// Drop-in surface (e.g. dashboard top) that shows the single best
// re-engagement nudge, or nothing. Records "shown" once, supports
// dismiss. Honest + gentle — never more than one nudge per day.
// ============================================================

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, X, Sparkles, RotateCcw, Flame, Target } from 'lucide-react';
import { useReengage } from '@/lib/reengage';
import type { TriggerId } from '@/lib/reengage';

const ICON: Partial<Record<TriggerId, React.ReactNode>> = {
  retest_due: <RotateCcw size={18} />,
  streak_at_risk: <Flame size={18} />,
  activation: <Target size={18} />,
};

export function ReengageNudgeCard() {
  const { nudge, markShown, dismiss } = useReengage();
  const shownRef = useRef(false);

  useEffect(() => {
    if (nudge && !shownRef.current) {
      shownRef.current = true;
      markShown();
    }
  }, [nudge, markShown]);

  if (!nudge) return null;

  return (
    <div className="relative flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {ICON[nudge.triggerId] ?? <Sparkles size={18} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{nudge.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{nudge.body}</p>
        <Link
          href={nudge.cta.href}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {nudge.cta.label} <ArrowRight size={14} />
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X size={16} />
      </button>
    </div>
  );
}
