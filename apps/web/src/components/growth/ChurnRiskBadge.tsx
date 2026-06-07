'use client';

// ============================================================
// SwingVantage — ChurnRiskBadge
// ------------------------------------------------------------
// A small, honest pill showing the engagement-health band + score
// from the Churn agent. Internal-leaning, but safe to show: it is
// framed as "engagement health", never as a judgment of the user.
// ============================================================

import { cn } from '@/lib/utils';
import type { ChurnBand } from '@/lib/agents/churn';

const BAND: Record<ChurnBand, { label: string; cls: string }> = {
  safe: { label: 'Healthy', cls: 'bg-primary/10 text-primary' },
  watch: { label: 'Watch', cls: 'bg-accent-secondary/10 text-accent-secondary' },
  at_risk: { label: 'At risk', cls: 'bg-amber-400/15 text-warning' },
  critical: { label: 'Critical', cls: 'bg-error/10 text-error' },
};

export function ChurnRiskBadge({
  band,
  score,
  className,
}: {
  band: ChurnBand;
  score: number;
  className?: string;
}) {
  const b = BAND[band];
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', b.cls, className)}
      title={`Engagement health: ${b.label} (risk score ${score}/100)`}
    >
      {b.label} · {score}
    </span>
  );
}
