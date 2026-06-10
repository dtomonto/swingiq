import { predictSafeZone } from '../engines/motion-safe-zone-engine';
import { evaluateFrameQuality } from '../engines/frame-quality-engine';
import { getPreset } from '../engines/sport-preset-engine';
import { makeFrame, makeLandmarks, makePose, shiftX } from './fixtures';
import type { FrameQualitySignals } from '../types';

const tennisForehand = getPreset('tennis', 'forehand');
const tennisServe = getPreset('tennis', 'serve');

function qualityFor(frameOver = {}) {
  return evaluateFrameQuality(makeFrame(frameOver), tennisForehand);
}

describe('MotionSafeZoneEngine', () => {
  it('is safe with no person / no preset', () => {
    const q = evaluateFrameQuality(makeFrame({ pose: null }), tennisForehand);
    const p = predictSafeZone(q, tennisForehand);
    expect(p.willLeaveFrame).toBe(false);
    expect(p.advice).toBeNull();
  });

  it('flags lateral risk when the athlete hugs the left edge (tennis needs width)', () => {
    const lm = shiftX(makeLandmarks(), -0.42);
    const q = evaluateFrameQuality(makeFrame({ pose: makePose(lm), orientation: 'landscape' }), tennisForehand);
    const p = predictSafeZone(q, tennisForehand);
    expect(p.left).toBe('risk');
    expect(p.willLeaveFrame).toBe(true);
    expect(p.advice).toMatch(/right/i);
  });

  it('flags overhead risk for the serve when headroom is tight', () => {
    // Body pushed up so there is little room above the head.
    const lm = makeLandmarks();
    const raised = lm.map((l) => ({ ...l, y: Math.max(0.01, l.y - 0.07) }));
    const q = evaluateFrameQuality(makeFrame({ pose: makePose(raised), orientation: 'portrait' }), tennisServe);
    const p = predictSafeZone(q, tennisServe);
    expect(['tight', 'risk']).toContain(p.top);
  });

  it('is comfortable when well-framed and centered', () => {
    const q = qualityFor({ orientation: 'landscape' });
    const p = predictSafeZone(q, tennisForehand);
    // A centered, full-body frame should have at most a "tight" edge, no risk.
    expect(p.willLeaveFrame).toBe(false);
  });

  it('respects a wider envelope for padel overhead vs golf', () => {
    const padelSmash = getPreset('padel', 'smash');
    const golfIron = getPreset('golf', 'iron');
    const lm = makeLandmarks().map((l) => ({ ...l, y: Math.max(0.01, l.y - 0.06) }));
    const q: FrameQualitySignals = evaluateFrameQuality(makeFrame({ pose: makePose(lm), orientation: 'portrait' }), padelSmash);
    const padelPred = predictSafeZone(q, padelSmash);
    const golfPred = predictSafeZone({ ...q }, golfIron);
    // Padel smash demands much more overhead room, so its top edge is at least
    // as risky as golf's for the same frame.
    const order = { ok: 0, tight: 1, risk: 2 } as const;
    expect(order[padelPred.top]).toBeGreaterThanOrEqual(order[golfPred.top]);
  });
});
