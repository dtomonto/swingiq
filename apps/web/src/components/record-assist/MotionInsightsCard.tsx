'use client';

import { cn } from '@/lib/utils';
import { Card, CardBody } from '@/components/ui/Card';
import { Activity, Info } from 'lucide-react';
import type { KineticConfidenceLevel, MotionInsights } from '@/lib/record-assist/types';

const CONFIDENCE_CHIP: Record<KineticConfidenceLevel, { label: string; cls: string }> = {
  high: { label: 'High', cls: 'bg-success/15 text-success' },
  medium: { label: 'Medium', cls: 'bg-primary/15 text-primary' },
  low: { label: 'Low', cls: 'bg-warning/15 text-warning' },
  insufficient: { label: 'No read', cls: 'bg-muted text-muted-foreground' },
};

function ConfidenceChip({ level }: { level: KineticConfidenceLevel }) {
  const c = CONFIDENCE_CHIP[level];
  return (
    <span className={cn('rounded px-1.5 py-0.5 text-3xs font-semibold uppercase', c.cls)}>
      {c.label}
    </span>
  );
}

export interface MotionInsightsCardProps {
  insights: MotionInsights;
  className?: string;
}

/**
 * Phase 3 review surface: the biomechanics proxies distilled from the captured
 * pose track (tempo, hip-shoulder separation, sway, balance, sequencing). Every
 * value is honestly confidence-labelled — these are estimates from a single
 * on-device camera, never lab-grade motion capture.
 */
export function MotionInsightsCard({ insights, className }: MotionInsightsCardProps) {
  const { metrics, confidence, trackedFrames } = insights;

  return (
    <Card className={className}>
      <CardBody className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-primary/15 p-2 text-primary">
            <Activity className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">Motion insights</h3>
              <ConfidenceChip level={confidence} />
            </div>
            <p className="text-sm text-muted-foreground">
              Estimated from on-device tracking across {trackedFrames} frames.
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {metrics.map((m) => (
            <li key={m.key} className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">{m.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-foreground">{m.display}</span>
                  <ConfidenceChip level={m.confidence} />
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{m.read}</p>
            </li>
          ))}
        </ul>

        <p className="flex items-start gap-1.5 text-2xs leading-snug text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          These are single-camera estimates (proxies), not lab-grade motion capture.
          Depth-dependent reads like separation use a 2D fallback and are labelled
          accordingly.
        </p>
      </CardBody>
    </Card>
  );
}
