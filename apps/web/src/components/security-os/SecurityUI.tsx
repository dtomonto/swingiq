// ============================================================
// securityOS — shared presentational components (server-safe)
// ------------------------------------------------------------
// Pure, hook-free building blocks shared across the securityOS pages so the
// look stays consistent with the rest of the admin (gray-900 panels, amber
// accent, tone palette from StatusBadge). No 'use client' — these render in
// both server and client components.
// ============================================================

import type { ReactNode } from 'react';
import {
  BAND_LABEL,
  SEVERITY_LABEL,
  type CheckResult,
  type FrameworkMapping,
  type ScoreBand,
  type Severity,
} from '@/lib/security-os/types';

// ── Severity / result chips ─────────────────────────────────────────────────

const SEVERITY_TONE: Record<Severity, string> = {
  critical: 'bg-red-500/15 text-red-300 border-red-500/40',
  high: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  low: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  informational: 'bg-gray-700/40 text-gray-300 border-gray-600/50',
};

export function SeverityPill({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${SEVERITY_TONE[severity]}`}>
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

const RESULT_TONE: Record<CheckResult, { cls: string; label: string }> = {
  pass: { cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40', label: 'Pass' },
  partial: { cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40', label: 'Partial' },
  fail: { cls: 'bg-red-500/15 text-red-300 border-red-500/40', label: 'Fail' },
  unknown: { cls: 'bg-gray-700/40 text-gray-400 border-gray-600/50', label: 'Unknown' },
};

export function ResultChip({ result }: { result: CheckResult }) {
  const t = RESULT_TONE[result];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${t.cls}`}>
      {t.label}
    </span>
  );
}

// ── Score dial ──────────────────────────────────────────────────────────────

const BAND_COLOR: Record<ScoreBand, string> = {
  critical: '#f87171',
  at_risk: '#fb923c',
  fair: '#fbbf24',
  good: '#34d399',
  strong: '#10b981',
};

export function ScoreDial({
  score,
  band,
  confidence,
  size = 160,
}: {
  score: number;
  band: ScoreBand;
  confidence?: number;
  size?: number;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = BAND_COLOR[band];
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2937" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold tabular-nums text-gray-100">{score}</span>
        <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color }}>
          {BAND_LABEL[band]}
        </span>
        {typeof confidence === 'number' && (
          <span className="mt-0.5 text-[10px] text-gray-500">{confidence}% confidence</span>
        )}
      </div>
    </div>
  );
}

// ── Score bar (category) ────────────────────────────────────────────────────

export function ScoreBar({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-gray-500">No signal yet</span>;
  }
  const color = value >= 75 ? '#34d399' : value >= 50 ? '#fbbf24' : '#f87171';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      </div>
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-gray-300">{value}</span>
    </div>
  );
}

// ── Framework tags ──────────────────────────────────────────────────────────

export function FrameworkTags({ frameworks }: { frameworks: FrameworkMapping }) {
  const tags = [
    frameworks.owaspTop10 && { label: frameworks.owaspTop10, title: 'OWASP Top 10' },
    frameworks.owaspLlm && { label: frameworks.owaspLlm, title: 'OWASP Top 10 for LLM' },
    frameworks.owaspAsvs && { label: frameworks.owaspAsvs, title: 'OWASP ASVS' },
    frameworks.nistSsdf && { label: `NIST SSDF ${frameworks.nistSsdf}`, title: 'NIST SSDF' },
  ].filter(Boolean) as { label: string; title: string }[];
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <span
          key={t.label}
          title={t.title}
          className="rounded border border-gray-700 bg-gray-800/60 px-1.5 py-0.5 text-[10px] font-medium text-gray-400"
        >
          {t.label}
        </span>
      ))}
    </div>
  );
}

// ── Mini panel scaffolding ──────────────────────────────────────────────────

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

/** A tiny inline sparkline for the security trend. */
export function Sparkline({ points, color = '#fbbf24', width = 220, height = 44 }: { points: number[]; color?: string; width?: number; height?: number }) {
  if (points.length < 2) {
    return <p className="text-xs text-gray-500">Not enough history yet — snapshots accrue each day you visit.</p>;
  }
  const min = Math.min(...points);
  const max = Math.max(...points, min + 1);
  const stepX = width / (points.length - 1);
  const d = points
    .map((p, i) => {
      const x = i * stepX;
      const y = height - ((p - min) / (max - min)) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
