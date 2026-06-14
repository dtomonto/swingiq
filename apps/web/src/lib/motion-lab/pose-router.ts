// ============================================================
// SwingVantage — Motion Lab: Pose Detection Router
// ------------------------------------------------------------
// The single seam the pipeline calls to turn extracted frames into a
// pose track. Today it runs ONE on-device engine (MediaPipe) with the
// worst-case recovery already shipping:
//   • primary-athlete selection (largest + central + best-tracked), and
//   • a low-light / low-contrast ENHANCE-and-retry that is adopted only
//     when it recovers MORE real poses (keep-if-better).
//
// It is deliberately the home where the robustness roadmap plugs in
// WITHOUT touching the pipeline again:
//   • L3 cross-frame tracker → replaces the per-frame primary pick,
//   • L2 second engine + fusion → runs a validator and fuses per joint,
//   • L1 blur recovery → another keep-if-better preprocessing variant.
//
// The async orchestrator is browser-only (it decodes images + runs WASM
// inference); the DECISION logic is factored into the pure helpers below
// so it is unit-tested in node. Never throws — degrades to an empty track.
// ============================================================

import { detectPoses, type PoseDetectInput, type PoseFrame, type PoseModelQuality } from '@/lib/pose';
import { planEnhancement, enhanceFrameDataUrl, type GrayLumaStats, type EnhancementPlan } from '@/lib/frame-enhance';
import type { ExtractedFrame } from '@/lib/frame-extraction';

/** Detect up to two people so a bystander can't capture the primary track. */
const DETECT_OPTS = { numPoses: 2, selectPrimary: true } as const;

/** Recovery triggers when fewer than this share of frames yield a pose… */
const MIN_POSE_COVERAGE = 0.6;
/** …or mean tracking confidence is below this. */
const MIN_TRACK_CONFIDENCE = 0.5;
/** A retry must beat the first pass's confidence by at least this to win on a tie. */
const RETRY_CONFIDENCE_MARGIN = 0.03;

export interface PoseRouterResult {
  /** Frames where a usable (primary) pose was found. */
  detected: PoseFrame[];
  /** True when an enhanced retry pass was adopted over the original. */
  enhancementApplied: boolean;
  /** True when more than one person was seen in any analysed frame. */
  multiplePeople: boolean;
  /** Human-readable detection path for the debug panel / model version tag. */
  enginePath: string;
}

// ── Pure decision helpers (unit-tested, no DOM) ───────────────

/** Mean landmark visibility across detected frames (0–1). */
export function trackVisibility(detected: PoseFrame[]): number {
  let sum = 0;
  let n = 0;
  for (const d of detected) {
    for (const lm of d.landmarks) {
      sum += lm.visibility;
      n++;
    }
  }
  return n > 0 ? sum / n : 0;
}

/** Mean of each luma field across frames, or null when no stats were measured. */
export function aggregateStats(frameStats: GrayLumaStats[] | undefined): GrayLumaStats | null {
  if (!frameStats || frameStats.length === 0) return null;
  const n = frameStats.length;
  const sum = frameStats.reduce(
    (a, s) => ({
      brightness: a.brightness + s.brightness,
      contrast: a.contrast + s.contrast,
      sharpness: a.sharpness + s.sharpness,
    }),
    { brightness: 0, contrast: 0, sharpness: 0 },
  );
  return { brightness: sum.brightness / n, contrast: sum.contrast / n, sharpness: sum.sharpness / n };
}

/**
 * Whether to attempt the enhance-and-retry pass: there must be a usable
 * enhancement plan, and the first pass must be WEAK (few poses found or low
 * confidence). No plan (good exposure) or a strong first pass ⇒ skip.
 */
export function shouldAttemptRecovery(
  posed: number,
  attempted: number,
  confidence: number,
  plan: EnhancementPlan | null,
): boolean {
  if (!plan || attempted <= 0) return false;
  return posed < Math.ceil(attempted * MIN_POSE_COVERAGE) || confidence < MIN_TRACK_CONFIDENCE;
}

/**
 * Keep-if-better: adopt the retry only when it recovers MORE poses, or matches
 * the count with meaningfully higher confidence. Otherwise keep the original —
 * enhancement must never make the read worse.
 */
export function chooseBetterPass(
  first: { posed: number; confidence: number },
  retry: { posed: number; confidence: number },
): 'first' | 'retry' {
  if (retry.posed > first.posed) return 'retry';
  if (retry.posed === first.posed && retry.confidence > first.confidence + RETRY_CONFIDENCE_MARGIN) return 'retry';
  return 'first';
}

/** True when any analysed frame saw more than one person. */
export function detectedHasMultiplePeople(detected: PoseFrame[]): boolean {
  return detected.some((d) => (d.personCount ?? 1) > 1);
}

/** Compose the human-readable detection path (also used to tag the model version). */
export function describeEnginePath(modelQuality: PoseModelQuality, enhanced: boolean): string {
  return `mediapipe-${modelQuality}(primary-of-2)${enhanced ? '+enhanced' : ''}`;
}

// ── Browser orchestrator ──────────────────────────────────────

/**
 * Run pose detection over the extracted frames with worst-case recovery.
 * Best-effort and never throws; returns an empty `detected` when no pose engine
 * is available (the pipeline then degrades to its honest no-pose result).
 */
export async function routePoseDetection(
  frames: ExtractedFrame[],
  frameStats: GrayLumaStats[] | undefined,
  modelQuality: PoseModelQuality,
): Promise<PoseRouterResult> {
  const baseInput: PoseDetectInput[] = frames.map((f) => ({
    dataUrl: f.dataUrl,
    timestampSeconds: f.timestampSeconds,
  }));
  let detected = await detectPoses(baseInput, modelQuality, DETECT_OPTS);
  const attempted = frames.length;
  let enhancementApplied = false;

  const aggregate = aggregateStats(frameStats);
  const plan = aggregate ? planEnhancement(aggregate) : null;

  if (shouldAttemptRecovery(detected.length, attempted, trackVisibility(detected), plan)) {
    const enhancedInput: PoseDetectInput[] = await Promise.all(
      frames.map(async (f) => ({
        dataUrl: await enhanceFrameDataUrl(f.dataUrl, plan as EnhancementPlan),
        timestampSeconds: f.timestampSeconds,
      })),
    );
    const retry = await detectPoses(enhancedInput, modelQuality, DETECT_OPTS);
    const winner = chooseBetterPass(
      { posed: detected.length, confidence: trackVisibility(detected) },
      { posed: retry.length, confidence: trackVisibility(retry) },
    );
    if (winner === 'retry') {
      detected = retry;
      enhancementApplied = true;
    }
  }

  return {
    detected,
    enhancementApplied,
    multiplePeople: detectedHasMultiplePeople(detected),
    enginePath: describeEnginePath(modelQuality, enhancementApplied),
  };
}
