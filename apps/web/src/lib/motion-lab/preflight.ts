// ============================================================
// SwingVantage — Motion Lab: Video-Quality Profiler (preflight)
// ------------------------------------------------------------
// Turns the honest signals we can measure on-device — per-frame luma
// statistics, how often a pose was found, how reliable the landmarks
// were, the clip's resolution/fps/duration — into a single quality
// PROFILE: a tier, a 0–100 score, a defensible analysis level (1–5),
// a structured list of capture ISSUES, and DYNAMIC, problem-specific
// capture fixes for the next retest.
//
// This is the layer that makes Motion Lab "never fail silently": even a
// terrible clip produces a profile that says what was visible, what was
// not, and exactly how to recapture — instead of a blank result.
//
// HONESTY: every signal here is derived from real measurement. Where a
// signal can't be measured (e.g. no luma stats because the canvas read
// was blocked), we DON'T invent an issue — we simply don't claim it.
// Pure + deterministic (no DOM, no I/O) so it is fully unit-tested.
// ============================================================

import type { SportId, CameraView } from './types';
import type { GrayLumaStats } from '@/lib/frame-enhance';
import { getRecordingGuide } from './recording-guidance';

export type VideoQualityTier =
  | 'excellent'
  | 'good'
  | 'usable'
  | 'poor'
  | 'terrible'
  | 'not_defensible';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type VideoQualityIssueCode =
  | 'LOW_LIGHT'
  | 'LOW_CONTRAST'
  | 'SOFT_OR_BLURRED'
  | 'LOW_RESOLUTION'
  | 'LOW_FPS'
  | 'BODY_CROPPED'
  | 'MULTIPLE_PEOPLE'
  | 'CAMERA_SHAKE'
  | 'NO_MOTION_WINDOW'
  | 'SHORT_CLIP'
  | 'NO_ATHLETE_VISIBLE';

export interface VideoQualityIssue {
  code: VideoQualityIssueCode;
  severity: IssueSeverity;
  /** Metric families this issue lowers the confidence of. */
  affectedMetrics: string[];
  /** Athlete-facing, premium-tone explanation (no "bad"/"failed"). */
  userMessage: string;
  /** Raw numbers behind the call — for the debug panel / telemetry. */
  internalDetails: Record<string, number | string | boolean>;
}

export interface VideoQualityProfile {
  tier: VideoQualityTier;
  /** 0–100 composite capture quality. */
  score: number;
  /** 1–5 — the deepest analysis this footage defensibly supports. */
  recommendedAnalysisLevel: 1 | 2 | 3 | 4 | 5;
  brightnessScore: number; // 0–1 (null-signal → 0.6 neutral)
  contrastScore: number; // 0–1
  sharpnessScore: number; // 0–1
  cameraStabilityScore: number; // 0–1 (1 = steady)
  subjectCoverage: number; // 0–1 fraction of frames a pose was found
  fullBodyVisible: boolean;
  multiplePeople: boolean;
  resolution: string;
  estimatedFps: number | null;
  /** True when at least one luma signal was measurable. */
  pixelSignalsAvailable: boolean;
  issues: VideoQualityIssue[];
  /** Dynamic, de-duplicated capture instructions for the retest. */
  recommendedFixes: string[];
  /** One-line premium read of what the footage supports. */
  headline: string;
}

export interface PreflightInput {
  /** Per-kept-frame luma stats; may be empty when canvas reads were blocked. */
  frameStats: GrayLumaStats[];
  /** Fraction (0–1) of attempted frames a usable pose was found. */
  subjectCoverage: number;
  /** Whether head-to-feet appeared visible across the motion. */
  fullBodyVisible: boolean;
  /** Mean landmark visibility across the track (0–1). */
  trackingConfidence: number;
  /** True when more than one person was detected in frame. */
  multiplePeople: boolean;
  resolution: string;
  estimatedFps: number | null;
  durationSeconds: number;
  swingWindowDetected: boolean;
  sport: SportId;
  view: CameraView;
  /**
   * Real camera steadiness (0–1, 1 = rock steady) from the camera-motion
   * estimator. When provided it overrides the exposure-variance proxy.
   */
  cameraStability?: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const std = (xs: number[]): number => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};

