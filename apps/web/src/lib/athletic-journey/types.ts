// ============================================================
// SwingVantage — Athletic Journey Engine: shared types
// ------------------------------------------------------------
// One config-driven player-development intelligence layer. The
// engine classifies an athlete into a sport-specific stage from a
// *blend* of signals (never one metric), explains the evidence for
// and against, surfaces missing data, and prescribes what to do
// next. Golf + Tennis ship now; Baseball / Fast-Pitch / Slow-Pitch
// are visibly "In Development" — represented, never faked.
//
// Pure types only — no React, no browser, no app-state coupling.
// ============================================================

import type { SportId } from '@swingiq/core';

export type { SportId };

// ── Sport availability ────────────────────────────────────────

export type SportAvailabilityStatus = 'available' | 'in_development';

export interface SportAvailability {
  sport: SportId;
  status: SportAvailabilityStatus;
  displayName: string;
  emoji: string;
  accentColor: string;
  tagline: string;
  /** Plain-English status line shown on the sport card. */
  userFacingMessage: string;
  /** What the future journey will eventually include (in-dev cards). */
  futurePromise: string;
  waitlistEnabled: boolean;
  basicProfileEnabled: boolean;
  journeyEnabled: boolean;
}

// ── Ratings (all optional) ────────────────────────────────────

export type RatingType = 'golf_handicap' | 'utr' | 'ntrp';

/** Provenance of a rating value — drives how much trust the engine gives it. */
export type RatingSource =
  | 'self_reported'
  | 'coach_entered'
  | 'imported'
  | 'verified'
  | 'estimated'; // estimated *by SwingVantage* (never presented as official)

export interface PlayerRating {
  sport: SportId;
  ratingType: RatingType;
  value: number;
  source: RatingSource;
  /** ISO date the value was recorded/entered. */
  dateRecorded: string;
}

// ── Confidence ────────────────────────────────────────────────

export type ConfidenceLevel = 'provisional' | 'low' | 'medium' | 'high';

// ── Evidence basis (how a number was obtained) ────────────────

export type SignalBasis =
  | 'measured' // launch monitor / scorecard / match result
  | 'analyzed' // SwingVantage video/motion analysis
  | 'self_reported'
  | 'estimated';

// ── Classification categories ─────────────────────────────────
// Sport-agnostic buckets the engine reasons across. Each sport
// declares which categories it uses and how it weights them.

export type ClassificationCategory =
  | 'scoring' // golf scoring trend / tennis match results
  | 'technique' // swing/stroke quality from video + ball-flight
  | 'consistency' // dispersion / unforced-error control
  | 'finesse' // golf short game + putting / tennis serve + return
  | 'movement' // athleticism + footwork (tennis-leaning)
  | 'tactical' // course/match management + decisions
  | 'practice' // usage + practice discipline
  | 'mental' // pressure performance + reflection
  | 'competitive'; // verified competitive exposure & results

export type CategoryWeights = Partial<Record<ClassificationCategory, number>>;

// ── Performance metrics (normalized) ──────────────────────────

export interface PerformanceMetric {
  /** Stable machine key, e.g. 'penalties_per_round' or 'first_serve_pct'. */
  metricName: string;
  /** Human label for display. */
  label: string;
  value: number;
  unit: string;
  category: ClassificationCategory;
  basis: SignalBasis;
  /** 0..1 — how much to trust this single reading. */
  confidence: number;
  /** ISO date. */
  dateRecorded: string;
  /**
   * Optional pre-scored 0..100 quality of THIS metric (higher = better),
   * already orientation-corrected (e.g. fewer penalties → higher score).
   * When omitted the engine treats the metric as evidence only.
   */
  score?: number;
}

// ── Profile signals (self-reported, normalized) ───────────────

export type FrequencyBand = 'daily' | 'high' | 'moderate' | 'weekly' | 'occasional' | 'none';
export type SkillBand = 'beginner' | 'intermediate' | 'advanced' | 'elite';
export type CompetitionBand =
  | 'none'
  | 'recreational'
  | 'club'
  | 'league'
  | 'tournament'
  | 'collegiate'
  | 'professional';

export interface JourneyProfileSignals {
  experienceYears: number | null;
  practiceFrequency: FrequencyBand | null;
  playFrequency: FrequencyBand | null;
  competitionLevel: CompetitionBand | null;
  selfRatedSkill: SkillBand | null;
  goals: string[];
  /** Free-text injury / limitation note; presence makes prescriptions safer. */
  injuries: string | null;
  /** Golf only: typical 18-hole score the athlete shoots. */
  typicalScore: number | null;
}

// ── Self-assessments (1..5 per skill branch) ──────────────────

