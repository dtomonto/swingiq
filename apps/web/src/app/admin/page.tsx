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
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { AlertCard } from '@/components/admin/AlertCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { getSystemStatus } from '@/lib/admin/data/system';
import { getPlatformMetrics } from '@/lib/admin/data/metrics';
import { deriveAlerts, type AdminAlert } from '@/lib/admin/alerts';
import { loadAlertCounts } from '@/lib/feature-education/server/data';
import { NAV_ITEMS, isHrefBuilt } from '@/lib/admin/nav';
import { formatNumber, formatRelativeTime } from '@/lib/admin/format';

export const metadata: Metadata = { title: 'Command Center | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const SPORT_LABELS: Record<string, string> = {
  golf: 'Golf', tennis: 'Tennis', pickleball: 'Pickleball', padel: 'Padel',
  baseball: 'Baseball', softball_slow: 'Slow-pitch', softball_fast: 'Fast-pitch',
};

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
  const alerts = [...deriveAlerts(system, metrics), ...feeAlerts];

  const tools = NAV_ITEMS.filter((i) => i.external && i.built);
  const muted = !metrics.connected;

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

      {/* Smart alerts */}
      {alerts.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {alerts.map((a) => (
            <AlertCard
              key={a.id}
              severity={a.severity === 'success' ? 'success' : a.severity}
              title={a.title}
              detail={a.detail}
              href={a.href && isHrefBuilt(a.href) ? a.href : undefined}
              cta={a.cta}
            />
          ))}
        </div>
      )}

      {/* KPI grid — real server-side record counts */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-300">Platform at a glance</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricStat
            label="Accounts" icon={Users} tone={muted ? 'muted' : 'default'}
            value={metrics.counts.authUsers === null ? '—' : `${formatNumber(metrics.counts.authUsers)}${metrics.authUsersCapped ? '+' : ''}`}
            hint="Authenticated users"
          />
          <MetricStat
            label="Golf profiles" icon={Trophy} tone={muted ? 'muted' : 'default'}
            value={formatNumber(metrics.counts.golfProfiles)} hint="golfer_profiles"
          />
          <MetricStat
            label="Sport profiles" icon={Activity} tone={muted ? 'muted' : 'default'}
            value={formatNumber(metrics.counts.sportProfiles)} hint="non-golf sports set up"
          />
          <MetricStat
            label="Sessions" icon={Database} tone={muted ? 'muted' : 'default'}
            value={formatNumber(metrics.counts.sessions)} hint="practice sessions"
          />
          <MetricStat
            label="Swing analyses" icon={Brain} tone={muted ? 'muted' : 'default'}
            value={formatNumber(metrics.counts.analyses)} hint="video_analyses"
          />
          <MetricStat
            label="Gamified" icon={Sparkles} tone={muted ? 'muted' : 'default'}
            value={formatNumber(metrics.counts.community)} hint="community/XP records"
          />
        </div>
        {!metrics.connected && (
          <p className="mt-2 text-xs text-gray-500">
            {metrics.reason}{' '}
            <Link href="/admin/integrations" className="text-amber-400 hover:underline">
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
              <p className="text-sm text-gray-500">
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
                      <span className="w-24 shrink-0 text-gray-300">{SPORT_LABELS[s.sport] ?? s.sport}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
                        <div className="h-full rounded-full bg-amber-500/70" style={{ width: `${(s.sessions / max) * 100}%` }} />
                      </div>
                      <span className="w-10 shrink-0 text-right tabular-nums text-gray-400">{s.sessions}</span>
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
              <p className="text-sm text-gray-500">
                {metrics.connected ? 'No analyses yet.' : 'No live data until the service role is connected.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="pb-2 pr-3">Sport</th>
                      <th className="pb-2 pr-3">File</th>
                      <th className="pb-2 pr-3">Score</th>
                      <th className="pb-2">When</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {metrics.recentAnalyses.map((a) => (
                      <tr key={a.id} className="border-t border-gray-800">
                        <td className="py-2 pr-3">{SPORT_LABELS[a.sport] ?? a.sport}</td>
                        <td className="max-w-[14rem] truncate py-2 pr-3 text-gray-400">{a.file_name || '—'}</td>
                        <td className="py-2 pr-3 tabular-nums">{a.overall_score ?? '—'}</td>
                        <td className="py-2 text-gray-500">{a.created_at ? formatRelativeTime(a.created_at) : '—'}</td>
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
              <Link href="/admin/system-health" className="text-xs text-amber-400 hover:underline">
                Details
              </Link>
            }
          >
            <ul className="space-y-1.5">
              {system.integrations.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-gray-300">{i.name}</span>
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

      {/* Existing tools */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-300">Operations tools</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.id}
                href={t.href}
                className="group flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-gray-700"
              >
                <span className="rounded-lg bg-gray-800 p-2 text-amber-400">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-sm font-medium text-gray-100">
                    {t.label}
                    <ArrowUpRight className="h-3 w-3 text-gray-600 group-hover:text-gray-400" />
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">{t.blurb}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> The Command Center is the home base for
          running SwingVantage. It surfaces the few things worth your attention today and links to every
          area of the dashboard from the sidebar.
        </p>
        <p>
          <strong className="text-gray-300">Why the numbers may be blank.</strong> SwingVantage is privacy-first:
          athlete data lives in each user&apos;s account and swing videos are processed on-device and never
          uploaded. The cross-user counts here read the database with a service-role key. If you see
          &ldquo;Local mode,&rdquo; set <code>SUPABASE_SERVICE_ROLE_KEY</code> on the{' '}
          <Link href="/admin/integrations">Integrations</Link> page.
        </p>
        <p>
          <strong className="text-gray-300">What to do next.</strong> Work the alert cards top-down, then use
          the sidebar to dive into Users, AI Analyses, Content or SEO. New here? Start with the{' '}
          <Link href="/admin/learning">Admin Academy</Link>.
        </p>
      </HelpPanel>
    </div>
  );
}
