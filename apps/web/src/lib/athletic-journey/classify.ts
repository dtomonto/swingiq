// ============================================================
// SwingVantage — Athletic Journey: stage classification engine
// ------------------------------------------------------------
// Classifies an athlete into a sport-specific stage from a BLEND of
// sources — optional rating, self-report, and performance — never a
// single metric. Missing sources drop out and lower confidence
// (redistributing weight). Elite/professional tiers are guarded so
// they can't be claimed from self-report or one strong signal.
// Pure & deterministic — fully unit-testable.
// ============================================================

import type {
  CategoryScore,
  ClassificationCategory,
  ConfidenceLevel,
  EvidenceItem,
  JourneyProfileSignals,
  JourneySignals,
  PerformanceMetric,
  SelfAssessment,
  SignalBasis,
  SportJourneyConfig,
  StageDefinition,
} from './types';
import { JOURNEY_THRESHOLDS as T } from './config/thresholds';
import { getStageByOrder } from './config';
import { GOLF_CONFIG } from './config/golf';
import { assessmentToScore, clamp, mean, weightedMean } from './util';

const BASIS_RANK: Record<SignalBasis, number> = {
  measured: 3,
  analyzed: 2,
  self_reported: 1,
  estimated: 0,
};

function bestBasis(bases: SignalBasis[]): SignalBasis | null {
  if (!bases.length) return null;
  return bases.reduce((a, b) => (BASIS_RANK[b] > BASIS_RANK[a] ? b : a));
}

// ── Self-report → approximate stage order ─────────────────────

const SKILL_ORDER: Record<NonNullable<JourneyProfileSignals['selfRatedSkill']>, number> = {
  beginner: 1,
  intermediate: 4,
  advanced: 6,
  elite: 8,
};

const COMPETITION_ORDER: Record<NonNullable<JourneyProfileSignals['competitionLevel']>, number> = {
  none: 2,
  recreational: 2,
  club: 4,
  league: 5,
  tournament: 7,
  collegiate: 9,
  professional: 10,
};

function golfScoreToOrder(score: number): number {
  if (score >= 120) return 1;
  if (score >= 110) return 1;
  if (score >= 100) return 2;
  if (score >= 95) return 3;
  if (score >= 90) return 4;
  if (score >= 85) return 5;
  if (score >= 80) return 6;
  if (score >= 75) return 7;
  if (score >= 72) return 8;
  return 9;
}

function selfReportOrder(
  profile: JourneyProfileSignals,
  config: SportJourneyConfig,
): number | null {
  const parts: number[] = [];
  if (profile.selfRatedSkill) parts.push(SKILL_ORDER[profile.selfRatedSkill]);
  if (profile.competitionLevel) parts.push(COMPETITION_ORDER[profile.competitionLevel]);
  if (config.sport === 'golf' && profile.typicalScore != null) {
    parts.push(golfScoreToOrder(profile.typicalScore));
  }
  return parts.length ? mean(parts) : null;
}

// ── Category scoring ──────────────────────────────────────────

interface CategoryContribution {
  score: number; // 0..100
  weight: number; // confidence-derived weight
  basis: SignalBasis;
}

function metricsForCategory(metrics: PerformanceMetric[], cat: ClassificationCategory) {
  return metrics.filter((m) => m.category === cat && typeof m.score === 'number');
}

function assessmentsForCategory(
  assessments: SelfAssessment[],
  cat: ClassificationCategory,
  config: SportJourneyConfig,
): SelfAssessment[] {
  const branchIds = new Set(config.branches.filter((b) => b.category === cat).map((b) => b.id));
  return assessments.filter((a) => branchIds.has(a.branchId));
}

/** Score a single classification category 0..100 from all feeding signals. */
function scoreCategory(
  cat: ClassificationCategory,
  signals: JourneySignals,
  config: SportJourneyConfig,
): CategoryScore {
  const contributions: CategoryContribution[] = [];

  for (const m of metricsForCategory(signals.metrics, cat)) {
    contributions.push({ score: clamp(m.score!, 0, 100), weight: m.confidence, basis: m.basis });
  }
  for (const a of assessmentsForCategory(signals.selfAssessments, cat, config)) {
    contributions.push({ score: assessmentToScore(a.rating), weight: 0.35, basis: 'self_reported' });
  }

  if (!contributions.length) {
    return { category: cat, score: null, confidence: 0, basis: null, signalCount: 0 };
  }

  const score = weightedMean(contributions.map((c) => [c.score, c.weight]));
  const basis = bestBasis(contributions.map((c) => c.basis));
  // Confidence rises with the best signal quality and the number of signals,
  // but is capped: more corroboration never fully removes single-camera doubt.
  const avgWeight = mean(contributions.map((c) => c.weight));
  const countBonus = clamp(contributions.length / 4, 0, 1);
  const confidence = clamp(avgWeight * (0.6 + 0.4 * countBonus), 0, 0.95);

  return {
    category: cat,
    score: Math.round(score),
    confidence,
    basis,
    signalCount: contributions.length,
  };
}

