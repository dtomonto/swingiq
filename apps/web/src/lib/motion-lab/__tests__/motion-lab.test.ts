// ============================================================
// SwingIQ — Motion Lab: engine smoke tests
// ------------------------------------------------------------
// Exercises the pure (non-DOM) engine end-to-end on a synthetic pose
// track: series → phases → metrics → scores → report → drills →
// compare. Confirms it never throws and produces sane, honest output.
// ============================================================

import {
  computeSeries,
  detectPhases,
  computeMetrics,
  computeScoreboard,
  buildReport,
  prescribeDrills,
  compareSessions,
  assessQuality,
  getPhaseTemplate,
  getMotion,
  compactTrack,
  scoreMetric,
  metricTarget,
} from '..';
import type { MotionPoseTrack, CaptureContext, MotionSession } from '..';

/** Build a 33-landmark frame with sensible defaults, then override key joints. */
function frame(tMs: number, theta: number, wristX: number): MotionPoseTrack['frames'][number] {
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, v: 0.85 }));
  const s = Math.sin(theta);
  const c = Math.cos(theta);
  lm[0] = { x: 0.5 + 0.02 * s, y: 0.2, z: 0, v: 0.9 };          // nose
  lm[11] = { x: 0.42, y: 0.35 - 0.06 * s, z: 0.1 * s, v: 0.9 }; // L shoulder
  lm[12] = { x: 0.58, y: 0.35 + 0.06 * s, z: -0.1 * s, v: 0.9 };// R shoulder
  lm[13] = { x: 0.38, y: 0.45, z: 0, v: 0.8 };                  // L elbow
  lm[14] = { x: 0.62, y: 0.45, z: 0, v: 0.8 };                  // R elbow
  lm[15] = { x: wristX, y: 0.5, z: 0, v: 0.8 };                 // L wrist (lead)
  lm[16] = { x: 0.66, y: 0.5, z: 0, v: 0.8 };                   // R wrist
  lm[23] = { x: 0.45, y: 0.6 - 0.02 * c, z: 0.05 * s, v: 0.9 };  // L hip
  lm[24] = { x: 0.55, y: 0.6 + 0.02 * c, z: -0.05 * s, v: 0.9 }; // R hip
  lm[25] = { x: 0.45, y: 0.75, z: 0, v: 0.7 };                  // L knee
  lm[26] = { x: 0.55, y: 0.75, z: 0, v: 0.7 };                  // R knee
  lm[27] = { x: 0.45, y: 0.92, z: 0, v: 0.6 };                  // L ankle
  lm[28] = { x: 0.55, y: 0.92, z: 0, v: 0.6 };                  // R ankle
  lm[31] = { x: 0.45, y: 0.97, z: 0, v: 0.5 };                  // L foot
  lm[32] = { x: 0.55, y: 0.97, z: 0, v: 0.5 };                  // R foot
  return { tMs, landmarks: lm };
}

function syntheticTrack(): MotionPoseTrack {
  const N = 24;
  const frames = Array.from({ length: N }, (_, i) => {
    const theta = (i / (N - 1)) * Math.PI; // 0 → π over the motion
    // wrist sweeps quickly through the middle (peak speed ~ frame 14)
    const wristX = 0.3 + 0.5 / (1 + Math.exp(-(i - 14)));
    return frame(i * 33, theta, wristX);
  });
  return {
    schema: 'mediapipe_pose_33',
    fps: 30,
    frames,
    attemptedFrames: N,
    trackingConfidence: 0.82,
    basis: 'estimated',
  };
}

const capture: CaptureContext = {
  sport: 'golf',
  motionType: 'driver',
  view: 'face_on',
  handedness: 'right',
  heightCm: null,
  implement: null,
};

