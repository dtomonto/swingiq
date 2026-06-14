// ============================================================
// BranchGuardianOS — shared presentational components (server-safe)
// ------------------------------------------------------------
// Pure, hook-free building blocks shared across the BranchGuardianOS dashboard
// so the look stays consistent with the rest of the admin (theme-aware surfaces,
// emerald/amber/red tone palette). No 'use client' — these render in both
// server and client components. Mirrors components/security-os/SecurityUI.
// ============================================================

import type { ReactNode } from 'react';
import {
  HEALTH_BAND_LABEL,
  COMMAND_SAFETY_LABEL,
  REC_SEVERITY_LABEL,
  REC_SAFETY_LABEL,
  RISK_LABEL,
  type CommandSafety,
  type HealthBand,
  type RecSafety,
  type RecSeverity,
  type RiskLevel,
} from '@/lib/branch-guardian/types';

const BAND_COLOR: Record<HealthBand, string> = {
  excellent: '#10b981',
  healthy: '#34d399',
  attention: '#fbbf24',
  stale: '#fb923c',
  high_risk: '#f87171',
};

// ── Cleanliness dial ─────────────────────────────────────────────────────────

export function CleanlinessDial({
  value,
  band,
  size = 160,
}: {
  value: number;
  band: HealthBand;
  size?: number;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const color = BAND_COLOR[band];
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`Git cleanliness score ${value} of 100`}>
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
        <span className="text-3xl font-bold tabular-nums text-foreground">{value}</span>
        <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color }}>
          {HEALTH_BAND_LABEL[band]}
        </span>
      </div>
    </div>
  );
}

// ── Health bar (per-entity) ──────────────────────────────────────────────────

export function HealthBar({ value, band }: { value: number; band: HealthBand }) {
  const color = BAND_COLOR[band];
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      </div>
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{value}</span>
    </div>
  );
}

// ── Pills ────────────────────────────────────────────────────────────────────

const RISK_TONE: Record<RiskLevel, string> = {
  high: 'bg-red-500/15 text-red-300 border-red-500/40',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  low: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
};

export function RiskPill({ risk }: { risk: RiskLevel }) {
  return <Pill className={RISK_TONE[risk]}>{RISK_LABEL[risk]}</Pill>;
}

const SEVERITY_TONE: Record<RecSeverity, string> = {
  critical: 'bg-red-500/15 text-red-300 border-red-500/40',
  high: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  low: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  info: 'bg-muted/40 text-muted-foreground border-border/50',
};

export function SeverityPill({ severity }: { severity: RecSeverity }) {
  return <Pill className={SEVERITY_TONE[severity]}>{REC_SEVERITY_LABEL[severity]}</Pill>;
}

const SAFETY_TONE: Record<CommandSafety, string> = {
  'read-only': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  'dry-run': 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  caution: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  destructive: 'bg-red-500/15 text-red-300 border-red-500/40',
};

export function CommandSafetyPill({ safety }: { safety: CommandSafety }) {
  return <Pill className={SAFETY_TONE[safety]}>{COMMAND_SAFETY_LABEL[safety]}</Pill>;
}

const REC_SAFETY_TONE: Record<RecSafety, string> = {
  safe: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  cautionary: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  high_risk: 'bg-red-500/15 text-red-300 border-red-500/40',
};

export function RecSafetyPill({ safety }: { safety: RecSafety }) {
  return <Pill className={REC_SAFETY_TONE[safety]}>{REC_SAFETY_LABEL[safety]}</Pill>;
}

function Pill({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${className}`}>
      {children}
    </span>
  );
}

// ── Panel scaffolding ────────────────────────────────────────────────────────

export function Panel({ title, hint, children, actions }: { title: ReactNode; hint?: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/** Tiny inline sparkline for the cleanliness trend. */
export function Sparkline({ points, color = '#34d399', width = 220, height = 44 }: { points: number[]; color?: string; width?: number; height?: number }) {
  if (points.length < 2) {
    return <p className="text-xs text-muted-foreground">Not enough history yet — snapshots accrue each day you visit.</p>;
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
