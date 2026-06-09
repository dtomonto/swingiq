'use client';

// ============================================================
// Clarity OS — admin command center (client shell)
// ------------------------------------------------------------
// A unified Microsoft Clarity control center: traffic, engagement and the
// behavioral quality signals rendered here from the Data Export API, plus
// deep links into Clarity for the rich interactive surfaces (recordings,
// heatmaps). Mirrors the Analytics OS (PostHog) dashboard pattern — the
// server builds a typed `dashboard`, the client fetches live data on demand
// (the export token stays server-side).
//
// Live data is fetched ON DEMAND (never on a timer) because Clarity caps the
// export API at ~10 calls/day per project and only covers the last 1–3 days.
// ============================================================

import { useCallback, useState } from 'react';
import {
  LayoutDashboard, Globe, BarChart3, Filter, PlayCircle, Activity,
  FlaskConical, Share2, Settings, MousePointerClick, Flame, Plug,
  RefreshCw, ExternalLink, CheckCircle2, AlertTriangle, KeyRound,
  Loader2, Play, type LucideIcon,
} from 'lucide-react';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { formatNumber } from '@/lib/admin/format';
import { useFeatureFlags } from '@/lib/admin/stores/feature-flags';
import { evalFlag, findFlagDef } from '@/lib/admin/flags';
import type {
  ClarityOsDashboard as Dashboard,
  CapabilityState,
  ClarityLiveSnapshot,
  ResolvedCapability,
} from '@/lib/clarity/types';

const ICONS: Record<string, LucideIcon> = {
  BarChart3, Globe, Filter, PlayCircle, LayoutDashboard, Activity,
  FlaskConical, Share2, Settings, MousePointerClick, Flame,
};

const STATE_META: Record<CapabilityState, { tone: BadgeTone; label: string }> = {
  live: { tone: 'success', label: 'Live in OS' },
  linked: { tone: 'info', label: 'Open in Clarity' },
  'needs-key': { tone: 'warning', label: 'Needs API token' },
};

type TabId = 'overview' | 'metrics' | 'observe' | 'connect';

interface LiveMeta {
  cached: boolean;
  stale: boolean;
  callsUsedToday: number | null;
  dailyLimit: number | null;
}

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'metrics', label: 'Live Metrics', icon: BarChart3 },
  { id: 'observe', label: 'Recordings & Heatmaps', icon: PlayCircle },
  { id: 'connect', label: 'Connect', icon: Plug },
];

