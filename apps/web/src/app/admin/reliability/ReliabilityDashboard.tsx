'use client';

// ============================================================
// ReliabilityOS — dashboard (CLIENT)
// ------------------------------------------------------------
// Merges durable (ingested) events with this device's captured buffer, groups
// them (pure engine), overlays owner state (localStorage), and renders the
// command center: System Status, Failure Inbox, incident detail with Copy
// Debug Context, and per-area reliability panels. Honest about cross-user scope.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { readBufferedEvents, logOperationalEvent } from '@/lib/reliability-os/capture';
import { useReliabilityOS } from '@/lib/reliability-os/useReliabilityOS';
import {
  applyOverrides,
  buildDebugContext,
  buildIssues,
  deriveReliabilityAlerts,
  summarize,
} from '@/lib/reliability-os/engine';
import type {
  OperationalCategory,
  OperationalEvent,
  OperationalIssueStatus,
  OperationalIssueView,
  OperationalSeverity,
  ReliabilitySignals,
  SystemHealthStatus,
} from '@/lib/reliability-os/types';

interface Props {
  actor: string;
  signals: ReliabilitySignals;
  ingestedEvents: OperationalEvent[];
}

const STATUS_TONE: Record<SystemHealthStatus, BadgeTone> = {
  healthy: 'success',
  watch: 'info',
  degraded: 'warning',
  critical: 'danger',
};
const STATUS_LABEL: Record<SystemHealthStatus, string> = {
  healthy: 'Healthy',
  watch: 'Watch',
  degraded: 'Degraded',
  critical: 'Critical',
};
const SEVERITY_VARIANT: Record<OperationalSeverity, 'critical' | 'high' | 'medium' | 'default'> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'default',
};

const TIME_RANGES: Array<{ id: string; label: string; ms: number | null }> = [
  { id: '1h', label: '1h', ms: 3_600_000 },
  { id: '24h', label: '24h', ms: 86_400_000 },
  { id: '7d', label: '7d', ms: 7 * 86_400_000 },
  { id: '30d', label: '30d', ms: 30 * 86_400_000 },
  { id: 'all', label: 'All', ms: null },
];
const CATEGORIES: OperationalCategory[] = ['video_upload', 'auth', 'page', 'tool', 'api', 'admin', 'storage', 'database', 'third_party', 'scheduled_task', 'diagnostic'];

