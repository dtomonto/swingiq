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
  'w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none';

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
    default: 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700',
    primary: 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25',
    danger: 'border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20',
    ghost: 'border-transparent bg-transparent text-gray-400 hover:bg-gray-800',
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
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-800 bg-gray-900/40 px-6 py-10 text-center">
      {Icon && <Icon className="h-6 w-6 text-gray-600" />}
      <p className="text-sm font-medium text-gray-300">{title}</p>
      {hint && <p className="max-w-md text-xs text-gray-500">{hint}</p>}
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
    return <p className="text-xs text-gray-600">{emptyHint ?? 'No data yet.'}</p>;
  }
  const top = max ?? Math.max(...buckets.map((b) => b.count), 1);
  return (
    <ul className="space-y-2">
      {buckets.map((b) => (
        <li key={b.key} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-gray-400" title={b.label}>{b.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-amber-500/70"
              style={{ width: `${Math.round((b.count / top) * 100)}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-xs tabular-nums text-gray-300">{b.count}</span>
        </li>
      ))}
    </ul>
  );
}

export function ScoreBar({ label, value, tone = 'amber' }: {
  label: string; value: number; tone?: 'amber' | 'emerald' | 'sky' | 'red';
}) {
  const colors = { amber: 'bg-amber-500/70', emerald: 'bg-emerald-500/70', sky: 'bg-sky-500/70', red: 'bg-red-500/70' };
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="tabular-nums text-gray-300">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
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
    </div>
  );
}

export function SubTabs<T extends string>({ tabs, active, onChange }: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-800 pb-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            active === t.id ? 'bg-amber-500/15 text-amber-300' : 'text-gray-400 hover:bg-gray-800'
          }`}
        >
          {t.label}
          {typeof t.count === 'number' && (
            <span className="ml-1.5 rounded-full bg-gray-800 px-1.5 text-[10px] tabular-nums text-gray-400">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