function parseMinEdge(resolution: string): number {
  const m = /(\d+)\s*[x×]\s*(\d+)/.exec(resolution);
  if (!m) return 0;
  return Math.min(Number(m[1]), Number(m[2]));
}

/**
 * Build the quality profile. Pure — feed it the measured signals and it returns
 * the tier, issues, and dynamic capture fixes. Never throws, always returns a
 * profile with at least one recommended fix.
 */
export function profileVideoQuality(input: PreflightInput): VideoQualityProfile {
  const pixelSignalsAvailable = input.frameStats.length > 0;

  // Aggregate luma signals (neutral 0.6 when we genuinely can't measure them —
  // we must not penalise a clip for a signal we never read).
  const brightnessScore = pixelSignalsAvailable
    ? clamp(mean(input.frameStats.map((s) => s.brightness)), 0, 1)
    : 0.6;
  const contrastScore = pixelSignalsAvailable
    ? clamp(mean(input.frameStats.map((s) => s.contrast)), 0, 1)
    : 0.6;
  const sharpnessScore = pixelSignalsAvailable
    ? clamp(mean(input.frameStats.map((s) => s.sharpness)), 0, 1)
    : 0.6;

  // Camera steadiness: prefer the real camera-motion estimate when supplied;
  // otherwise fall back to the exposure-variance proxy (a steady camera holds
  // roughly constant exposure, so large brightness swings hint at shake).
  const haveStabilitySignal = input.cameraStability != null || pixelSignalsAvailable;
  const cameraStabilityScore =
    input.cameraStability != null
      ? clamp(input.cameraStability, 0, 1)
      : pixelSignalsAvailable
        ? clamp(1 - std(input.frameStats.map((s) => s.brightness)) * 4, 0, 1)
        : 1;

  const subjectCoverage = clamp(input.subjectCoverage, 0, 1);
  const minEdge = parseMinEdge(input.resolution);
  const fps = input.estimatedFps;

  const issues: VideoQualityIssue[] = [];

  // ── Subject / framing ──────────────────────────────────────
  if (subjectCoverage < 0.15) {
    issues.push({
      code: 'NO_ATHLETE_VISIBLE',
      severity: 'critical',
      affectedMetrics: ['all'],
      userMessage:
        'We could not reliably find a body to track in this clip, so no motion measurements are defensible from it.',
      internalDetails: { subjectCoverage, trackingConfidence: input.trackingConfidence },
    });
  } else if (subjectCoverage < 0.5) {
    issues.push({
      code: 'NO_ATHLETE_VISIBLE',
      severity: 'high',
      affectedMetrics: ['rotation', 'sequencing', 'tempo', 'balance'],
      userMessage:
        'The athlete was only trackable in part of the clip, so several reads are partial and lower-confidence.',
      internalDetails: { subjectCoverage },
    });
  }
  if (!input.fullBodyVisible) {
    issues.push({
      code: 'BODY_CROPPED',
      severity: 'medium',
      affectedMetrics: ['legs', 'knee flexion', 'stance width', 'balance', 'weight shift'],
      userMessage:
        'The feet and lower body were not consistently in frame, so balance and leg-drive reads are limited.',
      internalDetails: { fullBodyVisible: false },
    });
  }
  if (input.multiplePeople) {
    issues.push({
      code: 'MULTIPLE_PEOPLE',
      severity: 'medium',
      affectedMetrics: ['rotation', 'sequencing', 'contact'],
      userMessage:
        'More than one person appeared in frame. We tracked the most prominent, central mover — but extra people can pull tracking off the athlete.',
      internalDetails: { multiplePeople: true },
    });
  }

  // ── Pixel-quality (only when we actually measured pixels) ──
  if (pixelSignalsAvailable) {
    if (brightnessScore < 0.35) {
      issues.push({
        code: 'LOW_LIGHT',
        severity: brightnessScore < 0.22 ? 'high' : 'medium',
        affectedMetrics: ['all'],
        userMessage:
          'The footage is dark, which makes the body harder to track. We brightened it on-device to recover what we could.',
        internalDetails: { brightnessScore: +brightnessScore.toFixed(3) },
      });
    }
    if (contrastScore < 0.15) {
      issues.push({
        code: 'LOW_CONTRAST',
        severity: 'medium',
        affectedMetrics: ['all'],
        userMessage:
          'The athlete blends into the background (low contrast), which softens landmark tracking.',
        internalDetails: { contrastScore: +contrastScore.toFixed(3) },
      });
    }
    if (sharpnessScore < 0.12) {
      issues.push({
        code: 'SOFT_OR_BLURRED',
        severity: 'high',
        affectedMetrics: ['contact', 'wrist/hand', 'tempo', 'sequencing'],
        userMessage:
          'Frames are soft or motion-blurred — especially fast through the strike — so contact-window reads are estimated, not measured.',
        internalDetails: { sharpnessScore: +sharpnessScore.toFixed(3) },
      });
    }
  }

  // ── Camera steadiness (real estimate or exposure-variance proxy) ──
  if (haveStabilitySignal && cameraStabilityScore < 0.5) {
    issues.push({
      code: 'CAMERA_SHAKE',
      severity: 'medium',
      affectedMetrics: ['rotation', 'balance', 'head movement'],
      userMessage:
        'The camera moved during the clip, which adds jitter to the tracked positions.',
      internalDetails: { cameraStabilityScore: +cameraStabilityScore.toFixed(3) },
    });
  }

  // ── Clip metadata ──────────────────────────────────────────
  if (minEdge > 0 && minEdge < 480) {
    issues.push({
      code: 'LOW_RESOLUTION',
      severity: minEdge < 360 ? 'high' : 'medium',
      affectedMetrics: ['wrist/hand', 'contact', 'rotation'],
      userMessage: `The video is low-resolution (${input.resolution}), so fine joint positions are coarse.`,
      internalDetails: { minEdge },
    });
  }
  if (fps != null && fps < 30) {
    issues.push({
      code: 'LOW_FPS',
      severity: 'medium',
      affectedMetrics: ['contact', 'tempo', 'sequencing'],
      userMessage: `At about ${Math.round(fps)} fps, fast motion near contact blurs and the strike frame is an estimate.`,
      internalDetails: { fps },
    });
  }
  if (input.durationSeconds > 0 && input.durationSeconds < 0.8) {
    issues.push({
      code: 'SHORT_CLIP',
      severity: 'medium',
      affectedMetrics: ['phases', 'tempo'],
      userMessage:
        'The clip is very short — the motion may start before or end after the footage, so some phases are estimated.',
      internalDetails: { durationSeconds: input.durationSeconds },
    });
  }
  if (!input.swingWindowDetected) {
    issues.push({
      code: 'NO_MOTION_WINDOW',
      severity: 'low',
      affectedMetrics: ['phases'],
      userMessage:
        'No single clear burst of motion stood out, so the rep window is approximate. Trimming to just the rep sharpens it.',
      internalDetails: { swingWindowDetected: false },
    });
  }

  // ── Composite score (0–100) ────────────────────────────────
  const sub = (v01: number) => clamp(v01, 0, 1) * 100;
  const resScore = minEdge >= 720 ? 90 : minEdge >= 480 ? 65 : minEdge > 0 ? 40 : 60;
  const fpsScore = fps == null ? 60 : fps >= 60 ? 95 : fps >= 30 ? 75 : 40;
  const score = Math.round(
    sub(subjectCoverage) * 0.3 +
      sub(input.trackingConfidence) * 0.2 +
      sub(brightnessScore) * 0.1 +
      sub(contrastScore) * 0.08 +
      sub(sharpnessScore) * 0.12 +
      resScore * 0.1 +
      fpsScore * 0.06 +
      sub(cameraStabilityScore) * 0.04,
  );

  // ── Tier (hard gates first, then the composite score) ──────
  let tier: VideoQualityTier;
  if (subjectCoverage < 0.15) tier = 'not_defensible';
  else if (subjectCoverage < 0.35 || score < 30) tier = 'terrible';
  else if (score >= 85) tier = 'excellent';
  else if (score >= 70) tier = 'good';
  else if (score >= 50) tier = 'usable';
  else if (score >= 35) tier = 'poor';
  else tier = 'terrible';

  const levelByTier: Record<VideoQualityTier, 1 | 2 | 3 | 4 | 5> = {
    excellent: 5,
    good: 4,
    usable: 3,
    poor: 2,
    terrible: 1,
    not_defensible: 1,
  };

  const headlineByTier: Record<VideoQualityTier, string> = {
    excellent: 'Excellent capture — this clip supports a full, high-confidence analysis.',
    good: 'Good capture — the core motion reads are well-supported.',
    usable: 'Usable capture — the main reads hold; a few are lower-confidence.',
    poor: 'Limited capture — we extracted partial reads and flagged what to fix.',
    terrible:
      'Difficult capture — we recovered only the most defensible signals. A quick retest will unlock far more.',
    not_defensible:
      'This clip is not analysable as captured — here is exactly how to get a great one next time.',
  };

  return {
    tier,
    score,
    recommendedAnalysisLevel: levelByTier[tier],
    brightnessScore: +brightnessScore.toFixed(3),
    contrastScore: +contrastScore.toFixed(3),
    sharpnessScore: +sharpnessScore.toFixed(3),
    cameraStabilityScore: +cameraStabilityScore.toFixed(3),
    subjectCoverage: +subjectCoverage.toFixed(3),
    fullBodyVisible: input.fullBodyVisible,
    multiplePeople: input.multiplePeople,
    resolution: input.resolution,
    estimatedFps: fps,
    pixelSignalsAvailable,
    issues,
    recommendedFixes: buildCaptureFixes(issues, input),
    headline: headlineByTier[tier],
  };
}

