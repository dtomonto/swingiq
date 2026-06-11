// SignalRadar OS — shared presentational helpers (server-safe, no hooks).
// Small, theme-consistent building blocks (dark gray-900 surfaces, amber
// accents) reused across every SignalRadar panel.

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import type { Signal, DistributionBucket } from '@/lib/signal-radar/types';
import {
  SENTIMENT_LABEL, SENTIMENT_TONE, INTENT_LABEL, SPORT_LABEL, URGENCY_LABEL,
  URGENCY_TONE, priorityTone, STATUS_LABEL,
} from '@/lib/signal-radar/labels';

export const INPUT_CLS =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none';

export function Btn({
  children, onClick, tone = 'default', size = 'md', type = 'button', disabled, title,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: 'default' | 'primary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  type?: 'button' | 'submit';
  disabled?: boolean;
  title?: string;
}) {
  const tones: Record<string, string> = {
    default: 'border-border bg-muted text-foreground hover:bg-muted',
    primary: 'border-primary/40 bg-primary/15 text-link hover:bg-primary/25',
    danger: 'border-error/40 bg-error/10 text-error-text hover:bg-error/20',
    ghost: 'border-transparent bg-transparent text-muted-foreground hover:bg-muted',
  };
  const sizes = { sm: 'px-2 py-1 text-xs', md: 'px-3 py-1.5 text-sm' };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]} ${sizes[size]}`}
    >
      {children}
    </button>
  );
}

export function EmptyState({ icon: Icon, title, hint, action }: {
  icon?: LucideIcon; title: string; hint?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
      {Icon && <Icon className="h-6 w-6 text-muted-foreground/70" />}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="max-w-md text-xs text-muted-foreground">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Horizontal distribution bars — the Mention Map primitive. */
export function DistributionBars({ buckets, max, emptyHint }: {
  buckets: DistributionBucket[];
  max?: number;
  emptyHint?: string;
}) {
  if (!buckets.length) {
    return <p className="text-xs text-muted-foreground/70">{emptyHint ?? 'No data yet.'}</p>;
  }
  const top = max ?? Math.max(...buckets.map((b) => b.count), 1);
  return (
    <ul className="space-y-2">
      {buckets.map((b) => (
        <li key={b.key} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-muted-foreground" title={b.label}>{b.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${Math.round((b.count / top) * 100)}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-xs tabular-nums text-foreground">{b.count}</span>
        </li>
      ))}
    </ul>
  );
}

export function ScoreBar({ label, value, tone = 'amber' }: {
  label: string; value: number; tone?: 'amber' | 'emerald' | 'sky' | 'red';
}) {
  const colors = { amber: 'bg-primary/70', emerald: 'bg-success/70', sky: 'bg-primary/70', red: 'bg-error/70' };
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${colors[tone]}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/** The standard badge row describing a signal's classification. */
export function SignalBadges({ signal, showStatus }: { signal: Signal; showStatus?: boolean }) {
  const c = signal.classification;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusBadge tone={priorityTone(signal.scores.priority)}>P{signal.scores.priority}</StatusBadge>
      <StatusBadge tone={SENTIMENT_TONE[c.sentiment]}>{SENTIMENT_LABEL[c.sentiment]}</StatusBadge>
      <StatusBadge tone="info">{INTENT_LABEL[c.intent]}</StatusBadge>
      {c.sport !== 'unknown' && <StatusBadge tone="accent">{SPORT_LABEL[c.sport]}</StatusBadge>}
      <StatusBadge tone={URGENCY_TONE[c.urgency]}>{URGENCY_LABEL[c.urgency]}</StatusBadge>
      {showStatus && <StatusBadge tone="neutral">{STATUS_LABEL[signal.status]}</StatusBadge>}
      {signal.isSeed && <StatusBadge tone="warning">Sample</StatusBadge>}
      {signal.ingested && <StatusBadge tone="info">Ingested</StatusBadge>}
    </div>
  );
}

export function SubTabs<T extends string>({ tabs, active, onChange }: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border pb-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            active === t.id ? 'bg-primary/15 text-link' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          {t.label}
          {typeof t.count === 'number' && (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
