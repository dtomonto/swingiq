// ============================================================
// SwingVantage — Athlete Priority Engine types (Phase 7)
// ============================================================

export type PrioritySeverity = 'critical' | 'high' | 'medium' | 'low';

/** How a priority is moving across the athlete's history. */
export type PriorityTrend = 'new' | 'persisting' | 'improving' | 'worsening';

export type PrioritySource = 'launch_monitor' | 'video' | 'gapping' | 'readiness';

export interface PriorityEvidence {
  label: string;
  detail: string;
}

export interface AthletePriority {
  /** Diagnostic rule id, or a synthetic id (e.g. 'club_gapping'). */
  id: string;
  label: string;
  summary: string;
  severity: PrioritySeverity;
  /** 0–100, recency- and sample-size-weighted. */
  confidence: number;
  /** Ranking score (higher = higher priority). */
  score: number;
  /** Number of sessions this appeared in. */
  occurrences: number;
  /** Total shots backing it across sessions. */
  sampleSize: number;
  trend: PriorityTrend;
  source: PrioritySource;
  recommendedPlanHref: string;
  evidence: PriorityEvidence[];
}

/** A persisted point-in-time record so we can show "what changed". */
export interface PrioritySnapshot {
  date: string;
  topId: string | null;
  topLabel: string | null;
  secondaryId: string | null;
}

export interface PriorityResult {
  generatedAt: string;
  top: AthletePriority | null;
  secondary: AthletePriority | null;
  /** All priorities, ranked. */
  all: AthletePriority[];
  /** Data that would sharpen the priorities (honest gaps). */
  whatsMissing: string[];
  /** Plain-language note vs the previous snapshot, or null. */
  whatChanged: string | null;
  /** True when there isn't enough cross-session data to synthesize. */
  insufficientData: boolean;
}
