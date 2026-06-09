// ============================================================
// SearchIntelligenceOS — Executive score battery (§2.1, §17)
// ------------------------------------------------------------
// Computes the Command Center's 0..100 scores, each with explainable factor
// lines. Reuses the Link Intelligence health numbers (internal-link health,
// AEO readiness, backlink opportunity) rather than recomputing them. Pure.
// ============================================================

import { clamp } from './scoring';
import type {
  PageIntel, TechnicalIssue, KeywordRow, DecaySignal, SearchScores, ScoreBreakdown,
} from './types';

const avg = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export interface ScoreInputs {
  pages: PageIntel[];
  issues: TechnicalIssue[];
  keywords: KeywordRow[];
  decay: DecaySignal[];
  /** Reused from runLinkAgent(). */
  internalLinkHealth: number;
  aeoReadiness: number;
  backlinkOpportunityScore: number;
  backlinkProviderConnected: boolean;
}

const SEVERITY_PENALTY = { critical: 9, high: 4.5, medium: 2, low: 0.6, informational: 0.1 } as const;

function technicalScore(issues: TechnicalIssue[]): ScoreBreakdown {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };
  for (const i of issues) counts[i.severity] += 1;
  const penalty = (Object.keys(counts) as (keyof typeof counts)[])
    .reduce((sum, k) => sum + counts[k] * SEVERITY_PENALTY[k], 0);
  return {
    score: clamp(100 - penalty),
    factors: [
      `${counts.critical} critical, ${counts.high} high, ${counts.medium} medium issues.`,
      `Weighted penalty ${Math.round(penalty)} from ${issues.length} total findings.`,
    ],
  };
}

function indexabilityScore(pages: PageIntel[]): ScoreBreakdown {
  const indexable = pages.filter((p) => p.indexable);
  const inSitemap = indexable.filter((p) => p.inSitemap).length;
  const pct = indexable.length ? (inSitemap / indexable.length) * 100 : 100;
  const missing = indexable.length - inSitemap;
  return {
    score: clamp(pct),
    factors: [
      `${inSitemap}/${indexable.length} indexable pages are in the sitemap.`,
      missing > 0 ? `${missing} indexable page(s) missing from the sitemap.` : 'No indexable pages missing from the sitemap.',
    ],
  };
}

function contentAuthorityScore(pages: PageIntel[]): ScoreBreakdown {
  const owned = pages.filter((p) => p.wordCount !== null);
  const quality = avg(owned.map((p) => p.qualityScore));
  return {
    score: clamp(quality),
    factors: [
      `Average content quality ${Math.round(quality)}/100 across ${owned.length} pages with owned bodies.`,
      `${pages.filter((p) => p.hasDirectAnswer).length} pages have a direct-answer block.`,
    ],
  };
}

function keywordOpportunityScore(keywords: KeywordRow[]): ScoreBreakdown {
  const gaps = keywords.filter((k) => !k.hasOwnedPage);
  const opp = avg(gaps.map((k) => k.opportunityScore));
  return {
    score: clamp(opp),
    factors: [
      `${gaps.length} keyword gaps with no owned page (avg opportunity ${Math.round(opp)}/100).`,
      `${keywords.filter((k) => k.hasOwnedPage).length} keywords already have a target page.`,
    ],
  };
}

function growthMomentumScore(pages: PageIntel[], decay: DecaySignal[]): ScoreBreakdown {
  const authority = avg(pages.filter((p) => p.wordCount !== null).map((p) => p.qualityScore));
  const decayRisk = avg(decay.map((d) => d.riskScore));
  const score = clamp(authority * 0.5 + (100 - decayRisk) * 0.5);
  return {
    score,
    factors: [
      'Heuristic (no historical traffic yet) — connect Search Console for true momentum.',
      `${decay.length} pages flagged for structural decay risk.`,
    ],
  };
}

export function computeScores(inp: ScoreInputs): SearchScores {
  const technical = technicalScore(inp.issues);
  const indexability = indexabilityScore(inp.pages);
  const contentAuthority = contentAuthorityScore(inp.pages);
  const internalLinking: ScoreBreakdown = {
    score: clamp(inp.internalLinkHealth),
    factors: ['Reused from the Link Intelligence internal-link health model.'],
  };
  const keywordOpportunity = keywordOpportunityScore(inp.keywords);
  const aeoReadiness: ScoreBreakdown = {
    score: clamp(inp.aeoReadiness),
    factors: ['Reused from the Link Intelligence AEO/GEO citation-readiness model.'],
  };
  const backlinkAuthority: ScoreBreakdown = {
    score: clamp(inp.backlinkOpportunityScore),
    factors: [
      inp.backlinkProviderConnected
        ? 'From the connected link-data provider.'
        : 'Curated white-hat opportunity proxy — connect a provider for verified authority.',
    ],
  };
  const growthMomentum = growthMomentumScore(inp.pages, inp.decay);

  // Overall search health = weighted blend of the levers we can measure today.
  const healthScore = clamp(
    technical.score * 0.25 +
    indexability.score * 0.15 +
    contentAuthority.score * 0.2 +
    internalLinking.score * 0.2 +
    aeoReadiness.score * 0.2,
  );
  const searchHealth: ScoreBreakdown = {
    score: healthScore,
    factors: [
      `Technical ${technical.score}, Indexability ${indexability.score}, Content ${contentAuthority.score}, Internal links ${internalLinking.score}, AEO ${aeoReadiness.score}.`,
    ],
  };

  return {
    searchHealth, technical, indexability, contentAuthority, internalLinking,
    keywordOpportunity, aeoReadiness, backlinkAuthority, growthMomentum,
  };
}
