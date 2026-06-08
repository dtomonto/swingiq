// ============================================================
// CentralIntelligenceOS — Coach Mix: Shared Types
// ------------------------------------------------------------
// The data model for the Coach Mix Learning Engine:
//   CoachProfile   — an admin-curated teaching-INFLUENCE framework
//   LearningSource — an admin-approved thing we may learn FROM
//   LearnedConcept — an extracted PRINCIPLE awaiting admin review
//   CoachMix       — a weighted blend of profiles
//   SwingModelTarget — the kind of swing a profile/mix develops
//   CoachingStrategy — the RESOLVED output of a mix that biases the app
//
// PHILOSOPHY: every object is original SwingVantage structure. We store
// generalized traits, relationships, and tendencies — never copied text.
// Coach handles are stored only as an admin REFERENCE, never rendered to
// users by default.
// ============================================================

import type { SportId, SkillLevel } from '@swingiq/core';
import type {
  CONCEPT_TYPES,
  IP_RISK_LEVELS,
  REVIEW_STATUSES,
  SOURCE_TYPES,
  STYLE_TAGS,
  USER_LABEL_MODES,
  VISIBILITY_LEVELS,
} from './config';

export type ConceptType = (typeof CONCEPT_TYPES)[number];
export type IpRiskLevel = (typeof IP_RISK_LEVELS)[number];
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];
export type StyleTag = (typeof STYLE_TAGS)[number];
export type UserLabelMode = (typeof USER_LABEL_MODES)[number];
export type Visibility = (typeof VISIBILITY_LEVELS)[number];

/**
 * Generalized swing-model traits — the vocabulary the engine reasons in.
 * These describe a TENDENCY of a teaching style, not any one coach's words.
 */
export type SwingModelTrait =
  | 'pivot_driven'
  | 'face_control_first'
  | 'plane_aware'
  | 'tempo_driven'
  | 'technical_precision'
  | 'athletic_rotation'
  | 'ground_force_emphasis'
  | 'compact_movement'
  | 'structured_checkpointing'
  | 'connection_focused'
  | 'sequencing_focused'
  | 'balance_and_rhythm';

/** How deep/technical the coaching voice gets. Influences explanation copy. */
export type TechnicalDepth = 'feel_first' | 'balanced' | 'technical';

/**
 * The kind of swing a profile (or a resolved mix) is trying to help the
 * user build. Phase priorities are short, original cue-phrases.
 */
export interface SwingModelTarget {
  /** Original, neutral name (e.g. "Athletic Rotational Model"). */
  name: string;
  primaryMovementPattern: string;
  setupPriorities: string[];
  backswingPriorities: string[];
  transitionPriorities: string[];
  downswingPriorities: string[];
  impactPriorities: string[];
  finishPriorities: string[];
  /** Fault ids (matching @/lib/faults ontology) this model addresses well. */
  addressesFaults: string[];
  /** Plain-language player types this model fits / may not fit. */
  fitsPlayerTypes: string[];
  mayNotFitPlayerTypes: string[];
  mobilityRequirements: string;
  skillSuitability: SkillLevel[];
  practiceDiscipline: string;
  recommendedLaunchMonitorMetrics: string[];
  recommendedVideoCheckpoints: string[];
}

/**
 * A source we may learn FROM. Nothing is learned until `approvedForLearning`
 * is true AND permission/copyright are cleared.
 */
export interface LearningSource {
  id: string;
  coachProfileId: string;
  title: string;
  /** External URL or an internal upload reference. */
  urlOrUploadRef: string;
  type: SourceType;
  sport: SportId;
  topic: string;
  drillCategory?: string;
  techniqueCategory?: string;
  skillLevel?: SkillLevel;
  /** Admin-asserted permission to learn from this source. */
  permissionStatus: 'unknown' | 'public' | 'licensed' | 'partnership' | 'restricted';
  copyrightStatus: 'unknown' | 'cleared' | 'attribution_required' | 'restricted';
  attributionRequirements?: string;
  /** Gate: extraction only runs on approved sources. */
  approvedForLearning: boolean;
  lastReviewedAt?: string; // ISO
  notes?: string;
  createdAt: string; // ISO
}

