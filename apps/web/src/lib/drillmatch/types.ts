// ============================================================
// SwingIQ — DrillMatch + Fix Stack: Shared Types
// ------------------------------------------------------------
// DrillMatch maps a diagnosed fault to a RANKED list of drills,
// and a Fix Stack turns the top match into a 3-part intervention:
//   Feel Cue  →  Drill  →  Retest.
//
// PHILOSOPHY (matches the rest of the app):
//   - Reuse, don't reinvent. Drill content comes from the existing
//     per-sport drill libraries in @swingiq/core. This layer only
//     NORMALIZES, SCORES, and EXPLAINS — it never fabricates drills.
//   - Honest confidence. A Fix Stack carries a plain-English
//     confidence label; "matched by rules" is never dressed up as
//     "measured biomechanics".
//   - Local-first memory. "Did this drill help?" feedback is stored
//     under the user's control and feeds future ranking.
// ============================================================

import type { SportId, SkillLevel } from '@swingiq/core';
import type { AgentConfidence } from '@/lib/agents';

/** Where a drill can realistically be done. */
export type DrillLocation = 'home' | 'field' | 'either';

/**
 * One normalized drill, unified across every sport's drill library
 * (golf video drills + the four multi-sport drill sets). This is the
 * single shape DrillMatch scores against.
 */
export interface DrillCandidate {
  id: string;
  sport: SportId;
  /** Fault ids this drill directly addresses (from the source `issue_id`). */
  faultIds: string[];
  /** Skill-family tags used for fuzzy matching when no direct fault id hits. */
  families: string[];
  name: string;
  goal: string;
  steps: string[];
  repsOrDuration: string;
  /** Rough minutes the drill takes, parsed from reps/duration text. */
  estimatedMinutes: number;
  skillLevel: SkillLevel;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Lower-cased equipment tokens the drill needs. `[]` means none/bodyweight. */
  equipment: string[];
  location: DrillLocation;
  /** The simple body/intent cue — becomes the Fix Stack "Feel Cue". */
  feelCue: string;
  /** Coach/channel hint (never a hardcoded URL). */
  coachingHint: string;
  youtubeSearchUrl: string;
  safetyNote: string | null;
  source: 'golf_video' | 'sport';
}

/** Recorded "did this drill help?" signal. */
export type DrillFeedbackValue = 'helped' | 'no_change' | 'hurt';

export interface DrillFeedbackRecord {
  drillId: string;
  faultId: string;
  sport: SportId;
  value: DrillFeedbackValue;
  notes?: string;
  recordedAt: string; // ISO
}

/**
 * A storage-agnostic repository for drill feedback. The default impl is
 * local-first (localStorage), but the interface lets a cloud adapter be
 * dropped in later without touching the scoring code.
 */
export interface DrillFeedbackRepository {
  record(input: Omit<DrillFeedbackRecord, 'recordedAt'>): DrillFeedbackRecord;
  getFor(drillId: string, faultId?: string): DrillFeedbackRecord[];
  latestFor(drillId: string, faultId?: string): DrillFeedbackRecord | null;
  all(): DrillFeedbackRecord[];
  clear(): void;
}

/** Everything the matcher uses to rank drills. All fields optional but `sport`. */
export interface DrillMatchInput {
  sport: SportId;
  /** Preferred: the diagnosed fault id (matches a core issue / ontology id). */
  faultId?: string;
  /** Fallback free-text fault label (e.g. an AI-surfaced focus). */
  faultName?: string;
  skillLevel?: SkillLevel;
  goal?: string;
  /** Minutes the user has to practice. */
  timeAvailableMinutes?: number;
  /** Lower-cased equipment tokens the user has. Empty/undefined = unknown. */
  availableEquipment?: string[];
  /** Plain-language constraints, e.g. "low back", "youth". */
  physicalConstraints?: string[];
  /** Confidence of the upstream analysis — flows into the Fix Stack's label. */
  analysisConfidence?: AgentConfidence['level'];
  /** How many ranked drills to return (default 4). */
  limit?: number;
}

/** One transparent reason a drill scored the way it did (shown as "why"). */
export interface MatchReason {
  label: string;
  /** Signed contribution to the score, for debugging / sorting transparency. */
  weight: number;
}

/** A drill plus its DrillMatch score and the reasons behind it. */
export interface RankedDrill {
  drill: DrillCandidate;
  /** 0–100 normalized match score (guidance, not a guarantee). */
  score: number;
  reasons: MatchReason[];
  /** Whether prior "did this help?" feedback influenced the score. */
  feedbackApplied: DrillFeedbackValue | null;
  /** True when the drill directly targets the diagnosed fault id. */
  directHit: boolean;
}

// ── Fix Stack (the branded 3-part intervention) ───────────────

export interface FixStackFeelCue {
  title: string;
  body: string;
}

export interface FixStackDrill {
  id: string;
  name: string;
  goal: string;
  steps: string[];
  repsOrDuration: string;
  estimatedMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skillLevel: SkillLevel;
  equipment: string[];
  coachingHint: string;
  youtubeSearchUrl: string;
  /** Plain-language reason this drill was chosen for this fault. */
  why: string;
  safetyNote: string | null;
}

export interface FixStackRetest {
  whatToReassess: string;
  sameConditions: string[];
  improvedWhen: string;
  activeWindowDays: number;
  /** Friendly "by <date>" target derived from the active window. */
  dueLabel: string;
  /** ISO date the retest is due. */
  dueOn: string;
}

/**
 * The Fix Stack: Feel Cue → Drill → Retest for one fault, with honest
 * confidence and a basis note so the user always knows what it's built on.
 */
export interface FixStack {
  sport: SportId;
  faultId: string;
  faultName: string;
  feelCue: FixStackFeelCue;
  drill: FixStackDrill;
  retest: FixStackRetest;
  /** The single most common mistake to avoid while practising this fix. */
  mistakeToAvoid: string;
  confidence: AgentConfidence;
  /** Other strong matches, ranked, for users who want options. */
  alternatives: RankedDrill[];
  /** "Matched by rules from your reported issue — not measured biomechanics." */
  basisNote: string;
  /** True when no curated drill matched and a generic fix was synthesized. */
  generated: boolean;
  createdAt: string;
}
