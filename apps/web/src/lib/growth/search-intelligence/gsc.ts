// ============================================================
// SearchIntelligenceOS — Google Search Console adapter (§2.16)
// ------------------------------------------------------------
// Turns the registry-derived module into a REAL-data one for the signals GSC
// actually provides: query position (rank), impressions, clicks, CTR. The
// fetch is keyless-SAFE — with no token/site configured it returns
// `connected:false` and no rows (never faked). Pure mappers convert GSC rows
// into KeywordRow + RankingSnapshot (dataSource 'gsc'); a synced snapshot is
// persisted best-effort to growth_records so the dashboards read it on render.
//
// Auth today: a bearer token in GSC_ACCESS_TOKEN (OAuth) + the property in
// GSC_SITE_URL (e.g. "sc-domain:swingvantage.com" or "https://swingvantage.com/").
// Service-account JWT signing is a documented follow-up.
// ============================================================

import { id } from '../link-intelligence/id';
import { normalizeUrl } from '../link-intelligence/inventory';
import { clusterForPage } from '../link-intelligence/clusters';
import {
  normalizeKeyword, difficultyEstimate, volumeEstimate, keywordBusinessValue,
} from './keywords';
import { clamp } from './scoring';
import { activeProject } from './projects';
import type {
  GscRow, GscSummary, GscSnapshot, KeywordRow, RankingSnapshot, LinkIntent, LinkSport,
} from './types';

export const GSC_TOKEN_ENV = 'GSC_ACCESS_TOKEN';
export const GSC_SITE_ENV = 'GSC_SITE_URL';

export interface GscStatus {
  connected: boolean;
  siteUrl: string | null;
  hasToken: boolean;
  missing: string[];
  note: string;
}

