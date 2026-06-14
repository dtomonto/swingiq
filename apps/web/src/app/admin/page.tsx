// ============================================================
// /admin — Command Center
// ------------------------------------------------------------
// The admin's daily operating room. Real cross-user counts (via the
// service-role client) where available; honest "connect" states where
// not. Smart alerts are derived from observed signals, never invented.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Users, Activity, Brain, Trophy, Sparkles, Database, ArrowUpRight,
  CalendarCheck, ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { AlertCard } from '@/components/admin/AlertCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { ChangesScroller } from '@/components/admin/ChangesScroller';
import { TierSection } from '@/components/admin/TierSection';
import { ConfidencePill } from '@/components/admin/ConfidencePill';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { getSystemStatus } from '@/lib/admin/data/system';
import { getPlatformMetrics } from '@/lib/admin/data/metrics';
import { deriveAlerts, type AdminAlert } from '@/lib/admin/alerts';
import { getSetupNudge } from '@/lib/admin/setup/nudge';
import { loadAlertCounts } from '@/lib/feature-education/server/data';
import { collectServerActions, summarizeActions } from '@/lib/admin/action-center';
import { NAV_ITEMS, isHrefBuilt } from '@/lib/admin/nav';
import { formatNumber, formatRelativeTime } from '@/lib/admin/format';
import { fromAlert } from '@/lib/admin/claude-handoff';

export const metadata: Metadata = { title: 'Command Center | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const SPORT_LABELS: Record<string, string> = {
  golf: 'Golf', tennis: 'Tennis', pickleball: 'Pickleball', padel: 'Padel',
  baseball: 'Baseball', softball_slow: 'Slow-pitch', softball_fast: 'Fast-pitch',
};

/** A 2-col grid of interpreted alert cards for one attention tier. */
function AlertGrid({ items }: { items: AdminAlert[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((a) => (
        <AlertCard
          key={a.id}
          severity={a.severity}
          title={a.title}
          detail={a.detail}
          href={a.href && isHrefBuilt(a.href) ? a.href : undefined}
          cta={a.cta}
          fix={fromAlert({ title: a.title, detail: a.detail, severity: a.severity, href: a.href })}
        />
      ))}
    </div>
  );
}

