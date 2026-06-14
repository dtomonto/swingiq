'use client';

// ============================================================
// RolloutControls — staged-rollout step picker + auto-verify toggle
// ------------------------------------------------------------
// A controlled primitive for planning how a decision rolls out: pick the
// audience step (50 / 75 / 100 %) and whether verification re-runs after the
// step lands. Pure presentational + fully keyboard-accessible (radiogroup +
// switch). It captures intent only — the parent persists it and the actual
// rollout happens in the linked tool.
// ============================================================

import { ShieldCheck } from 'lucide-react';
import { ROLLOUT_STEPS, type RolloutStep } from '@/lib/admin/decision-rollout';

export interface RolloutControlsProps {
  step: RolloutStep;
  onStepChange: (step: RolloutStep) => void;
  autoVerify: boolean;
  onAutoVerifyChange: (autoVerify: boolean) => void;
  disabled?: boolean;
}

export function RolloutControls({
  step, onStepChange, autoVerify, onAutoVerifyChange, disabled = false,
}: RolloutControlsProps) {
  function onStepKey(e: React.KeyboardEvent, index: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = ROLLOUT_STEPS[(index + dir + ROLLOUT_STEPS.length) % ROLLOUT_STEPS.length];
    onStepChange(next);
  }

  return (
    <div className="space-y-3">
      {/* Step picker — a segmented radiogroup */}
      <div>
        <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Rollout step</p>
        <div
          role="radiogroup"
          aria-label="Rollout step"
          className="inline-flex rounded-lg border border-border bg-background p-0.5"
        >
          {ROLLOUT_STEPS.map((s, i) => {
            const active = s === step;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                disabled={disabled}
                onClick={() => onStepChange(s)}
                onKeyDown={(e) => onStepKey(e, i)}
                className={`min-w-[3.25rem] rounded-md px-3 py-1.5 text-sm font-semibold tabular-nums transition-colors disabled:opacity-40 ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-theme'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}%
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-2xs text-muted-foreground">
          Ship to {step}% first{step < 100 ? ', then widen once it holds.' : ' — full audience in one step.'}
        </p>
      </div>

      {/* Auto-verify switch */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
        <span className="flex items-center gap-2 text-sm text-foreground">
          <ShieldCheck className="h-4 w-4 text-link" />
          <span>
            Auto-verify after step
            <span className="block text-2xs font-normal text-muted-foreground">
              Re-run checks once the step lands; pause if they regress.
            </span>
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={autoVerify}
          aria-label="Auto-verify after step"
          disabled={disabled}
          onClick={() => onAutoVerifyChange(!autoVerify)}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 ${
            autoVerify ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-theme transition-transform ${
              autoVerify ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
