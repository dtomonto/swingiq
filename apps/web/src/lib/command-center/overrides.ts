// ============================================================
// Today's Command Center — owner overlay + roll-ups (PURE)
// ------------------------------------------------------------
// Merges the client-persisted owner state (in-progress / completed /
// snoozed / dismissed / notes) onto the generated recommendations, then
// derives the executive summary, the single "do this first" focus, and
// the section/tab buckets. Pure — no fs, no React.
// ============================================================

import type {
  OverrideMap,
  Recommendation,
  RecommendationView,
  RecommendationType,
} from './types';
import { ACTIONABLE_STATUSES } from './types';

/** Score must rise this much above the completed snapshot to "reopen". */
export const REOPEN_DELTA = 12;

/**
 * Apply the owner overlay. Snoozes that have expired silently revert to
 * active. A completed item whose score has since risen materially is marked
 * `reopened` (the underlying issue got worse) but kept in the completed set
 * so the owner can decide to act again.
 */
export function applyOverrides(
  recs: Recommendation[],
  overrides: OverrideMap,
  now: string = new Date().toISOString(),
): RecommendationView[] {
  const nowMs = new Date(now).getTime();
  return recs.map((r) => {
    const o = overrides[r.id];
    if (!o) return { ...r, status: 'active' as const };

    if (o.status === 'snoozed') {
      const until = o.snoozedUntil ? new Date(o.snoozedUntil).getTime() : 0;
      if (until > nowMs) {
        return { ...r, status: 'snoozed', snoozedUntil: o.snoozedUntil, note: o.note };
      }
      // Snooze expired → back to active.
      return { ...r, status: 'active', note: o.note };
    }

    if (o.status === 'completed') {
      const reopened =
        typeof o.scoreAtAction === 'number' && r.priorityScore >= o.scoreAtAction + REOPEN_DELTA;
      return {
        ...r,
        status: 'completed',
        completedAt: o.completedAt,
        note: o.note,
        reopened,
      };
    }

    if (o.status === 'dismissed') {
      return { ...r, status: 'dismissed', dismissedReason: o.dismissedReason, note: o.note };
    }

    // in_progress
    return { ...r, status: 'in_progress', note: o.note };
  });
}

/** Is a view eligible for the Today list / focus / counts of "needs attention"? */
export function isActionable(v: RecommendationView): boolean {
  return ACTIONABLE_STATUSES.includes(v.status);
}

export interface CommandCenterSummary {
  /** Actionable items right now. */
  needsAttention: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  inProgress: number;
  completed: number;
  snoozed: number;
  dismissed: number;
  /** Highest-scoring actionable data_gap (title) or null. */
  biggestDataGap: string | null;
  /** Highest-scoring actionable growth/SEO/conversion item or null. */
  biggestGrowthOpportunity: string | null;
  /** Highest-scoring actionable AI-quality item or null. */
  biggestAiRisk: string | null;
  /** The category the owner should focus on today, or null. */
  focusArea: string | null;
}

const GROWTH_TYPES: RecommendationType[] = ['seo_growth', 'conversion', 'retention', 'monetization'];
const DATA_TYPES: RecommendationType[] = ['data_gap', 'analytics_gap', 'user_feedback'];

function topActionableBy(
  views: RecommendationView[],
  types: RecommendationType[],
): RecommendationView | null {
  return (
    views
      .filter((v) => isActionable(v) && types.includes(v.recommendationType))
      .sort((a, b) => b.priorityScore - a.priorityScore)[0] ?? null
  );
}

export function summarize(views: RecommendationView[]): CommandCenterSummary {
  const actionable = views.filter(isActionable);
  const focus = pickDailyFocus(views);
  return {
    needsAttention: actionable.length,
    critical: actionable.filter((v) => v.priorityBand === 'critical').length,
    high: actionable.filter((v) => v.priorityBand === 'high').length,
    medium: actionable.filter((v) => v.priorityBand === 'medium').length,
    low: actionable.filter((v) => v.priorityBand === 'low').length,
    inProgress: views.filter((v) => v.status === 'in_progress').length,
    completed: views.filter((v) => v.status === 'completed').length,
    snoozed: views.filter((v) => v.status === 'snoozed').length,
    dismissed: views.filter((v) => v.status === 'dismissed').length,
    biggestDataGap: topActionableBy(views, DATA_TYPES)?.title ?? null,
    biggestGrowthOpportunity: topActionableBy(views, GROWTH_TYPES)?.title ?? null,
    biggestAiRisk: topActionableBy(views, ['ai_quality', 'feature_readiness'])?.title ?? null,
    focusArea: focus?.category ?? null,
  };
}

/** The single highest-priority actionable item — "do this first today". */
export function pickDailyFocus(views: RecommendationView[]): RecommendationView | null {
  return (
    views
      .filter(isActionable)
      .sort((a, b) => b.priorityScore - a.priorityScore || a.dueDate.localeCompare(b.dueDate))[0] ?? null
  );
}

export type SectionId =
  | 'today'
  | 'critical'
  | 'data'
  | 'ai'
  | 'growth'
  | 'content'
  | 'product'
  | 'completed'
  | 'snoozed'
  | 'dismissed';

/** Which sections a given view belongs to (a view can appear in several). */
export function sectionsFor(v: RecommendationView): SectionId[] {
  if (v.status === 'completed') return ['completed'];
  if (v.status === 'dismissed') return ['dismissed'];
  if (v.status === 'snoozed') return ['snoozed'];

  const out: SectionId[] = ['today'];
  if (v.priorityBand === 'critical') out.push('critical');
  if (DATA_TYPES.includes(v.recommendationType)) out.push('data');
  if (v.recommendationType === 'ai_quality' || v.recommendationType === 'feature_readiness') out.push('ai');
  if (GROWTH_TYPES.includes(v.recommendationType)) out.push('growth');
  if (v.recommendationType === 'content_gap' || v.recommendationType === 'tutorial_gap' || v.recommendationType === 'documentation')
    out.push('content');
  if (v.recommendationType === 'product_quality' || v.recommendationType === 'performance' || v.recommendationType === 'system_health' || v.recommendationType === 'testing')
    out.push('product');
  return out;
}
