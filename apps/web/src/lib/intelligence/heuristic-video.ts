// ============================================================
// SwingVantage — GAI Heuristic Video Diagnosis (free-tier video completion)
// ------------------------------------------------------------
// The free tier can run on-device pose detection on an uploaded swing (MediaPipe
// in the browser — no AI call, the clip never leaves the device), but until now
// that measured motion only produced a list of "detected" cards. It never
// COMPLETED a diagnosis: the Instant Estimate was still built from the athlete's
// SELF-REPORTED miss and ignored the video entirely.
//
// This engine closes that gap. It is the deterministic bridge that turns the
// existing on-device pose proxies into a full, video-grounded plan WITHOUT any
// paid AI:
//
//   pose proxies (lib/pose)  →  detectPoseIssues (curated, calibrated)  ─┐
//                                                                        ├─→ a complete
//   the existing heuristic engine (fault ontology + drill library)  ────┘    Instant
//                                                                            Estimate,
//                                                                            now driven
//                                                                            by what was
//                                                                            MEASURED.
//
// It adds no parallel knowledge: it picks the dominant MEASURED fault, runs the
// existing heuristic engine against it, and overlays the measured evidence +
// honest confidence. When no video is measurable (golf / too few posed frames /
// no notable fault) it degrades to the standard self-reported estimate, so it is
// a safe SUPERSET of `runHeuristicEstimate` and a drop-in for the router's
// heuristic floor.
//
// Honesty (house rule #4): single-camera 2D pose is an ESTIMATE, never lab-grade
// and never an AI vision read. Confidence stays capped, sourceMode stays
// 'heuristic', and every surfaced number is labeled a proxy.
// ============================================================

import { detectPoseIssues } from '@swingiq/core';
import type { SportPoseFeatures } from '@swingiq/core';
import { runHeuristicEstimate } from './heuristic';
import type {
  AnalysisRequest,
  AnalysisResult,
  AnalysisRoute,
  ConfidenceLabel,
  MeasuredSignal,
} from './types';

/** Below this many posed frames the motion proxies aren't reliable enough to
 *  drive a diagnosis (mirrors the pose-detection module's own floor). */
const MIN_FRAMES_FOR_GROUNDING = 4;

function confidenceLabel(c: number): ConfidenceLabel {
  if (c >= 0.75) return 'high';
  if (c >= 0.55) return 'moderate';
  return 'low';
}

/**
 * Blend the curated-fault confidence with how strongly the fault was actually
 * MEASURED, lift modestly for the corroboration between the two, and cap it
 * honestly — a single-camera 2D proxy is never as sure as a true AI/lab read.
 */
function groundedConfidence(base: number, measured: number): number {
  const blended = 0.55 * base + 0.45 * measured + 0.06;
  return Math.max(0.45, Math.min(0.72, Number(blended.toFixed(2))));
}

/** Surface the raw on-device proxies as honest, labeled evidence. */
function buildSignals(pose: SportPoseFeatures): MeasuredSignal[] {
  return [
    {
      label: 'Shoulder rotation',
      value: `~${pose.shoulderTurnRangeDeg}°`,
      note: 'Coil/turn measured across the swing (rotation proxy).',
    },
    {
      label: 'Spine tilt change',
      value: `~${pose.spineAngleRangeDeg}°`,
      note: 'Posture-change / early-extension proxy.',
    },
    {
      label: 'Head movement',
      value: `~${pose.headSwayPct}% of frame`,
      note: 'How quiet the head stayed through contact.',
    },
    {
      label: 'Hip sway',
      value: `~${pose.hipSwayPct}% of frame`,
      note: 'Lateral slide vs. rotating around a stable center.',
    },
    {
      label: 'Frames measured',
      value: `${pose.framesWithPose}`,
      note: 'On-device poses used — more frames means more reliable.',
    },
  ];
}

function videoDisclaimer(grounded: boolean): string {
  return grounded
    ? 'This diagnosis was completed from your uploaded video using on-device motion tracking — single-camera pose proxies measured in your browser (not lab measurements and not an AI vision read). It confirms the most likely fault from your actual motion and builds the plan around it. Upload for Deep AI Analysis to verify against the frames.'
    : 'We measured your motion on-device from the video (single-camera pose proxies in your browser — not lab-grade, not AI vision) and did not flag a dominant fault, so this plan stays anchored to the miss you described. Upload for Deep AI Analysis for a frame-by-frame read.';
}

/**
 * Build a complete, video-grounded Instant Estimate for a request that carries
 * on-device pose proxies (`req.poseFeatures`). Pure + synchronous (no I/O, no
 * AI), so it is fully testable and a dependable floor.
 *
 * Behaviour:
 *   • No measurable video  → identical to `runHeuristicEstimate` (self-report).
 *   • Video measured, a dominant fault found → diagnosis is DRIVEN by the
 *     measured fault, evidence + honest confidence overlaid (evidenceBasis 'pose').
 *   • Video measured, nothing notable → corroborates the self-reported miss and
 *     attaches the measured signals (evidenceBasis 'self-report').
 */
export function runHeuristicVideoEstimate(
  req: AnalysisRequest,
  route: AnalysisRoute = 'HEURISTIC_ONLY',
): AnalysisResult {
  const pose = req.poseFeatures;

  // No usable video signal → the standard self-reported estimate. This makes the
  // engine a safe superset and a drop-in for the router's heuristic executor.
  if (!pose || pose.framesWithPose < MIN_FRAMES_FOR_GROUNDING) {
    return runHeuristicEstimate(req, route);
  }

  const signals = buildSignals(pose);
  const detected = detectPoseIssues(req.sport, pose)
    .slice()
    .sort((a, b) => b.confidence - a.confidence);
  const dominant = detected[0];

  // Motion measured, but no notable fault → keep the athlete's self-reported
  // miss as the anchor and add the measured corroboration honestly.
  if (!dominant) {
    const base = runHeuristicEstimate(req, route);
    return {
      ...base,
      videoGrounded: true,
      evidenceBasis: 'self-report',
      measuredSignals: signals,
      detectedIssues: detected,
      reasoning: `${base.reasoning} We also measured your motion on-device and didn't flag a dominant fault from the single-camera proxies, so this plan stays anchored to the miss you described.`,
      disclaimer: videoDisclaimer(false),
    };
  }

  // Drive the diagnosis from the MEASURED dominant fault rather than the
  // self-report — running it through the existing engine so the drills, 7-day
  // plan, and retest all come from the curated knowledge as usual.
  const base = runHeuristicEstimate({ ...req, issue: dominant.label }, route);
  const confidence = groundedConfidence(base.confidence, dominant.confidence);

  return {
    ...base,
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    videoGrounded: true,
    evidenceBasis: 'pose',
    measuredSignals: signals,
    detectedIssues: detected,
    reasoning: `Measured from your video: ${dominant.description} ${base.reasoning}`,
    disclaimer: videoDisclaimer(true),
  };
}
