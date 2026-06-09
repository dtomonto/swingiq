// ============================================================
// SearchIntelligenceOS — CSV import / export (§2.4/2.5/2.9, §21)
// ------------------------------------------------------------
// Pure, isomorphic CSV core + three importers (keywords / rankings /
// backlinks). Imported rows carry verified, user-provided values and are
// labeled `imported` (not estimated). The parser is RFC-4180-ish: it handles
// quoted fields, escaped quotes (""), embedded commas/newlines, CRLF, and a
// leading UTF-8 BOM. Header matching is case/spacing-insensitive with aliases.
// Zero I/O — the client download lives in ExportCsvButton.
// ============================================================

import { id } from '../link-intelligence/id';
import { clusterForPage } from '../link-intelligence/clusters';
import {
  normalizeKeyword, difficultyEstimate, volumeEstimate, keywordBusinessValue,
} from './keywords';
import { scoreKeywordOpportunity, clamp } from './scoring';
import type {
  KeywordRow, RankingSnapshot, BacklinkRecord, LinkIntent, LinkSport, LinkFunnel,
} from './types';

export type CsvValue = string | number | boolean | null | undefined;

// ──────────────────────────────────────────────────────────────
// Core parse / stringify
// ──────────────────────────────────────────────────────────────

/** Parse CSV text into a header row + an array of cell arrays (no mapping). */
export function parseCsvRows(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  // Strip a leading BOM.
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(field); out.push(row); row = []; field = ''; continue; }
    field += c;
  }
  // Flush the trailing field/row (unless the input ended on a newline).
  if (field !== '' || row.length > 0) { row.push(field); out.push(row); }
  return out;
}

/** Parse CSV into objects keyed by a normalized header (lowercase_underscored). */
export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const raw = parseCsvRows(text).filter((r) => r.some((c) => c.trim() !== ''));
  if (raw.length === 0) return { headers: [], rows: [] };
  const headers = raw[0].map(normalizeHeader);
  const rows = raw.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (cells[i] ?? '').trim(); });
    return obj;
  });
  return { headers, rows };
}

function csvCell(v: CsvValue): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serialize rows of objects to CSV. Headers default to the union of keys. */
export function toCsv(rows: Record<string, CsvValue>[], headers?: string[]): string {
  const cols = headers ?? Array.from(rows.reduce((set, r) => {
    Object.keys(r).forEach((k) => set.add(k));
    return set;
  }, new Set<string>()));
  const lines = [cols.map(csvCell).join(',')];
  for (const r of rows) lines.push(cols.map((c) => csvCell(r[c])).join(','));
  return lines.join('\r\n');
}

// ──────────────────────────────────────────────────────────────
// Header / value helpers
// ──────────────────────────────────────────────────────────────

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function pick(row: Record<string, string>, ...aliases: string[]): string {
  for (const a of aliases) {
    const v = row[normalizeHeader(a)];
    if (v !== undefined && v !== '') return v;
  }
  return '';
}

function toInt(v: string, fallback: number | null = null): number | null {
  const n = Number.parseFloat(v.replace(/[%,]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

function toBool(v: string): boolean {
  return /^(1|true|yes|y|nofollow)$/i.test(v.trim());
}

const INTENTS = new Set<LinkIntent>(['informational', 'commercial', 'transactional', 'navigational']);
const SPORTS = new Set<LinkSport>(['multi', 'golf', 'tennis', 'pickleball', 'padel', 'baseball', 'softball']);

function asIntent(v: string): LinkIntent {
  const s = v.trim().toLowerCase() as LinkIntent;
  return INTENTS.has(s) ? s : 'informational';
}
function asSport(v: string): LinkSport {
  const s = v.trim().toLowerCase() as LinkSport;
  return SPORTS.has(s) ? s : 'multi';
}
function asFunnel(v: string): LinkFunnel {
  const s = v.trim().toLowerCase();
  return s === 'awareness' || s === 'conversion' ? s : 'consideration';
}

function domainOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, ''); }
}

export interface ImportResult<T> {
  rows: T[];
  errors: string[];
  /** Total non-empty data rows seen (rows imported = rows.length). */
  total: number;
}

// ──────────────────────────────────────────────────────────────
// Keyword import — verified rows (DataSource 'imported')
// ──────────────────────────────────────────────────────────────

