'use client';

// ============================================================
// Analytics OS — admin command center (client shell)
// ------------------------------------------------------------
// A unified PostHog control center: one place to see analytics and manage
// flags/surveys/experiments, with deep links into PostHog for the rich
// interactive surfaces. Mirrors the CentralIntelligenceOS dashboard
// pattern — server builds a typed `dashboard`, the client renders tabbed
// panels and fetches live data on demand (personal API key stays server-side).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard, Globe, BarChart3, Flag, Terminal, Plug,
  Filter, CalendarClock, Route, PlayCircle, Activity, BellRing,
  FlaskConical, MessageSquare, Users, UserSearch, Database, Share2,
  MousePointerClick, Settings, RefreshCw, ExternalLink, CheckCircle2,
  AlertTriangle, KeyRound, Loader2, Play, type LucideIcon,
} from 'lucide-react';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { formatNumber } from '@/lib/admin/format';
import type {
  AnalyticsOsDashboard as Dashboard,
  CapabilityState,
  FeatureFlagSummary,
  LiveSnapshot,
  ResolvedCapability,
} from '@/lib/posthog/types';

// Map capability/icon name strings → Lucide components (kept in the UI layer).
const ICONS: Record<string, LucideIcon> = {
  BarChart3, Globe, Filter, CalendarClock, Route, Terminal, PlayCircle,
  LayoutDashboard, Activity, BellRing, Flag, FlaskConical, MessageSquare,
  Users, UserSearch, Database, Share2, MousePointerClick, Settings,
};

const STATE_META: Record<CapabilityState, { tone: BadgeTone; label: string }> = {
  live: { tone: 'success', label: 'Live in OS' },
  manage: { tone: 'accent', label: 'Manage here' },
  linked: { tone: 'info', label: 'Open in PostHog' },
  'needs-key': { tone: 'warning', label: 'Needs API key' },
};

type TabId = 'overview' | 'web' | 'product' | 'flags' | 'explore' | 'connect';

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'web', label: 'Web Analytics', icon: Globe },
  { id: 'product', label: 'Product', icon: BarChart3 },
  { id: 'flags', label: 'Feature Flags', icon: Flag },
  { id: 'explore', label: 'Explore', icon: Terminal },
  { id: 'connect', label: 'Connect', icon: Plug },
];

