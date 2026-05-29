// ============================================================
// SwingIQ — Responsible Learning Layer
// Tracks recommendation effectiveness WITHOUT exposing
// private user data or training global models on user videos.
//
// All insights are aggregated by SEGMENT (e.g. "beginner_driver")
// never by individual user, and never include video data.
// ============================================================

import type {
  RecommendationOutcome,
  LearningInsight,
  ImprovementResult,
} from './types';

// ──────────────────────────────────────────────────────────────
// Outcome recording helpers
// ──────────────────────────────────────────────────────────────

export function createOutcome(params: {
  user_id: string;
  recommendation_id: string;
  benchmark_version: string;
  skill_level: string;
  club_category: string;
  issue_category: string;
  drill_type: string;
  user_rating?: number;
  completed?: boolean;
  reported_improvement?: ImprovementResult;
  follow_up_metric_change?: number;
}): RecommendationOutcome {
  const segment = `${params.skill_level}_${params.club_category}`;

  return {
    id: `outcome_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    user_id: params.user_id,
    recommendation_id: params.recommendation_id,
    benchmark_version: params.benchmark_version,
    golfer_segment: segment,
    issue_category: params.issue_category,
    drill_type: params.drill_type,
    user_rating: params.user_rating ?? null,
    completed: params.completed ?? false,
    reported_improvement: params.reported_improvement ?? 'not_measured',
    follow_up_metric_change: params.follow_up_metric_change ?? null,
    created_at: new Date().toISOString(),
  };
}

// ──────────────────────────────────────────────────────────────
// Aggregate analysis (operates on segment-level data, not PII)
// ──────────────────────────────────────────────────────────────

export interface SegmentStats {
  segment: string;
  total_outcomes: number;
  completion_rate: number;        // 0–1
  avg_rating: number;             // 1–5
  improvement_rate: number;       // % reporting improvement
  top_effective_drills: string[];
  top_ineffective_drills: string[];
}

export function analyzeSegment(outcomes: RecommendationOutcome[]): SegmentStats | null {
  if (outcomes.length === 0) return null;

  const segment = outcomes[0].golfer_segment;
  const completed = outcomes.filter((o) => o.completed);
  const rated = outcomes.filter((o) => o.user_rating !== null);
  const improved = outcomes.filter((o) => o.reported_improvement === 'improved');

  const drillCounts = new Map<string, { good: number; bad: number }>();
  for (const o of outcomes) {
    if (!drillCounts.has(o.drill_type)) drillCounts.set(o.drill_type, { good: 0, bad: 0 });
    const counts = drillCounts.get(o.drill_type)!;
    if (o.reported_improvement === 'improved') counts.good++;
    else if (o.reported_improvement === 'regressed') counts.bad++;
  }

  const effective = [...drillCounts.entries()]
    .filter(([, c]) => c.good > c.bad)
    .sort((a, b) => b[1].good - a[1].good)
    .slice(0, 3)
    .map(([drill]) => drill);

  const ineffective = [...drillCounts.entries()]
    .filter(([, c]) => c.bad >= c.good && c.bad > 0)
    .sort((a, b) => b[1].bad - a[1].bad)
    .slice(0, 3)
    .map(([drill]) => drill);

  return {
    segment,
    total_outcomes: outcomes.length,
    completion_rate: completed.length / outcomes.length,
    avg_rating:
      rated.length > 0
        ? rated.reduce((sum, o) => sum + (o.user_rating ?? 0), 0) / rated.length
        : 0,
    improvement_rate: improved.length / outcomes.length,
    top_effective_drills: effective,
    top_ineffective_drills: ineffective,
  };
}

// ──────────────────────────────────────────────────────────────
// Generate LearningInsights from aggregated outcomes
// ──────────────────────────────────────────────────────────────

export function generateLearningInsights(
  stats: SegmentStats[],
  benchmark_version: string,
): LearningInsight[] {
  const insights: LearningInsight[] = [];
  const now = new Date().toISOString();

  for (const stat of stats) {
    // Low completion insight
    if (stat.completion_rate < 0.3 && stat.total_outcomes >= 10) {
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        insight_type: 'engagement',
        segment: stat.segment,
        source_type: 'internal_feedback',
        evidence_level: stat.total_outcomes >= 30 ? 'preliminary' : 'anecdotal',
        summary: `${Math.round(stat.completion_rate * 100)}% drill completion rate in ${stat.segment} segment`,
        recommended_action: 'Review drill complexity — may be too hard for this segment',
        related_benchmark_version: benchmark_version,
        created_at: now,
      });
    }

    // High improvement rate
    if (stat.improvement_rate > 0.6 && stat.total_outcomes >= 10) {
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        insight_type: 'drill_effectiveness',
        segment: stat.segment,
        source_type: 'internal_feedback',
        evidence_level: stat.total_outcomes >= 50 ? 'moderate' : 'preliminary',
        summary: `${Math.round(stat.improvement_rate * 100)}% improvement rate in ${stat.segment}`,
        recommended_action: 'Current drill recommendations are well-matched for this segment',
        related_benchmark_version: benchmark_version,
        created_at: now,
      });
    }

    // Ineffective drills
    if (stat.top_ineffective_drills.length > 0) {
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        insight_type: 'drill_effectiveness',
        segment: stat.segment,
        source_type: 'internal_feedback',
        evidence_level: 'preliminary',
        summary: `Drills with low effectiveness in ${stat.segment}: ${stat.top_ineffective_drills.join(', ')}`,
        recommended_action: 'Consider updating or replacing these drills in the next research cycle',
        related_benchmark_version: benchmark_version,
        created_at: now,
      });
    }
  }

  return insights;
}

// ──────────────────────────────────────────────────────────────
// Privacy-safe export (removes all user_id references)
// Used for admin-level aggregate reporting only
// ──────────────────────────────────────────────────────────────

export function anonymizeOutcomes(
  outcomes: RecommendationOutcome[],
): Omit<RecommendationOutcome, 'user_id'>[] {
  return outcomes.map(({ user_id: _removed, ...rest }) => rest);
}