export interface SelfAssessment {
  branchId: string;
  /** 1 (weak) .. 5 (strong). */
  rating: number;
  dateRecorded: string;
}

// ── Activity signals (usage / momentum inputs) ────────────────

export interface ActivitySignals {
  videoUploads: number;
  /** Per skill-branch upload counts, e.g. { driver: 2, wedge: 1 }. */
  videoUploadsByBranch: Record<string, number>;
  practiceSessions: number;
  drillsCompleted: number;
  /** Logged competitive outings — golf rounds / tennis matches. */
  loggedCompetitions: number;
  dailyNotes: number;
  retests: number;
  /** AI/coach recommendations the athlete marked done. */
  recommendationsCompleted: number;
  currentStreakDays: number;
  /** ISO date of most recent activity of any kind, or null. */
  lastActiveAt: string | null;
  /** Recent score/quality trend, -1 (regressing) .. +1 (improving), or null. */
  recentTrend: number | null;
}

// ── Normalized signal bundle (engine input) ───────────────────

export interface JourneySignals {
  sport: SportId;
  profile: JourneyProfileSignals;
  /** Primary rating used for classification (best available), or null. */
  rating: PlayerRating | null;
  /** Every rating on file (golf handicap / UTR / NTRP) for missing-data logic. */
  ratings: PlayerRating[];
  metrics: PerformanceMetric[];
  selfAssessments: SelfAssessment[];
  activity: ActivitySignals;
  /** ISO timestamp the bundle was assembled. */
  generatedAt: string;
}

// ── Stage definitions (config) ────────────────────────────────

export type StageTier =
  | 'foundation'
  | 'developing'
  | 'competent'
  | 'advanced'
  | 'elite'
  | 'professional';

export interface RatingAnchor {
  ratingType: RatingType;
  /** Display label only, e.g. "12–18" or "no handicap". */
  label: string;
}

export type Comparator = 'gte' | 'lte';

export interface UnlockCriterion {
  id: string;
  label: string;
  /** Optional machine metric this criterion checks. */
  metric?: string;
  targetValue?: number;
  comparator?: Comparator;
  unit?: string;
  /** Category this requirement most relates to (for prioritisation). */
  category?: ClassificationCategory;
}

export interface MilestoneTemplate {
  id: string;
  name: string;
  description: string;
  category: ClassificationCategory;
  /** Optional measurable target; presence enables progress tracking. */
  metric?: string;
  targetValue?: number;
  comparator?: Comparator;
  unit?: string;
}

export interface StageDefinition {
  code: string; // e.g. 'G4' / 'T3'
  order: number; // 0..10
  name: string;
  tier: StageTier;
  description: string;
  anchors: RatingAnchor[];
  primaryGoals: string[];
  commonWeaknesses: string[];
  unlockCriteria: UnlockCriterion[];
  milestoneTemplates: MilestoneTemplate[];
}

// ── Skill tree (config) ───────────────────────────────────────

export interface SkillBranchDef {
  id: string;
  name: string;
  category: ClassificationCategory;
  /** Metric keys + self-assessment branch ids that feed this branch. */
  description: string;
}

// ── Missing-data prompts (config) ─────────────────────────────

export type MissingDataKind =
  | 'rating'
  | 'video'
  | 'competition_log'
  | 'benchmark'
  | 'profile'
  | 'self_assessment';

export interface MissingDataPromptDef {
  id: string;
  kind: MissingDataKind;
  label: string;
  description: string;
  /** Where the CTA sends the athlete. */
  href: string;
  ctaLabel: string;
  /** Higher = more useful to collect first. */
  priority: number;
  /** For kind 'rating' — which rating satisfies this prompt. */
  ratingType?: RatingType;
  /** For kind 'video' — which skill branch a clip satisfies. */
  branchKey?: string;
  /** For kind 'profile' — the profile field this prompt fills. */
  profileField?: 'typicalScore';
}

// ── Sport journey config (the whole sport in one object) ──────

export interface SportJourneyConfig {
  sport: SportId;
  /** Short user-facing rating help, e.g. "USGA Handicap Index (optional)". */
  ratingLabel: string;
  ratingType: RatingType | null;
  /** Secondary optional rating (tennis NTRP alongside UTR). */
  secondaryRatingType: RatingType | null;
  categories: ClassificationCategory[];
  weights: CategoryWeights;
  stages: StageDefinition[];
  branches: SkillBranchDef[];
  missingDataPrompts: MissingDataPromptDef[];
  /** Map an optional rating to an approximate stage order (guidepost only). */
  ratingToStageOrder: (rating: PlayerRating) => number | null;
}

