'use client';

// ============================================================
// securityOS — Executive Command Center (CLIENT)
// ------------------------------------------------------------
// Applies the owner overlay to the server-generated scan and renders the
// founder-facing cockpit: health score, risk posture, severity counts, the
// Do Today / This Week / Monitor / Recently Improved / Security Trend /
// System Confidence hierarchy, and a map of the Phase 2/3 sections still to
// come. Records a daily score snapshot so posture-over-time accrues.
// ============================================================

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldAlert, ListChecks, Activity, AlertTriangle, Clock, CheckCircle2, TrendingUp,
  Gauge, ScrollText, Settings as SettingsIcon, BookOpen, Bot, Plug, Database,
  Lock, ChevronRight,
} from 'lucide-react';
import { MetricStat } from '@/components/admin/MetricStat';
import { ScoreDial, ScoreBar, Panel, Sparkline } from '@/components/security-os/SecurityUI';
import { useSecurityOS } from '@/lib/security-os/useSecurityOS';
import { applyFindingOverrides, summarizeFindings } from '@/lib/security-os/findings';
import { generateRecommendations, bucketRecommendations } from '@/lib/security-os/recommendations';
import { OPEN_FINDING_STATUSES, BUCKET_LABEL, type SecurityFinding, type SecurityRecommendation, type SecurityScore } from '@/lib/security-os/types';

interface Props {
  actor: string;
  score: SecurityScore;
  findings: SecurityFinding[];
  recommendations: SecurityRecommendation[];
  generatedAt: string;
  hasUnknowns: boolean;
}

const EFFORT_LABEL: Record<string, string> = { S: 'Quick', M: 'Moderate', L: 'Larger', XL: 'Project' };

