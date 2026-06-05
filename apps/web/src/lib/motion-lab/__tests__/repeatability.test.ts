// ============================================================
// SwingVantage — Motion Lab: repeatability (cross-session) tests
// ============================================================

import { computeRepeatability, MIN_SESSIONS_FOR_REPEATABILITY } from '../repeatability';
import type { MotionSession } from '../types';

type MetricSpec = [id: string, name: string, value: number];

function session(metrics: MetricSpec[], basis: MotionSession['poseTrack']['basis'] = 'estimated'): MotionSession {
  return {
    id: Math.random().toString(36).slice(2),
    metrics: metrics.map(([id, name, value]) => ({ id, name, value })),
    poseTrack: { basis },
  } as unknown as MotionSession;
}

describe('computeRepeatability', () => {
  it('is unavailable below the session threshold', () => {
    const res = computeRepeatability([
      session([['shoulder_turn', 'Shoulder Rotation', 90]]),
      session([['shoulder_turn', 'Shoulder Rotation', 92]]),
    ]);
    expect(res.available).toBe(false);
    expect(res.score).toBeNull();
    expect(res.sessionCount).toBe(2);
    expect(MIN_SESSIONS_FOR_REPEATABILITY).toBe(3);
  });

  it('scores identical mechanics as near-perfectly repeatable', () => {
    const reps: MetricSpec[] = [['shoulder_turn', 'Shoulder Rotation', 90], ['hip_turn', 'Hip Rotation', 45]];
    const res = computeRepeatability([session(reps), session(reps), session(reps)]);
    expect(res.available).toBe(true);
    expect(res.score).toBe(100);
    expect(res.mostConsistent?.consistency).toBe(100);
  });

  it('lowers the score when values vary across sessions', () => {
    const res = computeRepeatability([
      session([['shoulder_turn', 'Shoulder Rotation', 80]]),
      session([['shoulder_turn', 'Shoulder Rotation', 90]]),
      session([['shoulder_turn', 'Shoulder Rotation', 100]]),
    ]);
    expect(res.available).toBe(true);
    expect(res.score!).toBeLessThan(100);
    expect(res.score!).toBeGreaterThan(0);
  });

  it('skips metrics whose mean is ~0 (CV would be unstable)', () => {
    const noisy: MetricSpec[] = [['shoulder_turn', 'Shoulder Rotation', 90], ['drift', 'Tiny Drift', 0.1]];
    const res = computeRepeatability([
      session([['shoulder_turn', 'Shoulder Rotation', 90], ['drift', 'Tiny Drift', 0.1]]),
      session([['shoulder_turn', 'Shoulder Rotation', 91], ['drift', 'Tiny Drift', -0.1]]),
      session(noisy),
    ]);
    expect(res.perMetric.map((p) => p.id)).toContain('shoulder_turn');
    expect(res.perMetric.map((p) => p.id)).not.toContain('drift');
  });

  it('reports measured basis only when every session is measured', () => {
    const reps: MetricSpec[] = [['shoulder_turn', 'Shoulder Rotation', 90]];
    const measured = computeRepeatability([
      session(reps, 'measured'),
      session(reps, 'measured'),
      session(reps, 'measured'),
    ]);
    const mixed = computeRepeatability([
      session(reps, 'measured'),
      session(reps, 'estimated'),
      session(reps, 'measured'),
    ]);
    expect(measured.basis).toBe('measured');
    expect(mixed.basis).toBe('estimated');
  });

  it('confidence grows with sample size', () => {
    const reps: MetricSpec[] = [['shoulder_turn', 'Shoulder Rotation', 90]];
    const three = computeRepeatability([session(reps), session(reps), session(reps)]);
    const many = computeRepeatability(Array.from({ length: 8 }, () => session(reps)));
    expect(many.confidence).toBeGreaterThan(three.confidence);
  });
});
