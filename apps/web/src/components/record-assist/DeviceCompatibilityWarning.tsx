'use client';

import { cn } from '@/lib/utils';
import { MonitorSmartphone, AlertTriangle } from 'lucide-react';
import type { DeviceCompatibilityResult } from '@/lib/record-assist/types';

export interface DeviceCompatibilityWarningProps {
  result: DeviceCompatibilityResult;
  className?: string;
}

/**
 * Surfaces compatibility downgrades honestly. `unsupported` blocks the guided
 * flow (with an upload fallback message); `degraded` informs but proceeds.
 */
export function DeviceCompatibilityWarning({ result, className }: DeviceCompatibilityWarningProps) {
  if (result.tier === 'full') return null;
  const unsupported = result.tier === 'unsupported';

  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        unsupported ? 'border-error/40 bg-error/10' : 'border-warning/40 bg-warning/10',
        className,
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className={cn('rounded-lg p-2', unsupported ? 'bg-error/15 text-error' : 'bg-warning/15 text-warning')}>
          {unsupported ? <AlertTriangle className="h-5 w-5" aria-hidden /> : <MonitorSmartphone className="h-5 w-5" aria-hidden />}
        </span>
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold text-foreground">
            {unsupported ? 'Guided recording isn’t available here' : 'Limited guided-recording support'}
          </h3>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {result.notes.map((note, i) => (
              <li key={i}>• {note}</li>
            ))}
          </ul>
          {unsupported && (
            <p className="text-xs text-muted-foreground">
              You can still upload a clip from your device for analysis.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
