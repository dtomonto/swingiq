// MetricStat — a single KPI tile. Server-safe. `value` accepts a node
// so honest non-numeric states ("—", "Not tracked") render cleanly.

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface MetricStatProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  /** Subtle accent on the value. */
  tone?: 'default' | 'success' | 'warning' | 'muted';
}

const VALUE_TONE: Record<NonNullable<MetricStatProps['tone']>, string> = {
  default: 'text-foreground',
  success: 'text-success-text',
  warning: 'text-link',
  muted: 'text-muted-foreground',
};

export function MetricStat({ label, value, hint, icon: Icon, tone = 'default' }: MetricStatProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/70" />}
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${VALUE_TONE[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
