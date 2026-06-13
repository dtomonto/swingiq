// ============================================================
// Player Experience Overhaul — profile intelligence composer (WS-04)
// ------------------------------------------------------------
// COMPOSES the existing engine outputs (athletic-journey dashboard,
// priority result, AGI world model) into one organized, honest summary.
// It does NOT recompute any scores — it selects, labels, and narrates.
// Deterministic and safe with missing data (no fabrication).
// ============================================================

import type { EvidenceItem, SignalBasis } from '@/lib/athletic-journey/types';
import type { AthletePriority } from '@/lib/priority/types';
import { derivePlayerArchetype } from './archetype';
import type {
  ProfileIntelligenceInputs,
  ProfileIntelligenceSummary,
  IntelligenceStrength,
  IntelligenceFocus,
  RecurringPattern,
  DataCoverage,
  IntelligenceBasis,
} from './types';

const toBasis = (b: SignalBasis): IntelligenceBasis => b;

function focusFromPriority(p: AthletePriority): IntelligenceFocus {
  return {
    label: p.label,
    summary: p.summary,
    severity: p.severity,
    confidence: p.confidence,
    trend: p.trend,
    source: p.source,
    href: p.recommendedPlanHref,
  };
}

function strengthsFrom(items: EvidenceItem[]): IntelligenceStrength[] {
  return items.slice(0, 3).map((e) => ({
    category: e.category,
    label: e.text,
    basis: toBasis(e.basis),
  }));
}

function coverageOf(inputs: ProfileIntelligenceInputs): DataCoverage {
  const sessions = inputs.activity?.totalSessions ?? 0;
  const wm = inputs.worldModel?.coverage ?? 0;
  const hasJourney = !!inputs.journey;
  const hasPriority = !!inputs.priority && !inputs.priority.insufficientData;
  if (sessions === 0 && !hasJourney && !hasPriority) return 'none';
  const score =
    Math.min(1, sessions / 6) * 0.4 + wm * 0.3 + (hasJourney ? 0.15 : 0) + (hasPriority ? 0.15 : 0);
  if (score >= 0.66) return 'high';
  if (score >= 0.33) return 'moderate';
  return 'low';
}

/**
 * Build the composed intelligence summary. Pure + deterministic.
 */
export function buildProfileIntelligence(
  inputs: ProfileIntelligenceInputs,
): ProfileIntelligenceSummary {
  const now = inputs.now ?? new Date().toISOString();
  const { journey, priority, worldModel } = inputs;
  const dataCoverage = coverageOf(inputs);

  const archetype = derivePlayerArchetype({
    categoryScores: journey?.categoryScores,
    capabilities: worldModel?.capabilities,
    momentum: journey?.momentum ?? null,
  });

  // Strengths — prefer journey's evidence-backed strengths.
  const topStrengths = journey ? strengthsFrom(journey.primaryStrengths) : [];

  // Current focus — priority engine is the authority; fall back to the
  // journey's top development gap (clearly labelled as such) when absent.
  let currentFocus: IntelligenceFocus | null = null;
  let secondaryFocus: IntelligenceFocus | null = null;
  if (priority?.top) {
    currentFocus = focusFromPriority(priority.top);
    if (priority.secondary) secondaryFocus = focusFromPriority(priority.secondary);
  } else if (journey && journey.developmentGaps.length > 0) {
    const gap = journey.developmentGaps[0];
    currentFocus = {
      label: gap.text,
      summary: 'Highlighted as a development area from your athletic-journey signals.',
      severity: 'medium',
      confidence: Math.round((journey.confidenceScore ?? 0.4) * 100),
      trend: 'new',
      source: gap.basis,
      href: '/journey',
    };
  }

  // Recurring patterns — recurring/persistent faults or worsening trends.
  const recurringPatterns: RecurringPattern[] = (priority?.all ?? [])
    .filter(
      (p) =>
        p.pattern === 'recurring' ||
        p.pattern === 'persistent' ||
        p.trend === 'persisting' ||
        p.trend === 'worsening',
    )
    .slice(0, 3)
    .map((p) => ({
      label: p.label,
      detail:
        p.trend === 'worsening'
          ? `Worsening across ${p.occurrences} session(s).`
          : `Recurring across ${p.occurrences} session(s).`,
    }));

  // Confidence + honesty note.
  const confidenceLevel = journey?.confidence ?? 'unknown';
  const confidenceScore = journey?.confidenceScore ?? null;
  const missing = [
    ...(priority?.whatsMissing ?? []),
  ];
  let confidenceNote: string;
  if (dataCoverage === 'none') {
    confidenceNote =
      'Not enough data yet. Complete your profile and log your first session to unlock personalized intelligence.';
  } else if (missing.length > 0) {
    confidenceNote = `Confidence: ${confidenceLevel}. Sharpen it by adding: ${missing.slice(0, 3).join('; ')}.`;
  } else {
    confidenceNote = `Confidence: ${confidenceLevel}, based on your logged activity and analyses.`;
  }

  const recommendedNextStep = priority?.top
    ? { label: `Work on ${priority.top.label}`, href: priority.top.recommendedPlanHref }
    : journey
      ? { label: 'Continue your athletic journey', href: '/journey' }
      : dataCoverage === 'none'
        ? { label: 'Complete your profile', href: '/profile' }
        : null;

  return {
    archetype,
    topStrengths,
    currentFocus,
    secondaryFocus,
    recurringPatterns,
    confidenceNote,
    confidenceLevel,
    confidenceScore,
    recommendedNextStep,
    stage: journey
      ? {
          code: journey.currentStage.code,
          name: journey.currentStage.name,
          tier: journey.currentStage.tier,
        }
      : null,
    momentumBand: journey?.momentum.band ?? 'unknown',
    dataCoverage,
    generatedAt: now,
  };
}
