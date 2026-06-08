// ============================================================
// CentralIntelligenceOS — Coach Mix: Recommendation Integration
// ------------------------------------------------------------
// Bias the EXISTING DrillMatch ranking with a resolved CoachingStrategy,
// then assemble the user-facing "Curated Swing Drills for Your Current
// Game" recommendation. We never fabricate drills — DrillMatch (which
// reuses the per-sport drill libraries) produces the candidates; this
// layer only re-weights and EXPLAINS them in the mix's voice.
//
// User-safety: coach names never appear here unless the strategy says
// the admin opted in (`coachNamesVisible`). The default "why" is the
// neutral influence framing ("...an athletic, rotational model").
// ============================================================

import type { RankedDrill } from '@/lib/drillmatch';
import type { CoachingStrategy, StyleTag } from './types';
import { MAX_USER_DRILLS } from './config';

/** A DrillMatch result re-scored through the active coach mix. */
export interface CoachInfluencedDrill {
  drill: RankedDrill['drill'];
  baseScore: number;
  coachScore: number;
  influenceMultiplier: number;
  /** Influence-framed reason — never a coach name by default. */
  why: string;
  directHit: boolean;
}

/** The complete, deliberately-focused recommendation shown to a user. */
export interface CuratedRecommendation {
  topIssue: string;
  whyItMatters: string;
  firstDrill: CoachInfluencedDrill | null;
  whatToFeel: string;
  whatSuccessLooksLike: string;
  howToRetest: string;
  howItConnectsToYourGame: string;
  alternatives: CoachInfluencedDrill[];
  influenceSummary: string;
  influenceTags: StyleTag[];
  coachNamesVisible: boolean;
}

/** Lower-cased word tokens, for fuzzy category↔drill matching. */
function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

/**
 * How strongly the active mix favors a given drill: the max bias multiplier
 * across the strategy's drill-category weights whose tokens overlap the
 * drill's families / fault ids. Baseline 1.0 (no opinion).
 */
function influenceMultiplierFor(
  drill: RankedDrill['drill'],
  strategy: CoachingStrategy,
): { multiplier: number; matchedCategory: string | null } {
  const drillTokens = new Set([
    ...drill.families.flatMap(tokens),
    ...drill.faultIds.flatMap(tokens),
  ]);
  let best = 1;
  let matched: string | null = null;
  for (const [category, weight] of Object.entries(strategy.drillCategoryWeights)) {
    const catTokens = tokens(category);
    const overlaps = catTokens.some((t) => drillTokens.has(t));
    if (overlaps && weight > best) {
      best = weight;
      matched = category;
    }
  }
  return { multiplier: best, matchedCategory: matched };
}

/**
 * Re-rank DrillMatch output through the coach mix. Pure and deterministic;
 * returns at most MAX_USER_DRILLS, highest coach-weighted score first.
 */
export function biasRankedDrills(
  ranked: RankedDrill[],
  strategy: CoachingStrategy,
  limit: number = MAX_USER_DRILLS,
): CoachInfluencedDrill[] {
  const influenced = ranked.map((r) => {
    const { multiplier, matchedCategory } = influenceMultiplierFor(r.drill, strategy);
    const coachScore = Math.round(r.score * multiplier);
    const why =
      multiplier > 1 && matchedCategory
        ? `Favored by your coach mix — it builds "${matchedCategory}", which fits ${strategy.influenceSummary.replace(/^This recommendation is influenced by /, 'your ').replace(/\.$/, '')}.`
        : `A solid match for your current priority${r.directHit ? ' (directly targets the diagnosed fault)' : ''}.`;
    return {
      drill: r.drill,
      baseScore: r.score,
      coachScore,
      influenceMultiplier: multiplier,
      why,
      directHit: r.directHit,
    };
  });
  return influenced
    .sort((a, b) => b.coachScore - a.coachScore)
    .slice(0, Math.max(1, limit));
}

export interface CuratedRecommendationInput {
  /** The diagnosed top issue (plain language). */
  topIssue: string;
  /** Why this issue matters for the player (plain language). */
  whyItMatters?: string;
  /** Optional feel cue; falls back to the lead drill's own cue. */
  feelCue?: string;
}

/**
 * Assemble the focused, 7-part recommendation. Leads with ONE fix; the rest
 * are alternatives for users who want options (never an overwhelming wall).
 */
export function buildCuratedRecommendation(
  input: CuratedRecommendationInput,
  strategy: CoachingStrategy,
  ranked: RankedDrill[],
): CuratedRecommendation {
  const drills = biasRankedDrills(ranked, strategy);
  const first = drills[0] ?? null;

  return {
    topIssue: input.topIssue,
    whyItMatters:
      input.whyItMatters ??
      'It is the single change most likely to move your current ball flight and scores.',
    firstDrill: first,
    whatToFeel:
      input.feelCue ?? first?.drill.feelCue ?? 'Move smoothly and let the change feel athletic, not forced.',
    whatSuccessLooksLike: first
      ? `Success: ${first.drill.goal}`
      : 'Success: the pattern is noticeably reduced and no longer your top priority.',
    howToRetest: strategy.retestProtocol,
    howItConnectsToYourGame: `This works on your top priority (${input.topIssue}) in a way that matches ${strategy.influenceSummary.replace(/^This recommendation is influenced by /, '').replace(/\.$/, '')}.`,
    alternatives: drills.slice(1),
    influenceSummary: strategy.influenceSummary,
    influenceTags: strategy.influenceTags,
    coachNamesVisible: strategy.coachNamesVisible,
  };
}
