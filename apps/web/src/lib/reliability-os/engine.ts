// ============================================================
// ReliabilityOS — engine (PURE, isomorphic, deterministic)
// ------------------------------------------------------------
// Given sanitized events + server signals, produce grouped issues, an overall
// system status, an executive summary, and category playbooks. Same inputs →
// same output (stable issue ids = fingerprints), so client-side owner state
// (status/notes) dedupes across rescans — the securityOS pattern.
// ============================================================

import type {
  OperationalCategory,
  OperationalEvent,
  OperationalIssue,
  OperationalIssueStatus,
  OperationalIssueView,
  OperationalSeverity,
  IssueOverrideMap,
  ReliabilitySettings,
  ReliabilitySignals,
  ReliabilitySummary,
  SystemHealthStatus,
} from './types';
import { RECENT_EVENTS_PER_ISSUE } from './types';

const SEVERITY_RANK: Record<OperationalSeverity, number> = { critical: 3, high: 2, medium: 1, low: 0 };

/** Highest severity wins when grouping mixed events. */
export function maxSeverity(a: OperationalSeverity, b: OperationalSeverity): OperationalSeverity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

/** Static, category-derived debugging checklist (founder-friendly). */
export function suggestedAction(category: OperationalCategory): string[] {
  switch (category) {
    case 'video_upload':
    case 'storage':
      return [
        'Test the upload flow on iPhone Safari and Chrome mobile',
        'Check storage bucket permissions and file-size limits',
        'Confirm the upload progress state is not stuck',
        'Check that processing/analysis triggers after a successful upload',
      ];
    case 'auth':
      return [
        'Test the login and signup flow end to end',
        'Check the auth provider configuration and callback URL',
        'Inspect session-refresh behavior and token expiry',
        'Review the most recent auth errors for a common cause',
      ];
    case 'page':
      return [
        'Visit the route as an anonymous user and as a signed-in user',
        'Check the data-fetching dependency for that page',
        'Confirm loading and empty states render',
        'Review recent deployment changes to the route',
      ];
    case 'tool':
      return [
        'Run the tool manually from the admin diagnostics',
        'Check the required inputs and any API/function dependency',
        'Confirm a fallback state is shown on failure',
        'Check timeout and rate-limit behavior',
      ];
    case 'api':
    case 'third_party':
      return [
        'Inspect the endpoint status code and duration',
        'Check upstream/third-party service availability',
        'Review rate-limit and permission (RLS) behavior',
        'Confirm the request payload shape is valid',
      ];
    case 'database':
      return [
        'Check the database connection and credentials',
        'Review the failing query and its RLS policy',
        'Confirm the table/columns exist as expected',
      ];
    case 'admin':
      return [
        'Retry the admin action and watch the confirmation state',
        'Check whether the target object still exists',
        'Confirm you have the required permission for the action',
      ];
    case 'scheduled_task':
      return [
        'Check the cron/schedule configuration and last run',
        'Review the task logs for the failing step',
        'Confirm any required env keys are present',
      ];
    case 'diagnostic':
    default:
      return ['Re-run the diagnostic', 'Review the most recent occurrences for a pattern'];
  }
}

function mode<T>(values: (T | undefined)[]): T | undefined {
  const counts = new Map<T, number>();
  for (const v of values) {
    if (v == null) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: T | undefined;
  let bestN = 0;
  for (const [v, n] of counts) if (n > bestN) ((best = v), (bestN = n));
  return best;
}

/** Group raw events into issues by fingerprint. Pure + deterministic. */
export function buildIssues(events: OperationalEvent[]): OperationalIssue[] {
  const byFp = new Map<string, OperationalEvent[]>();
  for (const e of events) {
    const list = byFp.get(e.fingerprint);
    if (list) list.push(e);
    else byFp.set(e.fingerprint, [e]);
  }

  const issues: OperationalIssue[] = [];
  for (const [fingerprint, group] of byFp) {
    const sorted = [...group].sort((a, b) => a.at.localeCompare(b.at));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const severity = group.reduce<OperationalSeverity>((s, e) => maxSeverity(s, e.severity), 'low');
    const sessions = new Set(group.map((e) => e.sessionId).filter(Boolean));
    const representative = [...group].reverse().find((e) => e.errorMessageSafe)?.errorMessageSafe;

    issues.push({
      id: fingerprint,
      title: issueTitle(last, group.length),
      category: last.category,
      severity,
      firstSeenAt: first.at,
      lastSeenAt: last.at,
      occurrenceCount: group.length,
      affectedSessionCount: sessions.size,
      primaryRoute: mode(group.map((e) => e.route)),
      primaryTool: mode(group.map((e) => e.toolName)),
      primaryUploadStage: mode(group.map((e) => e.uploadStage)),
      representativeMessage: representative,
      recentEvents: sorted.slice(-RECENT_EVENTS_PER_ISSUE).reverse(),
      suggestedActions: suggestedAction(last.category),
      commonDevice: mode(group.map((e) => e.deviceType)),
      commonBrowser: mode(group.map((e) => e.browser)),
    });
  }

  // Inbox order: severity desc, then most-recent desc.
  return issues.sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.lastSeenAt.localeCompare(a.lastSeenAt),
  );
}

