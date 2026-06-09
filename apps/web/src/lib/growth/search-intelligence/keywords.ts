// ============================================================
// SearchIntelligenceOS — Keyword engine (§2.4)
// ------------------------------------------------------------
// Builds the keyword universe from owned + strategic sources:
//   • owned-page  — the real target keyword on every published page (real)
//   • blog-tag    — secondary tags on blog posts (real keywords)
//   • seed        — the strategic opportunity clusters (placeholder demand)
//
// Volume + difficulty are RELATIVE estimates derived deterministically from
// the keyword shape (NOT measured demand) and clearly labeled. CSV/GSC import
// can later promote a row's source to `imported`/`gsc` with real numbers.
// Pure + deterministic.
// ============================================================

import { id } from '../link-intelligence/id';
import { clusterForPage } from '../link-intelligence/clusters';
import { scoreKeywordOpportunity, clamp } from './scoring';
import { KEYWORD_SEEDS } from './keyword-seeds';
import type {
  PageIntel, KeywordRow, KeywordSource, LinkSport, LinkIntent, LinkFunnel, DataSource,
} from './types';

const INTENT_VALUE: Record<LinkIntent, number> = {
  transactional: 95, commercial: 80, informational: 55, navigational: 40,
};

function normalize(keyword: string): string {
  return keyword.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Relative keyword business value (0..100) from intent + sport + funnel. */
function keywordBusinessValue(intent: LinkIntent, sport: LinkSport, funnel: LinkFunnel): number {
  const sportBoost = sport === 'golf' ? 10 : sport === 'softball' ? 6 : 0;
  const funnelBoost = funnel === 'conversion' ? 12 : funnel === 'consideration' ? 6 : 0;
  return clamp(INTENT_VALUE[intent] * 0.8 + sportBoost + funnelBoost);
}

/**
 * Relative difficulty (0..100, higher = harder). Derived from keyword shape:
 * short head terms are harder; long-tail + specific modifiers are easier.
 * This is a heuristic estimate, NEVER presented as a measured KD.
 */
function difficultyEstimate(keyword: string): number {
  const words = keyword.split(' ').length;
  let d = 70 - (words - 1) * 8; // each extra word -> easier
  if (/\b(best|review|vs|near me|app|analyzer|software)\b/.test(keyword)) d += 10; // commercial competition
  if (/\b(how to|drill|drills|plan|fix|stop|at home)\b/.test(keyword)) d -= 8; // long-tail intent
  return clamp(d);
}

/** Relative volume proxy (0..100). Broader/head terms imply more demand. */
function volumeEstimate(keyword: string): number {
  const words = keyword.split(' ').length;
  let v = 75 - (words - 1) * 9;
  if (/\b(golf|swing|softball)\b/.test(keyword)) v += 6;
  return clamp(v);
}

function makeRow(input: {
  keyword: string; intent: LinkIntent; funnelStage: LinkFunnel; sport: LinkSport;
  source: KeywordSource; targetUrl: string | null; dataSource: DataSource;
}): KeywordRow {
  const normalizedKeyword = normalize(input.keyword);
  const difficulty = difficultyEstimate(normalizedKeyword);
  const businessValueScore = keywordBusinessValue(input.intent, input.sport, input.funnelStage);
  const hasOwnedPage = input.targetUrl !== null;
  const opportunity = scoreKeywordOpportunity({
    intent: input.intent,
    funnelStage: input.funnelStage,
    sport: input.sport,
    hasOwnedPage,
    businessValueScore,
    difficultyEstimate: difficulty,
  });
  return {
    id: id('si-kw', normalizedKeyword),
    keyword: input.keyword,
    normalizedKeyword,
    intent: input.intent,
    funnelStage: input.funnelStage,
    topicCluster: clusterForPage(input.sport, normalizedKeyword),
    sport: input.sport,
    difficultyEstimate: difficulty,
    volumeEstimate: volumeEstimate(normalizedKeyword),
    source: input.source,
    sourceConfidence: input.source === 'owned-page' ? 95 : input.source === 'blog-tag' ? 70 : 50,
    targetUrl: input.targetUrl,
    hasOwnedPage,
    opportunityScore: opportunity.score,
    businessValueScore,
    contentGapScore: hasOwnedPage ? 20 : 80,
    dataSource: input.dataSource,
  };
}

/**
 * Build the keyword universe. Owned-page keywords win over seeds on collision
 * (we already have a page for them, so they're not a content gap).
 */
export function buildKeywords(pages: PageIntel[]): KeywordRow[] {
  const byNorm = new Map<string, KeywordRow>();
  const put = (row: KeywordRow) => {
    const existing = byNorm.get(row.normalizedKeyword);
    // owned-page > blog-tag > seed
    const rank = (s: KeywordSource) => (s === 'owned-page' ? 3 : s === 'blog-tag' ? 2 : 1);
    if (!existing || rank(row.source) > rank(existing.source)) byNorm.set(row.normalizedKeyword, row);
  };

  // 1) Owned-page keywords (real).
  for (const p of pages) {
    if (!p.keyword) continue;
    put(makeRow({
      keyword: p.keyword,
      intent: p.intent ?? 'informational',
      funnelStage: p.funnelStage ?? 'consideration',
      sport: p.sport === 'multi' ? 'multi' : p.sport,
      source: 'owned-page',
      targetUrl: p.url,
      dataSource: 'real',
    }));
  }

  // 2) Strategic seeds (placeholder demand). Mark as owned if a page already targets it.
  const ownedNorms = new Map(
    pages.filter((p) => p.keyword).map((p) => [normalize(p.keyword as string), p.url]),
  );
  for (const seed of KEYWORD_SEEDS) {
    const norm = normalize(seed.keyword);
    const owningUrl = ownedNorms.get(norm) ?? null;
    put(makeRow({
      keyword: seed.keyword,
      intent: seed.intent,
      funnelStage: seed.funnelStage,
      sport: seed.sport,
      source: owningUrl ? 'owned-page' : 'seed',
      targetUrl: owningUrl,
      dataSource: owningUrl ? 'real' : 'placeholder',
    }));
  }

  return Array.from(byNorm.values()).sort((a, b) => b.opportunityScore - a.opportunityScore);
}