export function SecurityOSDashboardClient({ actor, score, findings, generatedAt, hasUnknowns }: Props) {
  const sec = useSecurityOS();

  useEffect(() => {
    if (actor) sec.setActor(actor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor]);

  // Apply owner overlay → views.
  const views = useMemo(
    () => applyFindingOverrides(findings, sec.overrides, generatedAt),
    [findings, sec.overrides, generatedAt],
  );
  const counts = useMemo(() => summarizeFindings(views), [views]);

  // Recommendations are recomputed from OPEN findings so triage takes effect.
  const openFindings = useMemo(
    () => views.filter((v) => OPEN_FINDING_STATUSES.includes(v.status)),
    [views],
  );
  const buckets = useMemo(
    () => bucketRecommendations(generateRecommendations(openFindings)),
    [openFindings],
  );

  // Record one score snapshot per day (after hydration).
  useEffect(() => {
    if (!sec.ready) return;
    sec.recordSnapshot({
      overall: score.overall,
      confidence: score.confidence,
      critical: score.counts.critical,
      high: score.counts.high,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sec.ready]);

  // Risk-domain posture (worst check result per domain).
  const domains = useMemo(() => buildDomainPosture(score), [score]);

  // Recently improved (resolved) findings.
  const improved = useMemo(
    () =>
      views
        .filter((v) => v.status === 'resolved')
        .sort((a, b) => (b.resolvedAt ?? '').localeCompare(a.resolvedAt ?? ''))
        .slice(0, 5),
    [views],
  );

  // New this week (created within 7 days, still open).
  const newThisWeek = useMemo(() => {
    const weekAgo = new Date(generatedAt);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const iso = weekAgo.toISOString();
    return openFindings.filter((v) => v.createdAt >= iso).length;
  }, [openFindings, generatedAt]);

  const unknownChecks = useMemo(
    () => score.categories.flatMap((c) => c.checks).filter((c) => c.result === 'unknown'),
    [score],
  );

  const trend = useMemo(() => sec.history.map((h) => h.overall), [sec.history]);

  return (
    <div className="space-y-6">
      {/* ── Hero: score + headline counts ─────────────────────────────── */}
      <section className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-[auto,1fr]">
        <div className="flex flex-col items-center justify-center gap-2">
          <ScoreDial score={score.overall} band={score.band} confidence={score.confidence} />
          <p className="text-xs text-muted-foreground">Maturity: <span className="text-foreground">{score.maturity}</span></p>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <CountTile label="Critical" value={score.counts.critical} tone="danger" />
            <CountTile label="High" value={score.counts.high} tone="warning" />
            <CountTile label="Medium" value={score.counts.medium} tone="muted" />
            <CountTile label="Low" value={score.counts.low} tone="muted" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricStat label="Open actions" value={counts.open} icon={ListChecks} tone={counts.open > 0 ? 'warning' : 'success'} />
            <MetricStat label="Overdue" value={counts.overdue} icon={Clock} tone={counts.overdue > 0 ? 'warning' : 'muted'} />
            <MetricStat label="New this week" value={newThisWeek} icon={Activity} />
            <MetricStat label="Resolved" value={counts.resolved} icon={CheckCircle2} tone="success" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/security-os/findings" className="inline-flex items-center gap-1 rounded-lg bg-primary/90 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-warning">
              <ListChecks className="h-4 w-4" /> View findings
            </Link>
            <Link href="/admin/security-os/recommendations" className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
              <Gauge className="h-4 w-4" /> Recommendations
            </Link>
            <Link href="/admin/security-os/audit-logs" className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
              <ScrollText className="h-4 w-4" /> Audit log
            </Link>
          </div>
        </div>
      </section>

      {/* ── Category breakdown ─────────────────────────────────────────── */}
      <Panel title="Security Health Score breakdown" hint="Weighted roll-up across seven domains. Categories with no readable signal are excluded from the score.">
        <ul className="space-y-2.5">
          {score.categories.map((cat) => (
            <li key={cat.id} className="grid grid-cols-[1fr,2fr] items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{cat.label}</p>
                <p className="text-[11px] text-muted-foreground">weight {cat.weight}% · {Math.round(cat.confidence * 100)}% signal</p>
              </div>
              <ScoreBar value={cat.score} />
            </li>
          ))}
        </ul>
      </Panel>

      {/* ── Risk posture tiles ─────────────────────────────────────────── */}
      <Panel title="Risk posture by domain" hint="The worst current check result in each security domain.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {domains.map((d) => (
            <div key={d.domain} className={`rounded-lg border p-3 ${d.cls}`}>
              <p className="text-xs font-medium text-foreground">{d.domain}</p>
              <p className="mt-1 text-sm font-semibold capitalize">{d.label}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* ── Do Today / This Week / Monitor ─────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <RecBucket title="Do Today" icon={AlertTriangle} items={buckets.do_today} accent="text-error-text" />
        <RecBucket title="This Week" icon={Clock} items={buckets.this_week} accent="text-link" />
        <RecBucket title="Monitor" icon={Activity} items={buckets.monitor} accent="text-link" />
      </div>

      {(buckets.needs_manual_setup.length > 0 || buckets.waiting_on_credentials.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <RecBucket title={BUCKET_LABEL.needs_manual_setup} icon={SettingsIcon} items={buckets.needs_manual_setup} accent="text-link" />
          <RecBucket title={BUCKET_LABEL.waiting_on_credentials} icon={Lock} items={buckets.waiting_on_credentials} accent="text-link" />
        </div>
      )}

      {/* ── Recently Improved + Trend + Confidence ─────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Recently improved" hint="Findings you've resolved.">
          {improved.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nothing resolved yet. Resolve a finding and it shows up here.</p>
          ) : (
            <ul className="space-y-2">
              {improved.map((v) => (
                <li key={v.id} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-text" />
                  <span className="text-foreground">{v.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Security trend" hint="Overall score over time (one snapshot per day).">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-4 w-4 text-link" />
            <Sparkline points={trend} />
          </div>
        </Panel>

        <Panel title="System confidence" hint="How much of the posture we could actually read.">
          <p className="text-2xl font-bold tabular-nums text-foreground">{score.confidence}%</p>
          {hasUnknowns ? (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">{unknownChecks.length} check(s) couldn&apos;t be read (excluded from the score):</p>
              <ul className="mt-1 space-y-1">
                {unknownChecks.slice(0, 4).map((c) => (
                  <li key={c.id} className="text-[11px] text-muted-foreground">• {c.title}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">Every check produced a real signal.</p>
          )}
        </Panel>
      </div>

      {/* ── Phase 2/3 map ──────────────────────────────────────────────── */}
      <Panel title="More security domains" hint="Deeper centers land in the next waves of securityOS.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {SOON.map((s) => (
            <div key={s.label} className="flex items-start gap-2 rounded-lg border border-border bg-background p-3">
              <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-foreground">{s.label}</p>
                <span className="mt-0.5 inline-block rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">Soon</span>
              </div>
            </div>
          ))}
          <Link href="/admin/security-os/runbooks" className="flex items-start gap-2 rounded-lg border border-border bg-background p-3 hover:border-border">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-link" />
            <div>
              <p className="text-xs font-medium text-foreground">Runbooks</p>
              <span className="mt-0.5 inline-block text-[9px] uppercase tracking-wide text-success-text">Available</span>
            </div>
          </Link>
        </div>
      </Panel>
    </div>
  );
}

