'use client';

// ============================================================
// PublishingOS — entity detail drawer
// ------------------------------------------------------------
// The "should I publish this, and what happens if I do?" view. Opens from a
// queue row and surfaces the rich model the queue never showed: risk rationale,
// a pre-flight validation checklist, the lifecycle/version, the affected routes,
// the registry's honest source label, and the per-entity audit timeline. The
// live action reuses the SAME guarded publish toggle as the queue (so high-risk
// still routes through the confirmation modal) — this panel never invents a new
// write path.
// ============================================================

import {
  X, ShieldAlert, CheckCircle2, AlertTriangle, Info, Clock, GitBranch, Route, History, ExternalLink,
  FileText, Users, RotateCcw,
} from 'lucide-react';
import { buildPublishDetail, type DetailInput } from '@/lib/publishing/detail';
import type { QueueItem } from '@/lib/publishing/admin-data.server';
import type { PublishableEntity, PublishEvent, RiskLevel, PublishMode, ValidationCheck } from '@/lib/publishing/types';

const RISK_TONE: Record<RiskLevel, string> = {
  low: 'bg-muted text-foreground border-border',
  medium: 'bg-primary/10 text-link border-primary/30',
  high: 'bg-primary/10 text-link border-primary/30',
  critical: 'bg-error/10 text-error-text border-error/30',
};
const MODE_LABEL: Record<PublishMode, string> = { instant: 'Instant', deploy_backed: 'Requires deploy', hybrid: 'Hybrid' };

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 border-t border-border/60 pt-4">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {title}
      </h3>
      {children}
    </section>
  );
}

/** Slug-based surfaces where the row id IS the public slug (so we can run the
 *  slug-format + collision pre-flight against it honestly). */
const SLUG_KINDS = new Set(['seo', 'blog']);

