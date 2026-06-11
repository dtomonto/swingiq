// ============================================================
// SignalRadar OS — scoring engine (PURE, deterministic, transparent)
// ------------------------------------------------------------
// Computes four 0–100 scores for every signal:
//   • confidence       — how sure the classifier is of its labels
//   • sourceReliability — how authoritative/trustworthy the source is
//   • relevance         — how relevant to SwingVantage the signal is
//   • priority          — the composite "act on this first" score
//
// Priority is a weighted sum of named factors (config.weights), capped
// at 100, with the contribution of each factor returned so the admin
// can SEE why a signal scored the way it did. No magic numbers hidden.
// ============================================================

import type {
  NormalizedSignal,
  SignalClassification,
  SignalScores,
  ScoringWeights,
  SignalSourceType,
  AudienceType,
} from './types';

/** Baseline trust per source type (0–1), refined by link/domain signals. */
const SOURCE_TRUST: Record<SignalSourceType, number> = {
  search_console: 0.95,
  analytics: 0.9,
  blog_news: 0.8,
  backlink: 0.8,
  search: 0.7,
  rss: 0.7,
  google_alerts: 0.7,
  support: 0.75,
  youtube: 0.6,
  reddit: 0.55,
  social: 0.5,
  ai_answer_engine: 0.65,
  competitor: 0.6,
  webhook: 0.6,
  manual: 0.5,
  csv: 0.5,
};

const AUDIENCE_RELEVANCE: Record<AudienceType, number> = {
  coach: 1,
  parent: 0.9,
  team_league: 0.9,
  sports_tech_buyer: 0.95,
  recreational_athlete: 0.8,
  creator: 0.85,
  blogger_media: 0.85,
  competitor: 0.3,
  unknown: 0.4,
};

const DEMAND_INTENTS = new Set([
  'seo_content_opportunity',
  'coaching_need',
  'purchase_comparison',
  'product_question',
  'feature_request',
]);

const HALF_LIFE_DAYS = 30;

function recencyFactor(nowIso: string, signal: NormalizedSignal): number {
  const ref = signal.publishedAt ?? signal.discoveredAt;
  const ageMs = Date.parse(nowIso) - Date.parse(ref);
  if (!Number.isFinite(ageMs) || ageMs < 0) return 1;
  const ageDays = ageMs / 86_400_000;
  // Exponential decay with a 30-day half-life, clamped to [0,1].
  return Math.min(1, Math.max(0, Math.pow(0.5, ageDays / HALF_LIFE_DAYS)));
}

export function computeSourceReliability(signal: NormalizedSignal): number {
  let base = SOURCE_TRUST[signal.sourceType] ?? 0.5;
  if (signal.sourceUrl || signal.linkedUrls.length) base += 0.05;
  if (signal.authorUrl) base += 0.03;
  // Known low-trust hint: no URL on a "web" source dampens trust.
  if (!signal.sourceUrl && signal.collectionMethod === 'manual') base -= 0.05;
  return clampPct(base * 100);
}

export function computeRelevance(c: SignalClassification): number {
  let r = 30;
  if (c.brandTermsMatched.length) r += 35;
  if (c.sport !== 'unknown') r += 12;
  if (c.sportTermsMatched.length) r += 8;
  if (c.competitorTermsMatched.length) r += 10;
  if (DEMAND_INTENTS.has(c.intent)) r += 12;
  if (c.intent === 'spam_noise') r = 5;
  return clampPct(r);
}

export function computeConfidence(c: SignalClassification): number {
  if (c.method === 'manual_override') return 100;
  let conf = 35;
  conf += Math.min(20, c.brandTermsMatched.length * 12);
  conf += Math.min(12, c.sportTermsMatched.length * 6);
  conf += Math.min(10, c.competitorTermsMatched.length * 6);
  if (c.sentiment !== 'neutral' && c.sentiment !== 'unknown') conf += 10;
  if (c.sport !== 'unknown') conf += 6;
  if (c.intent !== 'brand_mention') conf += 8;
  conf += Math.min(9, Math.max(0, c.rationale.length - 1) * 3);
  return clampPct(conf);
}

export function computePriority(
  signal: NormalizedSignal,
  c: SignalClassification,
  weights: ScoringWeights,
  nowIso: string,
): { priority: number; factors: { label: string; points: number }[] } {
  const factors: { label: string; points: number }[] = [];
  const add = (label: string, points: number) => {
    if (points > 0) factors.push({ label, points: Math.round(points) });
  };

  if (c.brandTermsMatched.length) add('Direct brand mention', weights.directBrandMention);
  if (signal.linkedUrls.length || signal.sourceUrl) add('Includes a link', weights.hasLink);

  if (c.sentiment === 'negative') add('Negative / reputation risk', weights.sentimentRisk);
  else if (c.sentiment === 'mixed') add('Mixed sentiment', weights.sentimentRisk * 0.5);

  const trust = (SOURCE_TRUST[signal.sourceType] ?? 0.5);
  add('Source authority', weights.sourceAuthority * trust);

  add('Audience relevance', weights.audienceRelevance * AUDIENCE_RELEVANCE[c.audience]);

  const rec = recencyFactor(nowIso, signal);
  add('Recency', weights.recency * rec);

  if (DEMAND_INTENTS.has(c.intent)) add('Product-market demand', weights.demandSignal);
  if (c.competitorTermsMatched.length) add('Competitor mentioned', weights.competitorMention);
  if (c.sport !== 'unknown') add('Maps to a sport', weights.sportMapped);

  let raw = factors.reduce((s, f) => s + f.points, 0);
  // Spam/noise is forced low regardless of incidental matches.
  if (c.intent === 'spam_noise') raw = Math.min(raw, 8);

  return { priority: clampPct(raw), factors };
}

export function computeScores(
  signal: NormalizedSignal,
  c: SignalClassification,
  weights: ScoringWeights,
  nowIso: string,
): SignalScores {
  const { priority, factors } = computePriority(signal, c, weights, nowIso);
  return {
    confidence: computeConfidence(c),
    priority,
    sourceReliability: computeSourceReliability(signal),
    relevance: computeRelevance(c),
    priorityFactors: factors,
  };
}

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