export default async function AdminCommandCenter() {
  const system = getSystemStatus();
  const metrics = await getPlatformMetrics();
  const fee = await loadAlertCounts();
  const feeAlerts: AdminAlert[] =
    fee.gaps > 0 || fee.needsReview > 0 || fee.drift > 0
      ? [
          {
            id: 'fee-coverage',
            severity: 'info',
            title: `${fee.gaps} feature${fee.gaps === 1 ? '' : 's'} need learning content`,
            detail: `${fee.needsReview} draft${fee.needsReview === 1 ? '' : 's'} await review · ${fee.drift} drift finding${fee.drift === 1 ? '' : 's'}. New features are auto-detected as you ship.`,
            href: '/admin/feature-education',
            cta: 'Open Feature Education',
          },
        ]
      : [];
  // Setup nudge — only counts auto-detectable (live) steps, so it never nags
  // about manual tasks the owner already did on another surface.
  const nudge = getSetupNudge();
  const setupAlerts: AdminAlert[] =
    nudge.essentialsOutstanding > 0
      ? [
          {
            id: 'setup-outstanding',
            severity: nudge.requiredOutstanding > 0 ? 'warning' : 'info',
            title:
              nudge.requiredOutstanding > 0
                ? `${nudge.requiredOutstanding} required setup step${nudge.requiredOutstanding === 1 ? '' : 's'} before launch`
                : `${nudge.essentialsOutstanding} recommended setup step${nudge.essentialsOutstanding === 1 ? '' : 's'} available`,
            detail: `${nudge.examples.join(', ')}${nudge.essentialsOutstanding > nudge.examples.length ? ', …' : ''}. Each has plain-English steps and the exact values to copy.`,
            href: '/admin/setup',
            cta: 'Open Setup & Next Steps',
          },
        ]
      : [];
  // Action Center roll-up — the single "what needs me" alert that gathers
  // every review/approve/implement queue (incl. open audit findings).
  const actions = await collectServerActions();
  const actionSummary = summarizeActions(actions);
  const actionAlerts: AdminAlert[] =
    actions.length > 0
      ? [
          {
            id: 'action-center',
            severity: actionSummary.hasCritical ? 'critical' : 'warning',
            title: `${actionSummary.total} item${actionSummary.total === 1 ? '' : 's'} need your review`,
            detail: `Across ${actionSummary.items} source${actionSummary.items === 1 ? '' : 's'}: ${actions
              .slice(0, 3)
              .map((i) => i.sourceLabel)
              .join(', ')}${actions.length > 3 ? ', …' : ''}. One inbox for approvals, opportunities and audit findings.`,
            href: '/admin/approvals',
            cta: 'Open Action Center',
          },
        ]
      : [];

  const alerts = [...actionAlerts, ...setupAlerts, ...deriveAlerts(system, metrics), ...feeAlerts];

  const tools = NAV_ITEMS.filter((i) => i.external && i.built);
  const muted = !metrics.connected;

  // ── Briefing model: health score + four attention tiers ──────────────────
  const tiers = {
    critical: alerts.filter((a) => a.severity === 'critical'),
    warning: alerts.filter((a) => a.severity === 'warning'),
    info: alerts.filter((a) => a.severity === 'info'),
    success: alerts.filter((a) => a.severity === 'success'),
  };
  const criticalCount = tiers.critical.length;
  const decisionCount = tiers.warning.length;
  const watchCount = tiers.info.length;
  // Honest + transparent: starts at 100 and is dragged down by the same open
  // alerts shown below, weighted by severity. Never an invented figure.
  const healthScore = Math.max(40, 100 - criticalCount * 22 - decisionCount * 7 - watchCount * 2);
  const confidence: 'low' | 'medium' | 'high' = metrics.connected ? 'high' : 'medium';
  const executiveSentence =
    criticalCount > 0
      ? `${criticalCount} ${criticalCount === 1 ? 'issue needs' : 'issues need'} you now${decisionCount ? `, plus ${decisionCount} ${decisionCount === 1 ? 'decision' : 'decisions'} waiting` : ''}. Work the top tier first.`
      : decisionCount > 0
        ? `Nothing on fire — ${decisionCount} ${decisionCount === 1 ? 'decision' : 'decisions'} waiting${watchCount ? ` and ${watchCount} to watch` : ''}. ${metrics.connected ? 'Live metrics are flowing.' : 'Running in local mode — connect the service role for cross-user data.'}`
        : `All clear — no incidents or decisions waiting${watchCount ? `, ${watchCount} item${watchCount === 1 ? '' : 's'} to watch` : ''}. ${metrics.connected ? 'Live metrics are flowing.' : 'Running in local mode.'}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Command Center"
        icon={Activity}
        description="Your daily operating room — platform health, real-time signals and what to do next. Numbers are read live from the database; where a data source isn't connected yet you'll see an honest prompt instead of a fake figure."
        actions={
          <StatusBadge tone={metrics.connected ? 'success' : 'warning'}>
            {metrics.connected ? 'Live data' : 'Local mode'}
          </StatusBadge>
        }
      />

      {/* Executive summary — the interpreted briefing (health · so-what · confidence) */}
      <SectionCard level="elevated">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Link
            href="/admin/metrics/platform-product-health"
            aria-label="What is the Product health score? Open the metric explainer"
            className="group rounded-xl transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ScoreRing score={healthScore} size={88} label="Product health" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-link">
              Today&apos;s read · {metrics.connected ? 'live data' : 'local mode'}
            </p>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-foreground">{executiveSentence}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ConfidencePill level={confidence} />
              {criticalCount > 0 && <StatusBadge tone="critical">{criticalCount} critical</StatusBadge>}
              {decisionCount > 0 && (
                <StatusBadge tone="warning">
                  {decisionCount} decision{decisionCount === 1 ? '' : 's'} waiting
                </StatusBadge>
              )}
              {criticalCount === 0 && decisionCount === 0 && <StatusBadge tone="routine">All clear</StatusBadge>}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Today's Command Center — the daily starting point */}
      <Link
        href="/admin/command-center"
        className="group flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/[0.06] p-4 hover:border-primary/50"
      >
        <span className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 rounded-lg bg-primary/15 p-2 text-link">
            <CalendarCheck className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">Today&apos;s Command Center</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              Your prioritized to-do for today — what to set up, which features need more data (and exactly
              how to feed them), and what to review. Each item is scored, fully laid out, step by step.
            </span>
          </span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-link group-hover:translate-x-0.5 transition-transform" />
      </Link>

      {/* Four attention tiers — interpreted, severity-ranked */}
      {alerts.length > 0 && (
        <div className="space-y-5">
          {tiers.critical.length > 0 && (
            <TierSection tier="critical" label="Needs you now" count={tiers.critical.length}>
              <AlertGrid items={tiers.critical} />
            </TierSection>
          )}
          {tiers.warning.length > 0 && (
            <TierSection tier="warning" label="Decisions waiting" count={tiers.warning.length}>
              <AlertGrid items={tiers.warning} />
            </TierSection>
          )}
          {tiers.info.length > 0 && (
            <TierSection tier="watch" label="Watch this week" count={tiers.info.length}>
              <AlertGrid items={tiers.info} />
            </TierSection>
          )}
          {tiers.success.length > 0 && (
            <TierSection tier="routine" label="Routine" count={tiers.success.length}>
              <AlertGrid items={tiers.success} />
            </TierSection>
          )}
        </div>
      )}

      {/* KPI grid — real server-side record counts */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Platform at a glance</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricStat
            label="Accounts" icon={Users} tone={muted ? 'muted' : 'default'} metricId="platform-accounts"
            value={metrics.counts.authUsers === null ? '—' : `${formatNumber(metrics.counts.authUsers)}${metrics.authUsersCapped ? '+' : ''}`}
            hint="Authenticated users"
          />
          <MetricStat
            label="Golf profiles" icon={Trophy} tone={muted ? 'muted' : 'default'} metricId="platform-golf-profiles"
            value={formatNumber(metrics.counts.golfProfiles)} hint="golfer_profiles"
          />
          <MetricStat
            label="Sport profiles" icon={Activity} tone={muted ? 'muted' : 'default'} metricId="platform-sport-profiles"
            value={formatNumber(metrics.counts.sportProfiles)} hint="non-golf sports set up"
          />
          <MetricStat
            label="Sessions" icon={Database} tone={muted ? 'muted' : 'default'} metricId="platform-sessions"
            value={formatNumber(metrics.counts.sessions)} hint="practice sessions"
          />
          <MetricStat
            label="Swing analyses" icon={Brain} tone={muted ? 'muted' : 'default'} metricId="platform-analyses"
            value={formatNumber(metrics.counts.analyses)} hint="video_analyses"
          />
          <MetricStat
            label="Gamified" icon={Sparkles} tone={muted ? 'muted' : 'default'} metricId="platform-community"
            value={formatNumber(metrics.counts.community)} hint="community/XP records"
          />
        </div>
        {!metrics.connected && (
          <p className="mt-2 text-xs text-muted-foreground">
            {metrics.reason}{' '}
            <Link href="/admin/integrations" className="text-link hover:underline">
              Open Integrations →
            </Link>
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: usage + recent */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard
            title="Sport usage"
            description="Practice sessions logged per sport, across all accounts (live)."
          >
            {metrics.sportUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {metrics.connected
                  ? 'No sessions recorded yet — usage will appear as athletes log practice.'
                  : 'Connect the service role to see which sports are most active.'}
              </p>
            ) : (
              <ul className="space-y-2">
                {metrics.sportUsage.map((s) => {
                  const max = metrics.sportUsage[0].sessions || 1;
                  return (
                    <li key={s.sport} className="flex items-center gap-3 text-sm">
                      <span className="w-24 shrink-0 text-foreground">{SPORT_LABELS[s.sport] ?? s.sport}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary/70" style={{ width: `${(s.sessions / max) * 100}%` }} />
                      </div>
                      <span className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">{s.sessions}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Recent swing analyses"
            description="Latest analyses across the platform (metadata only — videos are processed privately and never stored)."
          >
            {metrics.recentAnalyses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {metrics.connected ? 'No analyses yet.' : 'No live data until the service role is connected.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-2xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="pb-2 pr-3">Sport</th>
                      <th className="pb-2 pr-3">File</th>
                      <th className="pb-2 pr-3">Score</th>
                      <th className="pb-2">When</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    {metrics.recentAnalyses.map((a) => (
                      <tr key={a.id} className="border-t border-border">
                        <td className="py-2 pr-3">{SPORT_LABELS[a.sport] ?? a.sport}</td>
                        <td className="max-w-[14rem] truncate py-2 pr-3 text-muted-foreground">{a.file_name || '—'}</td>
                        <td className="py-2 pr-3 tabular-nums">{a.overall_score ?? '—'}</td>
                        <td className="py-2 text-muted-foreground">{a.created_at ? formatRelativeTime(a.created_at) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right: health + activity */}
        <div className="space-y-6">
          <SectionCard
            title="Integration health"
            description={`${system.connectedCount}/${system.totalCount} services connected`}
            actions={
              <Link href="/admin/system-health" className="text-xs text-link hover:underline">
                Details
              </Link>
            }
          >
            <ul className="space-y-1.5">
              {system.integrations.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-foreground">{i.name}</span>
                  <StatusBadge tone={i.connected ? 'success' : 'neutral'}>
                    {i.connected ? 'on' : 'off'}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Recent admin activity">
            <RecentActivity />
          </SectionCard>
        </div>
      </div>

      {/* What changed — auto-updating 30-day ticker (shipped commits + admin actions) */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">What changed</h2>
        <ChangesScroller />
      </section>

      {/* Existing tools */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Operations tools</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.id}
                href={t.href}
                className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-border"
              >
                <span className="rounded-lg bg-muted p-2 text-link">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                    {t.label}
                    <ArrowUpRight className="h-3 w-3 text-muted-foreground/70 group-hover:text-muted-foreground" />
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{t.blurb}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> The Command Center is the home base for
          running SwingVantage. It surfaces the few things worth your attention today and links to every
          area of the dashboard from the sidebar.
        </p>
        <p>
          <strong className="text-foreground">Why the numbers may be blank.</strong> SwingVantage is privacy-first:
          athlete data lives in each user&apos;s account and swing videos are processed on-device and never
          uploaded. The cross-user counts here read the database with a service-role key. If you see
          &ldquo;Local mode,&rdquo; set <code>SUPABASE_SERVICE_ROLE_KEY</code> on the{' '}
          <Link href="/admin/integrations">Integrations</Link> page.
        </p>
        <p>
          <strong className="text-foreground">What to do next.</strong> Work the alert cards top-down, then use
          the sidebar to dive into Users, AI Analyses, Content or SEO. New here? Start with the{' '}
          <Link href="/admin/learning">Admin Academy</Link>.
        </p>
      </HelpPanel>
    </div>
  );
}
