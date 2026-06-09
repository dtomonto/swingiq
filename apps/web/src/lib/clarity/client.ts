// ============================================================
// Clarity OS — Microsoft Clarity Data Export API client (SERVER-ONLY)
// ------------------------------------------------------------
// Thin, defensive wrapper over Clarity's Data Export API. Every call returns
// a normalized ClarityResult and NEVER throws — a slow or unreachable Clarity
// degrades to an honest error string, it never crashes a page or route.
//
// The Data Export API token is required and must stay server-side. Do NOT
// import this from a client component.
//
// API reference (Microsoft Learn — "Clarity Data Export API"):
//   GET https://www.clarity.ms/export-data/api/v1/project-live-insights
//       ?numOfDays={1|2|3}[&dimension1=&dimension2=&dimension3=]
//   Authorization: Bearer <token>   (generated in Clarity → Settings → Data export)
//   Returns an array of metric objects: { metricName, information: [...] }.
//   LIMITS: data covers only the last 1–3 days, and the project is capped at
//   ~10 calls/day — so the OS fetches on demand (never on a timer) and the UI
//   states this plainly.
//
// Field names in `information` vary slightly across Clarity versions, so the
// normalizer below reads each value from a list of candidate keys and falls
// back to null rather than guessing a wrong number ("never fabricate data").
// ============================================================

import type {
  ClarityBreakdownRow,
  ClarityEngagement,
  ClarityLiveSnapshot,
  ClarityResult,
  ClaritySignal,
  ClarityTraffic,
} from './types';
import { SIGNAL_CATALOG } from './capabilities';

const EXPORT_API_URL = 'https://www.clarity.ms/export-data/api/v1/project-live-insights';
const DEFAULT_TIMEOUT_MS = 12_000;

/** A single Clarity metric object from the export API. */
interface RawMetric {
  metricName?: string;
  information?: Record<string, unknown>[];
}

/** Coerce an unknown (string|number) into a finite number, else null. */
function num(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** First present, numeric value across candidate keys (defensive parsing). */
function pick(obj: Record<string, unknown> | undefined, ...keys: string[]): number | null {
  if (!obj) return null;
  for (const k of keys) {
    if (k in obj) {
      const n = num(obj[k]);
      if (n !== null) return n;
    }
  }
  return null;
}

/** First present, string value across candidate keys. */
function pickStr(obj: Record<string, unknown> | undefined, ...keys: string[]): string | null {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return null;
}

/** Clamp the requested window to Clarity's supported 1–3 day range. */
export function safeNumOfDays(raw: number): number {
  if (!Number.isFinite(raw)) return 3;
  const n = Math.round(raw);
  if (n < 1) return 1;
  if (n > 3) return 3;
  return n;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

function errorMessage(status: number, body: unknown): string {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    const detail = b.message ?? b.error ?? b.errorMessage;
    if (typeof detail === 'string' && detail) return detail;
  }
  if (status === 401) return 'Unauthorized — check the Data Export API token.';
  if (status === 403) return 'Forbidden — the token lacks access to this project.';
  if (status === 402 || status === 429)
    return 'Daily limit reached — Clarity allows ~10 export calls per project per day. Try again tomorrow.';
  return `Clarity returned HTTP ${status}.`;
}

/**
 * Defensive JSON fetch against the Clarity export API. Returns a ClarityResult;
 * never throws. Honors a timeout via AbortController.
 */
async function clarityFetch<T>(
  url: string,
  token: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<ClarityResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: authHeaders(token),
      signal: controller.signal,
      cache: 'no-store',
    });
    let body: unknown = null;
    const text = await res.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    if (!res.ok) {
      return { ok: false, status: res.status, data: null, error: errorMessage(res.status, body) };
    }
    return { ok: true, status: res.status, data: body as T, error: null };
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      data: null,
      error: aborted ? `Timed out after ${Math.round(timeoutMs / 1000)}s.` : 'Network error reaching Clarity.',
    };
  } finally {
    clearTimeout(timer);
  }
}

// ── Normalization (raw metrics → typed snapshot) ──────────────

/** Map the Clarity metricName for each signal onto our catalog id. */
const SIGNAL_METRIC_NAMES: Record<string, string> = {
  RageClickCount: 'rageClicks',
  DeadClickCount: 'deadClicks',
  ExcessiveScroll: 'excessiveScroll',
  QuickbackClick: 'quickBack',
  ScriptErrorCount: 'scriptErrors',
  ErrorClickCount: 'errorClicks',
};

function findMetric(metrics: RawMetric[], name: string): RawMetric | undefined {
  return metrics.find((m) => (m.metricName ?? '').toLowerCase() === name.toLowerCase());
}