export function gscStatus(env: NodeJS.ProcessEnv = process.env): GscStatus {
  const hasToken = Boolean(env[GSC_TOKEN_ENV] && String(env[GSC_TOKEN_ENV]).trim());
  const siteUrl = env[GSC_SITE_ENV]?.trim() || null;
  const missing: string[] = [];
  if (!hasToken) missing.push(GSC_TOKEN_ENV);
  if (!siteUrl) missing.push(GSC_SITE_ENV);
  const connected = hasToken && Boolean(siteUrl);
  return {
    connected,
    siteUrl,
    hasToken,
    missing,
    note: connected
      ? `Connected to ${siteUrl}.`
      : `Not connected — set ${missing.join(' + ')} to sync real Search Console data.`,
  };
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface GscFetchResult {
  connected: boolean;
  rows: GscRow[];
  note: string;
}

/**
 * Fetch query+page rows from the Search Analytics API. Keyless-safe: returns
 * `connected:false` + no rows when unconfigured, and never throws on a network
 * error (returns an honest note instead) so callers/UI degrade gracefully.
 */
export async function fetchGscRows(
  opts: { days?: number; rowLimit?: number } = {},
  env: NodeJS.ProcessEnv = process.env,
): Promise<GscFetchResult> {
  const status = gscStatus(env);
  if (!status.connected || !status.siteUrl) {
    return { connected: false, rows: [], note: status.note };
  }
  const days = opts.days ?? 28;
  const rowLimit = Math.min(opts.rowLimit ?? 1000, 5000);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(status.siteUrl)}/searchAnalytics/query`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env[GSC_TOKEN_ENV]}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: ymd(start),
        endDate: ymd(end),
        dimensions: ['query', 'page'],
        rowLimit,
      }),
    });
    if (!res.ok) {
      return { connected: true, rows: [], note: `Search Console API error ${res.status} (check token scope/expiry).` };
    }
    const json = (await res.json()) as { rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[] };
    const rows: GscRow[] = (json.rows ?? []).map((r) => ({
      query: r.keys[0] ?? '',
      page: r.keys[1] ?? '',
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    })).filter((r) => r.query);
    return { connected: true, rows, note: `Fetched ${rows.length} query rows from Search Console.` };
  } catch (err) {
    return { connected: true, rows: [], note: `Search Console fetch failed: ${(err as Error).message}` };
  }
}

// ──────────────────────────────────────────────────────────────
// Pure mappers (unit-testable with mock rows)
// ──────────────────────────────────────────────────────────────

const SPORT_HINTS: [LinkSport, RegExp][] = [
  ['golf', /\bgolf\b/], ['tennis', /\btennis\b/], ['pickleball', /pickleball/],
  ['padel', /padel/], ['baseball', /baseball/], ['softball', /softball|slow.?pitch|fast.?pitch/],
];

function inferSport(keyword: string): LinkSport {
  for (const [sport, re] of SPORT_HINTS) if (re.test(keyword)) return sport;
  return 'multi';
}
function inferIntent(keyword: string): LinkIntent {
  if (/\b(best|review|vs|app|software|analyzer|price|cost|buy)\b/.test(keyword)) return 'commercial';
  return 'informational';
}

/** Real ranking proximity → opportunity. Striking distance (4–20) scores highest. */
function gscOpportunity(position: number, businessValue: number): number {
  const proximity = position <= 3 ? 8 : position <= 10 ? 38 : position <= 20 ? 30 : 12;
  return clamp(businessValue * 0.4 + proximity + 25);
}

/** Convert GSC rows → KeywordRow[] (one per query, best page chosen). */
export function gscRowsToKeywords(rows: GscRow[]): KeywordRow[] {
  const byQuery = new Map<string, GscRow[]>();
  for (const r of rows) {
    const k = normalizeKeyword(r.query);
    const arr = byQuery.get(k) ?? [];
    arr.push(r);
    byQuery.set(k, arr);
  }

  const out: KeywordRow[] = [];
  for (const [normalizedKeyword, group] of byQuery) {
    const clicks = group.reduce((a, r) => a + r.clicks, 0);
    const impressions = group.reduce((a, r) => a + r.impressions, 0);
    // Impression-weighted average position (real).
    const position = impressions > 0
      ? group.reduce((a, r) => a + r.position * r.impressions, 0) / impressions
      : group.reduce((a, r) => a + r.position, 0) / group.length;
    const best = [...group].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)[0];
    const keyword = best.query;
    const sport = inferSport(normalizedKeyword);
    const intent = inferIntent(normalizedKeyword);
    const businessValueScore = keywordBusinessValue(intent, sport, 'consideration');

    out.push({
      id: id('si-kw', normalizedKeyword),
      keyword,
      normalizedKeyword,
      intent,
      funnelStage: 'consideration',
      topicCluster: clusterForPage(sport, normalizedKeyword),
      sport,
      difficultyEstimate: difficultyEstimate(normalizedKeyword),
      volumeEstimate: volumeEstimate(normalizedKeyword),
      source: 'gsc',
      sourceConfidence: 98,
      targetUrl: best.page ? normalizeUrl(best.page) : null,
      hasOwnedPage: Boolean(best.page),
      opportunityScore: gscOpportunity(position, businessValueScore),
      businessValueScore,
      contentGapScore: 15,
      dataSource: 'real', // verified Search Console data (source = 'gsc')
      currentRank: Math.round(position * 10) / 10,
      impressions,
      clicks,
      ctr: impressions > 0 ? clicks / impressions : 0,
    });
  }
  return out.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

/** Convert GSC rows → RankingSnapshot[] (real positions). */
export function gscRowsToRankings(rows: GscRow[]): RankingSnapshot[] {
  const now = new Date().toISOString().slice(0, 10);
  return rows.map((r) => ({
    id: id('si-rank', normalizeKeyword(r.query), normalizeUrl(r.page || '/')),
    keyword: r.query,
    url: r.page ? normalizeUrl(r.page) : '',
    position: Math.round(r.position * 10) / 10,
    searchEngine: 'google',
    device: 'all',
    checkedAt: now,
    source: 'gsc',
    dataSource: 'real', // verified Search Console position
  }));
}

export function summarizeGsc(rows: GscRow[]): GscSummary {
  const totalClicks = rows.reduce((a, r) => a + r.clicks, 0);
  const totalImpressions = rows.reduce((a, r) => a + r.impressions, 0);
  const avgPosition = rows.length
    ? Math.round((rows.reduce((a, r) => a + r.position, 0) / rows.length) * 10) / 10
    : 0;
  return {
    rowCount: rows.length,
    totalClicks,
    totalImpressions,
    avgPosition,
    avgCtr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
    fetchedAt: new Date().toISOString(),
  };
}

export function buildGscSnapshot(rows: GscRow[], siteUrl: string): GscSnapshot {
  return {
    siteUrl,
    summary: summarizeGsc(rows),
    keywords: gscRowsToKeywords(rows),
    rankings: gscRowsToRankings(rows),
  };
}

// ──────────────────────────────────────────────────────────────
// Server-only persistence (best-effort, dynamic supabase import)
// ──────────────────────────────────────────────────────────────

function snapshotId(): string {
  return `si-gsc-snapshot-${activeProject().id}`;
}

export async function persistGscSnapshot(snapshot: GscSnapshot): Promise<boolean> {
  try {
    const { createSupabaseAdminClient } = await import('@/lib/supabase-admin');
    const client = createSupabaseAdminClient();
    if (!client) return false;
    const now = new Date().toISOString();
    const { error } = await client.from('growth_records').upsert(
      [{ id: snapshotId(), kind: 'gsc-snapshot', data: snapshot, created_at: now, updated_at: now }],
      { onConflict: 'id' },
    );
    return !error;
  } catch {
    return false;
  }
}

/** Read the latest persisted GSC snapshot, or null when none / no Supabase. */
export async function loadGscSnapshot(): Promise<GscSnapshot | null> {
  try {
    const { createSupabaseAdminClient } = await import('@/lib/supabase-admin');
    const client = createSupabaseAdminClient();
    if (!client) return null;
    const { data, error } = await client.from('growth_records').select('data').eq('id', snapshotId()).maybeSingle();
    if (error || !data) return null;
    return (data as { data: GscSnapshot }).data;
  } catch {
    return null;
  }
}
