// ============================================================
// SwingIQ — Agent Layer: Shared Types
// ------------------------------------------------------------
// The "intelligent product layer" is built on deterministic
// workflows that read structured app data and return UI-ready
// insights. These types are the contract every workflow speaks.
//
// PHILOSOPHY:
//   - Structured JSON first, UI copy second.
//   - Deterministic by default. LLM is an optional enhancer.
//   - Nothing here is user-visible jargon — these are internal.
// ============================================================

import type { SportId, SkillLevel, GolferProfileInput } from '@swingiq/core';
import type { UsageCategory } from '@/store';

// ── Identity ──────────────────────────────────────────────────

/** Alias kept for spec parity ("SportType"). Use SportId everywhere internally. */
export type SportType = SportId;

/** Every agent capability has a stable id (for caching + observability). */
export type AgentId =
  | 'intake_quality'
  | 'diagnosis_confidence'
  | 'practice_planner'
  | 'progress_memory'
  | 'resume'
  | 'equipment_fit'
  | 'drill_selection'
  | 'youth_safety'
  | 'coach_sharing'
  | 'pre_game'
  | 'retention'
  | 'contextual_help'
  | 'report'
  | 'pro_upgrade'
  | 'guardrail'
  | 'next_best_action';

/** What caused a workflow to run — useful for analytics, never shown raw. */
export type AgentTrigger =
  | 'dashboard_load'
  | 'profile_restore'
  | 'session_added'
  | 'diagnosis_run'
  | 'returning_visit'
  | 'page_help'
  | 'manual';

// ── Confidence ────────────────────────────────────────────────

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface AgentConfidence {
  level: ConfidenceLevel;
  /** 0–100, deterministically derived from how much data backs the claim. */
  score: number;
  /** Plain-English reason, e.g. "based on one session". */
  reason: string;
}

// ── Observability metadata (internal, not shown unless it builds trust) ──

export interface AgentMetadata {
  agentId: AgentId;
  workflowId: string;
  triggerSource: AgentTrigger;
  confidence: ConfidenceLevel;
  /** Which data sources the output was derived from. */
  dataUsed: string[];
  createdAt: string;
  expiresAt?: string;
  /** True when deterministic fallback was used instead of an LLM. */
  fallbackUsed: boolean;
  /** Whether this output is intended to be shown to the user. */
  userVisible: boolean;
}

// ── Actions / recommendations ─────────────────────────────────

export type ActionIntent =
  | 'finish_profile'
  | 'add_equipment'
  | 'upload_session'
  | 'run_diagnosis'
  | 'create_plan'
  | 'continue_plan'
  | 'review_session'
  | 'view_progress'
  | 'generate_report'
  | 'pre_game'
  | 'share_coach'
  | 'restart'
  | 'upgrade'
  | 'learn';

/** A single, concrete thing the user can do next. */
export interface AgentAction {
  id: string;
  /** Button / link label in plain language. */
  label: string;
  /** In-app route. */
  href: string;
  intent: ActionIntent;
  /** 1 = highest. Used to rank competing actions. */
  priority: number;
  /** Optional one-liner explaining the action. */
  helperText?: string;
}

export type InsightTone = 'info' | 'success' | 'warning' | 'celebrate' | 'safety';

/**
 * The unified user-facing card model. Everything the product shows from the
 * agent layer is an AgentInsight — "SwingIQ noticed…", a next step, a nudge.
 * One model keeps the UX from feeling like 15 separate bots.
 */
export interface AgentInsight {
  id: string;
  title: string;
  body: string;
  tone: InsightTone;
  confidence?: AgentConfidence;
  evidence?: string[];
  whyItMatters?: string;
  primaryAction?: AgentAction;
  secondaryActions?: AgentAction[];
  dismissible: boolean;
  meta: AgentMetadata;
}

/** Spec parity alias — a recommendation is just an insight. */
export type AgentRecommendation = AgentInsight;

// ── Profiles (normalized) ─────────────────────────────────────

/** Sport-agnostic view of "who the athlete is". */
export interface UserProfile {
  firstName: string | null;
  sport: SportId;
  skillLevel: SkillLevel | null;
  goal: string | null;
  usageCategory: UsageCategory;
  /** True if a golf profile or a non-golf sport profile exists. */
  exists: boolean;
}

