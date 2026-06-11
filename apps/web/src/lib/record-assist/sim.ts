// ============================================================
// SwingVantage — RecordAssist: scenario simulator
// ------------------------------------------------------------
// Builds synthetic FrameSignalInputs for the documented QA states so the
// admin QA panel (and demos) can exercise the REAL engines without a
// camera. Pure — same builders the engines see at runtime.
// ============================================================

import type { FrameSignalInput, PoseLandmark, CameraOrientation } from './types';
import { LM } from './engines/landmarks';

export type ScenarioId =
  | 'ideal'
  | 'no_person'
  | 'too_close'
  | 'too_far'
  | 'off_center_left'
  | 'off_center_right'
  | 'head_cut'
  | 'feet_cut'
  | 'low_light'
  | 'busy_background'
  | 'shaky'
  | 'multiple_people'
  | 'implement_edge';

export interface ScenarioMeta {
  id: ScenarioId;
  label: string;
}

export const SCENARIOS: ScenarioMeta[] = [
  { id: 'ideal', label: 'Ideal full-body frame' },
  { id: 'no_person', label: 'No person detected' },
  { id: 'too_close', label: 'Too close' },
  { id: 'too_far', label: 'Too far' },
  { id: 'off_center_left', label: 'Off-center (left)' },
  { id: 'off_center_right', label: 'Off-center (right)' },
  { id: 'head_cut', label: 'Head cut off' },
  { id: 'feet_cut', label: 'Feet cut off' },
  { id: 'low_light', label: 'Low light' },
  { id: 'busy_background', label: 'Busy background' },
  { id: 'shaky', label: 'Shaky camera' },
  { id: 'multiple_people', label: 'Multiple people' },
  { id: 'implement_edge', label: 'Implement near edge' },
];

function baseLandmarks(): PoseLandmark[] {
  const y: Record<number, number> = {
    [LM.NOSE]: 0.08,
    [LM.LEFT_EAR]: 0.08, [LM.RIGHT_EAR]: 0.08,
    [LM.LEFT_SHOULDER]: 0.28, [LM.RIGHT_SHOULDER]: 0.28,
    [LM.LEFT_ELBOW]: 0.42, [LM.RIGHT_ELBOW]: 0.42,
    [LM.LEFT_WRIST]: 0.52, [LM.RIGHT_WRIST]: 0.52,
    [LM.LEFT_HIP]: 0.55, [LM.RIGHT_HIP]: 0.55,
    [LM.LEFT_KNEE]: 0.75, [LM.RIGHT_KNEE]: 0.75,
    [LM.LEFT_ANKLE]: 0.92, [LM.RIGHT_ANKLE]: 0.92,
    [LM.LEFT_HEEL]: 0.93, [LM.RIGHT_HEEL]: 0.93,
    [LM.LEFT_FOOT_INDEX]: 0.95, [LM.RIGHT_FOOT_INDEX]: 0.95,
  };
  const left = new Set<number>([
    LM.LEFT_EAR, LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST, LM.LEFT_HIP,
    LM.LEFT_KNEE, LM.LEFT_ANKLE, LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX,
  ]);
  const right = new Set<number>([
    LM.RIGHT_EAR, LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST, LM.RIGHT_HIP,
    LM.RIGHT_KNEE, LM.RIGHT_ANKLE, LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX,
  ]);
  const out: PoseLandmark[] = [];
  for (let i = 0; i < 33; i++) {
    out.push({
      x: left.has(i) ? 0.46 : right.has(i) ? 0.54 : 0.5,
      y: y[i] ?? 0.5,
      z: 0,
      visibility: y[i] != null ? 0.92 : 0.2, // points we don't position are "unseen"
    });
  }
  return out;
}

