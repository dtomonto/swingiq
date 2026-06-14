'use client';

// ============================================================
// SwingVantage — ActivationChecklist
// ------------------------------------------------------------
// Renders the Activation agent's staged funnel as a calm checklist
// with a progress bar and the current step highlighted. Hidden
// once the user is fully activated.
// ============================================================

import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivationState } from '@/lib/agents/activation';
import { Progress } from '@/components/ui/Progress';

export function ActivationChecklist({
  activation,
  className,
}: {
  activation: ActivationState;
  className?: string;
}) {
  if (activation.status === 'activated') return null;

  return (
    <div className={cn('bg-card rounded-xl border border-border shadow-xs p-4', className)}>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-foreground text-sm">Getting started</p>
        <span className="text-xs text-muted-foreground" aria-label={`${activation.percent}% complete`}>
          {activation.percent}%
        </span>
      </div>
      <Progress value={activation.percent} className="mt-2 h-1.5" aria-label={`${activation.percent}% complete`} />
      <ul className="mt-3 space-y-1.5">
        {activation.steps.map((s) => (
          <li
            key={s.id}
            className={cn(
              'flex items-center gap-2 text-sm',
              s.current ? 'text-foreground font-medium' : 'text-muted-foreground',
            )}
          >
            {s.done ? (
              <CheckCircle2 size={15} className="text-primary shrink-0" aria-hidden="true" />
            ) : (
              <Circle
                size={15}
                className={cn('shrink-0', s.current ? 'text-accent-secondary' : 'text-muted-foreground')}
                aria-hidden="true"
              />
            )}
            <span className={cn(s.done && 'line-through opacity-70')}>{s.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
