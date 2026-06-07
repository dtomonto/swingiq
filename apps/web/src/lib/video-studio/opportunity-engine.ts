// ============================================================
// SwingVantage — Video Studio: Opportunity Assessment Engine
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   This is the "scout". It walks the app surface map (surfaces.ts),
//   scores each spot with the deterministic model (scoring.ts), checks
//   whether a tutorial video already lives there (so we surface real
//   GAPS, not duplicates), and returns a ranked list of opportunities —
//   each with a plain-English rationale, a priority, a confidence, a
//   risk level, and whether a human needs to approve it.
//
//   It's pure and deterministic: same app map → same ranked list. That
//   makes it cheap to re-run on a schedule and trivial to test. No LLM
//   and no network are required.
// ============================================================

import {
  type VideoOpportunity,
  type OpportunitySignals,
  type VideoStyle,
  OPPORTUNITY_SIGNAL_KEYS,
} from './types';
import { APP_SURFACES, type AppSurface } from './surfaces';
import {
  deriveSignals,
  priorityScore,
  confidenceFrom,
  riskFrom,
  requiresApproval,
} from './scoring';
import { DEFAULT_STYLE_BY_TYPE, MAX_DURATION_BY_TYPE } from './brand';
import { TUTORIAL_PLACEMENTS } from '@/lib/tutorial/placements';

/** Plain-English fragments used to phrase the estimated impact. */
const IMPACT_PHRASES: Record<keyof OpportunitySignals, string> = {
  userConfusionRisk: 'reduce confusion on a tricky screen',
  featureComplexity: 'make a complex feature click faster',
  funnelImportance: 'support a high-traffic funnel step',
  conversionOpportunity: 'lift conversion at a decision moment',
  onboardingFriction: 'smooth a first-run drop-off point',
  educationalDepth: 'teach a concept that text struggles to convey',
  supportBurden: "cut repetitive 'how do I…' questions",
  visualExplanationNeed: 'show, not tell, something inherently visual',
  trustBuildingNeed: 'build trust before a key decision',
  seoOpportunity: 'win video-rich search/answer results',
  accessibilityBenefit: 'add a captioned, transcript-backed explanation',
  retentionValue: 'bring lapsed users back into the loop',
  differentiationValue: 'showcase a differentiating capability',
};

/** The required raw assets implied by a visual style. */
function requiredAssetsFor(style: VideoStyle, page: string): string[] {
  const common = ['VO/script', 'WebVTT captions', 'poster + thumbnail'];
  switch (style) {
    case 'screen_capture':
      return [`Screen recording of ${page}`, ...common];
    case 'motion_graphics':
    case 'kinetic_text':
      return ['Brand motion template', ...common];
    case 'talking_head':
      return ['Avatar/presenter render', ...common];
    case 'live_action':
      return ['On-location footage (range/court/field)', ...common];
    case 'hybrid':
    default:
      return [`Screen recording of ${page}`, 'Brand motion overlay', ...common];
  }
}

/** Phrase the top two signals into one honest impact sentence. */
function estimateImpact(signals: OpportunitySignals): string {
  const top = [...OPPORTUNITY_SIGNAL_KEYS]
    .sort((a, b) => signals[b] - signals[a])
    .slice(0, 2)
    .map((k) => IMPACT_PHRASES[k]);
  return `Could ${top[0]}${top[1] ? ` and ${top[1]}` : ''}.`;
}

/** A suggested target length: 70% of the type's max, floored sensibly. */
function suggestedLength(type: VideoOpportunity['recommendedType']): number {
  return Math.max(20, Math.round(MAX_DURATION_BY_TYPE[type] * 0.7));
}

/**
 * Build the set of (page::stage) keys already covered by a tutorial video,
 * so the scanner can mark those surfaces `alreadyCovered`. We match on page +
 * journey stage because a single page (e.g. /video) hosts several moments.
 */
function coveredKeys(): Set<string> {
  const keys = new Set<string>();
  for (const p of TUTORIAL_PLACEMENTS) {
    keys.add(`${p.page}::${p.journeyStage}`);
  }
  return keys;
}

export interface ScanOptions {
  /** Only include opportunities at/above this priority (0–100). */
  minPriority?: number;
  /** Include surfaces already covered by a tutorial video. Default true. */
  includeCovered?: boolean;
  /** Limit the number returned (after ranking). */
  limit?: number;
  /** Override the clock (tests). */
  now?: Date;
}

/** Score a single surface into a VideoOpportunity. */
export function assessSurface(
  surface: AppSurface,
  covered: Set<string>,
  now: Date,
): VideoOpportunity {
  const signals = deriveSignals(surface);
  const priority = priorityScore(signals);
  const { score: confidenceScore, level: confidence } = confidenceFrom(signals);
  const risk = riskFrom(surface, surface.recommendedType);
  const style = DEFAULT_STYLE_BY_TYPE[surface.recommendedType];
  const iso = now.toISOString();
  const alreadyCovered = covered.has(`${surface.page}::${surface.journeyStage}`);

  return {
    id: `opp_${surface.id}`,
    surfaceId: surface.id,
    page: surface.page,
    zone: surface.zone,
    recommendedType: surface.recommendedType,
    businessRationale: `${surface.label}: ${surface.description}`,
    uxRationale: estimateImpact(signals),
    signals,
    priorityScore: priority,
    confidenceScore,
    confidence,
    estimatedImpact: estimateImpact(signals),
    suggestedPlacement:
      surface.recommendedType === 'hero_explainer'
        ? 'hero'
        : surface.traits.emptyStateProne
          ? 'empty_state'
          : surface.traits.complexity === 'high'
            ? 'inline'
            : 'card',
    suggestedLengthSec: suggestedLength(surface.recommendedType),
    suggestedStyle: style,
    suggestedCta: 'See how it works',
    requiredAssets: requiredAssetsFor(style, surface.page),
    riskLevel: risk,
    requiresApproval: requiresApproval(risk, confidence),
    audience: surface.audience,
    sport: surface.sport,
    journeyStage: surface.journeyStage,
    status: 'recommended',
    alreadyCovered,
    createdAt: iso,
    updatedAt: iso,
  };
}

/**
 * Scan the whole app for video opportunities, ranked by priority (highest
 * first). Surfaces already covered by a tutorial video are deprioritised
 * (sorted after uncovered ones at equal priority) but not removed by default,
 * so reassessment can still consider improving them.
 */
export function scanForOpportunities(options: ScanOptions = {}): VideoOpportunity[] {
  const { minPriority = 0, includeCovered = true, limit, now = new Date() } = options;
  const covered = coveredKeys();

  let opportunities = APP_SURFACES.map((s) => assessSurface(s, covered, now)).filter(
    (o) => o.priorityScore >= minPriority,
  );

  if (!includeCovered) {
    opportunities = opportunities.filter((o) => !o.alreadyCovered);
  }

  opportunities.sort((a, b) => {
    // Uncovered gaps first at equal priority, then by priority desc.
    if (a.alreadyCovered !== b.alreadyCovered) return a.alreadyCovered ? 1 : -1;
    return b.priorityScore - a.priorityScore;
  });

  return typeof limit === 'number' ? opportunities.slice(0, limit) : opportunities;
}

/** Convenience: the single highest-priority uncovered gap, if any. */
export function topGap(options: ScanOptions = {}): VideoOpportunity | undefined {
  return scanForOpportunities({ ...options, includeCovered: false })[0];
}