export function importKeywords(text: string): ImportResult<KeywordRow> {
  const { rows } = parseCsv(text);
  const out: KeywordRow[] = [];
  const errors: string[] = [];

  rows.forEach((r, i) => {
    const keyword = pick(r, 'keyword', 'query', 'term');
    if (!keyword) { errors.push(`Row ${i + 2}: missing "keyword".`); return; }

    const normalizedKeyword = normalizeKeyword(keyword);
    const intent = asIntent(pick(r, 'intent'));
    const sport = asSport(pick(r, 'sport'));
    const funnelStage = asFunnel(pick(r, 'funnel', 'funnel_stage', 'stage'));
    const targetUrl = pick(r, 'url', 'target_url', 'landing_page') || null;

    // Verified numbers when present; relative estimates (labeled) otherwise.
    const volRaw = toInt(pick(r, 'volume', 'search_volume', 'vol'));
    const diffRaw = toInt(pick(r, 'difficulty', 'kd', 'keyword_difficulty'));
    const volumeEstimateVal = volRaw !== null ? clamp(volRaw > 100 ? 100 : volRaw) : volumeEstimate(normalizedKeyword);
    const difficulty = diffRaw !== null ? clamp(diffRaw) : difficultyEstimate(normalizedKeyword);

    const businessValueScore = keywordBusinessValue(intent, sport, funnelStage);
    const opportunity = scoreKeywordOpportunity({
      intent, funnelStage, sport, hasOwnedPage: targetUrl !== null, businessValueScore, difficultyEstimate: difficulty,
    });

    out.push({
      id: id('si-kw', normalizedKeyword),
      keyword,
      normalizedKeyword,
      intent,
      funnelStage,
      topicCluster: pick(r, 'cluster', 'topic_cluster') || clusterForPage(sport, normalizedKeyword),
      sport,
      difficultyEstimate: difficulty,
      volumeEstimate: volumeEstimateVal,
      source: 'imported',
      sourceConfidence: 90,
      targetUrl,
      hasOwnedPage: targetUrl !== null,
      opportunityScore: opportunity.score,
      businessValueScore,
      contentGapScore: targetUrl ? 20 : 80,
      // Real verified row when the CSV supplied actual volume/difficulty.
      dataSource: volRaw !== null || diffRaw !== null ? 'imported' : 'estimated',
    });
  });

  return { rows: out, errors, total: rows.length };
}

// ──────────────────────────────────────────────────────────────
// Ranking import
// ──────────────────────────────────────────────────────────────

export function importRankings(text: string): ImportResult<RankingSnapshot> {
  const { rows } = parseCsv(text);
  const out: RankingSnapshot[] = [];
  const errors: string[] = [];

  rows.forEach((r, i) => {
    const keyword = pick(r, 'keyword', 'query', 'term');
    const url = pick(r, 'url', 'page', 'landing_page');
    const pos = toInt(pick(r, 'position', 'rank', 'avg_position', 'average_position'));
    if (!keyword || !url) { errors.push(`Row ${i + 2}: needs "keyword" and "url".`); return; }
    if (pos === null) { errors.push(`Row ${i + 2}: missing/invalid "position".`); return; }

    out.push({
      id: id('si-rank', normalizeKeyword(keyword), url),
      keyword,
      url,
      position: pos,
      searchEngine: pick(r, 'search_engine', 'engine') || 'google',
      device: pick(r, 'device') || 'desktop',
      checkedAt: pick(r, 'checked_at', 'date') || new Date().toISOString().slice(0, 10),
      source: pick(r, 'source') || 'csv-import',
      dataSource: 'imported',
    });
  });

  return { rows: out, errors, total: rows.length };
}

// ──────────────────────────────────────────────────────────────
// Backlink import
// ──────────────────────────────────────────────────────────────

export function importBacklinks(text: string): ImportResult<BacklinkRecord> {
  const { rows } = parseCsv(text);
  const out: BacklinkRecord[] = [];
  const errors: string[] = [];

  rows.forEach((r, i) => {
    const sourceUrl = pick(r, 'source_url', 'source', 'referring_page', 'from');
    const targetUrl = pick(r, 'target_url', 'target', 'to', 'destination');
    if (!sourceUrl || !targetUrl) { errors.push(`Row ${i + 2}: needs "source_url" and "target_url".`); return; }

    out.push({
      id: id('si-bl', sourceUrl, targetUrl),
      sourceUrl,
      sourceDomain: pick(r, 'source_domain', 'referring_domain', 'domain') || domainOf(sourceUrl),
      targetUrl,
      anchorText: pick(r, 'anchor', 'anchor_text'),
      linkType: pick(r, 'link_type', 'type') || 'external',
      nofollow: toBool(pick(r, 'nofollow', 'rel')),
      firstSeen: pick(r, 'first_seen', 'date') || new Date().toISOString().slice(0, 10),
      authorityEstimate: toInt(pick(r, 'authority', 'dr', 'domain_rating', 'da')),
      dataSource: 'imported',
    });
  });

  return { rows: out, errors, total: rows.length };
}

export type ImportKind = 'keywords' | 'rankings' | 'backlinks';

/** Dispatch an import by kind (used by the UI's kind selector). */
export function importByKind(kind: ImportKind, text: string):
  | { kind: 'keywords'; result: ImportResult<KeywordRow> }
  | { kind: 'rankings'; result: ImportResult<RankingSnapshot> }
  | { kind: 'backlinks'; result: ImportResult<BacklinkRecord> } {
  if (kind === 'rankings') return { kind, result: importRankings(text) };
  if (kind === 'backlinks') return { kind, result: importBacklinks(text) };
  return { kind: 'keywords', result: importKeywords(text) };
}
