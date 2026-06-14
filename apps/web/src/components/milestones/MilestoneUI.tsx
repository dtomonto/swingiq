// ============================================================
// SwingVantage Milestones — shared presentational bits (server-safe)
// ------------------------------------------------------------
// Hook-free building blocks for the admin Milestone Center + public pages.
// No 'use client' — usable from server and client components.
// ============================================================

import type { ReactNode } from 'react';
import {
  AUTHORITY_BAND_LABEL, MILESTONE_STATUS_LABEL,
  type AuthorityBand, type MilestoneStatus,
} from '@/lib/milestones/types';

const STATUS_TONE: Record<MilestoneStatus, string> = {
  earned: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  in_progress: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  needs_data_source: 'bg-gray-700/40 text-gray-300 border-gray-600/50',
  not_started: 'bg-gray-800 text-gray-400 border-gray-700',
};

export function StatusPill({ status }: { status: MilestoneStatus }) {
  return <Pill className={STATUS_TONE[status]}>{MILESTONE_STATUS_LABEL[status]}</Pill>;
}

const AUTHORITY_TONE: Record<AuthorityBand, string> = {
  strategic: 'bg-violet-500/15 text-violet-300 border-violet-500/40',
  high_value: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  supporting: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  low_priority: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  do_not_publish: 'bg-red-500/15 text-red-300 border-red-500/40',
};

export function AuthorityPill({ band, value }: { band: AuthorityBand; value: number }) {
  return <Pill className={AUTHORITY_TONE[band]} title={AUTHORITY_BAND_LABEL[band]}>{value} · {AUTHORITY_BAND_LABEL[band]}</Pill>;
}

export function ProgressBar({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-gray-500">No data source</span>;
  const color = pct >= 100 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#9ca3af';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
      </div>
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-gray-300">{pct}%</span>
    </div>
  );
}

function Pill({ children, className, title }: { children: ReactNode; className: string; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

export function Panel({ title, hint, children, actions }: { title: ReactNode; hint?: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