function Bar({ pct, color = 'bg-sky-500' }: { pct: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800" role="presentation">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function AnalyticsOsDashboard({ dashboard }: { dashboard: Dashboard }) {
  const { connection } = dashboard;
  const [tab, setTab] = useState<TabId>('overview');
  const [days, setDays] = useState(30);
  const [live, setLive] = useState<LiveSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isFull = connection.level === 'full';

  const loadLive = useCallback(async (range: number) => {
    if (!isFull) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/analytics-os?days=${range}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.ok && json.live) setLive(json.live as LiveSnapshot);
      else setLoadError(json.message || json.reason || 'Could not load live data.');
    } catch {
      setLoadError('Network error loading live data.');
    } finally {
      setLoading(false);
    }
  }, [isFull]);

  useEffect(() => { void loadLive(days); }, [loadLive, days]);

  return (
    <div className="space-y-4">
      <ConnectionRibbon level={connection.level} region={connection.region} />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Analytics OS sections">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'border-violet-500/40 bg-violet-500/15 text-violet-200'
                  : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Live data controls (only meaningful when fully connected) */}
      {isFull && tab !== 'overview' && tab !== 'connect' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Range</span>
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md border px-2 py-1 text-xs transition ${
                days === d ? 'border-violet-500/40 bg-violet-500/15 text-violet-200' : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
              }`}
            >
              {d}d
            </button>
          ))}
          <button
            onClick={() => loadLive(days)}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-gray-700 bg-gray-900 px-2.5 py-1 text-xs text-gray-300 hover:text-gray-100 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </button>
        </div>
      )}

      {tab === 'overview' && <OverviewPanel dashboard={dashboard} />}
      {tab === 'web' && <WebPanel live={live} loading={loading} error={loadError} isFull={isFull} />}
      {tab === 'product' && <ProductPanel dashboard={dashboard} live={live} loading={loading} isFull={isFull} />}
      {tab === 'flags' && <FlagsPanel live={live} loading={loading} isFull={isFull} onChanged={() => loadLive(days)} />}
      {tab === 'explore' && <ExplorePanel live={live} isFull={isFull} />}
      {tab === 'connect' && <ConnectPanel dashboard={dashboard} />}
    </div>
  );
}

// ── Connection ribbon ─────────────────────────────────────────

function ConnectionRibbon({ level, region }: { level: Dashboard['connection']['level']; region: string }) {
  if (level === 'full') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span><strong>Fully connected</strong> to PostHog ({region.toUpperCase()}). Live analytics and flag management are on.</span>
      </div>
    );
  }
  if (level === 'ingest') {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <strong>Events are flowing to PostHog ✓</strong> ({region.toUpperCase()}). To read analytics and manage flags
          right here, add a <strong>personal API key</strong> in the <strong>Connect</strong> tab. Everything still works —
          the read-only panels just light up once it&apos;s set.
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span><strong>No PostHog project key set.</strong> Add <code>NEXT_PUBLIC_POSTHOG_KEY</code> (see the Connect tab).</span>
    </div>
  );
}

// ── Overview (the coverage map — "covers everything PostHog does") ──

function OverviewPanel({ dashboard }: { dashboard: Dashboard }) {
  const { coverageStats, coverageByGroup } = dashboard;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Capabilities covered" value={coverageStats.total} hint="across PostHog" />
        <MetricStat label="Live / manageable here" value={coverageStats.live + coverageStats.manage} tone="success" hint="in this OS" />
        <MetricStat label="Deep-linked" value={coverageStats.linked} tone="default" hint="open in PostHog" />
        <MetricStat label="Waiting on API key" value={coverageStats.needsKey} tone={coverageStats.needsKey > 0 ? 'warning' : 'success'} />
      </div>

      {coverageByGroup.map((g) => (
        <SectionCard key={g.group} title={g.label} description={`${g.items.length} capabilities`}>
          <div className="grid gap-2 sm:grid-cols-2">
            {g.items.map((c) => (
              <CapabilityCard key={c.id} cap={c} />
            ))}
          </div>
        </SectionCard>
      ))}

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> Your single control center for everything PostHog
          does — product &amp; web analytics, session replay, funnels, retention, feature flags, A/B experiments,
          surveys, cohorts and SQL. Items marked <em>Live in OS</em> or <em>Manage here</em> render and act inside
          SwingVantage; <em>Open in PostHog</em> deep-links to PostHog&apos;s rich interactive view.
        </p>
        <p>
          <strong className="text-gray-300">What to do next.</strong> Events are already being collected. Add a
          PostHog personal API key in the <strong>Connect</strong> tab to turn on live numbers and flag management
          inside this dashboard.
        </p>
      </HelpPanel>
    </div>
  );
}

function CapabilityCard({ cap }: { cap: ResolvedCapability }) {
  const Icon = ICONS[cap.icon] ?? LayoutDashboard;
  const meta = STATE_META[cap.state];
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-900 p-3">
      <span className="mt-0.5 shrink-0 rounded-lg bg-gray-800 p-2 text-violet-300">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-gray-100">{cap.label}</p>
          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">{cap.description}</p>
        {cap.href && (
          <a
            href={cap.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:underline"
          >
            Open in PostHog <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

// ── Reusable "needs read key" prompt ──────────────────────────

function NeedsKeyPanel({ what }: { what: string }) {
  return (
    <SectionCard>
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="text-sm text-gray-400">
          <p className="font-semibold text-gray-200">Add a PostHog personal API key to see {what} here.</p>
          <p className="mt-1 text-xs">
            Events are already being collected. The <strong>Connect</strong> tab has the exact steps and the two
            environment variables to add (<code>POSTHOG_PERSONAL_API_KEY</code> and <code>POSTHOG_PROJECT_ID</code>).
            Until then, use the <em>Open in PostHog</em> links on the Overview tab.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

function LiveError({ error }: { error: string }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
      {error}
    </div>
  );
}

// ── Web analytics ─────────────────────────────────────────────

function WebPanel({ live, loading, error, isFull }: { live: LiveSnapshot | null; loading: boolean; error: string | null; isFull: boolean }) {
  if (!isFull) return <NeedsKeyPanel what="web analytics" />;
  if (loading && !live) return <LoadingPanel />;
  if (error) return <LiveError error={error} />;
  if (!live) return <LoadingPanel />;

  const o = live.webOverview;
  const peak = Math.max(1, ...(o?.byDay ?? []).map((d) => d.pageviews));
  return (
    <div className="space-y-4">
      {live.errors.webOverview && <LiveError error={`Web overview: ${live.errors.webOverview}`} />}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Pageviews" value={formatNumber(o?.pageviews ?? null)} hint={`last ${live.rangeDays}d`} />
        <MetricStat label="Unique visitors" value={formatNumber(o?.visitors ?? null)} hint={`last ${live.rangeDays}d`} />
        <MetricStat label="Sessions" value={formatNumber(o?.sessions ?? null)} hint={`last ${live.rangeDays}d`} />
        <MetricStat label="Views / visitor" value={o && o.visitors ? (o.pageviews / o.visitors).toFixed(1) : '—'} tone="muted" />
      </div>

      {o && o.byDay.length > 0 && (
        <SectionCard title="Pageviews by day" description={`Last ${live.rangeDays} days`}>
          <div className="flex h-28 items-end gap-1">
            {o.byDay.map((d) => (
              <div key={d.date} className="group relative flex-1" title={`${d.date}: ${d.pageviews}`}>
                <div className="w-full rounded-t bg-violet-500/70 group-hover:bg-violet-400" style={{ height: `${(d.pageviews / peak) * 100}%` }} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <NamedCountCard title="Top pages" rows={live.topPages} error={live.errors.topPages} color="bg-emerald-500" />
        <NamedCountCard title="Top referrers" rows={live.topReferrers} error={live.errors.topReferrers} color="bg-sky-500" />
      </div>
    </div>
  );
}

function NamedCountCard({ title, rows, error, color }: { title: string; rows: { name: string; count: number }[]; error?: string; color: string }) {
  const peak = Math.max(1, ...rows.map((r) => r.count));
  return (
    <SectionCard title={title}>
      {error ? (
        <LiveError error={error} />
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">No data in this range yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 truncate text-gray-300" title={r.name}>{r.name}</span>
              <Bar pct={(r.count / peak) * 100} color={color} />
              <span className="w-12 text-right tabular-nums text-gray-400">{formatNumber(r.count)}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

// ── Product (events live + catalog + funnels) ─────────────────

function ProductPanel({ dashboard, live, loading, isFull }: { dashboard: Dashboard; live: LiveSnapshot | null; loading: boolean; isFull: boolean }) {
  return (
    <div className="space-y-4">
      {isFull ? (
        loading && !live ? <LoadingPanel /> : (
          <NamedCountCard title="Top events" rows={live?.topEvents ?? []} error={live?.errors.topEvents} color="bg-violet-500" />
        )
      ) : (
        <NeedsKeyPanel what="live event volumes" />
      )}

      <SectionCard title="Key funnels" description="The conversions worth watching (build these in PostHog Funnels).">
        <div className="space-y-3">
          {dashboard.funnels.map((f) => (
            <div key={f.name}>
              <p className="mb-1 text-sm font-medium text-amber-300">{f.name}</p>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
                {f.steps.map((s, i) => (
                  <span key={s} className="flex items-center gap-1.5">
                    <span className="rounded bg-gray-800 px-2 py-1">{s}</span>
                    {i < f.steps.length - 1 && <span className="text-gray-600">→</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Event catalog" description={`${dashboard.trackedEvents.length} events SwingVantage is instrumented to send`}>
        <div className="flex flex-wrap gap-1.5">
          {dashboard.trackedEvents.map((e) => (
            <code key={e} className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-[11px] text-gray-300">{e}</code>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ── Feature flags (management) ────────────────────────────────

function FlagsPanel({ live, loading, isFull, onChanged }: { live: LiveSnapshot | null; loading: boolean; isFull: boolean; onChanged: () => void }) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function toggle(flag: FeatureFlagSummary) {
    setBusyId(flag.id);
    setErr(null);
    try {
      const res = await fetch('/api/admin/analytics-os', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-flag', id: flag.id, active: !flag.active }),
      });
      const json = await res.json();
      if (!json.ok) setErr(json.message || 'Could not update the flag.');
      else onChanged();
    } catch {
      setErr('Network error updating the flag.');
    } finally {
      setBusyId(null);
    }
  }

  if (!isFull) return <NeedsKeyPanel what="and manage your PostHog feature flags" />;
  if (loading && !live) return <LoadingPanel />;

  const flags = live?.featureFlags ?? [];
  return (
    <div className="space-y-3">
      {err && <LiveError error={err} />}
      {live?.errors.featureFlags && <LiveError error={live.errors.featureFlags} />}
      <SectionCard
        title="PostHog feature flags"
        description="Toggle a flag here and it changes in PostHog for everyone. These are your real product flags (separate from the device-local operator flags under Feature Flags)."
      >
        {flags.length === 0 ? (
          <p className="text-sm text-gray-500">No feature flags in this PostHog project yet.</p>
        ) : (
          <div className="space-y-2">
            {flags.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-100">{f.name}</p>
                  <p className="font-mono text-[11px] text-gray-600">{f.key}{f.rolloutPercentage != null ? ` · ${f.rolloutPercentage}% rollout` : ''}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={f.active}
                  disabled={busyId === f.id}
                  onClick={() => toggle(f)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${f.active ? 'bg-emerald-500' : 'bg-gray-700'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${f.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── Explore (SQL + resource counts) ───────────────────────────

const STARTER_QUERY = "SELECT event, count() AS c\nFROM events\nWHERE timestamp >= now() - INTERVAL 7 DAY\nGROUP BY event\nORDER BY c DESC\nLIMIT 20";

function ExplorePanel({ live, isFull }: { live: LiveSnapshot | null; isFull: boolean }) {
  const [sql, setSql] = useState(STARTER_QUERY);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ columns: string[]; rows: unknown[][]; truncated?: boolean } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setErr(null);
    try {
      const res = await fetch('/api/admin/analytics-os', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'query', hogql: sql }),
      });
      const json = await res.json();
      if (!json.ok) setErr(json.message || 'Query failed.');
      else setResult({ columns: json.columns, rows: json.rows, truncated: json.truncated });
    } catch {
      setErr('Network error running the query.');
    } finally {
      setRunning(false);
    }
  }

  if (!isFull) return <NeedsKeyPanel what="resource counts and the SQL explorer" />;

  const c = live?.counts;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Dashboards" value={formatNumber(c?.dashboards ?? null)} />
        <MetricStat label="Experiments" value={formatNumber(c?.experiments ?? null)} />
        <MetricStat label="Surveys" value={formatNumber(c?.surveys ?? null)} />
        <MetricStat label="Cohorts" value={formatNumber(c?.cohorts ?? null)} />
      </div>

      <SectionCard
        title="SQL (HogQL) explorer"
        description="Run read-only SQL over your events. Try the starter query, or write your own."
        actions={
          <button
            onClick={run}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-md border border-violet-500/40 bg-violet-500/15 px-3 py-1.5 text-xs font-medium text-violet-200 hover:bg-violet-500/25 disabled:opacity-50"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Run
          </button>
        }
      >
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          spellCheck={false}
          rows={6}
          className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 font-mono text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        {err && <div className="mt-2"><LiveError error={err} /></div>}
        {result && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-gray-500">
                <tr>{result.columns.map((col) => <th key={col} className="border-b border-gray-800 py-1.5 pr-3 font-medium">{col}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {result.rows.map((row, i) => (
                  <tr key={i} className="text-gray-300">
                    {(row as unknown[]).map((cell, j) => (
                      <td key={j} className="py-1.5 pr-3 tabular-nums">{cell === null ? '—' : String(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {result.rows.length === 0 && <p className="py-3 text-center text-gray-600">No rows.</p>}
            {result.truncated && <p className="mt-2 text-[11px] text-amber-400">Showing the first 200 rows.</p>}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── Connect (setup + live test) ───────────────────────────────

interface TestState {
  ingest: { configured: boolean; ok: boolean; status: number; error: string | null; host: string; region: string };
  read: { configured: boolean; ok: boolean; status: number; error: string | null; projectName: string | null; hasKey: boolean; hasProjectId: boolean };
}

function ConnectPanel({ dashboard }: { dashboard: Dashboard }) {
  const { connection } = dashboard;
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<TestState | null>(null);

  async function runTest() {
    setTesting(true);
    try {
      const res = await fetch('/api/admin/analytics-os', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const json = await res.json();
      if (json.ok) setTest({ ingest: json.ingest, read: json.read });
    } catch {
      /* leave prior state */
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Project key" value={connection.ingestConfigured ? 'Set' : 'Missing'} tone={connection.ingestConfigured ? 'success' : 'warning'} hint={connection.ingestKeyMasked ?? undefined} />
        <MetricStat label="Region" value={connection.region.toUpperCase()} tone="muted" />
        <MetricStat label="Personal API key" value={connection.readConfigured ? 'Set' : 'Not set'} tone={connection.readConfigured ? 'success' : 'warning'} />
        <MetricStat label="Project ID" value={connection.projectId ?? '—'} tone="muted" />
      </div>

      <SectionCard
        title="Test connection"
        description="Checks the live PostHog connection right now."
        actions={
          <button
            onClick={runTest}
            disabled={testing}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-300 hover:text-gray-100 disabled:opacity-50"
          >
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Test now
          </button>
        }
      >
        {!test ? (
          <p className="text-sm text-gray-500">Press <strong>Test now</strong> to verify both keys against PostHog.</p>
        ) : (
          <div className="space-y-2 text-sm">
            <TestRow
              label="Event ingestion (public key)"
              ok={test.ingest.ok}
              detail={test.ingest.ok ? `PostHog accepted the project token (HTTP ${test.ingest.status})` : test.ingest.error ?? 'Not configured'}
            />
            <TestRow
              label="Read & manage (personal API key)"
              ok={test.read.ok}
              neutral={!test.read.configured}
              detail={
                !test.read.configured
                  ? 'Not set yet — optional, but needed for live numbers & flag management here.'
                  : test.read.ok
                    ? `Connected to project "${test.read.projectName ?? 'OK'}" (HTTP ${test.read.status})`
                    : test.read.error ?? 'Failed'
              }
            />
          </div>
        )}
      </SectionCard>

      <SectionCard title="Turn on live numbers & flag management" description="Optional — events already collect without this.">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-400">
          <li>In PostHog, open <strong>Settings → Personal API keys → Create personal API key</strong>. Give it read access (and <em>Feature flag write</em> if you want to toggle flags here).</li>
          <li>Find your <strong>Project ID</strong> in <strong>Settings → Project</strong> (a number).</li>
          <li>Add both as environment variables, then redeploy:</li>
        </ol>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-3 font-mono text-[11px] text-gray-300">{`POSTHOG_PERSONAL_API_KEY=phx_your_personal_key
POSTHOG_PROJECT_ID=12345`}</pre>
        <p className="mt-2 text-xs text-gray-500">
          Locally: add them to <code>apps/web/.env.local</code>. In production: <strong>Vercel → Settings → Environment Variables</strong>.
          The personal key is read server-side only and never sent to the browser.
        </p>
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-gray-300">Two different keys.</strong> The <em>project key</em> (<code>phc_…</code>) is public
          and lets the site <em>send</em> events. The <em>personal API key</em> (<code>phx_…</code>) is secret and lets this OS
          <em> read</em> your data back and manage flags. You already have the first one.
        </p>
      </HelpPanel>
    </div>
  );
}

function TestRow({ label, ok, detail, neutral }: { label: string; ok: boolean; detail: string; neutral?: boolean }) {
  const tone = neutral ? 'text-gray-400' : ok ? 'text-emerald-300' : 'text-red-300';
  const Icon = neutral ? KeyRound : ok ? CheckCircle2 : AlertTriangle;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} />
      <div>
        <p className="font-medium text-gray-200">{label}</p>
        <p className={`text-xs ${tone}`}>{detail}</p>
      </div>
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────────

function LoadingPanel() {
  return (
    <SectionCard>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading live data from PostHog…
      </div>
    </SectionCard>
  );
}
