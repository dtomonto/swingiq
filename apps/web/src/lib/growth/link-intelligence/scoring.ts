// ============================================================
// Link Intelligence Agent — explainable scoring models
// ------------------------------------------------------------
// Every score is 0..100 and returns the human-readable factors behind it.
// NO black boxes — the UI shows the reasoning. Four models:
//   1. Internal-link opportunity  (source → destination)
//   2. Page equity                (business value vs current authority)
//   3. Backlink opportunity       (from explicit signal inputs)
//   4. AI-search citation         (from explicit signal inputs)
// Reuses GrowthOS's ICE priorityScore where a record carries PriorityInputs.
// ============================================================

import type { PageNode, AnchorKind, ScoreBreakdown } from './types';

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Anchor quality weight (0..1) — descriptive/partial/natural are healthiest. */
export const ANCHOR_QUALITY: Record<AnchorKind, number> = {
  'descriptive': 1.0,
  'natural': 0.95,
  'partial-match': 0.9,
  'branded': 0.7,
  'cta': 0.7,
  'navigational': 0.6,
  'exact-match': 0.55, // useful but over-use is a risk (guardrails handle that)
  'image-alt': 0.5,
  'generic': 0.3,
};

/** Business value of a destination page (0..100), priority + funnel + type. */
function businessValue(node: PageNode): number {
  const byPriority = [100, 100, 80, 60, 40, 25][node.priority] ?? 40;
  const funnelBonus = node.funnelStage === 'conversion' ? 15 : node.funnelStage === 'consideration' ? 8 : 0;
  const typeBonus =
    node.pageType === 'sport-hub' ? 12 :
    node.pageType === 'feature' || node.pageType === 'tool' ? 8 :
    node.pageType === 'seo-programmatic' ? 6 : 0;
  return clamp(byPriority * 0.7 + funnelBonus + typeBonus);
}

/** Current internal authority of a page (0..100), inbound links + crawl depth. */
function currentAuthority(node: PageNode): number {
  const inbound = Math.min(1, node.inboundCount / 6) * 70; // saturates ~6 inbound
  const depth = Number.isFinite(node.depth) ? Math.max(0, 1 - (node.depth - 1) / 4) * 30 : 0;
  return clamp(inbound + depth);
}

// ── 1. Internal-link opportunity ──────────────────────────────
export function scoreInternalLink(source: PageNode, dest: PageNode, anchorKind: AnchorKind): ScoreBreakdown {
  const factors: string[] = [];

  const destValue = businessValue(dest);
  factors.push(`Destination business value ${destValue}/100 (priority P${dest.priority}${dest.funnelStage ? `, ${dest.funnelStage}` : ''}).`);

  // SEO opportunity: pages with FEW inbound links benefit most from another link.
  const seoOpportunity = clamp((1 - Math.min(1, dest.inboundCount / 5)) * 100);
  factors.push(`Destination under-linked: ${dest.inboundCount} inbound now → opportunity ${seoOpportunity}/100.`);

  // Source authority: a strong, shallow source passes more equity.
  const srcAuthority = currentAuthority(source);
  factors.push(`Source authority ${srcAuthority}/100 (${source.inboundCount} inbound, depth ${Number.isFinite(source.depth) ? source.depth : '∞'}).`);

  // Relevance: same cluster is ideal; same sport is good.
  const relevance = source.cluster === dest.cluster ? 100 : source.sport === dest.sport ? 70 : source.sport === 'multi' || dest.sport === 'multi' ? 45 : 15;
  factors.push(`Topical relevance ${relevance}/100 (${source.cluster === dest.cluster ? 'same cluster' : source.sport === dest.sport ? 'same sport' : 'cross-topic'}).`);

  // Crawl-depth improvement: linking to a deep/orphan page helps most.
  const depthGain = !Number.isFinite(dest.depth) ? 100 : dest.depth >= 4 ? 80 : dest.depth >= 3 ? 50 : 15;
  factors.push(`Crawl-depth improvement ${depthGain}/100 (destination depth ${Number.isFinite(dest.depth) ? dest.depth : 'orphan'}).`);

  const anchor = ANCHOR_QUALITY[anchorKind];
  factors.push(`Anchor quality ${(anchor * 100).toFixed(0)}/100 (${anchorKind}).`);

  // Weighted blend.
  const raw =
    destValue * 0.22 +
    seoOpportunity * 0.22 +
    srcAuthority * 0.13 +
    relevance * 0.23 +
    depthGain * 0.12 +
    anchor * 100 * 0.08;

  // Relevance gate: irrelevant cross-topic links are never high value.
  const gated = relevance < 30 ? raw * 0.5 : raw;
  if (relevance < 30) factors.push('Relevance gate applied (cross-topic link capped).');

  return { score: clamp(gated), factors };
}

