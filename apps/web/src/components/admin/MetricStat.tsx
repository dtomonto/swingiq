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
  default: 'text-gray-100',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  muted: 'text-gray-500',
};

export function MetricStat({ label, value, hint, icon: Icon, tone = 'default' }: MetricStatProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-gray-600" />}
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${VALUE_TONE[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
