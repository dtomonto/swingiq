// ============================================================
// SwingVantage — Athlete General Intelligence (AGI): Domain Types
// ------------------------------------------------------------
// "AGI" here = **Athlete General Intelligence**. SwingVantage already has many
// *narrow* engines — each is brilliant at exactly one task (motion metrics,
// drill matching, readiness, benchmarks). This module is the *general* one:
// a single reasoning system that works across ALL seven sports and ALL of
// those signals at once. It fuses them into one model of the whole athlete,
// reasons over that model, transfers what it learns between sports, and
// shows its work.
//
// "General" is used in the AI sense — breadth and transfer across domains,
// as opposed to narrow single-task models. It is NOT a claim of human-level
// or "artificial general intelligence". The engine is deterministic-first,
// every conclusion carries a `basis` + `confidence` + the evidence it used,
// and an optional LLM may only re-word the narrative (never invent numbers).
// This keeps it in line with the rest of the product: honest by design.
// ============================================================

import type { SportId } from '@swingiq/core';

/** How trustworthy a value is. Mirrors the app-wide basis ladder. */
export type Basis = 'measured' | 'estimated' | 'ai_inferred' | 'user_entered' | 'placeholder';

/** Honest, non-clinical score bands (shared with the readiness engine's bands). */
export type ScoreBand = 'building' | 'developing' | 'solid' | 'sharp';

export type { SportId };

// ── The sport-neutral capabilities the engine reasons over ────
//
// The trick that makes the engine "general": every sport-specific metric is
// mapped onto a small set of latent, sport-neutral athletic CAPABILITIES.
// These are the traits an athlete actually carries between sports — the same
// rotation that powers a golf drive powers a tennis forehand. Reasoning over
// capabilities (not raw metrics) is what lets one finding span many sports.

export type CapabilityId =
  | 'rotation'
  | 'sequencing'
  | 'balance'
  | 'tempo'
  | 'power'
  | 'consistency';

export interface CapabilityDef {
  id: CapabilityId;
  name: string;
  /** Sport-neutral description of the underlying athletic trait. */
  description: string;
  /** Linked skill-transfer principle id, when one exists (@/lib/skillTransfer). */
  principleId?: string;
}

// ── Normalized signals (what adapters produce) ────────────────

/** One normalized observation feeding the world model. Sport-neutral. */
export interface CapabilitySignal {
  capability: CapabilityId;
  sport: SportId;
  /** 0–100 normalized quality for this observation. */
  score: number;
  /** 0–1 confidence of the underlying measurement. */
  confidence: number;
  basis: Basis;
  /** Source metric id + human name, for evidence/citation. */
  metricId: string;
  metricName: string;
  /** When it was captured (ISO date). */
  at: string;
  /** Source session id (for drill lookups / citations). */
  sessionId: string;
}

/** Drill/fix hint a source attached to a capability, for plan-building. */
export interface DrillHint {
  capability: CapabilityId;
  fix: string;
  drillId: string | null;
}

/** A drill the athlete has personally marked as having helped before. */
export interface ProvenDrill {
  drillId: string;
  drillName: string;
  /** Best-effort capability the drill trains (from its fault/name), or null. */
  capability: CapabilityId | null;
  sports: SportId[];
  /** How many times the athlete said it helped. */
  helpedCount: number;
}

/** A compact per-session overview, used for trend + consistency reasoning. */
export interface SportSessionRef {
  sport: SportId;
  sportLabel: string;
  emoji: string;
  motionLabel: string;
  sessionId: string;
  at: string;
  overall: number;
  confidence: number;
  keyFault: string;
  drillHints: DrillHint[];
}

/** Declared, self-reported context about the athlete (basis: user_entered). */
export interface AthleteIdentity {
  /** Sports the athlete says they train (may exceed sports with analysed data). */
  declaredSports: SportId[];
  primarySport: SportId | null;
  skillLevel?: string;
  handedness?: string;
  handicap?: number | null;
  /** Free-text goal the athlete entered (e.g. "hit my driver straighter"). */
  primaryGoal?: string | null;
  /** Capabilities that goal most depends on, mapped from the goal text. */
  goalCapabilities?: CapabilityId[];
}

/**
 * "Today's form" — a daily-state axis, NOT a body capability. Comes from the
 * readiness engine (recovery, streak, soreness, recent trend). It modulates HOW
 * to train today; it never changes the structural capability scores.
 */
