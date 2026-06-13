// ============================================================
// SwingVantage — Educational Link Registry
// ------------------------------------------------------------
// Maps "educational topics" to their canonical explainer page plus the
// hover/aria help text. Used by <EducationalLink /> so every place that
// links "heuristic data" or "AI" points at the SAME page with the SAME
// accessible description — and so new topics are a one-line addition.
//
// This is intentionally a SMALL, curated set of topics (not a giant
// auto-linker). The UX rule is: link the FIRST meaningful instance in a
// paragraph/card/section — never every occurrence. Keeping the topic
// surface small makes that easy to honor.
// ============================================================

import { technologyClaims } from '@/content/technologyClaims';

/** A topic an EducationalLink can point at. */
export type EducationalTerm = 'heuristic-data' | 'ai-sports';

export interface EducationalTopic {
  /** Canonical destination page. */
  href: string;
  /** Default visible link label (callers can override with children). */
  defaultLabel: string;
  /** Short tooltip / aria help text. */
  tooltip: string;
}

export const EDUCATIONAL_TOPICS: Record<EducationalTerm, EducationalTopic> = {
  'heuristic-data': {
    href: '/learn/what-is-heuristic-data',
    defaultLabel: 'heuristic data',
    tooltip:
      'Structured performance logic that helps SwingVantage make fast, useful recommendations from known patterns.',
  },
  'ai-sports': {
    href: '/learn/ai-in-sports-performance',
    defaultLabel: 'AI in sports',
    tooltip:
      'Technology that helps connect video, profile data, session history, and performance signals into personalized improvement guidance.',
  },
};

/** Resolve a topic, or `undefined` for an unknown term (callers fall back to plain text). */
export function getEducationalTopic(term: EducationalTerm): EducationalTopic | undefined {
  return EDUCATIONAL_TOPICS[term];
}

/**
 * Phrases that, in prose, are good candidates to link to each topic. Kept here
 * as the documented source of truth for *which* terms map where (per the brief),
 * and reused by tests. Authors still choose, by hand, the single first
 * meaningful instance to wrap — this is guidance, not an auto-linker.
 */
export const HEURISTIC_LINK_TERMS: readonly string[] = [
  'heuristic data',
  'heuristics',
  'heuristic estimate',
  'heuristic engine',
  'heuristic intelligence',
  'deterministic analysis',
  'deterministic mode',
  'rules-based estimate',
  'instant estimate',
  'structured estimate',
  'rules-based intelligence',
] as const;

export const AI_LINK_TERMS: readonly string[] = [
  'AI',
  'artificial intelligence',
  'AI coach',
  'AI analysis',
  'AI swing report',
  'sports AI',
  'AI-powered',
  'video analysis',
  'athlete intelligence',
  'sports performance technology',
  'future of sports technology',
] as const;

/** Convenience: the same tooltips, sourced from the central claims config where they overlap. */
export const TOPIC_SUMMARIES = {
  heuristic: technologyClaims.heuristicIntelligence.short,
  ai: technologyClaims.aiSportsPerformance.short,
} as const;
