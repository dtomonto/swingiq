// ============================================================
// SwingVantage — AI Operations: provider interfaces (master-prompt §4.1)
// ------------------------------------------------------------
// The contracts the orchestrator depends on. Implementations are swappable
// (Gemini intake, MediaPipe measurement, OpenAI coach, Claude narrative)
// and registered in the AIProviderRegistry. Phase 1 implements the coach +
// narrative interfaces; the rest land in later AIO phases.
// ============================================================

import type {
  AnalysisMode,
  CoachSynthesis,
  MeasurementResult,
  NormalizedAnalysisEvidence,
  ProviderStage,
  ProviderTrace,
  VideoIntakeResult,
} from './schemas';

export interface ProviderRunMeta {
  trace: ProviderTrace;
}

export interface VideoIntakeInput {
  videoId: string;
  /** Path/URI/handle resolved by the provider (file API, storage ref, inline). */
  videoRef: string;
  sizeMb?: number;
  durationSec?: number;
  declaredSport?: string | null;
  mode: AnalysisMode;
}

export interface VideoIntakeProvider {
  readonly name: 'gemini' | string;
  intake(input: VideoIntakeInput): Promise<{ result: VideoIntakeResult | null } & ProviderRunMeta>;
}

/** Structural shape of lib/pose PoseMetrics (kept import-free so types.ts has no deps). */
export interface PoseMetricsLike {
  framesWithPose: number;
  shoulderTurnRangeDeg: number;
  spineAngleRangeDeg: number;
  headSwayPct: number;
  hipSwayPct: number;
}

export interface MeasurementInput {
  videoId: string;
  frames?: unknown;
  sport?: string | null;
  /** Client-computed on-device pose metrics (MediaPipe runs in the browser). */
  poseMetrics?: PoseMetricsLike | null;
}

export interface MeasurementProvider {
  readonly name: 'mediapipe' | string;
  measure(input: MeasurementInput): Promise<{ result: MeasurementResult | null } & ProviderRunMeta>;
}

export interface CoachInput {
  evidence: NormalizedAnalysisEvidence;
  sport: string | null;
  mode: AnalysisMode;
  /** Optional prior normalized evidence for an explicit comparison. */
  priorEvidence?: NormalizedAnalysisEvidence | null;
  skillLevel?: string | null;
}

export interface CoachProvider {
  readonly name: 'openai' | string;
  synthesize(input: CoachInput): Promise<{ result: CoachSynthesis | null } & ProviderRunMeta>;
}

export interface NarrativeInput {
  evidence: NormalizedAnalysisEvidence;
  coach: CoachSynthesis;
  sport: string | null;
}

export interface NarrativeProvider {
  readonly name: 'anthropic' | string;
  /** Returns null + a 'skipped' trace when disabled — never throws into the job. */
  narrate(input: NarrativeInput): Promise<{ result: string | null; skippedReason?: string } & ProviderRunMeta>;
}

export interface AIProviderRegistry {
  videoIntake: VideoIntakeProvider | null;
  measurement: MeasurementProvider | null;
  coach: CoachProvider | null;
  narrative: NarrativeProvider | null;
}

export interface RouteDecision {
  stage: ProviderStage;
  provider: string;
  model: string | null;
  enabled: boolean;
  reason: string;
}

export interface AIRouter {
  route(stage: ProviderStage, mode: AnalysisMode): RouteDecision;
}

export interface VersionedPrompt {
  id: string;
  version: string;
  stage: ProviderStage;
  body: string;
}

export interface AIPromptRegistry {
  get(stage: ProviderStage, opts?: { sport?: string | null; mode?: AnalysisMode }): VersionedPrompt;
}
