'use client';

// Progress — determinate progress bar on @radix-ui/react-progress (already a
// dependency). Radix supplies role="progressbar" + aria-valuenow/min/max and
// data-state, so feature code stops hand-rolling the bar markup + ARIA. Token-
// styled; the indicator color is overridable for status/tier bars.

import * as ProgressPrimitive from '@radix-ui/react-progress';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** 0–100. */
  value?: number | null;
  /** Class for the moving indicator (e.g. a status/tier color). @default bg-primary */
  indicatorClassName?: string;
}

export const Progress = forwardRef<ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value, indicatorClassName, ...props }, ref) => {
    const pct = Math.max(0, Math.min(100, value ?? 0));
    return (
      <ProgressPrimitive.Root
        ref={ref}
        value={value ?? undefined}
        className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn('h-full w-full flex-1 bg-primary transition-transform', indicatorClassName)}
          style={{ transform: `translateX(-${100 - pct}%)` }}
        />
      </ProgressPrimitive.Root>
    );
  },
);
Progress.displayName = 'Progress';