function shapeTraffic(metrics: RawMetric[]): ClarityTraffic {
  const info = findMetric(metrics, 'Traffic')?.information?.[0];
  return {
    totalSessions: pick(info, 'totalSessionCount', 'totalSessions', 'sessionsCount'),
    botSessions: pick(info, 'totalBotSessionCount', 'botSessions'),
    distinctUsers: pick(info, 'distinctUserCount', 'distinctUsers'),
    pagesPerSession: pick(info, 'pagesPerSessionPercentage', 'averagePagesPerSession', 'pagesPerSession'),
  };
}

function shapeEngagement(metrics: RawMetric[]): ClarityEngagement {
  const scroll = findMetric(metrics, 'ScrollDepth')?.information?.[0];
  const time = findMetric(metrics, 'EngagementTime')?.information?.[0];
  return {
    averageScrollDepth: pick(scroll, 'averageScrollDepth', 'scrollDepth'),
    totalTime: pick(time, 'totalTime', 'totalSessionTime'),
    activeTime: pick(time, 'activeTime', 'totalActiveTime'),
  };
}

function shapeSignals(metrics: RawMetric[]): ClaritySignal[] {
  return SIGNAL_CATALOG.map((sig) => {
    const metricName = Object.keys(SIGNAL_METRIC_NAMES).find((k) => SIGNAL_METRIC_NAMES[k] === sig.id);
    const info = metricName ? findMetric(metrics, metricName)?.information?.[0] : undefined;
    return {
      id: sig.id,
      label: sig.label,
      sessions: pick(info, 'sessionsCount', 'subTotal', 'sessionsWithMetricCount'),
      pct: pick(info, 'sessionsWithMetricPercentage', 'percentage'),
    };
  });
}

/**
 * When a dimension was requested, Clarity breaks the Traffic metric into one
 * `information` row per dimension value. Shape those into named-count rows.
 */
function shapeBreakdown(metrics: RawMetric[], dimension: string): ClarityBreakdownRow[] {
  const traffic = findMetric(metrics, 'Traffic');
  const rows = traffic?.information ?? [];
  if (rows.length <= 1) return [];
  return rows
    .map((row) => ({
      name: pickStr(row, dimension, 'name', 'dimension', 'value') ?? 'Unknown',
      sessions: pick(row, 'totalSessionCount', 'totalSessions', 'sessionsCount'),
      pct: pick(row, 'sessionsWithMetricPercentage', 'percentage'),
    }))
    .filter((r) => r.sessions !== null)
    .sort((a, b) => (b.sessions ?? 0) - (a.sessions ?? 0))
    .slice(0, 10);
}

// ── Public fetchers ───────────────────────────────────────────

/**
 * Fetch a live insights snapshot. Pass an optional single dimension to also
 * get a breakdown (e.g. "Browser"). Always one HTTP call (counts toward the
 * ~10/day project cap).
 */
export async function fetchLiveInsights(
  token: string,
  numOfDays: number,
  dimension?: string,
): Promise<ClarityResult<ClarityLiveSnapshot>> {
  const params = new URLSearchParams({ numOfDays: String(safeNumOfDays(numOfDays)) });
  if (dimension) params.set('dimension1', dimension);

  const res = await clarityFetch<RawMetric[]>(`${EXPORT_API_URL}?${params.toString()}`, token);
  if (!res.ok) return { ok: false, status: res.status, data: null, error: res.error };

  const metrics = Array.isArray(res.data) ? res.data : [];
  const snapshot: ClarityLiveSnapshot = {
    traffic: shapeTraffic(metrics),
    engagement: shapeEngagement(metrics),
    signals: shapeSignals(metrics),
    breakdown: dimension ? { dimension, rows: shapeBreakdown(metrics, dimension) } : null,
    metricsReturned: metrics.map((m) => m.metricName ?? '').filter(Boolean),
    raw: res.data,
    numOfDays: safeNumOfDays(numOfDays),
    errors: {},
    fetchedAt: new Date().toISOString(),
  };
  return { ok: true, status: res.status, data: snapshot, error: null };
}

/**
 * Validate the token by making a minimal (1-day, no-dimension) export call.
 * NOTE: this consumes one of the ~10 daily calls — the UI says so.
 */
export async function testConnection(token: string): Promise<ClarityResult<{ metrics: number }>> {
  const res = await clarityFetch<RawMetric[]>(`${EXPORT_API_URL}?numOfDays=1`, token);
  if (!res.ok) return { ok: false, status: res.status, data: null, error: res.error };
  const metrics = Array.isArray(res.data) ? res.data.length : 0;
  return { ok: true, status: res.status, data: { metrics }, error: null };
}
