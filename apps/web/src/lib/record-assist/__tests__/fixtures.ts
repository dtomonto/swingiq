// Test fixtures for RecordAssist engines. Not a test file itself
// (jest testMatch only picks up *.test.ts), just shared builders.

import type { FrameSignalInput, PoseLandmark, PoseSample, CameraOrientation } from '../types';
import { LM } from '../engines/landmarks';

/** Build a 33-entry landmark array, all centered + visible by default. */
export function makeLandmarks(overrides: Partial<Record<number, Partial<PoseLandmark>>> = {}): PoseLandmark[] {
  // Canonical y positions for a well-framed full body (head→feet).
  const yByIndex: Record<number, number> = {
    [LM.NOSE]: 0.08,
    [LM.LEFT_EYE_INNER]: 0.07, [LM.LEFT_EYE]: 0.07, [LM.LEFT_EYE_OUTER]: 0.07,
    [LM.RIGHT_EYE_INNER]: 0.07, [LM.RIGHT_EYE]: 0.07, [LM.RIGHT_EYE_OUTER]: 0.07,
    [LM.LEFT_EAR]: 0.08, [LM.RIGHT_EAR]: 0.08,
    [LM.MOUTH_LEFT]: 0.1, [LM.MOUTH_RIGHT]: 0.1,
    [LM.LEFT_SHOULDER]: 0.28, [LM.RIGHT_SHOULDER]: 0.28,
    [LM.LEFT_ELBOW]: 0.42, [LM.RIGHT_ELBOW]: 0.42,
    [LM.LEFT_WRIST]: 0.52, [LM.RIGHT_WRIST]: 0.52,
    [LM.LEFT_PINKY]: 0.54, [LM.RIGHT_PINKY]: 0.54,
    [LM.LEFT_INDEX]: 0.54, [LM.RIGHT_INDEX]: 0.54,
    [LM.LEFT_THUMB]: 0.53, [LM.RIGHT_THUMB]: 0.53,
    [LM.LEFT_HIP]: 0.55, [LM.RIGHT_HIP]: 0.55,
    [LM.LEFT_KNEE]: 0.75, [LM.RIGHT_KNEE]: 0.75,
    [LM.LEFT_ANKLE]: 0.92, [LM.RIGHT_ANKLE]: 0.92,
    [LM.LEFT_HEEL]: 0.93, [LM.RIGHT_HEEL]: 0.93,
    [LM.LEFT_FOOT_INDEX]: 0.95, [LM.RIGHT_FOOT_INDEX]: 0.95,
  };
  // Slight left/right x offset for paired points.
  const leftPoints = new Set<number>([
    LM.LEFT_EYE_INNER, LM.LEFT_EYE, LM.LEFT_EYE_OUTER, LM.LEFT_EAR, LM.MOUTH_LEFT,
    LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST, LM.LEFT_PINKY, LM.LEFT_INDEX, LM.LEFT_THUMB,
    LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE, LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX,
  ]);
  const rightPoints = new Set<number>([
    LM.RIGHT_EYE_INNER, LM.RIGHT_EYE, LM.RIGHT_EYE_OUTER, LM.RIGHT_EAR, LM.MOUTH_RIGHT,
    LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST, LM.RIGHT_PINKY, LM.RIGHT_INDEX, LM.RIGHT_THUMB,
    LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE, LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX,
  ]);

  const out: PoseLandmark[] = [];
  for (let i = 0; i < 33; i++) {
    const baseX = leftPoints.has(i) ? 0.46 : rightPoints.has(i) ? 0.54 : 0.5;
    const base: PoseLandmark = {
      x: baseX,
      y: yByIndex[i] ?? 0.5,
      z: 0,
      visibility: 0.92,
    };
    out.push({ ...base, ...(overrides[i] ?? {}) });
  }
  return out;
}

export function makePose(
  landmarks: PoseLandmark[] = makeLandmarks(),
  personCount = 1,
): PoseSample {
  return { landmarks, personCount, timestampMs: 0 };
}

export function makeFrame(over: Partial<FrameSignalInput> = {}): FrameSignalInput {
  return {
    frameWidth: 720,
    frameHeight: 1280,
    pose: makePose(),
    luma: 0.5,
    contrast: 0.2,
    motion: 0.05,
    orientation: 'portrait' as CameraOrientation,
    ...over,
  };
}

/** Shift every landmark horizontally (to simulate off-center framing). */
export function shiftX(landmarks: PoseLandmark[], dx: number): PoseLandmark[] {
  return landmarks.map((lm) => ({ ...lm, x: lm.x + dx }));
}

/** Scale body height around the vertical center (simulate near/far). */
export function scaleY(landmarks: PoseLandmark[], factor: number, center = 0.5): PoseLandmark[] {
  return landmarks.map((lm) => ({ ...lm, y: center + (lm.y - center) * factor }));
}
