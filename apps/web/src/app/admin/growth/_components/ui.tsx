// ============================================================
// GrowthOS — Shared UI primitives (presentational, no client hooks)
// ------------------------------------------------------------
// Usable from both server pages and client modules. Matches the existing
// admin dark palette (gray-950/900/800 + accent tints). Keeping badges +
// cards here guarantees every one of the 28 modules looks identical.
// ============================================================

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DATA_SOURCE_BADGE, PRIORITY_BADGE, statusBadgeClass } from '@/lib/growth/labels';
import { priorityScore, priorityBand } from '@/lib/growth/scoring';
import type { DataSource, PriorityInputs } from '@/lib/growth/types';
import { metricHref } from '@/lib/admin/metrics';

// ── Generic badge ─────────────────────────────────────────────
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-sm border font-medium whitespace-nowrap', className)}>
      {children}
    </span>
  );
}

/** The honesty layer: every data point can show where it came from. */
export function DataSourceBadge({ source }: { source: DataSource }) {
  const cfg = DATA_SOURCE_BADGE[source];
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge className={statusBadgeClass(status)}>{status.replace(/[-_]/g, ' ')}</Badge>;
}

export function PriorityBadge({ priority }: { priority: PriorityInputs }) {
  const score = priorityScore(priority);
  const band = priorityBand(score);
  const cfg = PRIORITY_BADGE[band];
  return <Badge className={cfg.className}>{cfg.label} · {score}</Badge>;
}

// ── KPI / stat card ───────────────────────────────────────────
export function KpiCard({
  label, value, sublabel, icon: Icon, accent = 'text-success-text', source, metricId, metricValueText,
}: {
  label: string;
  value: ReactNode;
  sublabel?: string;
  icon?: LucideIcon;
  accent?: string;
  source?: DataSource;
  /** When set, the tile links to its explainer at /admin/metrics/<metricId>. */
  metricId?: string;
  /** Plain-text value passed to the explainer for the uncurated fallback. */
  metricValueText?: string;
}) {
  const clickable = Boolean(metricId);
  return (
    <div
      className={cn(
        'group relative rounded-xl border border-border bg-card p-4',
        clickable && 'transition-colors hover:border-primary/40',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        {Icon ? <Icon className={cn('w-4 h-4', accent)} /> : <span />}
        <div className="flex items-center gap-1.5">
          {source ? <DataSourceBadge source={source} /> : null}
          {clickable ? <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-link transition-colors" aria-hidden /> : null}
        </div>
      </div>
      <p className={cn('text-2xl font-bold leading-none', accent)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
      {sublabel ? <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sublabel}</p> : null}
      {clickable ? (
        <Link
          href={metricHref(metricId!, metricValueText)}
          aria-label={`What is "${label}"? Open the metric explainer`}
          className="absolute inset-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      ) : null}
    </div>
  );
}

// ── Section card (titled panel) ───────────────────────────────
export function SectionCard({
  title, icon: Icon, action, children, className,
}: {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2 min-w-0">
          {Icon ? <Icon className="w-4 h-4 text-success-text shrink-0" /> : null}
          <h2 className="text-sm font-semibold text-foreground truncate">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Module header (page title + description + data note) ───────
export function ModuleHeader({
  title, description, icon: Icon, children,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        {Icon ? (
          <div className="rounded-lg bg-success/10 border border-success/20 p-2 shrink-0">
            <Icon className="w-5 h-5 text-success-text" />
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
export function EmptyState({
  icon: Icon, title, description, action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
      {Icon ? <Icon className="w-8 h-8 text-muted-foreground/70 mx-auto mb-3" /> : null}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/** A small inline note explaining the data is demo/seed data. */
export function MockDataNote({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-xs text-link">
      {children ?? (
        <>
          <strong>Demo data.</strong> These records are realistic seed data so the module is useful immediately.
          Connect a database + the relevant integrations to replace them with live data — nothing here is presented as a real production metric.
        </>
      )}
    </div>
  );
}

/** Definition-style field row used in detail panels. */
export function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/60 last:border-0">
      <dt className="text-xs text-muted-foreground col-span-1">{label}</dt>
      <dd className="text-xs text-foreground col-span-2">{children || '—'}</dd>
    </div>
  );
}