export function scoreAllCategories(
  signals: JourneySignals,
  config: SportJourneyConfig,
): CategoryScore[] {
  return config.categories.map((cat) => scoreCategory(cat, signals, config));
}

// ── Performance index → stage order ───────────────────────────

function performanceOrder(
  categoryScores: CategoryScore[],
  config: SportJourneyConfig,
): { order: number | null; coverage: number } {
  const weightKeys = Object.keys(config.weights) as ClassificationCategory[];
  const pairs: Array<[number, number]> = [];
  let covered = 0;
  let totalWeight = 0;
  for (const cat of weightKeys) {
    const w = config.weights[cat] ?? 0;
    totalWeight += w;
    const cs = categoryScores.find((c) => c.category === cat);
    if (cs && cs.score !== null && cs.confidence >= T.categoryCoveredAt) {
      pairs.push([cs.score, w * cs.confidence]);
      covered += w;
    }
  }
  const coverage = totalWeight > 0 ? covered / totalWeight : 0;
  if (!pairs.length) return { order: null, coverage };
  const perfIndex = weightedMean(pairs); // 0..100
  const { minOrder, maxOrder } = T.performanceOrder;
  const order = minOrder + (perfIndex / 100) * (maxOrder - minOrder);
  return { order: clamp(order, 0, T.maxOrder), coverage };
}

// ── Competitive evidence guard ────────────────────────────────

function hasCompetitiveEvidence(signals: JourneySignals): boolean {
  const lvl = signals.profile.competitionLevel;
  if (lvl === 'tournament' || lvl === 'collegiate' || lvl === 'professional') return true;
  if (signals.activity.loggedCompetitions >= 5) return true;
  if (signals.rating?.source === 'verified') return true;
  if (signals.metrics.some((m) => m.category === 'competitive' && m.basis === 'measured')) return true;
  return false;
}

// ── Confidence ────────────────────────────────────────────────

export interface ClassificationResult {
  currentStage: StageDefinition;
  nextStage: StageDefinition | null;
  stageOrderEstimate: number; // fractional 0..10
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0..1
  categoryScores: CategoryScore[];
  presentSources: Array<'rating' | 'selfReport' | 'performance'>;
  redistributedWeight: boolean;
  priorityCategory: ClassificationCategory | null;
  primaryStrengths: EvidenceItem[];
  developmentGaps: EvidenceItem[];
  contradictoryEvidence: EvidenceItem[];
  ratingImpliedOrder: number | null;
  performanceImpliedOrder: number | null;
}

function bandConfidence(score: number): ConfidenceLevel {
  if (score >= T.confidenceBands.high) return 'high';
  if (score >= T.confidenceBands.medium) return 'medium';
  if (score >= T.confidenceBands.low) return 'low';
  return 'provisional';
}

const CATEGORY_LABEL: Record<ClassificationCategory, string> = {
  scoring: 'scoring',
  technique: 'technique',
  consistency: 'consistency',
  finesse: 'short game & touch',
  movement: 'movement & athleticism',
  tactical: 'strategy & decisions',
  practice: 'practice discipline',
  mental: 'mental & pressure performance',
  competitive: 'competitive results',
};

function evidenceText(cs: CategoryScore): string {
  const label = CATEGORY_LABEL[cs.category];
  return `Your ${label} scores ${cs.score}/100 from your analyzed data.`;
}

