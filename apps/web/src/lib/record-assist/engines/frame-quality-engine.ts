// ============================================================
// SwingVantage — RecordAssist: FrameQualityEngine
// ------------------------------------------------------------
// Turns a raw FrameSignalInput (+ the active sport preset) into a
// structured FrameQualitySignals verdict. Pure + deterministic so the
// full state matrix (no person, too close, head cut off, low light…)
// is covered by fast unit tests.
// ============================================================

import type {
  FrameSignalInput,
  FrameQualitySignals,
  SportActionPreset,
  VisibilityState,
  CenteringState,
  DistanceState,
} from '../types';
import {
  LM,
  HEAD_POINTS,
  FOOT_POINTS,
  HAND_POINTS,
  anyVisible,
  allVisible,
  isInFrame,
  boundingBox,
  centerlineX,
  isVisible,
} from './landmarks';

// Tunables (documented so the admin readiness-threshold story is honest).
const DISTANCE_TOO_FAR = 0.45; // body height < 45% of frame → too far
const DISTANCE_TOO_CLOSE = 0.92; // body height > 92% of frame → too close
const CENTER_TOLERANCE = 0.12; // centerline within ±12% of mid → centered
const LOW_LIGHT_LUMA = 0.22;
const BUSY_CONTRAST = 0.34; // very high stddev → busy/cluttered background
const SHAKY_MOTION = 0.4;

function visibilityFor(
  landmarksPresent: boolean,
  anyPointVisible: boolean,
  allInFrame: boolean,
): VisibilityState {
  if (!landmarksPresent) return 'unknown';
  if (!anyPointVisible) return 'cut_off';
  return allInFrame ? 'visible' : 'partial';
}

export function evaluateFrameQuality(
  input: FrameSignalInput,
  preset?: SportActionPreset,
): FrameQualitySignals {
  const pose = input.pose;
  const landmarks = pose?.landmarks ?? [];
  const personDetected = !!pose && landmarks.length > 0;
  const personCount = pose?.personCount ?? 0;

  const orientationMatch = preset
    ? input.orientation === preset.recommendedOrientation
    : true;

  // Lighting / background / stability are pose-independent.
  const lighting: FrameQualitySignals['lighting'] =
    input.luma == null ? 'unknown' : input.luma < LOW_LIGHT_LUMA ? 'low' : 'good';
  const background: FrameQualitySignals['background'] =
    input.contrast == null ? 'unknown' : input.contrast > BUSY_CONTRAST ? 'busy' : 'clear';
  const stability: FrameQualitySignals['stability'] =
    input.motion == null ? 'unknown' : input.motion > SHAKY_MOTION ? 'shaky' : 'steady';

  if (!personDetected) {
    return {
      personDetected: false,
      personCount,
      boundingBox: null,
      headVisible: 'unknown',
      feetVisible: 'unknown',
      fullBodyVisible: false,
      centering: 'unknown',
      centerlineX: null,
      distance: 'unknown',
      bodyHeightFraction: null,
      lighting,
      background,
      stability,
      implementRisk: 'unknown',
      orientationMatch,
    };
  }

  const box = boundingBox(landmarks);
  const bodyHeightFraction = box ? box.height : null;

  // Head / feet visibility.
  const headAnyVisible = anyVisible(landmarks, HEAD_POINTS);
  const headInFrame = HEAD_POINTS.some((i) => isVisible(landmarks[i]) && isInFrame(landmarks[i]));
  const headVisible = visibilityFor(true, headAnyVisible, headInFrame);

  const feetAnyVisible = anyVisible(landmarks, FOOT_POINTS);
  const feetInFrame = FOOT_POINTS.some((i) => isVisible(landmarks[i]) && isInFrame(landmarks[i]));
  const feetVisible = visibilityFor(true, feetAnyVisible, feetInFrame);

  const torso =
    allVisible(landmarks, [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER]) ||
    allVisible(landmarks, [LM.LEFT_HIP, LM.RIGHT_HIP]);
  const fullBodyVisible = headVisible === 'visible' && feetVisible === 'visible' && torso;

  // Centering from the body centerline.
  const cx = centerlineX(landmarks);
  let centering: CenteringState = 'unknown';
  if (cx != null) {
    if (cx < 0.5 - CENTER_TOLERANCE) centering = 'left';
    else if (cx > 0.5 + CENTER_TOLERANCE) centering = 'right';
    else centering = 'centered';
  }

  // Distance proxy from body height fraction.
  let distance: DistanceState = 'unknown';
  if (bodyHeightFraction != null) {
    if (bodyHeightFraction < DISTANCE_TOO_FAR) distance = 'too_far';
    else if (bodyHeightFraction > DISTANCE_TOO_CLOSE) distance = 'too_close';
    else distance = 'good';
  }

  // Implement-visibility risk: combine the preset baseline with whether the
  // hands (which hold the implement) are near/over the frame edge — a wrist
  // close to the border means the club/racket/bat/paddle likely exits frame.
  const implementRisk = estimateImplementRisk(input, preset);

  return {
    personDetected: true,
    personCount,
    boundingBox: box,
    headVisible,
    feetVisible,
    fullBodyVisible,
    centering,
    centerlineX: cx,
    distance,
    bodyHeightFraction,
    lighting,
    background,
    stability,
    implementRisk,
    orientationMatch,
  };
}

function estimateImplementRisk(
  input: FrameSignalInput,
  preset?: SportActionPreset,
): FrameQualitySignals['implementRisk'] {
  const pose = input.pose;
  if (!pose) return 'unknown';
  const landmarks = pose.landmarks;
  const baseline = preset?.implementRiskBaseline ?? 'medium';

  // A wrist within this margin of the frame edge means swinging the
  // implement will very likely leave the frame.
  const EDGE = 0.08;
  const handsNearEdge = HAND_POINTS.some((i) => {
    const lm = landmarks[i];
    if (!isVisible(lm)) return false;
    return lm.x < EDGE || lm.x > 1 - EDGE || lm.y < EDGE || lm.y > 1 - EDGE;
  });

  if (handsNearEdge) return 'high';
  if (baseline === 'high') return 'medium';
  return baseline;
}