export interface ReadinessSnapshot {
  /** 0–100 guidance score. */
  score: number;
  band: ScoreBand;
  headline: string;
  /** The biggest signed contributors, for transparency. */
  drivers: Array<{ label: string; contribution: number }>;
  /** A safety note that overrides the number (e.g. flagged discomfort). */
  caution: string | null;
  /** Plain-language basis reminder (guidance, not measurement). */
  basis: string;
}

/**
 * A compact point-in-time record of the athlete model, persisted locally so the
 * engine can show how capabilities move over time (the honest retest loop).
 */
export interface AGISnapshot {
  at: string; // ISO timestamp
  coverage: number;
  capabilities: Array<{ id: CapabilityId; score: number | null; basis: Basis }>;
  keystone: CapabilityId | null;
  sports: SportId[];
}

/** Everything the engine knows, normalized. Built by source adapters. */
export interface SignalBundle {
  signals: CapabilitySignal[];
  sportSessions: SportSessionRef[];
  /** Optional declared context (who the athlete is + what they want). */
  identity?: AthleteIdentity;
  /** Optional "today's form" snapshot. */
  readiness?: ReadinessSnapshot;
  /** Optional prior snapshots (oldest → newest) for progress over time. */
  history?: AGISnapshot[];
  /** Optional drills the athlete has personally found helpful. */
  provenDrills?: ProvenDrill[];
  /** Opt-in (Phase 9): allow cross-sport transfers/insights. When false (the
   *  default), Athlete GI keeps recommendations within the active sport even if
   *  the athlete has data in several sports. */
  allowCrossSport?: boolean;
}

// ── The unified athlete model ─────────────────────────────────

export interface CapabilityPerSport {
  sport: SportId;
  score: number;
  confidence: number;
  sampleCount: number;
}

/** How a capability has trended across stored snapshots. */
export interface CapabilityTrajectory {
  direction: 'up' | 'down' | 'flat';
  /** Change from the earliest tracked score to now (null if <2 points). */
  deltaFromFirst: number | null;
  /** Score points over time (oldest → newest, includes the current value). */
  points: number[];
}

export interface CapabilityState {
  capability: CapabilityId;
  name: string;
  description: string;
  /** Confidence-weighted score 0–100 across all sports, or null if unobserved. */
  score: number | null;
  /** Honest band for the score (null if unobserved). */
  band: ScoreBand | null;
  /** Trend of this capability across snapshots (null if no/!enough history). */
  trajectory: CapabilityTrajectory | null;
  /** 0–1 aggregate confidence. */
  confidence: number;
  /** Most conservative (lowest) basis among the contributing evidence. */
  basis: Basis;
  /** Distinct sports that evidence this capability. */
  sports: SportId[];
  /** How many sports this trait spans — the "generality" of the capability. */
  breadth: number;
  /** Number of contributing observations. */
  sampleCount: number;
  perSport: CapabilityPerSport[];
  /** Strongest evidence rows (most confident first), for citation. */
  evidence: CapabilitySignal[];
}

export interface AthleteWorldModel {
  /** Sports the athlete actually has data for. */
  sports: SportId[];
  primarySport: SportId | null;
  /** True when ≥2 sports have data — generality matters more here. */
  crossSport: boolean;
  /** Declared context, when available (sports trained, goal, skill…). */
  identity: AthleteIdentity | null;
  /** "Today's form" snapshot, when available. */
  readiness: ReadinessSnapshot | null;
  capabilities: CapabilityState[];
  /** Overall 0–1 data coverage (how much the engine actually knows). */
  coverage: number;
  /** Honest inventory of what is present vs missing. */
  dataMap: {
    totalSessions: number;
    sportsWithData: number;
    capabilitiesObserved: number;
    capabilitiesTotal: number;
    missing: string[];
  };
  generatedAt: string;
}

// ── Reasoning output ──────────────────────────────────────────

export type InsightKind =
  | 'readiness' // today's form — how to train right now (safety can lead)
  | 'keystone' // one weak general capability limiting multiple sports
  | 'goal' // how the athlete's stated goal maps to a capability
  | 'progress' // how capabilities have moved since a prior snapshot
  | 'strength' // a transferable strength to lean on
  | 'transfer' // a cross-sport transfer opportunity
  | 'imbalance' // a capability already strong in one sport, lagging in another
  | 'recurring' // the same fault keeps coming back across sessions/sports
  | 'plateau' // the focus capability has stalled across snapshots
  | 'consistency' // repeatability concern
  | 'coverage'; // not enough data — what to capture next

