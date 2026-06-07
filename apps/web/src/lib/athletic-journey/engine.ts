// ============================================================
// SwingVantage — Athletic Journey: engine orchestrator
// ------------------------------------------------------------
// The pure entry point. Give it a normalized JourneySignals bundle
// (from any adapter) and it returns the full JourneyDashboard:
// classification, evidence, momentum, rating alignment, milestones,
// missing data, prescription, and a structured narrative. No React,
// no browser, no network — fully testable.
// ============================================================

import type {
  JourneyDashboard,
  JourneyNarrative,
  JourneySignals,
  SkillBranchState,
  SportJourneyConfig,
} from './types';
import { classifyPlayerStage, type ClassificationResult } from './classify';
import { calculateJourneyMomentum, isRegressionRisk } from './momentum';
import { compareRatingAlignment } from './rating';
import { getMissingDataRecommendations } from './missing-data';
import { computeMilestones } from './milestones';
import { generatePracticePrescription } from './prescription';
import { buildJourneyNarrative } from './narrative';
import { getSportConfig, getSportAvailability } from './config';
import { JOURNEY_THRESHOLDS as T, JOURNEY_VERSION, JOURNEY_DISCLAIMER } from './config/thresholds';

export interface BuildOptions {
  /** Milestone ids the athlete has explicitly marked complete. */
  completedMilestoneIds?: ReadonlySet<string>;
  /**
   * Optional narrative enhancer. It may only RE-WORD the deterministic base
   * (validated by the caller); it can never change a number, stage, or basis.
   * Absent = pure deterministic output (narrative.enhanced === false).
   */
  enhanceNarrative?: (base: JourneyNarrative) => JourneyNarrative;
}

function buildBranches(
  signals: JourneySignals,
  config: SportJourneyConfig,
  classification: ClassificationResult,
): SkillBranchState[] {
  const catMap = new Map(classification.categoryScores.map((c) => [c.category, c]));
  return config.branches.map((b) => {
    const cs = catMap.get(b.category);
    const uploads = signals.activity.videoUploadsByBranch?.[b.id] ?? 0;
    const metricsInCat = signals.metrics.filter((m) => m.category === b.category).length;
    const selfAssess = signals.selfAssessments.filter((a) => a.branchId === b.id).length;
    const score = cs?.score ?? null;
    const flagged =
      b.category === classification.priorityCategory ||
      (score !== null && score <= T.gapBelow);
    return {
      id: b.id,
      name: b.name,
      category: b.category,
      score,
      evidenceCount: uploads + metricsInCat + selfAssess,
      flagged,
    };
  });
}

/** Run the full Athletic Journey pipeline over a normalized signal bundle. */
export function buildJourneyDashboard(
  signals: JourneySignals,
  opts: BuildOptions = {},
): JourneyDashboard {
  const config = getSportConfig(signals.sport);
  if (!config) {
    throw new Error(
      `No live Athletic Journey for "${signals.sport}". Check isJourneyLive() before building.`,
    );
  }

  const classification = classifyPlayerStage(signals, config);
  const momentum = calculateJourneyMomentum(signals.activity);
  const ratingAlignment = compareRatingAlignment(signals.rating, classification, config);
  const missingData = getMissingDataRecommendations(signals, config);
  const milestones = computeMilestones(signals, classification.currentStage, opts.completedMilestoneIds);
  const branches = buildBranches(signals, config, classification);
  const prescription = generatePracticePrescription(signals, config, classification, missingData);
  const unlockRequirements = classification.currentStage.unlockCriteria;

  const base = buildJourneyNarrative({
    sportNoun: signals.sport === 'golf' ? 'golf' : 'tennis',
    currentStage: classification.currentStage,
    nextStage: classification.nextStage,
    confidence: classification.confidence,
    primaryStrengths: classification.primaryStrengths,
    developmentGaps: classification.developmentGaps,
    contradictoryEvidence: classification.contradictoryEvidence,
    ratingAlignment,
    momentum,
    missingData,
    unlockRequirements,
    prescription,
  });

  let narrative = base;
  if (opts.enhanceNarrative) {
    try {
      narrative = opts.enhanceNarrative(base);
    } catch {
      narrative = base; // honest fallback — never fail because an optional LLM did
    }
  }

  return {
    sport: signals.sport,
    availability: getSportAvailability(signals.sport),
    generatedAt: signals.generatedAt,

    currentStage: classification.currentStage,
    nextStage: classification.nextStage,
    stageOrderEstimate: classification.stageOrderEstimate,
    confidence: classification.confidence,
    confidenceScore: classification.confidenceScore,

    categoryScores: classification.categoryScores,
    primaryStrengths: classification.primaryStrengths,
    developmentGaps: classification.developmentGaps,
    contradictoryEvidence: classification.contradictoryEvidence,
    priorityCategory: classification.priorityCategory,

    unlockRequirements,
    branches,
    milestones,

    momentum,
    ratingAlignment,
    regressionRisk: isRegressionRisk(signals.activity),

    missingData,
    prescription,
    narrative,

    redistributedWeight: classification.redistributedWeight,
    disclaimer: JOURNEY_DISCLAIMER,
    version: JOURNEY_VERSION,
  };
}
