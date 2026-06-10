import {
  computeContinuousMovement,
  isContinuousSport,
  movementModelFor,
} from '../continuous-movement';
import { computeSeries } from '../biomechanics';
import { detectPhases } from '../phases';
import { generateSamplePoseTrack, buildSampleSession, SAMPLE_SPECS } from '../sample';
import type { CaptureContext } from '../types';

function captureFor(sport: CaptureContext['sport'], motionType: string): CaptureContext {
  return { sport, motionType, view: 'face_on', handedness: 'right', skillLevel: 'intermediate' };
}

describe('movement model classification', () => {
  it('routes the three rally sports to continuous movement', () => {
    expect(isContinuousSport('tennis')).toBe(true);
    expect(isContinuousSport('pickleball')).toBe(true);
    expect(isContinuousSport('padel')).toBe(true);
  });

  it('treats swing sports as discrete', () => {
    expect(isContinuousSport('golf')).toBe(false);
    expect(isContinuousSport('baseball')).toBe(false);
    expect(isContinuousSport('softball_slow')).toBe(false);
  });

  it('maps sports to the right movement model', () => {
    expect(movementModelFor('golf', 'driver')).toBe('stationary_rotational_swing');
    expect(movementModelFor('baseball', 'hitting')).toBe('stride_rotational_swing');
    expect(movementModelFor('tennis', 'forehand')).toBe('continuous_rally');
  });
});

describe('computeContinuousMovement', () => {
  it('returns null for a discrete swing sport', () => {
    const track = generateSamplePoseTrack('groundstroke');
    const capture = captureFor('golf', 'driver');
    const series = computeSeries(track, capture);
    const phases = detectPhases(track, capture, series);
    expect(computeContinuousMovement(track, capture, series, phases)).toBeNull();
  });

  it('produces a well-formed summary for a rally sport', () => {
    const track = generateSamplePoseTrack('groundstroke');
    const capture = captureFor('tennis', 'forehand');
    const series = computeSeries(track, capture);
    const phases = detectPhases(track, capture, series);
    const summary = computeContinuousMovement(track, capture, series, phases);

    expect(summary).not.toBeNull();
    if (!summary) return;
    expect(summary.movementModel).toBe('continuous_rally');
    expect(summary.checkpoints).toHaveLength(4);
    expect(summary.checkpoints.map((c) => c.id)).toEqual(['readiness', 'spacing', 'recovery', 'recentering']);
    expect(summary.contactEvents.length).toBeGreaterThanOrEqual(1);
    expect(summary.basis).not.toBe('measured'); // single-camera sample
    expect(summary.confidence).toBeGreaterThanOrEqual(0);
    expect(summary.confidence).toBeLessThanOrEqual(1);
    expect(summary.headline.length).toBeGreaterThan(0);
    expect(['readiness', 'spacing', 'recovery', 'recentering']).toContain(summary.primaryFocus);
  });

  it('keeps every checkpoint score in range or honestly null', () => {
    const track = generateSamplePoseTrack('dink');
    const capture = captureFor('pickleball', 'dink');
    const series = computeSeries(track, capture);
    const phases = detectPhases(track, capture, series);
    const summary = computeContinuousMovement(track, capture, series, phases);
    expect(summary).not.toBeNull();
    for (const cp of summary!.checkpoints) {
      if (cp.score == null) {
        expect(cp.status).toBe('not_available');
      } else {
        expect(cp.score).toBeGreaterThanOrEqual(0);
        expect(cp.score).toBeLessThanOrEqual(100);
        expect(cp.confidence).toBeGreaterThanOrEqual(0);
        expect(cp.confidence).toBeLessThanOrEqual(1);
      }
    }
  });

  it('returns null when the track is too short to read movement', () => {
    const track = generateSamplePoseTrack('groundstroke');
    const shortTrack = { ...track, frames: track.frames.slice(0, 3) };
    const capture = captureFor('tennis', 'forehand');
    const series = computeSeries(shortTrack, capture);
    expect(computeContinuousMovement(shortTrack, capture, series, [])).toBeNull();
  });
});

describe('continuous movement integrates into the pipeline', () => {
  it('attaches a summary to rally-sport sample sessions only', () => {
    for (const spec of SAMPLE_SPECS) {
      const session = buildSampleSession(spec);
      if (isContinuousSport(spec.sport)) {
        expect(session.continuousMovement).toBeDefined();
        expect(session.continuousMovement?.movementModel).toBe('continuous_rally');
      } else {
        expect(session.continuousMovement).toBeUndefined();
      }
    }
  });
});
