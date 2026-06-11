// StatusBadge — small status pill with a consistent tone palette.
// Server-safe. Use for connection state, content status, severities.

import type { ReactNode } from 'react';

export type BadgeTone =
  // Admin OS 4-level severity scale (+ healthy).
  | 'critical' | 'warning' | 'watch' | 'routine' | 'healthy'
  // Legacy tones — kept as aliases so existing callers don't break.
  | 'neutral' | 'success' | 'danger' | 'info' | 'accent';

const TONES: Record<BadgeTone, string> = {
  // Severity scale
  critical: 'bg-error/10 text-error-text border-error/30',
  warning: 'bg-warning/12 text-warning-text border-warning/30',
  watch: 'bg-primary/8 text-link border-primary/30',
  routine: 'bg-success/10 text-success-text border-success/30',
  healthy: 'bg-success/10 text-success-text border-success/30',
  // Legacy aliases
  neutral: 'bg-muted text-foreground border-border',
  success: 'bg-success/10 text-success-text border-success/30',
  danger: 'bg-error/10 text-error-text border-error/30',
  info: 'bg-primary/10 text-link border-primary/30',
  accent: 'bg-primary/10 text-link border-primary/30',
};

export function StatusBadge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
