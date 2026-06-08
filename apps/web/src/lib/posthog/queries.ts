// ============================================================
// Analytics OS — HogQL query builders & result shapers (pure)
// ------------------------------------------------------------
// HogQL is PostHog's read-only SQL over your events. These builders keep
// the queries in one tested place, and the shapers turn PostHog's
// row-array responses into the typed objects the UI renders.
// ============================================================

import type { NamedCount, WebOverview } from './types';

/** Clamp a day range to something sane (1–365). */
export function safeDays(days: number): number {
  if (!Number.isFinite(days)) return 30;
  return Math.max(1, Math.min(365, Math.round(days)));
}

/** Totals: pageviews, unique visitors and sessions over the window. */
export function webOverviewQuery(days: number): string {
  const d = safeDays(days);
  return `
    SELECT
      countIf(event = '$pageview') AS pageviews,
      count(DISTINCT person_id) AS visitors,
      count(DISTINCT properties.$session_id) AS sessions
    FROM events
    WHERE timestamp >= now() - INTERVAL ${d} DAY
  `.trim();
}

/** Pageviews per day (oldest → newest) for the sparkline. */
export function pageviewsByDayQuery(days: number): string {
  const d = safeDays(days);
  return `
    SELECT toDate(timestamp) AS day, countIf(event = '$pageview') AS pageviews
    FROM events
    WHERE timestamp >= now() - INTERVAL ${d} DAY
    GROUP BY day
    ORDER BY day ASC
  `.trim();
}

/** Top pages / events / referrers as name+count pairs. */
export function topNamedCountQuery(
  kind: 'pages' | 'events' | 'referrers',
  days: number,
  limit = 8,
): string {
  const d = safeDays(days);
  const lim = Math.max(1, Math.min(50, Math.round(limit)));
  if (kind === 'events') {
    return `
      SELECT event AS name, count() AS c
      FROM events
      WHERE timestamp >= now() - INTERVAL ${d} DAY
      GROUP BY name ORDER BY c DESC LIMIT ${lim}
    `.trim();
  }
  if (kind === 'referrers') {
    return `
      SELECT properties.$referring_domain AS name, count() AS c
      FROM events
      WHERE event = '$pageview' AND timestamp >= now() - INTERVAL ${d} DAY
        AND properties.$referring_domain != ''
      GROUP BY name ORDER BY c DESC LIMIT ${lim}
    `.trim();
  }
  // pages
  return `
    SELECT properties.$pathname AS name, count() AS c
    FROM events
    WHERE event = '$pageview' AND timestamp >= now() - INTERVAL ${d} DAY
    GROUP BY name ORDER BY c DESC LIMIT ${lim}
  `.trim();
}

// ── Shapers ───────────────────────────────────────────────────

function toNum(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Shape [[name, count], …] rows into NamedCount[]. */
export function shapeNamedCounts(rows: unknown[][] | undefined): NamedCount[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => Array.isArray(r))
    .map((r) => ({
      name: r[0] === null || r[0] === undefined || r[0] === '' ? '(direct / none)' : String(r[0]),
      count: toNum(r[1]),
    }));
}

/** Shape the overview totals + per-day rows into a WebOverview. */
export function shapeWebOverview(
  totals: unknown[][] | undefined,
  byDay: unknown[][] | undefined,
): WebOverview {
  const row = Array.isArray(totals) && Array.isArray(totals[0]) ? totals[0] : [];
  const days = Array.isArray(byDay)
    ? byDay
        .filter((r) => Array.isArray(r))
        .map((r) => ({ date: String(r[0] ?? ''), pageviews: toNum(r[1]) }))
    : [];
  return {
    pageviews: toNum(row[0]),
    visitors: toNum(row[1]),
    sessions: toNum(row[2]),
    byDay: days,
  };
}

// ── HogQL explorer guard ──────────────────────────────────────

const FORBIDDEN = /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke)\b/i;

/**
 * Light guard for the in-OS SQL explorer. HogQL is read-only by design,
 * but we still reject obvious mutation keywords and cap the length so the
 * box stays a reporting tool.
 */
export function validateHogQL(query: string): { ok: boolean; error?: string } {
  const q = (query ?? '').trim();
  if (!q) return { ok: false, error: 'Enter a query.' };
  if (q.length > 5_000) return { ok: false, error: 'Query is too long (5,000 char max).' };
  if (FORBIDDEN.test(q)) return { ok: false, error: 'Only read-only SELECT queries are allowed.' };
  if (!/\bselect\b/i.test(q) && !/^\s*with\b/i.test(q)) {
    return { ok: false, error: 'Query must be a SELECT (or WITH … SELECT).' };
  }
  return { ok: true };
}
