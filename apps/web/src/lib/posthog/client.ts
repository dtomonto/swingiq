// ============================================================
// Analytics OS — PostHog API client (SERVER-ONLY)
// ------------------------------------------------------------
// Thin, defensive wrapper over PostHog's HTTP API. Every call returns a
// normalized PhResult and NEVER throws — a slow or unreachable PostHog
// degrades to an honest error string, it never crashes a page or route.
//
// The personal API key is required for read/management calls and must stay
// server-side. Do NOT import this from a client component.
// ============================================================

import type {
  FeatureFlagSummary,
  NamedCount,
  PhResult,
  WebOverview,
} from './types';
import {
  pageviewsByDayQuery,
  topNamedCountQuery,
  webOverviewQuery,
  shapeNamedCounts,
  shapeWebOverview,
} from './queries';

/** Minimal read config the client needs (no display fields). */
export interface ReadClientConfig {
  apiBaseUrl: string;
  projectId: string;
  personalKey: string;
}

const DEFAULT_TIMEOUT_MS = 12_000;

function authHeaders(personalKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${personalKey}`,
    'Content-Type': 'application/json',
  };
}

/** Best-effort human message from a PostHog error body. */
function errorMessage(status: number, body: unknown): string {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    const detail = b.detail ?? b.error ?? b.message;
    if (typeof detail === 'string' && detail) return detail;
  }
  if (status === 401) return 'Unauthorized — check the personal API key.';
  if (status === 403) return 'Forbidden — the key lacks permission for this project.';
  if (status === 404) return 'Not found — check the project id.';
  if (status === 429) return 'Rate limited by PostHog — try again shortly.';
  return `PostHog returned HTTP ${status}.`;
}

/**
 * Defensive JSON fetch. Returns a PhResult; never throws. Honors a timeout
 * via AbortController so a hung PostHog cannot hang the request.
 */
export async function phFetch<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<PhResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
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
      error: aborted ? `Timed out after ${Math.round(timeoutMs / 1000)}s.` : 'Network error reaching PostHog.',
    };
  } finally {
    clearTimeout(timer);
  }
}

// ── Connection tests ──────────────────────────────────────────

/**
 * Validate the PUBLIC ingest key by calling the decide endpoint. A 200
 * means PostHog recognizes the project token (events will be accepted).
 */
export async function testIngest(ingestHost: string, apiKey: string): Promise<PhResult<unknown>> {
  const url = `${ingestHost.replace(/\/+$/, '')}/decide/?v=3`;
  return phFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, distinct_id: 'swingvantage-connection-test' }),
  });
}

/** Validate the personal API key + project id by reading the project. */
export async function testRead(cfg: ReadClientConfig): Promise<PhResult<{ name?: string }>> {
  const url = `${cfg.apiBaseUrl}/api/projects/${encodeURIComponent(cfg.projectId)}/`;
  return phFetch<{ name?: string }>(url, { headers: authHeaders(cfg.personalKey) });
}

// ── HogQL ─────────────────────────────────────────────────────

interface HogQLResponse {
  results?: unknown[][];
  columns?: string[];
}

/** Run a HogQL query. Returns columns + row arrays. */
export async function runHogQL(
  cfg: ReadClientConfig,
  query: string,
): Promise<PhResult<HogQLResponse>> {
  const url = `${cfg.apiBaseUrl}/api/projects/${encodeURIComponent(cfg.projectId)}/query/`;
  return phFetch<HogQLResponse>(url, {
    method: 'POST',
    headers: authHeaders(cfg.personalKey),
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
  });
}

// ── Higher-level live fetchers (shape HogQL/REST into UI types) ──

export async function fetchWebOverview(cfg: ReadClientConfig, days: number): Promise<PhResult<WebOverview>> {
  const [totals, byDay] = await Promise.all([
    runHogQL(cfg, webOverviewQuery(days)),
    runHogQL(cfg, pageviewsByDayQuery(days)),
  ]);
  if (!totals.ok) return { ...totals, data: null };
  return {
    ok: true,
    status: 200,
    data: shapeWebOverview(totals.data?.results, byDay.ok ? byDay.data?.results : undefined),
    error: null,
  };
}

export async function fetchTopNamed(
  cfg: ReadClientConfig,
  kind: 'pages' | 'events' | 'referrers',
  days: number,
  limit = 8,
): Promise<PhResult<NamedCount[]>> {
  const res = await runHogQL(cfg, topNamedCountQuery(kind, days, limit));
  if (!res.ok) return { ...res, data: null };
  return { ok: true, status: 200, data: shapeNamedCounts(res.data?.results), error: null };
}

interface DrfList<T> {
  count?: number;
  results?: T[];
}

/** List feature flags (with PostHog's total count). */
export async function listFeatureFlags(
  cfg: ReadClientConfig,
  limit = 100,
): Promise<PhResult<{ count: number; flags: FeatureFlagSummary[] }>> {
  const url = `${cfg.apiBaseUrl}/api/projects/${encodeURIComponent(cfg.projectId)}/feature_flags/?limit=${limit}`;
  const res = await phFetch<DrfList<RawFlag>>(url, { headers: authHeaders(cfg.personalKey) });
  if (!res.ok) return { ...res, data: null };
  const flags = (res.data?.results ?? []).map(shapeFlag);
  return { ok: true, status: 200, data: { count: res.data?.count ?? flags.length, flags }, error: null };
}

/** Enable/disable a feature flag by id. Requires a write-scoped key. */
export async function patchFeatureFlag(
  cfg: ReadClientConfig,
  id: number,
  active: boolean,
): Promise<PhResult<RawFlag>> {
  const url = `${cfg.apiBaseUrl}/api/projects/${encodeURIComponent(cfg.projectId)}/feature_flags/${id}/`;
  return phFetch<RawFlag>(url, {
    method: 'PATCH',
    headers: authHeaders(cfg.personalKey),
    body: JSON.stringify({ active }),
  });
}

/** Read just the `count` of a paginated resource (surveys, cohorts, …). */
export async function fetchResourceCount(
  cfg: ReadClientConfig,
  resource: 'surveys' | 'experiments' | 'cohorts' | 'dashboards',
): Promise<PhResult<number>> {
  const url = `${cfg.apiBaseUrl}/api/projects/${encodeURIComponent(cfg.projectId)}/${resource}/?limit=1`;
  const res = await phFetch<DrfList<unknown>>(url, { headers: authHeaders(cfg.personalKey) });
  if (!res.ok) return { ...res, data: null };
  return { ok: true, status: 200, data: res.data?.count ?? (res.data?.results?.length ?? 0), error: null };
}

// ── Flag shaping ──────────────────────────────────────────────

export interface RawFlag {
  id: number;
  key: string;
  name?: string;
  active: boolean;
  filters?: { groups?: { rollout_percentage?: number | null }[] };
}

export function shapeFlag(f: RawFlag): FeatureFlagSummary {
  const groups = f.filters?.groups ?? [];
  const rollout = groups.length > 0 ? groups[0].rollout_percentage ?? null : null;
  return {
    id: f.id,
    key: f.key,
    name: f.name || f.key,
    active: Boolean(f.active),
    rolloutPercentage: rollout,
  };
}