describe('motion-lab engine (synthetic track)', () => {
  const track = syntheticTrack();

  it('computes a per-frame series with a real strike peak', () => {
    const series = computeSeries(track, capture);
    expect(series).not.toBeNull();
    expect(series!.frames).toBe(24);
    expect(series!.peakFrame).toBeGreaterThan(0);
    expect(series!.peakFrame).toBeLessThan(24);
    expect(series!.shoulderLineDeg.length).toBe(24);
  });

  it('segments phases in order, anchored to the motion, all within bounds', () => {
    const series = computeSeries(track, capture);
    const phases = detectPhases(track, capture, series);
    const template = getPhaseTemplate('golf', 'driver');
    expect(phases.length).toBe(template.length);
    // ordered + within frame bounds
    for (let i = 0; i < phases.length; i++) {
      expect(phases[i].startFrame).toBeLessThanOrEqual(phases[i].endFrame);
      expect(phases[i].endFrame).toBeLessThanOrEqual(track.frames.length - 1);
      if (i > 0) expect(phases[i].startFrame).toBeGreaterThanOrEqual(phases[i - 1].startFrame);
    }
    expect(phases[phases.length - 1].endFrame).toBe(track.frames.length - 1);
  });

  it('computes metrics with values, scores, and honest bases', () => {
    const series = computeSeries(track, capture);
    const phases = detectPhases(track, capture, series);
    const metrics = computeMetrics(track, capture, series, phases);
    expect(metrics.length).toBeGreaterThan(8);
    for (const m of metrics) {
      expect(m.basis).not.toBe('measured'); // single-camera video is never "measured"
      expect(m.confidence).toBeGreaterThanOrEqual(0);
      expect(m.confidence).toBeLessThanOrEqual(1);
      if (m.normalizedScore != null) {
        expect(m.normalizedScore).toBeGreaterThanOrEqual(0);
        expect(m.normalizedScore).toBeLessThanOrEqual(100);
      }
    }
    // repeatability must stay honest about needing multiple sessions
    const rep = metrics.find((m) => m.id === 'repeatability');
    expect(rep?.value).toBeNull();
    expect(rep?.basis).toBe('placeholder');
  });

  it('produces an overall score in range with a disclaimer (not measured)', () => {
    const series = computeSeries(track, capture);
    const phases = detectPhases(track, capture, series);
    const metrics = computeMetrics(track, capture, series, phases);
    const sb = computeScoreboard(metrics);
    expect(sb.overall).toBeGreaterThanOrEqual(0);
    expect(sb.overall).toBeLessThanOrEqual(100);
    expect(sb.components.length).toBe(6);
    expect(sb.disclaimer).toBeTruthy(); // estimate must keep its disclaimer
  });

  it('writes a grounded report and a 4-drill prescription', () => {
    const series = computeSeries(track, capture);
    const phases = detectPhases(track, capture, series);
    const metrics = computeMetrics(track, capture, series, phases);
    const sb = computeScoreboard(metrics);
    const drills = prescribeDrills(metrics, capture);
    const report = buildReport(capture, metrics, phases, sb, drills);

    expect(report.topFixes.length).toBeGreaterThan(0);
    expect(report.topFixes.length).toBeLessThanOrEqual(3);
    expect(report.limitations.length).toBeGreaterThan(0);
    expect(Object.keys(report.tones)).toEqual(
      expect.arrayContaining(['beginner', 'athlete', 'coach', 'youth', 'data']),
    );
    expect(drills.immediate.kind).toBe('immediate');
    expect(drills.weeklyPlan.length).toBe(7);
  });

  it('assesses capture quality with a verdict and recommendations', () => {
    const q = assessQuality(
      track,
      { resolution: '1920x1080', durationSeconds: 1.5, attemptedFrames: 24, swingWindowDetected: true, estimatedFps: 30 },
      capture,
    );
    expect(['good', 'fair', 'poor']).toContain(q.verdict);
    expect(q.analyzable).toBe(true);
    expect(q.items.length).toBeGreaterThan(4);
    expect(q.recommendations.length).toBeGreaterThan(0);
  });

  it('compares two sessions and yields an overall delta + recommendation', () => {
    const series = computeSeries(track, capture);
    const phases = detectPhases(track, capture, series);
    const metrics = computeMetrics(track, capture, series, phases);
    const sb = computeScoreboard(metrics);

    const make = (id: string, bump: number, date: string): MotionSession =>
      ({
        id,
        createdAt: date,
        metrics: metrics.map((m) => ({
          ...m,
          normalizedScore: m.normalizedScore == null ? null : Math.min(100, m.normalizedScore + bump),
        })),
        scoreboard: { ...sb, overall: Math.min(100, sb.overall + bump) },
      } as unknown as MotionSession);

    const before = make('a', 0, '2026-01-01T00:00:00Z');
    const after = make('b', 10, '2026-02-01T00:00:00Z');
    const cmp = compareSessions(before, after);
    // delta is read from the (score-capped) sessions, so derive it from them
    expect(cmp.overallDelta).toBe(after.scoreboard.overall - before.scoreboard.overall);
    expect(cmp.overallDelta).toBeGreaterThan(0);
    expect(cmp.recommendation).toMatch(/progress|same|dip/i);
    expect(cmp.metricDeltas.length).toBeGreaterThan(0);
  });

  it('compacts a pose track for storage without losing structure', () => {
    const big: MotionPoseTrack = { ...track, frames: [...track.frames, ...track.frames, ...track.frames] };
    const small = compactTrack(big);
    expect(small.frames.length).toBeLessThanOrEqual(40);
    expect(small.frames[0].landmarks.length).toBe(33);
  });

  it('scores metrics more strictly as skill level rises', () => {
    // 62° separation is elite-good but only "fine" for a beginner band shape.
    const beginner = scoreMetric('hip_shoulder_sep', 18, 'beginner');
    const elite = scoreMetric('hip_shoulder_sep', 18, 'elite');
    expect(beginner).toBeGreaterThan(elite); // 18° is below the elite target band
    expect(metricTarget('shoulder_turn', 'intermediate')).toMatch(/intermediate/);
    expect(scoreMetric('unknown_metric', 5, 'elite')).toBe(50); // safe default
  });

  it('resolves taxonomy for every sport/motion without throwing', () => {
    expect(getMotion('tennis', 'serve').label).toBeTruthy();
    expect(getPhaseTemplate('softball_fast', 'pitching').length).toBeGreaterThan(0);
    expect(getPhaseTemplate('baseball', 'hitting').length).toBeGreaterThan(0);
  });
});
