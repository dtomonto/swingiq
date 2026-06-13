'use client';

// ============================================================
// DeterministicPlanCard — token-free practice plan + feedback
// ------------------------------------------------------------
// Pairs with DeterministicWhyPanel: turns a diagnosis into a focused, structured
// practice plan (warm-up, skill-scaled drills, success/failure signals, retest,
// progression/regression) with a Today-length short form and an expandable full
// plan. Records the shown diagnosis to the local history hub, emits the
// plan-generated event once, and captures a one-tap "was this helpful?" signal.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardList, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { DeterministicDiagnosis, SkillLevel } from '@/lib/intelligence/diagnose-types';
import { generateDeterministicPlan } from '@/lib/intelligence/plan';
import { useRecordDiagnosis } from '@/lib/intelligence/history';
import { trackDeterministicPlan, trackDeterministicFeedback } from '@/lib/intelligence/analytics';

export function DeterministicPlanCard({
  diagnosis,
  skillLevel,
  surface,
}: {
  diagnosis: DeterministicDiagnosis;
  skillLevel?: SkillLevel;
  /** Non-PII surface tag for analytics (e.g. 'dashboard', 'start_here'). */
  surface?: string;
}) {
  const plan = useMemo(() => generateDeterministicPlan(diagnosis, { skillLevel }), [diagnosis, skillLevel]);
  const [feedback, setFeedback] = useState<null | boolean>(null);

  // Persist the shown diagnosis to the structured history hub.
  useRecordDiagnosis(diagnosis);

  // Emit plan-generated once per cause.
  const emitted = useRef<string | null>(null);
  useEffect(() => {
    if (emitted.current === diagnosis.primary.faultId) return;
    emitted.current = diagnosis.primary.faultId;
    trackDeterministicPlan(diagnosis, plan, surface ? { surface } : undefined);
  }, [diagnosis, plan, surface]);

  function rate(helpful: boolean) {
    setFeedback(helpful);
    trackDeterministicFeedback(diagnosis, helpful, surface ? { surface } : undefined);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <ClipboardList size={16} className="text-primary" aria-hidden="true" />
          Your practice plan
        </h3>
        <span className="text-[11px] text-muted-foreground">~{plan.estimatedMinutes} min</span>
      </div>

      {/* Short (Today) form */}
      <ul className="mt-3 space-y-1.5 text-sm text-foreground">
        {plan.shortForm.map((line) => (
          <li key={line} className="flex gap-2">
            <ChevronRight size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {/* Full plan (default closed) */}
      <details className="group mt-3">
        <summary className="cursor-pointer list-none text-xs font-medium text-primary">
          <span className="group-open:hidden">Show the full plan</span>
          <span className="hidden group-open:inline">Hide the full plan</span>
        </summary>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {plan.longForm.map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
      </details>

      {/* Sharpen-this prompts (missing data → high-value intake questions) */}
      {diagnosis.missingDataPrompts.length > 0 && (
        <div className="mt-3 rounded-xl bg-muted/50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sharpen this</p>
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
            {diagnosis.missingDataPrompts.slice(0, 2).map((q) => (
              <li key={q}>• {q}</li>
            ))}
          </ul>
        </div>
      )}

      {/* One-tap helpfulness */}
      <div className="mt-4 flex items-center gap-3 border-t border-border pt-3">
        {feedback === null ? (
          <>
            <span className="text-xs text-muted-foreground">Was this helpful?</span>
            <button
              type="button"
              onClick={() => rate(true)}
              aria-label="Helpful"
              className="rounded-full border border-border p-1.5 text-muted-foreground hover:border-success hover:text-success"
            >
              <ThumbsUp size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => rate(false)}
              aria-label="Not helpful"
              className="rounded-full border border-border p-1.5 text-muted-foreground hover:border-warning hover:text-warning"
            >
              <ThumbsDown size={14} aria-hidden="true" />
            </button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Thanks — noted.</span>
        )}
      </div>
    </div>
  );
}