// ── Engine outputs ────────────────────────────────────────────

export interface CategoryScore {
  category: ClassificationCategory;
  /** 0..100, or null when no data feeds this category yet. */
  score: number | null;
  /** 0..1 confidence in this category score. */
  confidence: number;
  basis: SignalBasis | null;
  /** Count of distinct signals feeding the score. */
  signalCount: number;
}

export interface SkillBranchState {
  id: string;
  name: string;
  category: ClassificationCategory;
  score: number | null;
  /** Evidence the athlete has supplied for this branch (uploads, metrics). */
  evidenceCount: number;
  /** True when this branch is a current development priority. */
  flagged: boolean;
}

export type RatingAlignment = 'above' | 'aligned' | 'below' | 'unknown';

export interface RatingAlignmentResult {
  alignment: RatingAlignment;
  ratingType: RatingType | null;
  ratingValue: number | null;
  ratingSource: RatingSource | null;
  ratingImpliedOrder: number | null;
  performanceImpliedOrder: number | null;
  /** Honest, specific explanation referencing the driving category. */
  explanation: string;
}

export type MomentumBand =
  | 'inactive'
  | 'low'
  | 'building'
  | 'strong'
  | 'accelerated';

export interface MomentumResult {
  score: number; // 0..100
  band: MomentumBand;
  /** Top contributing factors, each with its 0..100 sub-score. */
  drivers: Array<{ label: string; score: number }>;
  /** Plain-English note. */
  note: string;
}

export interface EvidenceItem {
  category: ClassificationCategory;
  text: string;
  basis: SignalBasis;
}

export type MilestoneStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface MilestoneState {
  id: string;
  name: string;
  description: string;
  category: ClassificationCategory;
  status: MilestoneStatus;
  /** 0..1 progress when measurable, else null. */
  progress: number | null;
  currentValue: number | null;
  targetValue: number | null;
  unit: string | null;
  stageCode: string;
}

export interface PrescriptionBlock {
  id: string;
  title: string;
  /** Why this block matters at this stage. */
  rationale: string;
  drills: string[];
  /** e.g. "2–3x/week". */
  frequency: string;
  /** What metric proves it worked. */
  proofMetric: string;
  category: ClassificationCategory;
}

export interface PracticePrescription {
  stageCode: string;
  headline: string;
  /** Ordered blocks, highest-priority first. */
  blocks: PrescriptionBlock[];
  /** Next thing to upload. */
  uploadRequest: string | null;
  /** When/what to retest. */
  retest: string | null;
  /** Injury-aware adjustment note, when an injury is on file. */
  safetyNote: string | null;
}

/** The structured AI-journey narrative shape (also the deterministic output). */
export interface JourneyNarrative {
  stageSummary: string;
  whyHere: string[];
  strengths: string[];
  developmentGaps: string[];
  contradictoryEvidence: string[];
  nextStageFocus: string[];
  ratingAlignment: string;
  coachNote: string;
  missingDataRequests: string[];
  recommendedNextActions: string[];
  /** True when an optional LLM re-worded the deterministic base. */
  enhanced: boolean;
}

export interface MissingDataItem {
  id: string;
  kind: MissingDataKind;
  label: string;
  description: string;
  href: string;
  ctaLabel: string;
  priority: number;
}

export interface JourneyDashboard {
  sport: SportId;
  availability: SportAvailability;
  generatedAt: string;

  // Classification
  currentStage: StageDefinition;
  nextStage: StageDefinition | null;
  stageOrderEstimate: number; // fractional 0..10 (how far into the stage)
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0..1

  // Evidence
  categoryScores: CategoryScore[];
  primaryStrengths: EvidenceItem[];
  developmentGaps: EvidenceItem[];
  contradictoryEvidence: EvidenceItem[];
  priorityCategory: ClassificationCategory | null;

  // Requirements & progression
  unlockRequirements: UnlockCriterion[];
  branches: SkillBranchState[];
  milestones: MilestoneState[];

  // Momentum & alignment
  momentum: MomentumResult;
  ratingAlignment: RatingAlignmentResult;
  regressionRisk: boolean;

  // Guidance
  missingData: MissingDataItem[];
  prescription: PracticePrescription;
  narrative: JourneyNarrative;

  /** Whether the engine had to redistribute weight over missing categories. */
  redistributedWeight: boolean;
  /** Always-on honest disclaimer. */
  disclaimer: string;
  version: string;
}

// ── Sport interest (waitlist) capture ─────────────────────────

export type SportInterestType = 'notify' | 'waitlist' | 'basic_profile';

export interface SportInterest {
  sport: SportId;
  interestType: SportInterestType;
  createdAt: string;
}