/** Human title for an issue from its representative event. */
function issueTitle(e: OperationalEvent, count: number): string {
  const where = e.toolName || e.pageName || e.route || e.category;
  const verb: Record<OperationalCategory, string> = {
    video_upload: 'Video upload failing',
    auth: 'Sign-in/sign-up failing',
    page: 'Page failing to load',
    tool: 'Tool execution failing',
    api: 'API request failing',
    admin: 'Admin action failing',
    diagnostic: 'Diagnostic failing',
    scheduled_task: 'Scheduled task failing',
    database: 'Database error',
    storage: 'Storage failure',
    third_party: 'Third-party failure',
  };
  const base = verb[e.category] ?? 'Operational failure';
  const scope = where && where !== e.category ? ` — ${where}` : '';
  const plural = count > 1 ? ` (${count})` : '';
  return `${base}${scope}${plural}`;
}

/** Join issues with owner-state overrides into UI-ready views. */
export function applyOverrides(
  issues: OperationalIssue[],
  overrides: IssueOverrideMap,
  nowMs: number = Date.now(),
): OperationalIssueView[] {
  return issues.map((issue) => {
    const ov = overrides[issue.id];
    const status: OperationalIssueStatus = ov?.status ?? 'new';
    const snoozedActive = ov?.snoozedUntil ? Date.parse(ov.snoozedUntil) > nowMs : false;
    const closed = status === 'resolved' || status === 'ignored' || snoozedActive;
    return { ...issue, status, note: ov?.note, resolvedAt: ov?.resolvedAt, snoozedUntil: ov?.snoozedUntil, closed };
  });
}

function withinMs(at: string, nowMs: number, ms: number): boolean {
  const t = Date.parse(at);
  return Number.isFinite(t) && nowMs - t <= ms;
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/**
 * Overall status:
 *   critical — an OPEN critical issue seen in the last 30 minutes
 *   degraded — ≥2 OPEN high/critical issues active in the last 24h
 *   watch    — any OPEN high issue in 24h, OR a rising trend of mediums
 *   healthy  — otherwise
 */
export function computeSystemStatus(
  views: OperationalIssueView[],
  _signals?: ReliabilitySignals,
  nowMs: number = Date.now(),
): SystemHealthStatus {
  const open = views.filter((v) => !v.closed);
  const activeCritical = open.filter((v) => v.severity === 'critical' && withinMs(v.lastSeenAt, nowMs, 30 * MIN));
  if (activeCritical.length > 0) return 'critical';

  const highish24h = open.filter(
    (v) => (v.severity === 'high' || v.severity === 'critical') && withinMs(v.lastSeenAt, nowMs, DAY),
  );
  if (highish24h.length >= 2) return 'degraded';

  const anyHigh = highish24h.length > 0;
  const risingMedium = open.filter((v) => v.severity === 'medium' && withinMs(v.lastSeenAt, nowMs, DAY)).length >= 3;
  if (anyHigh || risingMedium) return 'watch';

  return 'healthy';
}

/** Count events of a category within a trailing window. */
export function countEvents(
  events: OperationalEvent[],
  predicate: (e: OperationalEvent) => boolean,
  nowMs: number,
  windowMs: number,
): number {
  return events.filter((e) => predicate(e) && withinMs(e.at, nowMs, windowMs)).length;
}

/** Executive summary for the dashboard header. */
export function summarize(
  events: OperationalEvent[],
  views: OperationalIssueView[],
  signals: ReliabilitySignals | undefined,
  nowMs: number = Date.now(),
): ReliabilitySummary {
  const open = views.filter((v) => !v.closed);
  const isFail = (e: OperationalEvent) => e.type !== 'video_upload_succeeded' && e.type !== 'video_upload_started';

  const routeCounts = new Map<string, number>();
  const featureCounts = new Map<string, number>();
  for (const e of events) {
    if (!isFail(e)) continue;
    if (e.route) routeCounts.set(e.route, (routeCounts.get(e.route) ?? 0) + 1);
    const feature = e.toolName || e.category;
    featureCounts.set(feature, (featureCounts.get(feature) ?? 0) + 1);
  }
  const top = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const latestCritical = open
    .filter((v) => v.severity === 'critical')
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))[0];

  return {
    status: computeSystemStatus(views, signals, nowMs),
    openCritical: open.filter((v) => v.severity === 'critical').length,
    openHigh: open.filter((v) => v.severity === 'high').length,
    failedUploads24h: countEvents(events, (e) => e.type === 'video_upload_failed' || e.type === 'video_processing_failed', nowMs, DAY),
    failedLogins24h: countEvents(events, (e) => e.category === 'auth', nowMs, DAY),
    pageFailures24h: countEvents(events, (e) => e.category === 'page', nowMs, DAY),
    toolFailures24h: countEvents(events, (e) => e.category === 'tool', nowMs, DAY),
    mostAffectedRoute: top(routeCounts),
    mostAffectedFeature: top(featureCounts),
    latestCritical,
    totalEvents: events.length,
  };
}

