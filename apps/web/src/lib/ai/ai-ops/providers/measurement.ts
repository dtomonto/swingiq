// ============================================================
// SwingVantage — AI Operations: measurement provider (§2.3/§4.4)
// ------------------------------------------------------------
// The pluggable MEASUREMENT layer. The first production adapter wraps the app's
// REAL on-device MediaPipe pose (lib/pose) — it converts the client-computed
// PoseMetrics into the normalized MeasurementResult, honestly labelled. These
// are 2D single-camera PROXIES, never lab-grade, so every metric is marked
// precision:'estimated' with a limitation note and confidence is capped. No
// false precision. Future MoveNet / YOLO / sport-CV adapters slot in behind the
// same interface.
//
// RUNTIME NOTE: MediaPipe runs in the BROWSER, so the metrics arrive on the
// input (computed client-side). A true server-side measurement model is a
// documented next step — until then the server path returns a 'skipped' trace
// rather than faking outputs.
// ============================================================

import type { AIModelConfig } from '../model-config';
import {
  MeasurementResultSchema,
  type Metric,
  type MeasurementResult,
  type ProviderTrace,
} from '../schemas';
import type { MeasurementInput, MeasurementProvider, PoseMetricsLike } from '../types';

const METHOD = 'on-device MediaPipe pose (2D projection)';
const PROXY_LIMIT = '2D single-camera projection proxy — not a lab measurement';

function metric(name: string, value: number, unit: string, confidence: number): Metric {
  return {
    name,
    value,
    unit,
    source: 'mediapipe',
    method: METHOD,
    confidence,
    precision: 'estimated', // honest: these are derived proxies, never measured angles
    limitations: PROXY_LIMIT,
  };
}

/**
 * Convert real client-computed pose proxies into a normalized MeasurementResult.
 * Pure + deterministic. Confidence scales with frame coverage but is capped at
 * 0.6 because single-camera 2D proxies are inherently limited.
 */
export function poseMetricsToMeasurement(m: PoseMetricsLike): MeasurementResult {
  // More frames with a usable pose → more confidence, capped (proxy ceiling).
  const confidence = Math.min(0.6, 0.15 + m.framesWithPose * 0.03);
  const derivedMetrics: Metric[] = [
    metric('shoulder_turn_range', m.shoulderTurnRangeDeg, 'deg', confidence),
    metric('spine_angle_range', m.spineAngleRangeDeg, 'deg', confidence),
    metric('head_sway', m.headSwayPct, '% frame width', confidence),
    metric('hip_sway', m.hipSwayPct, '% frame width', confidence),
  ];
  return {
    provider: 'mediapipe',
    modelOrMethod: 'mediapipe-pose-2d',
    landmarks: null,
    derivedMetrics,
    frameMetrics: [],
    phaseMetrics: [],
    confidence,
    warnings: [
      `Single-camera 2D pose proxies from ${m.framesWithPose} frames — directional, not lab-grade.`,
    ],
    sourceFrames: [],
  };
}

export interface CreateMeasurementOptions {
  config: AIModelConfig;
  now?: () => string;
}

function trace(now: () => string, status: ProviderTrace['status'], errorCode: string | null): ProviderTrace {
  return {
    stage: 'measurement',
    provider: 'mediapipe',
    model: 'mediapipe-pose-2d',
    promptVersion: null,
    startedAt: now(),
    completedAt: now(),
    latencyMs: 0,
    inputTokens: null,
    outputTokens: null,
    estimatedCost: null,
    status,
    errorCode,
    errorMessage: null,
    retryCount: 0,
    fallbackUsed: false,
    sanitizedRequest: null,
    sanitizedResponse: null,
  };
}

/** The MediaPipe adapter: normalizes client-supplied pose metrics. */
export function createMediaPipeMeasurementProvider(opts: CreateMeasurementOptions): MeasurementProvider {
  const now = opts.now ?? (() => new Date().toISOString());
  return {
    name: 'mediapipe',
    async measure(input: MeasurementInput) {
      if (!input.poseMetrics || input.poseMetrics.framesWithPose < 2) {
        // No usable client-side pose → honest skip (no faked measurements).
        return { result: null, trace: trace(now, 'skipped', 'no_pose_data') };
      }
      const result = poseMetricsToMeasurement(input.poseMetrics);
      const parsed = MeasurementResultSchema.safeParse(result);
      if (!parsed.success) return { result: null, trace: trace(now, 'error', 'schema_invalid') };
      return { result: parsed.data, trace: trace(now, 'ok', null) };
    },
  };
}

/** Disabled provider — the honest no-op when measurement can't run. */
export function createDisabledMeasurementProvider(reason: string, opts: CreateMeasurementOptions): MeasurementProvider {
  const now = opts.now ?? (() => new Date().toISOString());
  return {
    name: 'disabled',
    async measure() {
      return { result: null, trace: trace(now, 'skipped', reason) };
    },
  };
}

/**
 * Factory: pick the measurement provider from config. Today only the MediaPipe
 * (client-fed) adapter is production-ready; a server-side CV model is a
 * documented staged next step (returns a disabled provider when selected).
 */
export function getMeasurementProvider(opts: CreateMeasurementOptions): MeasurementProvider {
  const provider = opts.config.measurement.provider;
  if (provider === 'mediapipe') return createMediaPipeMeasurementProvider(opts);
  // MoveNet / YOLO / sport-CV adapters are future work — never fake them.
  return createDisabledMeasurementProvider(`measurement_provider_unavailable:${provider}`, opts);
}