export function PublishDetailDrawer({
  item, entity, events, queue, busy, onToggle, onClose,
}: {
  item: QueueItem;
  entity?: PublishableEntity;
  events: PublishEvent[];
  queue: QueueItem[];
  busy: string | null;
  onToggle: (i: QueueItem) => void;
  onClose: () => void;
}) {
  const existingSlugs = queue
    .filter((q) => q.entityType === item.entityType && q.id !== item.id)
    .map((q) => q.id);

  const input: DetailInput = {
    entityType: item.entityType,
    entityId: item.id,
    title: item.title,
    slug: SLUG_KINDS.has(item.kind) ? item.id : undefined,
    published: item.published,
    category: item.category,
    date: item.date,
  };
  const d = buildPublishDetail(input, entity, events, existingSlugs);

  const vTone =
    d.validation.status === 'failed' ? 'text-error-text' :
    d.validation.status === 'warnings' ? 'text-link' :
    d.validation.status === 'passed' ? 'text-success-text' : 'text-muted-foreground';
  const warnCount = d.validation.checks.filter((c) => !c.passed && c.level !== 'error').length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/60" role="dialog" aria-modal="true" aria-label={`Details for ${item.title}`}>
      {/* Click-away backdrop */}
      <button type="button" aria-label="Close details" className="absolute inset-0 cursor-default" onClick={onClose} />

      <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-background/95 p-5 backdrop-blur">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-foreground">{item.title}</h2>
              <Pill className={item.published ? 'bg-success/10 text-success-text border-success/30' : 'bg-muted text-muted-foreground border-border'}>
                {item.published ? 'Live' : 'Draft'}
              </Pill>
            </div>
            <p className="mt-0.5 font-mono text-2xs text-muted-foreground">{d.key}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Risk */}
          <Section icon={<ShieldAlert className="h-3.5 w-3.5" />} title="Risk & blast radius">
            <div className="flex flex-wrap items-center gap-2">
              <Pill className={RISK_TONE[d.risk.level]}>{d.risk.level} risk</Pill>
              <Pill className="bg-muted text-foreground border-border">{MODE_LABEL[item.publishMode]}</Pill>
              <Pill className="bg-muted text-foreground border-border">confirm: {d.risk.confirmation}</Pill>
              {!d.risk.allowsInstant && <Pill className="bg-error/10 text-error-text border-error/30">engineering review</Pill>}
            </div>
            <p className="text-sm leading-relaxed text-foreground">{d.risk.explanation}</p>
          </Section>

          {/* Validation */}
          <Section icon={<CheckCircle2 className="h-3.5 w-3.5" />} title="Pre-flight checks">
            <p className={`text-xs ${vTone}`}>
              {d.validation.status === 'passed' && 'All pre-flight checks pass.'}
              {d.validation.status === 'warnings' && 'Passes with warnings.'}
              {d.validation.status === 'failed' && 'Has blocking errors — fix before publishing.'}
              {d.validation.status === 'unknown' && 'Not yet checked.'}
            </p>
            <ul className="space-y-1.5">
              {d.validation.checks.map((c: ValidationCheck) => (
                <li key={c.id} className="flex items-start gap-2 text-sm">
                  {c.passed
                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-text" />
                    : c.level === 'error'
                      ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error-text" />
                      : <Info className="mt-0.5 h-4 w-4 shrink-0 text-link" />}
                  <span className={c.passed ? 'text-muted-foreground' : c.level === 'error' ? 'text-error-text' : 'text-link'}>
                    {c.label}{c.detail ? <span className="block text-2xs text-muted-foreground">{c.detail}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-2xs text-muted-foreground/70">Shallow pre-flight (title + slug). The server runs the full content/SEO gate at publish time.</p>
          </Section>

          {/* Lifecycle */}
          <Section icon={<Clock className="h-3.5 w-3.5" />} title="Lifecycle">
            {d.lifecycle.hasSnapshot ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <Row label="Status" value={d.lifecycle.status} />
                <Row label="Version" value={`v${d.lifecycle.version}`} />
                <Row label="Published" value={fmt(d.lifecycle.publishedAt)} />
                <Row label="By" value={d.lifecycle.publishedBy ?? '—'} />
                <Row label="Updated" value={fmt(d.lifecycle.updatedAt)} />
                {d.lifecycle.scheduledFor && <Row label="Scheduled" value={fmt(d.lifecycle.scheduledFor)} />}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">No durable snapshot yet — a versioned record is created the first time this is published from here.</p>
            )}
          </Section>

          {/* Affected routes */}
          <Section icon={<Route className="h-3.5 w-3.5" />} title="Affected routes">
            {d.affectedRoutes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No public routes recorded.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {d.affectedRoutes.map((r) => (
                  <li key={r}><Pill className="bg-muted text-foreground border-border font-mono">{r}</Pill></li>
                ))}
              </ul>
            )}
          </Section>

          {/* Source / area */}
          {d.area && (
            <Section icon={<GitBranch className="h-3.5 w-3.5" />} title="Source of truth">
              <div className="flex flex-wrap items-center gap-2">
                <Pill className={d.area.liveConnected ? 'bg-success/10 text-success-text border-success/30' : 'bg-primary/10 text-link border-primary/30'}>
                  {d.area.source}
                </Pill>
                <span className="text-xs text-muted-foreground">owner: {d.area.owner}</span>
                <a href={d.area.adminHref} className="ml-auto text-xs text-link hover:underline">
                  Manage <ExternalLink className="inline h-3 w-3" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground">{d.area.recommendedAction}</p>
            </Section>
          )}

          {/* Audit timeline */}
          <Section icon={<History className="h-3.5 w-3.5" />} title="Audit timeline">
            {d.timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded for this entity yet.</p>
            ) : (
              <ol className="space-y-2">
                {d.timeline.map((t) => (
                  <li key={t.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted" />
                    <div className="min-w-0">
                      <p className="text-foreground">{t.message}</p>
                      <p className="font-mono text-2xs text-muted-foreground/70">
                        {t.action}{t.fromStatus ? ` · ${t.fromStatus} → ${t.toStatus}` : ''} · {t.actor} · {fmt(t.at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Section>

          {/* Four-question publish gate — what / who / risk / undo */}
          <Section icon={<ShieldAlert className="h-3.5 w-3.5" />} title="Before you publish">
            <ul className="space-y-2.5">
              <GateRow
                icon={<FileText className="h-4 w-4" />}
                label="What"
                value={`${item.title} · ${d.lifecycle.hasSnapshot ? `v${d.lifecycle.version}` : 'new entity'}${warnCount > 0 ? ` · ${warnCount} warning${warnCount === 1 ? '' : 's'} to accept` : ''}`}
              />
              <GateRow
                icon={<Users className="h-4 w-4" />}
                label="Who"
                value={`${d.affectedRoutes.length} public route${d.affectedRoutes.length === 1 ? '' : 's'}${d.area ? ` · ${d.area.liveConnected ? 'live-connected' : MODE_LABEL[item.publishMode].toLowerCase()}` : ''}`}
              />
              <GateRow
                icon={<ShieldAlert className="h-4 w-4" />}
                label="Risk"
                value={`${d.risk.level} risk${d.risk.allowsInstant ? '' : ' · engineering review required'}`}
                tone={d.risk.level === 'critical' ? 'text-error-text' : d.risk.level === 'low' ? 'text-success-text' : 'text-link'}
              />
              <GateRow
                icon={<RotateCcw className="h-4 w-4" />}
                label="Undo"
                value={d.canRevert ? 'One-click unpublish reverts to draft and revalidates the route.' : 'First publish creates a versioned snapshot you can roll back.'}
              />
            </ul>
          </Section>
        </div>

        {/* Action footer — reuses the guarded queue toggle, except read-only
            surfaces (milestones, library) whose change lives in the native tool. */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-background/95 p-4 backdrop-blur">
          {item.readOnly ? (
            <>
              <p className="text-2xs text-muted-foreground">
                Managed in {item.manageLabel ?? 'its native tool'} — PublishingOS shows its live state but doesn’t change it here.
              </p>
              <a
                href={item.manageHref}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/35 bg-primary/[0.06] px-4 py-2 text-sm font-medium text-link hover:border-primary/50"
              >
                Manage in {item.manageLabel ?? 'tool'} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </>
          ) : (
            <>
              <p className="text-2xs text-muted-foreground">
                {d.canRevert ? 'Unpublishing reverts to draft and revalidates the route.' : 'Publishing flips the durable override and revalidates the route.'}
              </p>
              <button
                disabled={busy === item.id}
                onClick={() => onToggle(item)}
                className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-40 ${
                  item.published
                    ? 'border border-border text-foreground hover:bg-muted'
                    : 'bg-success text-foreground hover:bg-success'
                }`}
              >
                {busy === item.id ? 'Working…' : item.published ? 'Unpublish' : 'Publish'}
              </button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function GateRow({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <span className="mt-0.5 shrink-0 text-link">{icon}</span>
      <span className="min-w-0">
        <span className="font-semibold text-foreground">{label}:</span>{' '}
        <span className={tone ?? 'text-muted-foreground'}>{value}</span>
      </span>
    </li>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-mono text-[12px] text-foreground">{value}</dd>
    </>
  );
}

function fmt(iso?: string): string {
  if (!iso) return '—';
  return iso.replace('T', ' ').slice(0, 16);
}