/** Threshold-based alert messages for the admin alert queue. */
export interface ReliabilityAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
}

export function deriveReliabilityAlerts(
  events: OperationalEvent[],
  summary: ReliabilitySummary,
  settings: ReliabilitySettings,
  nowMs: number = Date.now(),
): ReliabilityAlert[] {
  const alerts: ReliabilityAlert[] = [];
  const win = settings.thresholdWindowMinutes * MIN;

  if (summary.status === 'critical' && summary.latestCritical) {
    alerts.push({
      id: 'status-critical',
      severity: 'critical',
      title: 'Critical incident active',
      detail: summary.latestCritical.title,
    });
  } else if (summary.status === 'degraded') {
    alerts.push({ id: 'status-degraded', severity: 'warning', title: 'Platform degraded', detail: `${summary.openHigh + summary.openCritical} high-severity issues open.` });
  }

  const uploadFails = countEvents(events, (e) => e.type === 'video_upload_failed', nowMs, win);
  if (uploadFails >= settings.uploadFailureThreshold) {
    alerts.push({ id: 'upload-spike', severity: 'warning', title: 'Upload failures spiking', detail: `${uploadFails} upload failures in the last ${settings.thresholdWindowMinutes} min.` });
  }
  const authFails = countEvents(events, (e) => e.category === 'auth', nowMs, win);
  if (authFails >= settings.authFailureThreshold) {
    alerts.push({ id: 'auth-spike', severity: 'warning', title: 'Login failures spiking', detail: `${authFails} auth failures in the last ${settings.thresholdWindowMinutes} min.` });
  }
  return alerts;
}

/** The paste-into-Claude-Code debug block for an issue. */
export function buildDebugContext(view: OperationalIssueView): string {
  const lines = [
    `Issue: ${view.title}`,
    `Category: ${view.category}`,
    `Severity: ${view.severity}`,
    `Status: ${view.status}`,
    `First seen: ${view.firstSeenAt}`,
    `Last seen: ${view.lastSeenAt}`,
    `Occurrences: ${view.occurrenceCount}`,
    `Affected sessions: ${view.affectedSessionCount}`,
    view.primaryRoute ? `Primary route: ${view.primaryRoute}` : null,
    view.primaryTool ? `Primary tool: ${view.primaryTool}` : null,
    view.primaryUploadStage ? `Upload stage: ${view.primaryUploadStage}` : null,
    view.representativeMessage ? `Representative safe error: ${view.representativeMessage}` : null,
    'Suggested investigation:',
    ...view.suggestedActions.map((a) => `- ${a}`),
  ].filter(Boolean);
  const corr = [...new Set(view.recentEvents.map((e) => e.correlationId).filter(Boolean))];
  if (corr.length) {
    lines.push('Related correlation IDs:');
    for (const c of corr) lines.push(`- ${c}`);
  }
  return lines.join('\n');
}