// ── 2. Page equity ────────────────────────────────────────────
export interface PageEquityResult extends ScoreBreakdown {
  businessValue: number;
  currentAuthority: number;
  /** Positive = under-supported (needs more inbound links). */
  need: number;
}

export function scorePageEquity(node: PageNode): PageEquityResult {
  const value = businessValue(node);
  const authority = currentAuthority(node);
  const need = clamp(value - authority);
  const factors = [
    `Business value ${value}/100 vs current internal authority ${authority}/100.`,
    need > 30
      ? `Under-supported by ${need} points — a high-value page with too little internal link equity.`
      : authority - value > 30
        ? 'Over-supported — receives more internal equity than its value warrants.'
        : 'Balanced — internal equity roughly matches page value.',
  ];
  return { score: need, businessValue: value, currentAuthority: authority, need, factors };
}

// ── 3. Backlink opportunity (explicit signals) ────────────────
export interface BacklinkSignals {
  relevance: number;        // 0..1 topical fit
  authorityProxy: number;   // 0..1 domain authority proxy
  trafficProxy: number;     // 0..1 estimated traffic
  editorialQuality: number; // 0..1
  linkLikelihood: number;   // 0..1 how attainable
  competitorGap: number;    // 0..1 (1 = competitor has it, we don't)
  spamRisk: number;         // 0..1 (subtracted)
}

export function scoreBacklinkOpportunity(s: BacklinkSignals): ScoreBreakdown {
  const factors = [
    `Relevance ${(s.relevance * 100).toFixed(0)} · authority ${(s.authorityProxy * 100).toFixed(0)} · traffic ${(s.trafficProxy * 100).toFixed(0)}.`,
    `Editorial quality ${(s.editorialQuality * 100).toFixed(0)} · link likelihood ${(s.linkLikelihood * 100).toFixed(0)} · competitor gap ${(s.competitorGap * 100).toFixed(0)}.`,
  ];
  const positive =
    s.relevance * 0.28 +
    s.authorityProxy * 0.18 +
    s.trafficProxy * 0.12 +
    s.editorialQuality * 0.14 +
    s.linkLikelihood * 0.16 +
    s.competitorGap * 0.12;
  const score = clamp((positive - s.spamRisk * 0.5) * 100);
  if (s.spamRisk > 0.3) factors.push(`Spam risk ${(s.spamRisk * 100).toFixed(0)} reduced the score (white-hat only).`);
  return { score, factors };
}

// ── 4. AI-search citation (explicit signals) ──────────────────
export interface CitationSignals {
  answerClarity: number;   // 0..1 direct answer present + clear
  factualDepth: number;    // 0..1
  schemaQuality: number;   // 0..1 schema present + correct type
  internalAuthority: number; // 0..1 (from page equity)
  structure: number;       // 0..1 FAQs / steps / lists
  sportSpecificity: number; // 0..1
}

export function scoreCitation(s: CitationSignals): ScoreBreakdown {
  const factors = [
    `Answer clarity ${(s.answerClarity * 100).toFixed(0)} · factual depth ${(s.factualDepth * 100).toFixed(0)} · structure ${(s.structure * 100).toFixed(0)}.`,
    `Schema ${(s.schemaQuality * 100).toFixed(0)} · internal authority ${(s.internalAuthority * 100).toFixed(0)} · sport specificity ${(s.sportSpecificity * 100).toFixed(0)}.`,
  ];
  const raw =
    s.answerClarity * 0.26 +
    s.factualDepth * 0.18 +
    s.schemaQuality * 0.16 +
    s.structure * 0.16 +
    s.internalAuthority * 0.12 +
    s.sportSpecificity * 0.12;
  return { score: clamp(raw * 100), factors };
}
