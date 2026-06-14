'use client';

// ============================================================
// SwingVantage — Analysis Speed Selector
// A simple Fast / Balanced / Thorough dial. "Fast" is the default — it uses
// a quicker AI model and asks for concise output, which is the biggest lever
// on how long the review takes. The slower tiers trade time for depth.
// ============================================================

import { Zap, Gauge, Microscope } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VisionSpeed } from '@swingiq/core';

const OPTIONS: { id: VisionSpeed; label: string; hint: string; Icon: typeof Zap }[] = [
  { id: 'fast', label: 'Fast', hint: 'Quickest — usually ~10s', Icon: Zap },
  { id: 'balanced', label: 'Balanced', hint: 'A little deeper', Icon: Gauge },
  { id: 'thorough', label: 'Thorough', hint: 'Most detail, slowest', Icon: Microscope },
];

export function AnalysisSpeedSelector({
  value,
  onChange,
}: {
  value: VisionSpeed;
  onChange: (s: VisionSpeed) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground mb-2">
        Analysis speed{' '}
        <span className="text-xs font-normal text-muted-foreground">
          (faster vs. more detail — you can change this anytime)
        </span>
      </p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Analysis speed">
        {OPTIONS.map(({ id, label, hint, Icon }) => {
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors',
                selected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/40',
              )}
            >
              <Icon className={cn('w-4 h-4', selected ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn('text-xs font-semibold', selected ? 'text-primary' : 'text-foreground')}>
                {label}
              </span>
              <span className="text-2xs leading-tight text-muted-foreground">{hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