/** Classify an athlete into a stage from blended, multi-signal evidence. */
export function classifyPlayerStage(
  signals: JourneySignals,
  config: SportJourneyConfig,
): ClassificationResult {
  const categoryScores = scoreAllCategories(signals, config);

  // 1) Source-implied orders.
  const ratingImpliedOrder = signals.rating ? config.ratingToStageOrder(signals.rating) : null;
  const selfOrder = selfReportOrder(signals.profile, config);
  const perf = performanceOrder(categoryScores, config);
  const performanceImpliedOrder = perf.order;

  // 2) Blend present sources (renormalized weights).
  const presentSources: ClassificationResult['presentSources'] = [];
  const blendPairs: Array<[number, number]> = [];
  if (ratingImpliedOrder !== null) {
    presentSources.push('rating');
    blendPairs.push([ratingImpliedOrder, T.sourceWeights.rating]);
  }
  if (selfOrder !== null) {
    presentSources.push('selfReport');
    blendPairs.push([selfOrder, T.sourceWeights.selfReport]);
  }
  if (performanceImpliedOrder !== null) {
    presentSources.push('performance');
    blendPairs.push([performanceImpliedOrder, T.sourceWeights.performance]);
  }

  let rawOrder = blendPairs.length ? weightedMean(blendPairs) : 0;

  // 3) Guardrails — elite/pro cannot be claimed cheaply.
  const competitive = hasCompetitiveEvidence(signals);
  const verified = signals.rating?.source === 'verified';
  if (!competitive && rawOrder > T.guards.nonCompetitiveCap) {
    rawOrder = T.guards.nonCompetitiveCap;
  }
  if (!verified && rawOrder >= T.guards.proOrder) {
    rawOrder = Math.min(rawOrder, T.guards.eliteOrder); // pro requires verification
  }
  if (!competitive && rawOrder > T.guards.unverifiedEliteCap) {
    rawOrder = T.guards.unverifiedEliteCap;
  }

  const stageOrderEstimate = clamp(rawOrder, 0, T.maxOrder);
  const currentStage = getStageByOrder(config.sport, stageOrderEstimate)!;
  const nextStage = currentStage.order < T.maxOrder
    ? getStageByOrder(config.sport, currentStage.order + 1)
    : null;

  // 4) Confidence — blend source quality, category coverage, recency.
  const sourceConfPairs: Array<[number, number]> = [];
  if (ratingImpliedOrder !== null && signals.rating) {
    const rc = T.sourceConfidence.rating[signals.rating.source] ?? 0.5;
    sourceConfPairs.push([rc, T.sourceWeights.rating]);
  }
  if (selfOrder !== null) sourceConfPairs.push([T.sourceConfidence.selfReport, T.sourceWeights.selfReport]);
  if (performanceImpliedOrder !== null) {
    sourceConfPairs.push([T.sourceConfidence.performance * (0.5 + 0.5 * perf.coverage), T.sourceWeights.performance]);
  }
  const sourcePart = sourceConfPairs.length ? weightedMean(sourceConfPairs) : 0;
  const coverageFactor = 0.55 + 0.45 * perf.coverage;
  const days = signals.activity.lastActiveAt
    ? Math.max(0, (Date.now() - Date.parse(signals.activity.lastActiveAt)) / 86_400_000)
    : null;
  const recencyFactor = days === null ? 0.85 : clamp(1 - (days / 90) * 0.3, 0.7, 1);

  let confidenceScore = clamp(sourcePart * coverageFactor * recencyFactor, 0, 0.97);

  // Provisional when there's essentially nothing but a self-rating.
  const totalEvidence = signals.metrics.length + signals.selfAssessments.length;
  const totalActivity = signals.activity.practiceSessions + signals.activity.videoUploads + signals.activity.loggedCompetitions;
  const onlySelfReport = presentSources.length === 1 && presentSources[0] === 'selfReport';
  if (presentSources.length === 0 || (onlySelfReport && totalEvidence === 0 && totalActivity === 0)) {
    confidenceScore = Math.min(confidenceScore, T.confidenceBands.low - 0.05);
  }
  const confidence = bandConfidence(confidenceScore);

  // 5) Evidence: strengths, gaps, contradictions, priority.
  const covered = categoryScores.filter((c) => c.score !== null && c.confidence >= T.categoryCoveredAt);
  const primaryStrengths: EvidenceItem[] = covered
    .filter((c) => (c.score ?? 0) >= T.strengthAt)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3)
    .map((c) => ({ category: c.category, text: evidenceText(c), basis: c.basis ?? 'estimated' }));

  const developmentGaps: EvidenceItem[] = covered
    .filter((c) => (c.score ?? 100) <= T.gapBelow)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 3)
    .map((c) => ({ category: c.category, text: evidenceText(c), basis: c.basis ?? 'estimated' }));

  // Priority = weighted category with the lowest covered score (keystone weakness).
  const weightKeys = Object.keys(config.weights) as ClassificationCategory[];
  const priority = covered
    .filter((c) => weightKeys.includes(c.category))
    .sort((a, b) => {
      const sa = (a.score ?? 0) - (config.weights[a.category] ?? 0) * 10;
      const sb = (b.score ?? 0) - (config.weights[b.category] ?? 0) * 10;
      return sa - sb;
    })[0];
  const priorityCategory = priority?.category ?? null;

  // Contradictory evidence: a covered category well below the assigned stage's
  // expected level, or rating above performance.
  const expectedForStage = clamp(40 + currentStage.order * 5.5, 0, 100);
  const contradictoryEvidence: EvidenceItem[] = covered
    .filter((c) => (c.score ?? 100) <= expectedForStage - 18)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 2)
    .map((c) => ({
      category: c.category,
      text: `Your ${CATEGORY_LABEL[c.category]} (${c.score}/100) is below what's typical for ${currentStage.name}.`,
      basis: c.basis ?? 'estimated',
    }));

  return {
    currentStage,
    nextStage,
    stageOrderEstimate: Math.round(stageOrderEstimate * 10) / 10,
    confidence,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    categoryScores,
    presentSources,
    redistributedWeight: perf.coverage < 1 && perf.order !== null,
    priorityCategory,
    primaryStrengths,
    developmentGaps,
    contradictoryEvidence,
    ratingImpliedOrder,
    performanceImpliedOrder: performanceImpliedOrder === null ? null : Math.round(performanceImpliedOrder * 10) / 10,
  };
}

/** Standalone confidence helper (also used by the engine's API surface). */
export function calculateStageConfidence(
  signals: JourneySignals,
  config: SportJourneyConfig,
): { level: ConfidenceLevel; score: number } {
  const r = classifyPlayerStage(signals, config);
  return { level: r.confidence, score: r.confidenceScore };
}

// Re-export so callers needn't import the default golf config separately in
// tests that only need a config handle.
export { GOLF_CONFIG };
