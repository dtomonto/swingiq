'use client';

import { cn } from '@/lib/utils';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, AlertTriangle, RotateCcw, ArrowRight } from 'lucide-react';
import type { RetakeRecommendation, KineticConfidenceLevel } from '@/lib/record-assist/types';

const CONFIDENCE_LABEL: Record<KineticConfidenceLevel, string> = {
  high: 'High confidence this clip is analysis-ready',
  medium: 'Medium confidence — usable with minor tradeoffs',
  low: 'Low confidence — analysis accuracy may be reduced',
  insufficient: 'Not enough was captured for a confident read',
};

export interface RetakeRecommendationCardProps {
  recommendation: RetakeRecommendation;
  onRetake: () => void;
  onProceed: () => void;
  className?: string;
}

/**
 * Post-recording verdict. We never block — the user can always proceed — but
 * we surface honest, specific retake reasons and the quality tradeoff.
 */
export function RetakeRecommendationCard({
  recommendation, onRetake, onProceed, className,
}: RetakeRecommendationCardProps) {
  const { recommended, reasons, confidence } = recommendation;
  const good = !recommended && reasons.length === 0;

  return (
    <Card className={className}>
      <CardBody className="space-y-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'rounded-lg p-2',
              good ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning',
            )}
          >
            {good ? <CheckCircle2 className="h-5 w-5" aria-hidden /> : <AlertTriangle className="h-5 w-5" aria-hidden />}
          </span>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {good ? 'Looks good — ready for analysis' : 'Retake recommended'}
            </h3>
            <p className="text-sm text-muted-foreground">{CONFIDENCE_LABEL[confidence]}</p>
          </div>
        </div>

        {reasons.length > 0 && (
          <ul className="space-y-2">
            {reasons.map((r) => (
              <li key={r.id} className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-3xs font-semibold uppercase',
                      r.severity === 'blocking' ? 'bg-error/15 text-error' : 'bg-warning/15 text-warning',
                    )}
                  >
                    {r.severity}
                  </span>
                  <span className="text-sm font-medium text-foreground">{r.reason}</span>
                </div>
                <p className="mt-1 pl-0.5 text-xs text-muted-foreground">{r.fix}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant={recommended ? 'primary' : 'outline'} onClick={onRetake} className="flex-1">
            <RotateCcw className="h-4 w-4" aria-hidden /> Retake
          </Button>
          <Button variant={recommended ? 'outline' : 'primary'} onClick={onProceed} className="flex-1">
            Use this clip <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
