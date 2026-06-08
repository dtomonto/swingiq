'use client';

import { useState } from 'react';
import { Wind, RotateCcw, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { MentalRoutine } from '@/lib/mental-performance/types';

/**
 * Guided step-by-step routine player. Big tap targets so it's usable quickly
 * between a shot, pitch, or point. Calls onComplete when finished.
 */
export function RoutinePlayer({
  routine,
  onComplete,
}: {
  routine: MentalRoutine;
  onComplete?: (routineId: string) => void;
}) {
  const [step, setStep] = useState(0);
  const last = step >= routine.steps.length - 1;

  const next = () => {
    if (last) {
      onComplete?.(routine.id);
      setStep(routine.steps.length); // done state
    } else {
      setStep((s) => s + 1);
    }
  };

  const done = step >= routine.steps.length;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">{routine.title}</h3>
          <p className="text-sm text-muted-foreground">{routine.situation}</p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {routine.durationSeconds}s
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-primary/5 p-3 text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium text-primary">
          <Wind size={15} aria-hidden="true" /> Breathe
        </span>
        <span className="ml-2 text-foreground">{routine.breathPattern}</span>
      </div>

      {!done ? (
        <div className="mt-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Step {step + 1} of {routine.steps.length}
          </div>
          <p className="mt-2 min-h-[3.5rem] text-lg text-foreground">{routine.steps[step]}</p>

          {/* progress dots */}
          <div className="mt-3 flex gap-1.5" aria-hidden="true">
            {routine.steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2">
            <Button onClick={next} size="lg" className="flex-1">
              {last ? (<><Check size={18} /> Done</>) : (<>Next <ChevronRight size={18} /></>)}
            </Button>
          </div>
          <p className="mt-3 text-center text-sm font-medium text-primary">“{routine.selfTalkCue}”</p>
        </div>
      ) : (
        <div className="mt-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check size={24} aria-hidden="true" />
          </div>
          <p className="mt-3 font-semibold text-foreground">Reset complete.</p>
          <p className="mt-1 text-sm text-muted-foreground">“{routine.selfTalkCue}” — now play the next one.</p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => setStep(0)}>
            <RotateCcw size={15} /> Run it again
          </Button>
        </div>
      )}
    </div>
  );
}