/**
 * One PRINCIPLE the engine extracted from an approved source. It enters the
 * admin review queue and influences NOTHING until approved. The original
 * SwingVantage rewrite — not the source text — is what ever gets used.
 */
export interface LearnedConcept {
  id: string;
  coachProfileId: string;
  sourceId: string;
  type: ConceptType;
  /** Neutral, generalized summary of the observed principle. */
  summary: string;
  /** The ORIGINAL SwingVantage rephrasing the product will actually use. */
  suggestedRewrite: string;
  /** Confidence the extraction is a fair, generalizable read (0–1). */
  confidence: number;
  ipRisk: IpRiskLevel;
  /** Optional links the admin can accept: a drill family / fault / trait. */
  suggestedDrillConnection?: string;
  suggestedFaultId?: string;
  suggestedSwingModelTrait?: SwingModelTrait;
  reviewStatus: ReviewStatus;
  reviewedAt?: string; // ISO
  reviewerNotes?: string;
  createdAt: string; // ISO
}

/**
 * A coach-INSPIRED teaching-influence framework. Original SwingVantage
 * structure; the real coach is only an admin reference.
 */
export interface CoachProfile {
  id: string;
  /** Internal/admin display name (e.g. "Athletic Rotational (Gankas-inspired)"). */
  name: string;
  /** Admin reference only — a public handle/URL. NEVER shown to users by default. */
  publicHandle?: string;
  reference?: string;
  sports: SportId[];
  /** Plain-English summary of the generalized teaching tendency. */
  teachingStyleSummary: string;
  /** User-safe neutral tag(s). */
  styleTags: StyleTag[];
  swingModelTraits: SwingModelTrait[];
  swingModelTarget: SwingModelTarget;
  /** Drill / technique families this style leans on (original taxonomy). */
  drillCategories: string[];
  techniqueCategories: string[];
  skillLevels: SkillLevel[];
  technicalDepth: TechnicalDepth;
  visibility: Visibility;
  /** Default blend weight (0–100) when added to a mix. */
  defaultInfluenceWeight: number;
  /** The mandatory disclaimer (always COACH_MIX_DISCLAIMER; stored for audit). */
  disclaimer: string;
  /** True until an admin has reviewed sources and confirmed the framing. */
  needsReview: boolean;
  /** Admin-only note, e.g. "Needs admin review before influencing users." */
  adminNote?: string;
  status: 'active' | 'archived';
  createdAt: string; // ISO
}

/** One coach's slice of a blend. */
export interface CoachMixEntry {
  coachProfileId: string;
  weightPct: number; // 0–100
}

/** A named, weighted blend of coaches (plus the implicit house default). */
export interface CoachMix {
  id: string;
  name: string;
  description: string;
  sport: SportId;
  entries: CoachMixEntry[];
  visibility: Visibility;
  /** How a coach label (if any) is shown to users for this mix. */
  userLabelMode: UserLabelMode;
  createdAt: string; // ISO
}

/**
 * The RESOLVED output of a mix — the thing that actually biases SwingVantage's
 * coaching. Pure, deterministic, and explainable.
 */
export interface CoachingStrategy {
  mixId: string;
  mixName: string;
  sport: SportId;
  /** Blended weights per swing-model trait (sums to ~1). */
  traitWeights: Partial<Record<SwingModelTrait, number>>;
  /** Diagnostic categories in priority order (highest-influence first). */
  diagnosticPriority: string[];
  /** Drill-category → weight multiplier used to bias DrillMatch. */
  drillCategoryWeights: Record<string, number>;
  explanationStyle: TechnicalDepth;
  /** Short, original movement cues to lead with. */
  movementCues: string[];
  practiceProgression: string;
  retestProtocol: string;
  /** Neutral influence tags surfaced as the "why" (e.g. "Athletic Rotation"). */
  influenceTags: StyleTag[];
  /** One-line, user-safe summary of what's driving the recommendation. */
  influenceSummary: string;
  /** Whether coach names may be shown (admin opt-in). */
  coachNamesVisible: boolean;
}