/** Build a synthetic frame for a documented QA scenario. */
export function buildScenarioFrame(
  scenario: ScenarioId,
  orientation: CameraOrientation = 'landscape',
): FrameSignalInput {
  let landmarks: PoseLandmark[] | null = baseLandmarks();
  let personCount = 1;
  let luma: number | undefined = 0.5;
  let contrast: number | undefined = 0.2;
  let motion: number | undefined = 0.05;

  switch (scenario) {
    case 'no_person':
      landmarks = null;
      break;
    case 'too_close':
      landmarks = landmarks!.map((l) => ({ ...l, y: 0.5 + (l.y - 0.5) * 2.2 }));
      break;
    case 'too_far':
      landmarks = landmarks!.map((l) => ({ ...l, y: 0.5 + (l.y - 0.5) * 0.4 }));
      break;
    case 'off_center_left':
      landmarks = landmarks!.map((l) => ({ ...l, x: l.x - 0.25 }));
      break;
    case 'off_center_right':
      landmarks = landmarks!.map((l) => ({ ...l, x: l.x + 0.25 }));
      break;
    case 'head_cut': {
      const head: number[] = [LM.NOSE, LM.LEFT_EAR, LM.RIGHT_EAR];
      landmarks = landmarks!.map((l, i) => (head.includes(i) ? { ...l, visibility: 0.1 } : l));
      break;
    }
    case 'feet_cut': {
      const feet: number[] = [
        LM.LEFT_ANKLE, LM.RIGHT_ANKLE, LM.LEFT_HEEL, LM.RIGHT_HEEL, LM.LEFT_FOOT_INDEX, LM.RIGHT_FOOT_INDEX,
      ];
      landmarks = landmarks!.map((l, i) => (feet.includes(i) ? { ...l, y: 1.06 } : l));
      break;
    }
    case 'low_light':
      luma = 0.1;
      break;
    case 'busy_background':
      contrast = 0.5;
      break;
    case 'shaky':
      motion = 0.8;
      break;
    case 'multiple_people':
      personCount = 2;
      break;
    case 'implement_edge':
      landmarks = landmarks!.map((l, i) => (i === LM.RIGHT_WRIST ? { ...l, x: 0.97 } : l));
      break;
    case 'ideal':
    default:
      break;
  }

  return {
    frameWidth: orientation === 'portrait' ? 720 : 1280,
    frameHeight: orientation === 'portrait' ? 1280 : 720,
    pose: landmarks ? { landmarks, personCount, timestampMs: 0 } : null,
    luma,
    contrast,
    motion,
    orientation,
  };
}

/** One captured frame for the Phase 3 biomechanics simulator. */
export interface SimSwingFrame {
  tMs: number;
  landmarks: PoseLandmark[];
}

/**
 * A synthetic swing pose track: lead wrist arcs up to the top then down while
 * the torso turns. Lets the admin QA panel exercise the REAL biomechanics
 * bridge (tempo / separation / sway / balance / sequencing) without a camera.
 */
export function buildScenarioSwingTrack(frames = 24, fps = 8): SimSwingFrame[] {
  const dt = 1000 / fps;
  const out: SimSwingFrame[] = [];
  for (let i = 0; i < frames; i++) {
    const t = frames > 1 ? i / (frames - 1) : 0; // 0..1
    const arc = Math.sin(t * Math.PI); // peaks at the top of the backswing
    const turn = Math.sin(t * Math.PI * 2) * 0.08; // torso rotates through
    const landmarks = baseLandmarks().map((l, idx) => {
      switch (idx) {
        case LM.LEFT_WRIST: return { ...l, x: 0.46 + turn, y: 0.52 - arc * 0.22, z: -arc * 0.1 };
        case LM.RIGHT_WRIST: return { ...l, x: 0.54 + turn, y: 0.52 - arc * 0.1, z: -arc * 0.05 };
        case LM.LEFT_SHOULDER: return { ...l, x: 0.46 + turn, z: -arc * 0.12 };
        case LM.RIGHT_SHOULDER: return { ...l, x: 0.54 + turn, z: arc * 0.12 };
        case LM.LEFT_HIP: return { ...l, x: 0.46 + turn * 0.4 };
        case LM.RIGHT_HIP: return { ...l, x: 0.54 + turn * 0.4 };
        default: return l;
      }
    });
    out.push({ tMs: Math.round(i * dt), landmarks });
  }
  return out;
}