/** One inspectable step in the engine's reasoning chain. */
export interface ReasoningStep {
  /** A short, plain claim. */
  claim: string;
  /** What evidence supports it (session/metric references). */
  evidence: string[];
}

export interface Insight {
  id: string;
  kind: InsightKind;
  title: string;
  /** One-paragraph plain-English explanation. */
  summary: string;
  capability: CapabilityId | null;
  /** Sports this insight touches. */
  sports: SportId[];
  /** The deterministic, inspectable reasoning chain. */
  reasoning: ReasoningStep[];
  basis: Basis;
  /** 0–1 confidence in the conclusion. */
  confidence: number;
  /** 0–1 — how broadly acting on this helps. Drives ranking. */
  leverage: number;
  /** The single recommended action. */
  action: string;
}

// ── Progress over time ────────────────────────────────────────

export interface CapabilityProgress {
  capability: CapabilityId;
  name: string;
  before: number | null;
  after: number | null;
  delta: number | null;
}

export interface ProgressReport {
  /** Date of the baseline snapshot we compared against (ISO). */
  sinceDate: string;
  /** How many snapshots are stored. */
  snapshots: number;
  deltas: CapabilityProgress[];
  biggestImprover: CapabilityProgress | null;
  biggestDecliner: CapabilityProgress | null;
  /** Movement of whatever is the current keystone, if it was tracked before. */
  keystoneMoved: CapabilityProgress | null;
  summary: string;
}

// ── Trust grade (meta-confidence) ─────────────────────────────

export interface TrustGrade {
  grade: 'A' | 'B' | 'C' | 'D';
  /** 0–100 meta-confidence in the whole picture. */
  score: number;
  headline: string;
  /** What is holding it up / what would raise it. */
  reasons: string[];
  /** The single highest-impact action to raise the grade (with a deep link). */
  nextStep?: { text: string; href: string };
}

/** The keystone capability phrased in each of the athlete's sports. */
export interface KeystoneTranslation {
  sport: SportId;
  sportLabel: string;
  text: string;
}

// ── Cross-domain transfer ─────────────────────────────────────

export interface TransferLink {
  capability: CapabilityId;
  /** Principle name from the skill-transfer map. */
  principle: string;
  fromSport: SportId;
  toSport: SportId;
  fromExpression: string;
  toExpression: string;
  /** Why we believe it transfers for THIS athlete (data-grounded). */
  rationale: string;
  /** Honest caveat — related, not guaranteed. */
  note: string;
}

// ── Goal-directed general plan ────────────────────────────────

export interface PlanFocus {
  capability: CapabilityId;
  name: string;
  why: string;
  sportsHelped: SportId[];
  /** `proven` marks a drill the athlete has personally found helpful before. */
  drills: Array<{ sport: SportId; fix: string; drillId: string | null; proven?: boolean }>;
}

export interface GeneralPlan {
  /** The one keystone focus that lifts the most across sports. */
  keystone: PlanFocus | null;
  supporting: PlanFocus[];
  /** A simple weekly structure. */
  week: Array<{ day: string; focus: string; minutes: number }>;
  /** What today's readiness means for how hard to train today (null if unknown). */
  todayNote: string | null;
  retestReminder: string;
  confidence: number;
  basis: Basis;
}

// ── Top-level result ──────────────────────────────────────────

export interface AthleteGIResult {
  model: AthleteWorldModel;
  insights: Insight[];
  transfers: TransferLink[];
  plan: GeneralPlan;
  /** How capabilities have moved since a prior snapshot (null if no history). */
  progress: ProgressReport | null;
  /** Overall "how much to trust this picture" meta-grade. */
  trust: TrustGrade;
  /** The keystone capability phrased for each of the athlete's sports. */
  keystoneTranslations: KeystoneTranslation[];
  /** Drills the athlete has personally found helpful (most-helped first). */
  provenDrills: ProvenDrill[];
  /** Honest, plain-English framing of what this is and is not. */
  disclaimer: string;
  version: string;
  /** True only if an LLM re-worded the narrative; numbers are always deterministic. */
  enhanced: boolean;
}