export function ReliabilityDashboard({ actor, signals, ingestedEvents }: Props) {
  const os = useReliabilityOS();
  const { setActor } = os;
  const [localEvents, setLocalEvents] = useState<OperationalEvent[]>([]);
  const [range, setRange] = useState('24h');
  const [category, setCategory] = useState<OperationalCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [diag, setDiag] = useState<string | null>(null);

  // Read this device's buffered events once on mount.
  useEffect(() => {
    setLocalEvents(readBufferedEvents());
  }, []);
  // Record the working actor (setActor is a stable useCallback ref).
  useEffect(() => {
    setActor(actor);
  }, [actor, setActor]);

  const nowMs = Date.now();

  // Merge durable + local, de-dupe by id.
  const events = useMemo(() => {
    const byId = new Map<string, OperationalEvent>();
    for (const e of [...ingestedEvents, ...localEvents]) byId.set(e.id, e);
    return [...byId.values()];
  }, [ingestedEvents, localEvents]);

  const rangeMs = TIME_RANGES.find((r) => r.id === range)?.ms ?? null;
  const inRange = useMemo(
    () => (rangeMs == null ? events : events.filter((e) => nowMs - Date.parse(e.at) <= rangeMs)),
    [events, rangeMs, nowMs],
  );

  const views = useMemo(() => applyOverrides(buildIssues(inRange), os.overrides, nowMs), [inRange, os.overrides, nowMs]);
  const summary = useMemo(() => summarize(inRange, views, signals, nowMs), [inRange, views, signals, nowMs]);
  const alerts = useMemo(() => deriveReliabilityAlerts(inRange, summary, os.settings, nowMs), [inRange, summary, os.settings, nowMs]);

  const filtered = useMemo(
    () =>
      views.filter((v) => {
        if (!showClosed && v.closed) return false;
        if (category !== 'all' && v.category !== category) return false;
        if (search) {
          const hay = `${v.title} ${v.primaryRoute ?? ''} ${v.primaryTool ?? ''} ${v.representativeMessage ?? ''} ${v.category}`.toLowerCase();
          if (!hay.includes(search.toLowerCase())) return false;
        }
        return true;
      }),
    [views, showClosed, category, search],
  );

  const panel = (cat: OperationalCategory[], label: string) => {
    const evs = inRange.filter((e) => cat.includes(e.category) && e.type !== 'video_upload_succeeded' && e.type !== 'video_upload_started');
    const last = evs.sort((a, b) => b.at.localeCompare(a.at))[0];
    return { label, count: evs.length, last };
  };
  const panels = [
    panel(['video_upload', 'storage'], 'Upload reliability'),
    panel(['auth'], 'Login reliability'),
    panel(['page'], 'Page reliability'),
    panel(['tool'], 'Tool reliability'),
    panel(['admin'], 'Admin actions'),
  ];

  async function copyDebug(v: OperationalIssueView) {
    try {
      await navigator.clipboard.writeText(buildDebugContext(v));
      setCopied(v.id);
      setTimeout(() => setCopied((c) => (c === v.id ? null : c)), 2000);
    } catch {
      /* clipboard blocked — noop */
    }
  }

  async function runDiagnostic() {
    setDiag('Running…');
    const routes = ['/', '/dashboard', '/pricing'];
    const results: string[] = [];
    for (const r of routes) {
      try {
        const res = await fetch(r, { method: 'HEAD', cache: 'no-store' });
        results.push(`${r} → ${res.status}`);
        if (!res.ok) logOperationalEvent({ type: 'diagnostic_failed', category: 'diagnostic', route: r, httpStatus: res.status, errorMessage: `Diagnostic HEAD ${r} returned ${res.status}` });
      } catch (err) {
        results.push(`${r} → error`);
        logOperationalEvent({ type: 'diagnostic_failed', category: 'diagnostic', route: r, error: err });
      }
    }
    setLocalEvents(readBufferedEvents());
    setDiag(results.join('  ·  '));
  }

  const setStatus = (v: OperationalIssueView, status: OperationalIssueStatus) =>
    status === 'reopened' ? os.clearOverride(v.id, v.title) : os.setIssueStatus(v.id, status, { title: v.title });

  return (
    <div className="space-y-6">
      {!signals.crossUserCaptureEnabled && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Cross-user runtime capture is <strong>off</strong> (no durable backend configured). Showing this admin
          session&apos;s captured failures + signal-derived health only — no numbers are invented for other users.
        </div>
      )}

      {/* System Status */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>System Status</CardTitle>
          <StatusBadge tone={STATUS_TONE[summary.status]}>{STATUS_LABEL[summary.status]}</StatusBadge>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <MetricCard label="Open critical" value={summary.openCritical} status={summary.openCritical > 0 ? 'danger' : 'good'} />
            <MetricCard label="Open high" value={summary.openHigh} status={summary.openHigh > 0 ? 'warning' : 'good'} />
            <MetricCard label="Failed uploads 24h" value={summary.failedUploads24h} status={summary.failedUploads24h > 0 ? 'warning' : 'neutral'} />
            <MetricCard label="Failed logins 24h" value={summary.failedLogins24h} status={summary.failedLogins24h > 0 ? 'warning' : 'neutral'} />
            <MetricCard label="Page failures 24h" value={summary.pageFailures24h} status={summary.pageFailures24h > 0 ? 'warning' : 'neutral'} />
            <MetricCard label="Tool failures 24h" value={summary.toolFailures24h} status={summary.toolFailures24h > 0 ? 'warning' : 'neutral'} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {summary.totalEvents} event{summary.totalEvents === 1 ? '' : 's'} in view
            {summary.mostAffectedRoute ? ` · most affected route ${summary.mostAffectedRoute}` : ''}
            {summary.mostAffectedFeature ? ` · most affected area ${summary.mostAffectedFeature}` : ''}
          </p>
        </CardBody>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`rounded-lg border px-4 py-2 text-sm ${a.severity === 'critical' ? 'border-error/40 bg-error/10 text-error' : 'border-warning/40 bg-warning/10 text-warning'}`}
            >
              <strong>{a.title}.</strong> {a.detail}
            </div>
          ))}
        </div>
      )}

      {/* Reliability panels */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {panels.map((p) => (
          <Card key={p.label}>
            <CardBody>
              <p className="text-xs text-muted-foreground">{p.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{p.count}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {p.last ? `last: ${new Date(p.last.at).toLocaleString()}` : 'no failures in range'}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {TIME_RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`rounded-md px-2 py-1 text-xs ${range === r.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as OperationalCategory | 'all')}
            className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search issues…"
            className="flex-1 min-w-[8rem] rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
          />
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} className="accent-primary" />
            Show resolved
          </label>
        </CardBody>
      </Card>

      {/* Failure Inbox */}
      <Card>
        <CardHeader>
          <CardTitle>Failure Inbox</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2">
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No matching issues. {events.length === 0 ? 'No failures captured yet — that’s good news.' : 'Try a wider time range or clearing filters.'}
            </p>
          )}
          {filtered.map((v) => (
            <div key={v.id} className="rounded-lg border border-border bg-card/60">
              <button onClick={() => setOpenId((id) => (id === v.id ? null : v.id))} className="flex w-full items-start gap-3 p-3 text-left">
                <Badge variant={SEVERITY_VARIANT[v.severity]}>{v.severity}</Badge>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{v.title}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {v.occurrenceCount}× · {v.affectedSessionCount} session{v.affectedSessionCount === 1 ? '' : 's'} · last {new Date(v.lastSeenAt).toLocaleString()}
                    {v.status !== 'new' ? ` · ${v.status}` : ''}
                  </span>
                </span>
              </button>

              {openId === v.id && (
                <div className="space-y-3 border-t border-border p-3 text-sm">
                  {v.representativeMessage && <p className="text-muted-foreground">{v.representativeMessage}</p>}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested next steps</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[13px] text-foreground/90">
                      {v.suggestedActions.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setStatus(v, 'investigating')}>Investigating</Button>
                    <Button size="sm" variant="secondary" onClick={() => setStatus(v, 'resolved')}>Resolve</Button>
                    <Button size="sm" variant="ghost" onClick={() => setStatus(v, 'ignored')}>Ignore</Button>
                    {v.status !== 'new' && <Button size="sm" variant="ghost" onClick={() => setStatus(v, 'reopened')}>Reopen</Button>}
                    <Button size="sm" variant="secondary" onClick={() => copyDebug(v)}>{copied === v.id ? 'Copied ✓' : 'Copy Debug Context'}</Button>
                  </div>

                  <textarea
                    defaultValue={v.note ?? ''}
                    onBlur={(e) => e.target.value !== (v.note ?? '') && os.addNote(v.id, e.target.value)}
                    placeholder="Admin notes…"
                    className="w-full rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
                    rows={2}
                  />

                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Technical details ({v.recentEvents.length} recent)</summary>
                    <pre className="mt-2 max-h-48 overflow-auto rounded bg-black/30 p-2 text-[11px] text-foreground/80">
                      {JSON.stringify(v.recentEvents, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Diagnostics */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Diagnostics</CardTitle>
          <Button size="sm" variant="secondary" onClick={runDiagnostic}>Run page check</Button>
        </CardHeader>
        <CardBody>
          <p className="text-xs text-muted-foreground">
            Safe, read-only checks against key public routes. Failures are recorded as diagnostic events above.
          </p>
          {diag && <p className="mt-2 font-mono text-[11px] text-foreground/80">{diag}</p>}
        </CardBody>
      </Card>
    </div>
  );
}
