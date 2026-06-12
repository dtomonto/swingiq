// ============================================================
// SwingVantage — AI Operations: analysis orchestrator (master-prompt §4 / §10)
// ------------------------------------------------------------
// The conductor that turns one swing video into the user-facing report by
// running the pipeline end to end:
//
//   video_intake (Gemini)  ┐
//                          ├─→ normalize ─→ coach_synthesis (OpenAI)
//   measurement (MediaPipe)┘                       └─→ premium_narrative (Claude, opt-in)
//
// Design contracts:
//   • KEYLESS-SAFE — every stage degrades to null + an honest ProviderTrace;
//     the orchestrator NEVER throws into the caller. A provider that throws is
//     caught and recorded as an 'error' trace, not a crashed job.
//   • HONEST STATUS — completed only when the coach produced a grounded report
//     at or above the human-review confidence threshold; below it → needs_review;
//     no coach output → failed, with a precise failureReason.
//   • The coach always receives normalized evidence, so its output carries the
//     "one fix / one plan / one retest" contract automatically (that is the
//     whole point of routing the coach through this layer).
//
// Pure core (runAnalysisPipeline takes injected providers) + thin env-backed
// entrypoints (buildAnalysisRegistry / runAnalysis) so it is fully unit-testable
// offline and wires the real providers in production without re-plumbing.
// ============================================================

import { loadAIConfig, type AIModelConfig } from './model-config';
import { normalizeEvidence } from './normalize';
import { createOpenAICoachProvider } from './coach-provider';
import { createClaudeNarrativeProvider } from './narrative-provider';
import { createGeminiVideoIntakeProvider } from './providers/gemini-intake';
import { getMeasurementProvider } from './providers/measurement';
import {
  type AIAnalysisJob,
  type AnalysisMode,
  type AnalysisStatus,
  type CoachSynthesis,
  type NormalizedAnalysisEvidence,
  type ProviderTrace,
} from './schemas';
import type {
  AIProviderRegistry,
  PoseMetricsLike,
} from './types';

export interface AnalysisRequest {
  jobId: string;
  userId: string;
  videoId: string;
  /** Resolved video handle: a `data:video/...;base64,...` URL (inline) or a
   *  Gemini `files/...` resource URI (large clips uploaded ahead of time). */
  videoRef: string;
  sport: string | null;
  mode: AnalysisMode;
  sizeMb?: number;
  durationSec?: number;
  declaredSport?: string | null;
  /** Client-computed on-device MediaPipe pose proxies (measurement input). */
  poseMetrics?: PoseMetricsLike | null;
  skillLevel?: string | null;
  /** Prior normalized evidence for an explicit retest comparison. */
  priorEvidence?: NormalizedAnalysisEvidence | null;
}

export interface AnalysisPipelineResult {
  job: AIAnalysisJob;
  evidence: NormalizedAnalysisEvidence;
  coach: CoachSynthesis | null;
  /** Optional premium polish; null unless Claude narrative is enabled + ran. */
  narrative: string | null;
  traces: ProviderTrace[];
}

export interface OrchestratorDeps {
  registry: AIProviderRegistry;
  config: AIModelConfig;
  now?: () => string;
}

/** Sum nullable numbers, returning null when every input was null. */
function sumOrNull(values: Array<number | null | undefined>): number | null {
  let total = 0;
  let any = false;
  for (const v of values) {
    if (typeof v === 'number' && Number.isFinite(v)) {
      total += v;
      any = true;
    }
  }
  return any ? total : null;
}

/**
 * Run the full analysis pipeline with injected providers. Deterministic given
 * its providers + clock; performs no IO of its own beyond the provider calls.
 */
export async function runAnalysisPipeline(
  req: AnalysisRequest,
  deps: OrchestratorDeps,
): Promise<AnalysisPipelineResult> {
  const now = deps.now ?? (() => new Date().toISOString());
  const { registry, config } = deps;
  const createdAt = now();
  const traces: ProviderTrace[] = [];

  // ── Stage 1+2: video intake + measurement run independently → parallel ──
  const [intakeRes, measureRes] = await Promise.all([
    safeStage(
      'video_intake',
      now,
      () =>
        registry.videoIntake?.intake({
          videoId: req.videoId,
          videoRef: req.videoRef,
          sizeMb: req.sizeMb,
          durationSec: req.durationSec,
          declaredSport: req.declaredSport ?? req.sport,
          mode: req.mode,
        }) ?? Promise.resolve(null),
    ),
    safeStage(
      'measurement',
      now,
      () =>
        registry.measurement?.measure({
          videoId: req.videoId,
          sport: req.sport,
          poseMetrics: req.poseMetrics ?? null,
        }) ?? Promise.resolve(null),
    ),
  ]);

  if (intakeRes.trace) traces.push(intakeRes.trace);
  if (measureRes.trace) traces.push(measureRes.trace);

  // ── Stage 3: normalize (pure honesty gate) ──
  const evidence = normalizeEvidence({
    videoIntake: intakeRes.result,
    measurements: measureRes.result,
  });

  // ── Stage 4: coach synthesis (skipped when there's nothing to ground on) ──
  let coach: CoachSynthesis | null = null;
  if (evidence.evidenceClaims.length === 0) {
    traces.push(skipTrace('coach_synthesis', 'openai', now, 'no_evidence'));
  } else {
    const c = await safeStage('coach_synthesis', now, () =>
      registry.coach?.synthesize({
        evidence,
        sport: req.sport,
        mode: req.mode,
        priorEvidence: req.priorEvidence ?? null,
        skillLevel: req.skillLevel ?? null,
      }) ?? Promise.resolve(null),
    );
    coach = c.result;
    if (c.trace) traces.push(c.trace);
  }

  // ── Stage 5: premium narrative (opt-in; never blocks the job) ──
  let narrative: string | null = null;
  if (coach && req.mode === 'premium' && registry.narrative) {
    try {
      const n = await registry.narrative.narrate({ evidence, coach, sport: req.sport });
      narrative = n.result;
      if (n.trace) traces.push(n.trace);
    } catch (err) {
      traces.push(errorTrace('premium_narrative', 'anthropic', now, err));
    }
  }

  // ── Assemble the job record with honest status + rolled-up metrics ──
  const { status, failureReason } = decideStatus(coach, evidence.confidenceScore, config);
  const completedAt = now();

  const job: AIAnalysisJob = {
    id: req.jobId,
    userId: req.userId,
    videoId: req.videoId,
    sport: req.sport,
    status,
    analysisMode: req.mode,
    createdAt,
    startedAt: createdAt,
    completedAt: status === 'failed' ? null : completedAt,
    failedAt: status === 'failed' ? completedAt : null,
    failureReason,
    providerTrace: traces,
    costEstimate: sumOrNull(traces.map((t) => t.estimatedCost)),
    latencyMs: sumOrNull(traces.map((t) => t.latencyMs)),
    confidenceScore: coach ? evidence.confidenceScore : null,
  };

  return { job, evidence, coach, narrative, traces };
}

