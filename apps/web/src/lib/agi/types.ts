// ============================================================
// SwingIQ — Athlete General Intelligence (AGI): Domain Types
// ------------------------------------------------------------
// "AGI" here = **Athlete General Intelligence**. SwingIQ already has many
// *narrow* engines — each is brilliant at exactly one task (motion metrics,
// drill matching, readiness, benchmarks). This module is the *general* one:
// a single reasoning system that works across ALL five sports and ALL of
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

/** Everything the engine knows, normalized. Built by source adapters. */
export interface SignalBundle {
  signals: CapabilitySignal[];
  sportSessions: SportSessionRef[];
}

// ── The unified athlete model ─────────────────────────────────

export interface CapabilityPerSport {
  sport: SportId;
  score: number;
  confidence: number;
  sampleCount: number;
}

export interface CapabilityState {
  capability: CapabilityId;
  name: string;
  description: string;
  /** Confidence-weighted score 0–100 across all sports, or null if unobserved. */
  score: number | null;
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
  | 'keystone' // one weak general capability limiting multiple sports
  | 'strength' // a transferable strength to lean on
  | 'transfer' // a cross-sport transfer opportunity
  | 'imbalance' // a capability already strong in one sport, lagging in another
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
  drills: Array<{ sport: SportId; fix: string; drillId: string | null }>;
}

export interface GeneralPlan {
  /** The one keystone focus that lifts the most across sports. */
  keystone: PlanFocus | null;
  supporting: PlanFocus[];
  /** A simple weekly structure. */
  week: Array<{ day: string; focus: string; minutes: number }>;
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
  /** Honest, plain-English framing of what this is and is not. */
  disclaimer: string;
  version: string;
  /** True only if an LLM re-worded the narrative; numbers are always deterministic. */
  enhanced: boolean;
}