/**
 * Turn the detected issues into dynamic, problem-specific retest instructions —
 * the brief's rule that guidance must be about THIS clip's problem, not generic
 * "try better lighting". De-duplicated, sport-aware, premium tone.
 */
function buildCaptureFixes(issues: VideoQualityIssue[], input: PreflightInput): string[] {
  const guide = getRecordingGuide(input.sport);
  const codes = new Set(issues.map((i) => i.code));
  const fixes: string[] = [];

  if (codes.has('NO_ATHLETE_VISIBLE')) {
    fixes.push(
      `Keep the athlete fully in frame, head to feet, and large enough to fill most of the height. ${guide.bestAngle}`,
    );
  }
  if (codes.has('BODY_CROPPED')) {
    fixes.push('Step back or tilt down so the feet stay in frame the whole motion — that unlocks the balance and leg reads.');
  }
  if (codes.has('LOW_LIGHT') || codes.has('LOW_CONTRAST')) {
    fixes.push('Film in brighter, even light (face the light, not into it) against an uncluttered background so the body separates clearly.');
  }
  if (codes.has('SOFT_OR_BLURRED') || codes.has('LOW_FPS')) {
    fixes.push('Use 60 fps slow-motion if your phone supports it, and keep your hands and implement in frame from load through finish — that sharpens the contact window we read.');
  }
  if (codes.has('LOW_RESOLUTION')) {
    fixes.push('Record at 720p or higher so fine joint and hand positions stay crisp.');
  }
  if (codes.has('CAMERA_SHAKE')) {
    fixes.push('Prop the phone on a steady surface or tripod and avoid following the motion by hand.');
  }
  if (codes.has('MULTIPLE_PEOPLE')) {
    fixes.push('Frame only the athlete — extra people in shot can pull tracking onto the wrong body.');
  }
  if (codes.has('SHORT_CLIP')) {
    fixes.push('Start recording about a second before the motion and keep rolling a second past the finish.');
  }
  if (codes.has('NO_MOTION_WINDOW')) {
    fixes.push('Trim the clip to just the rep (or record a cleaner single rep) so the motion window is unambiguous.');
  }

  if (fixes.length === 0) {
    fixes.push('Capture looks strong — re-film from the same spot, distance, and angle next time for clean retest comparisons.');
  }
  return [...new Set(fixes)];
}
