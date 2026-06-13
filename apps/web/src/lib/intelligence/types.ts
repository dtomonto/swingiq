// ============================================================
// SwingVantage — General Athlete Intelligence (GAI): shared types
// ------------------------------------------------------------
// The vocabulary for the Intelligence Routing layer. This is the THIN
// connective tissue that names the existing systems into one ladder:
//
//   • Operating modes   → which posture the platform takes toward spend
//   • Intelligence tiers → the three user-facing analysis products
//   • Analysis routes    → how a single request is actually served
//
// It deliberately does NOT re-implement the heuristic engine, provider
// adapters, budget guard, or orchestrator that already exist — it routes
// across them. See docs/intelligence-routing.md.
//
// Pure types only (no runtime, no secrets) — safe to import anywhere.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { TierId } from '@/lib/billing/tiers';

/** Platform-wide posture toward AI spend, set by an admin. */
export type OperatingMode = 'DEFAULT_AI_MODE' | 'COST_SAVING_MODE';

/** The three user-facing, monetizable analysis products. */
export type IntelligenceTier =
  | 'INSTANT_ESTIMATE'
  | 'AI_SWING_REPORT'
  | 'PREMIUM_RETEST_PLAN';

/** How a single analysis request was actually served. */
export type AnalysisRoute =
  | 'HEURISTIC_ONLY'
  | 'HYBRID'
  | 'FULL_AI'
  | 'CACHED'
  | 'FALLBACK_HEURISTIC'
  | 'ADMIN_FORCED_HEURISTIC';

/** Where the content of a result came from (drives the honest UI label). */
export type AnalysisSourceMode = 'heuristic' | 'hybrid' | 'ai' | 'cached';

/** A coarse, human-readable confidence band. */
export type ConfidenceLabel = 'low' | 'moderate' | 'high';

// ── Request / result ────────────────────────────────────────

/** A normalized analysis request — the single shape the router consumes. */
export interface AnalysisRequest {
  /** Which product the caller is asking for. */
  tier: IntelligenceTier;
  sport: SportId;
  /** The selected issue / miss pattern (curated id or free text). */
  issue: string;
  /** Optional finer symptoms the athlete selected. */
  symptoms?: string[];
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  /** Plain-language athlete goals, used to tune the plan copy. */
  goals?: string[];
  handedness?: 'left' | 'right';
  /** True when a swing video is available for deeper (AI) analysis. */
  videoAvailable?: boolean;
  /** The signed-in user's id (for per-user caps / logging), if any. */
  userId?: string | null;
}

/**
 * A normalized analysis result. Every route — heuristic, hybrid, full AI,
 * cached, fallback — returns this same shape so the report UI never branches
 * on provider internals.
 */
export interface AnalysisResult {
  tier: IntelligenceTier;
  route: AnalysisRoute;
  sourceMode: AnalysisSourceMode;
  sport: SportId;
  issue: string;
  diagnosis: string;
  /** 0..1 — how sure the layer is about the diagnosis. */
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  reasoning: string;
  primaryFix: string;
  drills: DrillRecommendation[];
  practicePlan: PracticePlan;
  retest: RetestInstruction;
  /** Setup / equipment note when relevant. */
  setupNote?: string;
  /** Premium upsell shown when a deeper tier would add value. */
  upgradeCTA?: string;
  /** True when the underlying fault entry was synthesized, not curated. */
  generated?: boolean;
  /** Honest one-liner about what this analysis is (and is not). */
  disclaimer: string;
  /** Branding line surfaced in the UI. */
  poweredBy: 'SwingVantage GAI';
  ruleVersion: string;
  /** Upper-bound estimated cost of producing this result, in cents. */
  costEstimateCents: number;
}

export interface DrillRecommendation {
  name: string;
  goal: string;
  /** Optional deep link into the existing drill library. */
  slug?: string;
}

export interface PracticePlan {
  /** A 7-entry, one-line-per-day plan. */
  days: string[];
}