/** Decide the job's terminal status from the coach result + blended confidence. */
function decideStatus(
  coach: CoachSynthesis | null,
  confidence: number,
  config: AIModelConfig,
): { status: AnalysisStatus; failureReason: string | null } {
  if (!coach) {
    return { status: 'failed', failureReason: 'No coaching report was produced (no provider, or evidence too weak).' };
  }
  const threshold = config.system.humanReviewLowConfidenceThreshold;
  if (confidence < threshold) {
    return { status: 'needs_review', failureReason: null };
  }
  return { status: 'completed', failureReason: null };
}

/** Run a stage, converting a thrown error into an honest 'error' trace. */
async function safeStage<R>(
  stage: ProviderTrace['stage'],
  now: () => string,
  fn: () => Promise<({ result: R | null; trace: ProviderTrace } | null)>,
): Promise<{ result: R | null; trace: ProviderTrace | null }> {
  try {
    const res = await fn();
    if (!res) return { result: null, trace: null };
    return { result: res.result, trace: res.trace };
  } catch (err) {
    const provider = stage === 'video_intake' ? 'gemini' : stage === 'measurement' ? 'mediapipe' : 'openai';
    return { result: null, trace: errorTrace(stage, provider, now, err) };
  }
}

function skipTrace(
  stage: ProviderTrace['stage'],
  provider: ProviderTrace['provider'],
  now: () => string,
  reason: string,
): ProviderTrace {
  return {
    stage,
    provider,
    model: null,
    promptVersion: null,
    startedAt: now(),
    completedAt: now(),
    latencyMs: 0,
    inputTokens: null,
    outputTokens: null,
    estimatedCost: null,
    status: 'skipped',
    errorCode: reason,
    errorMessage: null,
    retryCount: 0,
    fallbackUsed: false,
    sanitizedRequest: null,
    sanitizedResponse: null,
  };
}

function errorTrace(
  stage: ProviderTrace['stage'],
  provider: ProviderTrace['provider'],
  now: () => string,
  err: unknown,
): ProviderTrace {
  return {
    stage,
    provider,
    model: null,
    promptVersion: null,
    startedAt: now(),
    completedAt: now(),
    latencyMs: null,
    inputTokens: null,
    outputTokens: null,
    estimatedCost: null,
    status: 'error',
    errorCode: 'stage_threw',
    errorMessage: err instanceof Error ? err.message : 'unknown stage error',
    retryCount: 0,
    fallbackUsed: false,
    sanitizedRequest: null,
    sanitizedResponse: null,
  };
}

export interface BuildRegistryOptions {
  /** Gemini key; defaults to GOOGLE_AI_API_KEY. Pass undefined to force keyless. */
  geminiApiKey?: string | undefined;
  now?: () => string;
}

/**
 * Wire the real providers from config. Each provider is independently keyless-
 * safe, so the registry is always complete — providers simply return null +
 * a skipped trace when their key is absent.
 */
export function buildAnalysisRegistry(config: AIModelConfig, opts: BuildRegistryOptions = {}): AIProviderRegistry {
  return {
    videoIntake: createGeminiVideoIntakeProvider({ config, apiKey: opts.geminiApiKey, now: opts.now }),
    measurement: getMeasurementProvider({ config, now: opts.now }),
    coach: createOpenAICoachProvider({ config, now: opts.now }),
    narrative: createClaudeNarrativeProvider({ config, now: opts.now }),
  };
}

/**
 * Production entrypoint: load config from env, wire the real providers, and run
 * the pipeline. The video bytes are expected to be already resolved into a
 * videoRef (inline data URL for small clips, or a Gemini files/ URI produced by
 * the File-API upload for large ones — see providers/gemini-files).
 */
export async function runAnalysis(
  req: AnalysisRequest,
  env: Record<string, string | undefined> = process.env,
): Promise<AnalysisPipelineResult> {
  const config = loadAIConfig(env);
  const registry = buildAnalysisRegistry(config, { geminiApiKey: env.GOOGLE_AI_API_KEY });
  return runAnalysisPipeline(req, { registry, config });
}
