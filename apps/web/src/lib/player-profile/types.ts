// ============================================================
// Player Experience Overhaul — Player profile intelligence (WS-04)
// ------------------------------------------------------------
// The player profile becomes a structured "intelligence hub": a clean,
// COMPOSED summary of what the existing engines already know (journey,
// priority, AGI) — never a re-derivation of their math, never fabricated.
// When a signal is missing we say so (basis: 'unknown' / null values).
// ============================================================

import type {
  JourneyDashboard,
  CategoryScore,
  ClassificationCategory,
  MomentumResult,
  MomentumBand,
  ConfidenceLevel,
} from '@/lib/athletic-journey/types';
import type { PriorityResult, PrioritySeverity, PriorityTrend } from '@/lib/priority/types';
import type { AthleteWorldModel, CapabilityState } from '@/lib/agi/types';

/** Honest provenance for an intelligence statement. */
export type IntelligenceBasis =
  | 'measured'
  | 'analyzed'
  | 'self_reported'
  | 'estimated'
  | 'unknown';

/** How much the system actually knows about this athlete right now. */
export type DataCoverage = 'none' | 'low' | 'moderate' | 'high';

/** A derived player archetype (e.g. "Power Developer"). Deterministic. */
export interface PlayerArchetype {
  id: string;
  label: string;
  description: string;
  /** Plain-English reasons, citing the evidence that drove the label. */
  evidence: string[];
  /** 0..1 — confidence in the archetype, tied to data coverage. */
  confidence: number;
  basis: IntelligenceBasis;
}

export interface IntelligenceStrength {
  category: ClassificationCategory;
  label: string;
  basis: IntelligenceBasis;
}

export interface IntelligenceFocus {
  label: string;
  summary: string;
  severity: PrioritySeverity;
  /** 0..100 (priority engine scale). */
  confidence: number;
  trend: PriorityTrend;
  source: string;
  href: string;
}

export interface RecurringPattern {
  label: string;
  detail: string;
}

export interface RecommendedStep {
  label: string;
  href: string;
}

/** The composed, organized summary surfaced in the profile hub. */
export interface ProfileIntelligenceSummary {
  archetype: PlayerArchetype | null;
  topStrengths: IntelligenceStrength[];
  currentFocus: IntelligenceFocus | null;
  secondaryFocus: IntelligenceFocus | null;
  recurringPatterns: RecurringPattern[];
  /** Plain-English honesty note about confidence / what's missing. */
  confidenceNote: string;
  confidenceLevel: ConfidenceLevel | 'unknown';
  /** 0..1 overall confidence, or null when there is no data. */
  confidenceScore: number | null;
  recommendedNextStep: RecommendedStep | null;
  stage: { code: string; name: string; tier: string } | null;
  momentumBand: MomentumBand | 'unknown';
  dataCoverage: DataCoverage;
  generatedAt: string;
}

export interface ArchetypeInputs {
  categoryScores?: CategoryScore[];
  capabilities?: CapabilityState[];
  momentum?: MomentumResult | null;
}

export interface ProfileIntelligenceInputs {
  journey: JourneyDashboard | null;
  priority: PriorityResult | null;
  worldModel?: AthleteWorldModel | null;
  activity?: {
    totalSessions: number;
    lastActiveAt: string | null;
    streakDays: number;
  };
  profile?: {
    skillLevel?: string | null;
    goals?: string[];
    commonIssues?: string[];
  };
  now?: string;
}

/** The canonical aggregate the hub renders + the service persists. */
export interface PlayerProfile {
  displayName: string | null;
  handle: string | null;
  primarySport: string | null;
  sports: string[];
  skillLevel: string | null;
  goals: string[];
  commonIssues: string[];
  intelligence: ProfileIntelligenceSummary;
}