function Bar({ pct, color = 'bg-sky-500' }: { pct: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800" role="presentation">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function ClarityOsDashboard({ dashboard }: { dashboard: Dashboard }) {
  const { connection } = dashboard;
  const [tab, setTab] = useState<TabId>('overview');
  const [days, setDays] = useState(3);
  const [dimension, setDimension] = useState<string>('');
  const [live, setLive] = useState<ClarityLiveSnapshot | null>(null);
  const [meta, setMeta] = useState<LiveMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isFull = connection.level === 'full';

  const loadLive = useCallback(async (range: number, dim: string) => {
    if (!isFull) return;
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ days: String(range) });
      if (dim) params.set('dimension', dim);
      const res = await fetch(`/api/admin/clarity?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      setMeta({
        cached: Boolean(json.cached),
        stale: Boolean(json.stale),
        callsUsedToday: typeof json.callsUsedToday === 'number' ? json.callsUsedToday : null,
        dailyLimit: typeof json.dailyLimit === 'number' ? json.dailyLimit : null,
      });
      if (json.ok && json.live) setLive(json.live as ClarityLiveSnapshot);
      else setLoadError(json.message || json.reason || 'Could not load live data.');
    } catch {
      setLoadError('Network error loading live data.');
    } finally {
      setLoading(false);
    }
  }, [isFull]);

  return (
    <div className="space-y-4">
      <MasterSwitchCard connection={connection} />
      <ConnectionRibbon level={connection.level} />

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Clarity OS sections">
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
                  ? 'border-sky-500/40 bg-sky-500/15 text-sky-200'
                  : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && <OverviewPanel dashboard={dashboard} />}
      {tab === 'metrics' && (
        <MetricsPanel
          dashboard={dashboard}
          live={live}
          meta={meta}
          loading={loading}
          error={loadError}
          isFull={isFull}
          days={days}
          dimension={dimension}
          onDays={(d) => { setDays(d); void loadLive(d, dimension); }}
          onDimension={(dim) => { setDimension(dim); void loadLive(days, dim); }}
          onLoad={() => loadLive(days, dimension)}
        />
      )}
      {tab === 'observe' && <ObservePanel dashboard={dashboard} />}
      {tab === 'connect' && <ConnectPanel dashboard={dashboard} />}
    </div>
  );
}

// ── Master switch (operator kill-switch) ──────────────────────

const CLARITY_FLAG = 'clarity.enabled';

function MasterSwitchCard({ connection }: { connection: Dashboard['connection'] }) {
  const overrides = useFeatureFlags((s) => s.overrides);
  const toggle = useFeatureFlags((s) => s.toggle);
  const def = findFlagDef(CLARITY_FLAG);
  const enabled = def ? evalFlag(def, overrides[CLARITY_FLAG]) : false;
  const provisioned = connection.ingestConfigured;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-gray-100">Microsoft Clarity tag</p>
          <StatusBadge tone={!provisioned ? 'warning' : enabled ? 'success' : 'neutral'}>
            {!provisioned ? 'Not provisioned' : enabled ? 'On' : 'Off'}
          </StatusBadge>
        </div>
        <p className="mt-1 max-w-xl text-xs text-gray-500">
          {provisioned
            ? 'Master kill-switch for the heatmap / session-recording tag. Takes effect on the next page load. Device-local like all operator flags — the durable, all-visitor control is the NEXT_PUBLIC_CLARITY_PROJECT_ID env var.'
            : 'Set NEXT_PUBLIC_CLARITY_PROJECT_ID first (Connect tab). With no project id the tag can’t load, so this switch has nothing to control yet.'}
        </p>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        aria-label="Toggle Microsoft Clarity tag"
        disabled={!provisioned}
        onClick={() => toggle(CLARITY_FLAG, 'clarity-os')}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${enabled ? 'bg-emerald-500' : 'bg-gray-700'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

// ── Connection ribbon ─────────────────────────────────────────

function ConnectionRibbon({ level }: { level: Dashboard['connection']['level'] }) {
  if (level === 'full') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span><strong>Fully connected</strong> to Microsoft Clarity. Live metrics and deep links are on.</span>
      </div>
    );
  }
  if (level === 'ingest') {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <strong>Clarity is recording ✓</strong> Heatmaps and session recordings are collecting in Clarity. To read
          metrics right here, add a <strong>Data Export API token</strong> in the <strong>Connect</strong> tab. The
          deep links below work either way.
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span><strong>No Clarity project id set.</strong> Add <code>NEXT_PUBLIC_CLARITY_PROJECT_ID</code> (see the Connect tab).</span>
    </div>
  );
}

// ── Overview (coverage map) ───────────────────────────────────

function OverviewPanel({ dashboard }: { dashboard: Dashboard }) {
  const { coverageStats, coverageByGroup } = dashboard;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Capabilities covered" value={coverageStats.total} hint="across Clarity" />
        <MetricStat label="Live in OS" value={coverageStats.live} tone="success" hint="rendered here" />
        <MetricStat label="Deep-linked" value={coverageStats.linked} tone="default" hint="open in Clarity" />
        <MetricStat label="Waiting on token" value={coverageStats.needsKey} tone={coverageStats.needsKey > 0 ? 'warning' : 'success'} />
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
          <strong className="text-gray-300">What this is.</strong> Your single control center for Microsoft Clarity —
          session recordings, heatmaps, traffic, engagement and the behavioral quality signals (rage clicks, dead
          clicks, script errors). Items marked <em>Live in OS</em> render inside SwingVantage from Clarity&apos;s Data
          Export API; <em>Open in Clarity</em> deep-links to Clarity&apos;s rich interactive view.
        </p>
        <p>
          <strong className="text-gray-300">What to do next.</strong> Recordings &amp; heatmaps collect automatically
          once the project id is set. Add a Data Export API token in the <strong>Connect</strong> tab to turn on live
          numbers in this dashboard.
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
      <span className="mt-0.5 shrink-0 rounded-lg bg-gray-800 p-2 text-sky-300">
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
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:underline"
          >
            Open in Clarity <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

// ── Reusable "needs token" prompt ─────────────────────────────

function NeedsKeyPanel({ what }: { what: string }) {
  return (
    <SectionCard>
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="text-sm text-gray-400">
          <p className="font-semibold text-gray-200">Add a Clarity Data Export API token to see {what} here.</p>
          <p className="mt-1 text-xs">
            Recordings &amp; heatmaps are already collecting. The <strong>Connect</strong> tab has the exact steps and
            the one environment variable to add (<code>CLARITY_DATA_EXPORT_TOKEN</code>). Until then, use the
            <em> Open in Clarity</em> links on the Overview &amp; Recordings tabs.
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

// ── Live metrics ──────────────────────────────────────────────

interface MetricsPanelProps {
  dashboard: Dashboard;
  live: ClarityLiveSnapshot | null;
  meta: LiveMeta | null;
  loading: boolean;
  error: string | null;
  isFull: boolean;
  days: number;
  dimension: string;
  onDays: (d: number) => void;
  onDimension: (dim: string) => void;
  onLoad: () => void;
}

function MetricsPanel({ dashboard, live, meta, loading, error, isFull, days, dimension, onDays, onDimension, onLoad }: MetricsPanelProps) {
  if (!isFull) return <NeedsKeyPanel what="live metrics" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2">
        <span className="text-xs text-gray-500">Window</span>
        {[1, 2, 3].map((d) => (
          <button
            key={d}
            onClick={() => onDays(d)}
            className={`rounded-md border px-2 py-1 text-xs transition ${
              days === d ? 'border-sky-500/40 bg-sky-500/15 text-sky-200' : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
            }`}
          >
            {d}d
          </button>
        ))}
        <span className="ml-2 text-xs text-gray-500">Breakdown</span>
        <select
          value={dimension}
          onChange={(e) => onDimension(e.target.value)}
          className="rounded-md border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-gray-300"
          aria-label="Breakdown dimension"
        >
          <option value="">None</option>
          {dashboard.dimensions.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>
        <button
          onClick={onLoad}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-sky-500/40 bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-200 hover:bg-sky-500/25 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {live ? 'Refresh' : 'Load metrics'}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-gray-500">
          Clarity&apos;s export API covers only the last 1–3 days and is capped at ~10 calls/day per project, so metrics
          load on demand here (not automatically) and results are cached for 10 min to protect the budget.
        </p>
        {meta && meta.callsUsedToday != null && meta.dailyLimit != null && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-[11px] text-gray-400">
            <span className={meta.callsUsedToday >= meta.dailyLimit ? 'text-amber-400' : 'text-gray-300'}>
              {meta.callsUsedToday}/{meta.dailyLimit}
            </span>
            export calls used today
            {meta.cached && <StatusBadge tone={meta.stale ? 'warning' : 'neutral'}>{meta.stale ? 'stale cache' : 'cached'}</StatusBadge>}
          </span>
        )}
      </div>

      {error && <LiveError error={error} />}

      {!live && !loading && !error && (
        <SectionCard>
          <p className="text-sm text-gray-500">Press <strong>Load metrics</strong> to pull the latest {days}-day snapshot from Clarity.</p>
        </SectionCard>
      )}

      {loading && !live && <LoadingPanel />}

      {live && (
        <>
          <SectionCard title="Traffic" description={`Last ${live.numOfDays} day${live.numOfDays > 1 ? 's' : ''}`}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricStat label="Sessions" value={formatNumber(live.traffic.totalSessions)} />
              <MetricStat label="Distinct users" value={formatNumber(live.traffic.distinctUsers)} />
              <MetricStat label="Bot sessions" value={formatNumber(live.traffic.botSessions)} tone="muted" />
              <MetricStat label="Pages / session" value={live.traffic.pagesPerSession != null ? live.traffic.pagesPerSession.toFixed(1) : '—'} tone="muted" />
            </div>
          </SectionCard>

          <SectionCard title="Engagement">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MetricStat label="Avg scroll depth" value={live.engagement.averageScrollDepth != null ? `${live.engagement.averageScrollDepth.toFixed(0)}%` : '—'} />
              <MetricStat label="Total time" value={formatDuration(live.engagement.totalTime)} tone="muted" />
              <MetricStat label="Active time" value={formatDuration(live.engagement.activeTime)} tone="muted" />
            </div>
          </SectionCard>

          <SectionCard title="Quality signals" description="Behavioral friction Clarity detects — lower is better.">
            <div className="grid gap-2 sm:grid-cols-2">
              {live.signals.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-100">{s.label}</p>
                    <p className="text-[11px] text-gray-500">{s.pct != null ? `${s.pct.toFixed(1)}% of sessions` : 'No data'}</p>
                  </div>
                  <span className="shrink-0 tabular-nums text-sm text-gray-300">{formatNumber(s.sessions)}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {live.breakdown && (
            <SectionCard title={`By ${live.breakdown.dimension.toLowerCase()}`} description={`Top ${live.breakdown.rows.length} by sessions`}>
              {live.breakdown.rows.length === 0 ? (
                <p className="text-sm text-gray-500">No breakdown data returned for this dimension.</p>
              ) : (
                <ul className="space-y-2">
                  {live.breakdown.rows.map((r) => {
                    const peak = Math.max(1, ...live.breakdown!.rows.map((x) => x.sessions ?? 0));
                    return (
                      <li key={r.name} className="flex items-center gap-3 text-sm">
                        <span className="w-32 shrink-0 truncate text-gray-300" title={r.name}>{r.name}</span>
                        <Bar pct={((r.sessions ?? 0) / peak) * 100} color="bg-sky-500" />
                        <span className="w-12 text-right tabular-nums text-gray-400">{formatNumber(r.sessions)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>
          )}

          <p className="text-[11px] text-gray-600">
            Fetched {new Date(live.fetchedAt).toLocaleString()} · metrics returned: {live.metricsReturned.join(', ') || 'none'}
          </p>

          <details className="rounded-lg border border-gray-800 bg-gray-900">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-200">
              Raw Clarity response (verify field shapes)
            </summary>
            <div className="border-t border-gray-800 px-3 py-2">
              <p className="mb-2 text-[11px] text-gray-500">
                The numbers above are parsed defensively from this payload (unknown field names fall back to
                &ldquo;—&rdquo; rather than guessing). If a metric shows &ldquo;—&rdquo; but has a value here, the field
                mapping in <code>lib/clarity/client.ts</code> needs that key added.
              </p>
              <pre className="max-h-80 overflow-auto rounded border border-gray-800 bg-gray-950 p-3 font-mono text-[10px] leading-relaxed text-gray-300">
                {JSON.stringify(live.raw, null, 2)}
              </pre>
            </div>
          </details>
        </>
      )}
    </div>
  );
}

// ── Observe (deep links to recordings & heatmaps) ─────────────

function ObservePanel({ dashboard }: { dashboard: Dashboard }) {
  const observe = dashboard.coverage.filter((c) => c.group === 'observe');
  const { connection } = dashboard;

  if (!connection.ingestConfigured) {
    return (
      <SectionCard>
        <div className="flex items-start gap-3 text-sm text-gray-400">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <p>Set <code>NEXT_PUBLIC_CLARITY_PROJECT_ID</code> first (see the <strong>Connect</strong> tab). Recordings and heatmaps appear in Clarity once the tag is live.</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Jump into Clarity" description="Recordings, heatmaps and the full dashboard open directly in Microsoft Clarity for this project.">
        <div className="grid gap-2 sm:grid-cols-2">
          {observe.map((c) => (
            <CapabilityCard key={c.id} cap={c} />
          ))}
        </div>
      </SectionCard>
      <HelpPanel>
        <p>
          Session recordings and heatmaps have no public read API, so the OS deep-links you straight into Clarity&apos;s
          purpose-built players rather than reproducing them. The <strong>Live Metrics</strong> tab brings the numeric
          insights back into SwingVantage.
        </p>
      </HelpPanel>
    </div>
  );
}

// ── Connect (setup + live test) ───────────────────────────────

interface TestState {
  ingest: { configured: boolean; projectId: string | null };
  read: { configured: boolean; ok: boolean; status: number; error: string | null; metrics: number | null; hasToken: boolean };
}

function ConnectPanel({ dashboard }: { dashboard: Dashboard }) {
  const { connection } = dashboard;
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<TestState | null>(null);

  async function runTest() {
    setTesting(true);
    try {
      const res = await fetch('/api/admin/clarity', {
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricStat label="Project id" value={connection.ingestConfigured ? 'Set' : 'Missing'} tone={connection.ingestConfigured ? 'success' : 'warning'} hint={connection.projectIdMasked ?? undefined} />
        <MetricStat label="Export token" value={connection.readConfigured ? 'Set' : 'Not set'} tone={connection.readConfigured ? 'success' : 'warning'} />
        <MetricStat label="Level" value={connection.level} tone="muted" />
      </div>

      <SectionCard
        title="Test connection"
        description="Validates the Data Export token against Clarity. Note: this uses one of the ~10 daily export calls."
        actions={
          <button
            onClick={runTest}
            disabled={testing}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-300 hover:text-gray-100 disabled:opacity-50"
          >
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Test now
          </button>
        }
      >
        {!test ? (
          <p className="text-sm text-gray-500">Press <strong>Test now</strong> to verify the export token against Clarity.</p>
        ) : (
          <div className="space-y-2 text-sm">
            <TestRow
              label="Recording tag (project id)"
              ok={test.ingest.configured}
              neutral={!test.ingest.configured}
              detail={test.ingest.configured ? `Project id is set — Clarity is recording.` : 'Not set — add NEXT_PUBLIC_CLARITY_PROJECT_ID.'}
            />
            <TestRow
              label="Data Export API (token)"
              ok={test.read.ok}
              neutral={!test.read.configured}
              detail={
                !test.read.configured
                  ? 'Not set yet — optional, but needed for live numbers here.'
                  : test.read.ok
                    ? `Connected — Clarity returned ${test.read.metrics ?? 0} metric groups (HTTP ${test.read.status}).`
                    : test.read.error ?? 'Failed'
              }
            />
          </div>
        )}
      </SectionCard>

      <SectionCard title="Set up Microsoft Clarity" description="Two pieces: the tag (records sessions) and the export token (reads numbers here).">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-400">
          <li>Create a project at <strong>clarity.microsoft.com</strong>, then open <strong>Settings → Overview</strong> and copy the <strong>Project ID</strong>.</li>
          <li>For live numbers here, open <strong>Settings → Data export</strong> and <strong>Generate new API token</strong>.</li>
          <li>Add these environment variables, then redeploy:</li>
        </ol>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-3 font-mono text-[11px] text-gray-300">{`NEXT_PUBLIC_CLARITY_PROJECT_ID=your_project_id
CLARITY_DATA_EXPORT_TOKEN=your_data_export_token`}</pre>
        <p className="mt-2 text-xs text-gray-500">
          Locally: add them to <code>apps/web/.env.local</code>. In production: <strong>Vercel → Settings → Environment Variables</strong>.
          The export token is read server-side only and never sent to the browser.
        </p>
        <p className="mt-2 text-xs text-amber-400/90">
          Privacy: Clarity records sessions and sets cookies (unlike the cookieless Plausible default), so pair it with a cookie-consent banner in the EU and keep masking on for youth safety.
        </p>
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-gray-300">Two different credentials.</strong> The <em>project id</em> is public and
          loads the recording tag in the browser. The <em>Data Export API token</em> is secret and lets this OS read
          your metrics back. You can set the first without the second — recordings and heatmaps still work.
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
        <Loader2 className="h-4 w-4 animate-spin" /> Loading live data from Clarity…
      </div>
    </SectionCard>
  );
}

/** Format a duration in seconds as "1h 2m", "3m 4s", or "5s". */
function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