/** What we learned when a user imported/restored a saved profile. */
export interface UploadedProfile {
  restoredAt: string;
  hadProfile: boolean;
  sessionCount: number;
  sport: SportId;
}

export interface EquipmentProfile {
  sport: SportId;
  /** 0–100 completeness of the equipment data for this sport. */
  completeness: number;
  itemCount: number;
  /** Whether equipment data is detailed enough to give fit guidance. */
  sufficientForFit: boolean;
}

// ── Sessions (normalized, compact) ────────────────────────────

/**
 * Compact normalized session record. Unifies golf launch-monitor sessions
 * and non-golf video analyses into one shape so workflows stay sport-neutral.
 */
export interface SessionSummary {
  id: string;
  sport: SportId;
  source: 'session' | 'video';
  date: string;
  name: string;
  /** Primary issue / diagnosis label, if any. */
  primaryFocus: string | null;
  /** Confidence the engine had in the primary focus (0–100), if known. */
  focusConfidence: number | null;
  score: number | null;
  shotCount: number;
  hasDiagnosis: boolean;
}

export interface DiagnosisResult {
  primaryIssue: string | null;
  confidence: AgentConfidence;
  evidence: string[];
  missingData: string[];
  recommendedNextStep: string;
  avoidForNow: string[];
  plainEnglishSummary: string;
  sportSpecificCue: string;
}

// ── Practice planning ─────────────────────────────────────────

export interface PracticeDrill {
  name: string;
  why: string;
  repsOrTime: string;
  successMetric: string;
}

export interface PracticePlan {
  sport: SportId;
  practiceFocus: string;
  estimatedTimeMinutes: number;
  /** Available durations the user can pick from. */
  timeOptions: number[];
  warmup: string;
  mainDrills: PracticeDrill[];
  pressureTest: string;
  successMetric: string;
  nextSessionPrompt: string;
  difficultyLevel: SkillLevel;
  equipmentNeeded: string[];
  whyThisPlan: string;
}

// ── Progress memory ───────────────────────────────────────────

export type TrendDirection = 'improving' | 'stable' | 'declining' | 'unknown';

export interface ProgressMemory {
  trendSummary: string;
  direction: TrendDirection;
  improvedAreas: string[];
  stalledAreas: string[];
  worsenedAreas: string[];
  recurringPatterns: string[];
  suggestedAdjustment: string;
  nextBestAction: string;
}

// ── Equipment fit ─────────────────────────────────────────────

export interface EquipmentFit {
  sport: SportId;
  fitScore: number | null; // 0–100, null when not enough data
  fitConfidence: AgentConfidence;
  equipmentStrengths: string[];
  equipmentConcerns: string[];
  testSuggestions: string[];
  noChangeNeededReason: string | null;
  dataNeeded: string[];
}

// ── Safety ────────────────────────────────────────────────────

export type SafetyFlagType =
  | 'pain_injury'
  | 'youth'
  | 'medical_claim'
  | 'overtraining'
  | 'low_confidence';

export interface SafetyFlag {
  id: string;
  type: SafetyFlagType;
  severity: 'info' | 'caution' | 'stop';
  message: string;
  recommendProfessional: boolean;
}

// ── Resume / Welcome Back (centerpiece) ───────────────────────

export type ResumeStatus =
  | 'first_time'      // no usable data — point them to a baseline
  | 'minimal_data'    // has profile but not enough to plan
  | 'continue'        // active improvement loop — pick up where they left off
  | 'stale';          // returning after a long gap

export type PlanStatus = 'none' | 'in_progress' | 'completed';

export interface ResumeState {
  status: ResumeStatus;
  userFirstName: string | null;
  sport: SportId;
  sportLabel: string;
  lastGoal: string | null;
  lastSessionDate: string | null;
  daysSinceLastActivity: number | null;
  lastFocus: string | null;
  practicePlanStatus: PlanStatus;
  progressTrend: TrendDirection;
  equipmentCompleteness: number;
  sessionCount: number;
  /** "Welcome back, Danny." */
  headline: string;
  /** The plain-English continuity paragraph. */
  summary: string;
  nextBestAction: AgentAction;
  /** Continue / review last / upload new / update equipment / generate summary. */
  options: AgentAction[];
  confidence: AgentConfidence;
  meta: AgentMetadata;
}