const SOON = [
  { label: 'AI Security Center', icon: Bot },
  { label: 'API Security Center', icon: Plug },
  { label: 'Privacy & Data Governance', icon: Database },
  { label: 'Threat Model', icon: ShieldAlert },
  { label: 'Scan Runner', icon: Activity },
];

function CountTile({ label, value, tone }: { label: string; value: number; tone: 'danger' | 'warning' | 'muted' }) {
  const cls =
    value === 0
      ? 'border-border text-muted-foreground'
      : tone === 'danger'
        ? 'border-error/40 text-error-text'
        : tone === 'warning'
          ? 'border-primary/40 text-link'
          : 'border-border text-foreground';
  return (
    <div className={`rounded-lg border bg-background p-3 text-center ${cls}`}>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function RecBucket({
  title,
  icon: Icon,
  items,
  accent,
}: {
  title: string;
  icon: typeof AlertTriangle;
  items: SecurityRecommendation[];
  accent: string;
}) {
  return (
    <Panel title={<span className={`inline-flex items-center gap-1.5 ${accent}`}><Icon className="h-4 w-4" /> {title}</span>} hint={`${items.length} item${items.length === 1 ? '' : 's'}`}>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing here right now.</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((r) => (
            <li key={r.id}>
              <Link
                href={r.relatedLinks[0]?.href ?? '/admin/security-os/findings'}
                className="group flex items-start justify-between gap-2 rounded-lg border border-border bg-background p-2.5 hover:border-border"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{r.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{r.riskDomain} · {EFFORT_LABEL[r.effort] ?? r.effort} fix{r.canClaudeFix ? ' · Claude can help' : ''}</p>
                </div>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70 group-hover:text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ── domain posture helper ─────────────────────────────────────────────────
const RESULT_RANK: Record<string, number> = { fail: 0, partial: 1, unknown: 2, pass: 3 };
const DOMAIN_CLS: Record<string, string> = {
  fail: 'border-error/40 bg-error/5 text-error-text',
  partial: 'border-primary/40 bg-primary/5 text-link',
  unknown: 'border-border bg-background text-muted-foreground',
  pass: 'border-success/30 bg-success/5 text-success-text',
};
const RESULT_WORD: Record<string, string> = { fail: 'At risk', partial: 'Needs work', unknown: 'Unknown', pass: 'Protected' };

function buildDomainPosture(score: SecurityScore) {
  const worst = new Map<string, string>();
  for (const cat of score.categories) {
    for (const chk of cat.checks) {
      const cur = worst.get(chk.riskDomain);
      if (cur === undefined || RESULT_RANK[chk.result] < RESULT_RANK[cur]) {
        worst.set(chk.riskDomain, chk.result);
      }
    }
  }
  return [...worst.entries()]
    .map(([domain, result]) => ({ domain, label: RESULT_WORD[result], cls: DOMAIN_CLS[result], rank: RESULT_RANK[result] }))
    .sort((a, b) => a.rank - b.rank);
}
