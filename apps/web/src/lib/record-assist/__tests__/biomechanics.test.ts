// Tests for the Phase 3 biomechanics bridge + camera-shake proxy helpers.
// The bridge reuses the canonical Motion Lab engine, so these assert the
// adapter contract (mapping, gating, honest confidence) rather than the
// underlying biomechanics math (which Motion Lab tests cover).

import {
  analyzeRecording,
  toMotionPoseTrack,
  toCaptureContext,
  distillInsights,
  type CapturedPoseFrame,
} from '../biomechanics';
import {
  shakeFromDeviation,
  smoothShake,
  accelDeviation,
} from '../runtime/devicemotion';
import { getPreset } from '../engines/sport-preset-engine';
import { makeLandmarks } from './fixtures';
import type { SportActionPreset } from '../types';

/** A short synthetic swing: lead wrist arcs up then down while the torso turns. */
function makeSwingTrack(n = 24, fps = 8): CapturedPoseFrame[] {
  const dt = 1000 / fps;
  const frames: CapturedPoseFrame[] = [];
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0; // 0..1
    const arc = Math.sin(t * Math.PI); // up at the top of the backswing
    const turn = Math.sin(t * Math.PI * 2) * 0.08; // torso rotates through
    const landmarks = makeLandmarks({
      15: { x: 0.46 + turn, y: 0.52 - arc * 0.22, z: -arc * 0.1 }, // LEFT_WRIST
      16: { x: 0.54 + turn, y: 0.52 - arc * 0.1, z: -arc * 0.05 }, // RIGHT_WRIST
      11: { x: 0.46 + turn, z: -arc * 0.12 }, // LEFT_SHOULDER
      12: { x: 0.54 + turn, z: arc * 0.12 }, // RIGHT_SHOULDER
      23: { x: 0.46 + turn * 0.4 }, // LEFT_HIP
      24: { x: 0.54 + turn * 0.4 }, // RIGHT_HIP
    });
    frames.push({ tMs: Math.round(i * dt), landmarks });
  }
  return frames;
}

const golfPreset = getPreset('golf', 'iron') as SportActionPreset;

describe('biomechanics bridge', () => {
  it('returns null for too few tracked frames', () => {
    const frames = makeSwingTrack(5);
    expect(analyzeRecording(frames, golfPreset)).toBeNull();
  });

  it('returns null when no frame has landmarks', () => {
    const frames: CapturedPoseFrame[] = Array.from({ length: 20 }, (_, i) => ({ tMs: i * 100, landmarks: [] }));
    expect(analyzeRecording(frames, golfPreset)).toBeNull();
  });

  it('produces a confidence-labelled insights summary for a real swing track', () => {
    const result = analyzeRecording(makeSwingTrack(24), golfPreset);
    expect(result).not.toBeNull();
    const { insights, session } = result!;
    expect(session.metrics.length).toBeGreaterThan(0);
    expect(insights.trackedFrames).toBeGreaterThan(0);
    // All five Phase 3 proxies are present, in order.
    expect(insights.metrics.map((m) => m.key)).toEqual([
      'tempo', 'separation', 'sway', 'balance', 'sequencing',
    ]);
    for (const m of insights.metrics) {
      expect(['high', 'medium', 'low', 'insufficient']).toContain(m.confidence);
      expect(typeof m.display).toBe('string');
    }
  });

  it('never claims "high" confidence for a single-view capture', () => {
    const result = analyzeRecording(makeSwingTrack(24), golfPreset)!;
    expect(result.insights.confidence).not.toBe('high');
    for (const m of result.insights.metrics) {
      expect(m.confidence).not.toBe('high');
    }
  });
});

describe('toMotionPoseTrack', () => {
  it('maps visibility→v and marks the track as an estimate', () => {
    const track = toMotionPoseTrack(makeSwingTrack(10), 8);
    expect(track.schema).toBe('mediapipe_pose_33');
    expect(track.basis).toBe('estimated');
    expect(track.fps).toBe(8);
    expect(track.frames).toHaveLength(10);
    expect(track.frames[0].landmarks[0]).toHaveProperty('v');
    expect(track.trackingConfidence).toBeGreaterThan(0);
  });
});

describe('toCaptureContext', () => {
  it('maps RecordAssist sport+action onto Motion Lab vocabulary', () => {
    const putt = getPreset('golf', 'putting') as SportActionPreset;
    expect(toCaptureContext(putt).motionType).toBe('putt'); // RA "putting" → ML "putt"
    const chip = getPreset('golf', 'chipping') as SportActionPreset;
    expect(toCaptureContext(chip).motionType).toBe('pitch_chip');
    const soft = getPreset('softball', 'hitting') as SportActionPreset;
    expect(toCaptureContext(soft).sport).toBe('softball_fast');
  });
});

describe('distillInsights gating', () => {
  it('reports insufficient overall confidence when nothing was tracked', () => {
    // An empty session-like object: no metrics, empty pose track.
    const fakeSession = {
      metrics: [],
      poseTrack: { frames: [], attemptedFrames: 0 },
    } as unknown as Parameters<typeof distillInsights>[0];
    const insights = distillInsights(fakeSession);
    expect(insights.confidence).toBe('insufficient');
    expect(insights.metrics).toHaveLength(5);
    expect(insights.metrics.every((m) => m.confidence === 'insufficient')).toBe(true);
  });
});

describe('camera-shake proxy helpers', () => {
  it('normalizes deviation into a 0–1 proxy and clamps', () => {
    expect(shakeFromDeviation(0)).toBe(0);
    expect(shakeFromDeviation(-1)).toBe(0);
    expect(shakeFromDeviation(2.5, 2.5)).toBe(1);
    expect(shakeFromDeviation(5, 2.5)).toBe(1); // clamps
    expect(shakeFromDeviation(1.25, 2.5)).toBeCloseTo(0.5, 3);
  });

  it('smooths toward the new sample', () => {
    expect(smoothShake(0, 1, 0.2)).toBeCloseTo(0.2, 5);
    expect(smoothShake(1, 1, 0.2)).toBeCloseTo(1, 5);
  });

  it('measures the high-frequency acceleration magnitude', () => {
    expect(accelDeviation({ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })).toBeCloseTo(1, 5);
    expect(accelDeviation({ x: 3, y: 4, z: 0 }, { x: 0, y: 0, z: 0 })).toBeCloseTo(5, 5);
  });
});