// ── Growth / reports / misc spec types ────────────────────────

export interface GrowthSuggestion {
  id: string;
  /** Friction point detected in the funnel. */
  friction:
    | 'profile_incomplete'
    | 'upload_abandoned'
    | 'diagnosis_without_plan'
    | 'plan_incomplete'
    | 'no_return';
  message: string;
  action: AgentAction;
}

export interface ReportSummary {
  sport: SportId;
  generatedAt: string;
  kind: 'session' | '30_day' | 'coach' | 'equipment';
  title: string;
  sections: ReportSection[];
}

export interface ReportSection {
  heading: string;
  body: string;
  bullets?: string[];
}

export interface CoachShareSummary {
  coachSummary: string;
  keyEvidence: string[];
  recentTrend: string;
  suggestedCoachQuestions: string[];
  nextPracticeFocus: string;
}

/** Parent-facing companion to CoachShareSummary: simpler, safety-first,
 *  encouragement-led, with "homework" the parent can guide at home. */
export interface ParentShareSummary {
  parentSummary: string;
  focusThisWeek: string;
  homeworkDrills: string[];
  encouragement: string;
  safetyNote: string;
}

export interface UpgradeSuggestion {
  upgradeReason: string;
  relevantFeature: string;
  userBenefit: string;
  showUpgradePrompt: boolean;
}

export interface PreGamePlan {
  sport: SportId;
  title: string;
  swingThoughts: string[]; // 1–2 max
  warmupFocus: string;
  tacticalReminder: string;
  confidenceCue: string;
  whatToAvoid: string;
}

export interface IntakeQualityResult {
  ready: boolean;
  /** "This upload is ready to analyze." style headline. */
  headline: string;
  blocking: string[];
  improvements: string[];
  filmingTips: string[];
  allowContinueAnyway: boolean;
}

export interface ContextualHelp {
  page: string;
  whatThisScreenDoes: string;
  nextAction: string;
  commonMistakes: string[];
  fastestPath: string;
}

// ── Memory snapshots (compact, cached) ────────────────────────

export interface AgentMemorySnapshot {
  /** Hash of the inputs this snapshot was built from. */
  hash: string;
  createdAt: string;
  sport: SportId;
  lastFocus: string | null;
  trend: TrendDirection;
  sessionCount: number;
  /** The action we last recommended (so we can detect "still not done"). */
  lastRecommendedNextStep: ActionIntent | null;
}

// ── Orchestrator I/O ──────────────────────────────────────────

/**
 * The single object every workflow reads. Built once per render by the
 * context builder from the persisted store. Cheap, fully deterministic.
 */
export interface AgentContext {
  now: string;

  // Identity
  activeSport: SportId;
  sportLabel: string;
  profile: UserProfile;

  // Raw-ish references (normalized)
  golfProfile: GolferProfileInput | null;
  sportProfiles: Record<string, unknown>;

  // Inventory
  hasGolfProfile: boolean;
  hasSportProfile: boolean;
  clubCount: number;
  equipment: EquipmentProfile;

  // Activity (active sport)
  sessions: SessionSummary[];           // all sports, newest first
  sportSessions: SessionSummary[];      // active sport only, newest first
  latestSession: SessionSummary | null; // active sport
  latestDiagnosedSession: SessionSummary | null;
  sessionCount: number;

  // Training
  planStatus: PlanStatus;
  hasActivePlan: boolean;
  streakDays: number;
  lastPracticeDate: string | null;

  // Recency
  lastActivityAt: string | null;
  daysSinceLastActivity: number | null;

  // Preferences / safety
  usageCategory: UsageCategory;
  coachingStyle: string;
  units: 'yards' | 'meters';
}

export interface AgentWorkflowResult {
  /** Generated at build time. */
  generatedAt: string;
  trigger: AgentTrigger;
  resume: ResumeState;
  nextBestAction: AgentAction;
  /** Ordered, de-duplicated, dismissable insight cards for the dashboard. */
  insights: AgentInsight[];
  /** Safety flags that should gate or annotate recommendations. */
  safetyFlags: SafetyFlag[];
}
