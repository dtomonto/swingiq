// ============================================================
// SwingIQ — Pose Estimation Abstraction Layer
// ⚠️  HEURISTIC STUB — No ML model is running.
//     All positions are estimated geometric approximations.
//     Every result is labeled is_estimated: true.
//
// UPGRADE PATH:
//   1. Install @mediapipe/tasks-vision or @tensorflow-models/pose-detection
//   2. Replace the `estimatePoseAtFrame` implementation below
//   3. Raise confidence values from ~0.3 to actual model confidence
//   4. Update is_estimated to false when real detection runs
// ============================================================

import type { EstimatedPoseLandmarks, NormalizedPoint } from '@swingiq/core';

// ──────────────────────────────────────────────────────────────
// Point helpers
// ──────────────────────────────────────────────────────────────

function pt(x: number, y: number, conf = 0.3): NormalizedPoint {
  return { x, y, confidence: conf };
}

// ──────────────────────────────────────────────────────────────
// Heuristic pose generator
// These positions approximate a right-handed golfer in each phase.
// They are visually plausible but NOT measured from real pixels.
// ──────────────────────────────────────────────────────────────

type PhaseHint = 'address' | 'top' | 'impact' | 'finish' | 'mid';

/**
 * Generate an approximate pose for a given phase hint.
 * The canvas will show "Estimated body position" near these landmarks.
 */
function heuristicPoseForPhase(phase: PhaseHint): EstimatedPoseLandmarks {
  // All coordinates are normalised [0,1] within the video frame.
  // Assumes the golfer is roughly centred in the frame.
  switch (phase) {
    case 'address':
      return {
        head:             pt(0.50, 0.18),
        left_shoulder:    pt(0.44, 0.30),
        right_shoulder:   pt(0.56, 0.30),
        left_hip:         pt(0.46, 0.52),
        right_hip:        pt(0.54, 0.52),
        left_knee:        pt(0.45, 0.70),
        right_knee:       pt(0.55, 0.70),
        left_ankle:       pt(0.44, 0.88),
        right_ankle:      pt(0.56, 0.88),
        left_wrist:       pt(0.50, 0.60),
        right_wrist:      pt(0.52, 0.62),
        club_shaft_tip:   pt(0.52, 0.85),
        club_grip:        pt(0.50, 0.59),
        is_estimated: true,
        estimation_method: 'heuristic',
      };

    case 'top':
      return {
        head:             pt(0.48, 0.17),
        left_shoulder:    pt(0.38, 0.28),
        right_shoulder:   pt(0.52, 0.28),
        left_hip:         pt(0.45, 0.50),
        right_hip:        pt(0.55, 0.50),
        left_knee:        pt(0.43, 0.68),
        right_knee:       pt(0.56, 0.68),
        left_ankle:       pt(0.43, 0.87),
        right_ankle:      pt(0.57, 0.87),
        left_wrist:       pt(0.42, 0.22),
        right_wrist:      pt(0.48, 0.20),
        club_shaft_tip:   pt(0.60, 0.12),
        club_grip:        pt(0.45, 0.21),
        is_estimated: true,
        estimation_method: 'heuristic',
      };

    case 'impact':
      return {
        head:             pt(0.49, 0.18),
        left_shoulder:    pt(0.43, 0.29),
        right_shoulder:   pt(0.55, 0.31),
        left_hip:         pt(0.44, 0.50),
        right_hip:        pt(0.54, 0.52),
        left_knee:        pt(0.43, 0.68),
        right_knee:       pt(0.56, 0.70),
        left_ankle:       pt(0.43, 0.87),
        right_ankle:      pt(0.58, 0.88),
        left_wrist:       pt(0.53, 0.58),
        right_wrist:      pt(0.55, 0.60),
        club_shaft_tip:   pt(0.52, 0.82),
        club_grip:        pt(0.54, 0.57),
        is_estimated: true,
        estimation_method: 'heuristic',
      };

    case 'finish':
      return {
        head:             pt(0.51, 0.17),
        left_shoulder:    pt(0.44, 0.27),
        right_shoulder:   pt(0.58, 0.27),
        left_hip:         pt(0.47, 0.50),
        right_hip:        pt(0.57, 0.50),
        left_knee:        pt(0.46, 0.68),
        right_knee:       pt(0.59, 0.65),
        left_ankle:       pt(0.46, 0.87),
        right_ankle:      pt(0.59, 0.87),
        left_wrist:       pt(0.55, 0.15),
        right_wrist:      pt(0.60, 0.13),
        club_shaft_tip:   pt(0.62, 0.05),
        club_grip:        pt(0.57, 0.14),
        is_estimated: true,
        estimation_method: 'heuristic',
      };

    default: // 'mid' — generic mid-swing position
      return {
        head:             pt(0.50, 0.18),
        left_shoulder:    pt(0.43, 0.29),
        right_shoulder:   pt(0.56, 0.29),
        left_hip:         pt(0.46, 0.51),
        right_hip:        pt(0.54, 0.51),
        left_knee:        pt(0.44, 0.69),
        right_knee:       pt(0.56, 0.69),
        left_ankle:       pt(0.44, 0.87),
        right_ankle:      pt(0.57, 0.87),
        left_wrist:       pt(0.52, 0.45),
        right_wrist:      pt(0.54, 0.47),
        club_shaft_tip:   pt(0.55, 0.70),
        club_grip:        pt(0.52, 0.44),
        is_estimated: true,
        estimation_method: 'heuristic',
      };
  }
}

// ──────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────

/**
 * Get estimated pose landmarks for a given video timestamp.
 *
 * @param _videoElement - Unused until real ML integration
 * @param currentTime - Current video playback time in seconds
 * @param totalDuration - Total video duration in seconds
 */
export function estimatePoseAtFrame(
  _videoElement: HTMLVideoElement,
  currentTime: number,
  totalDuration: number,
): EstimatedPoseLandmarks {
  const pct = totalDuration > 0 ? currentTime / totalDuration : 0;

  // Map approximate percentage of video to a phase hint
  let phase: PhaseHint;
  if (pct < 0.15)        phase = 'address';
  else if (pct < 0.50)   phase = 'mid';
  else if (pct < 0.55)   phase = 'top';
  else if (pct < 0.85)   phase = 'mid';
  else if (pct < 0.92)   phase = 'impact';
  else                   phase = 'finish';

  return heuristicPoseForPhase(phase);
}

/** Whether real pose estimation is available (always false until ML is integrated). */
export const POSE_ESTIMATION_AVAILABLE = false;

/** Human-readable label shown in the UI. */
export const POSE_ESTIMATION_LABEL = 'Estimated body position — not measured from video';