export interface RetestInstruction {
  protocol: string;
  activeWindowDays: number;
  improvedWhen: string;
}

// ── Heuristic rule schema (data-driven, versioned) ──────────

/**
 * The schema an Instant-Estimate heuristic rule conforms to. Rules are derived
 * from the existing multi-sport fault ontology + per-sport drill libraries — this
 * type documents the contract so future rules can be added as data, not code.
 */
export interface HeuristicRule {
  id: string;
  sport: SportId;
  issue: string;
  symptoms: string[];
  skillLevelRange: string[];
  confidenceBase: number;
  diagnosis: string;
  reasoning: string;
  primaryFix: string;
  drills: string[];
  sevenDayPlan: string[];
  retestProtocol: string;
  setupNote?: string;
  upgradeCTA: string;
  version: string;
}

// ── Routing ─────────────────────────────────────────────────

/** A coarse, upper-bound cost estimate for a candidate route. */
export interface CostEstimate {
  cents: number;
  /** The metered operation id this maps onto (see lib/ai-budget). */
  op: string;
}

/** Everything the pure decision function needs — no I/O, fully testable. */
export interface RouteDecisionInput {
  operatingMode: OperatingMode;
  tier: IntelligenceTier;
  userPlan: TierId;
  videoAvailable: boolean;
  cacheHit: boolean;
  cacheAllowed: boolean;
  /** True when an AI provider key for the needed stage is configured. */
  providerConfigured: boolean;
  /** True when that provider is currently healthy. */
  providerHealthy: boolean;
  /** True when budget + per-user caps allow another paid call. */
  budgetAllows: boolean;
  estimatedCostCents: number;
  /** Per-tier max spend cap, in cents (0 = no cap). */
  maxCostCents: number;
  /** Global admin "serve heuristics for everything" toggle. */
  adminForceHeuristic: boolean;
  /** Global admin kill switch — no paid calls at all. */
  adminKillSwitch: boolean;
  /** In Cost-Saving Mode, whether AI is explicitly allowed for this tier. */
  adminAllowsAIOverrideForTier: boolean;
}

/** The router's verdict for one request. */
export interface RouteDecision {
  route: AnalysisRoute;
  usesAI: boolean;
  reason: string;
  costEstimateCents: number;
}

// ── Tier configuration ──────────────────────────────────────

export interface TierConfig {
  tier: IntelligenceTier;
  /** User-facing product name. */
  name: string;
  description: string;
  enabled: boolean;
  usesVideo: boolean;
  usesAI: boolean;
  usesHeuristic: boolean;
  usesCache: boolean;
  /** Which billing plans may run this tier (empty = all). */
  allowedPlans: TierId[];
  /** Per-analysis spend ceiling in cents (0 = no cap). */
  maxCostCents: number;
  /** Target latency in ms (informational / observability). */
  maxLatencyMs: number;
  upgradeCTA: string;
}

// ── Observability ───────────────────────────────────────────

/** One route-decision record for the admin observability surface. */
export interface AnalysisLog {
  at: string;
  tier: IntelligenceTier;
  route: AnalysisRoute;
  sourceMode: AnalysisSourceMode;
  sport: SportId;
  issue: string;
  operatingMode: OperatingMode;
  userPlan: TierId;
  usesAI: boolean;
  confidence: number;
  costEstimateCents: number;
  /** Estimated cost avoided by serving a cheaper route, in cents. */
  costAvoidedCents: number;
  reason: string;
  userId?: string | null;
}

// ── Cache ───────────────────────────────────────────────────

/** A reusable, non-personalized recommendation cache entry. */
export interface CacheEntry {
  key: string;
  result: AnalysisResult;
  generatedAt: string;
  sourceMode: AnalysisSourceMode;
  version: string;
  /** Estimated cost avoided each time this entry is reused, in cents. */
  costAvoidedCents: number;
}
