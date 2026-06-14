'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardBody } from '@/components/ui/Card';
import { Info, ChevronDown, Lightbulb } from 'lucide-react';
import type { SportActionPreset, CameraView } from '@/lib/record-assist/types';

const VIEW_LABEL: Record<CameraView, string> = {
  face_on: 'Face-on',
  down_the_line: 'Down-the-line',
  side: 'Side view',
  rear: 'Rear view',
  front: 'Front view',
  baseline: 'Baseline',
  unknown: 'Recommended',
};

export interface SetupInstructionCardProps {
  preset: SportActionPreset;
  className?: string;
}

/** Sport/action-specific setup steps + a "why this matters" explainer. */
export function SetupInstructionCard({ preset, className }: SetupInstructionCardProps) {
  const [open, setOpen] = useState(true);
  return (
    <Card className={className}>
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary/15 p-1.5 text-primary">
              <Info className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{preset.label} setup</h3>
              <p className="text-xs text-muted-foreground">
                {VIEW_LABEL[preset.recommendedView]} · {preset.recommendedOrientation}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? 'Collapse setup steps' : 'Expand setup steps'}
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground tap-target"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
          </button>
        </div>

        {open && (
          <>
            <ol className="space-y-1.5">
              {preset.setupSteps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-2xs font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <div className="flex gap-2 rounded-lg bg-muted/60 p-2.5">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Why this matters: </span>
                {preset.why}
              </p>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
