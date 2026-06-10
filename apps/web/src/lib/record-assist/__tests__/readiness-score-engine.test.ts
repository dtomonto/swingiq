import {
  computeReadiness,
  stateForScore,
  resolveWeights,
  DEFAULT_WEIGHTS,
} from '../engines/readiness-score-engine';
import { evaluateFrameQuality } from '../engines/frame-quality-engine';
import { getPreset } from '../engines/sport-preset-engine';
import { makeFrame } from './fixtures';

const golfIron = getPreset('golf', 'iron');

describe('ReadinessScoreEngine', () => {
  it('maps scores to the documented states', () => {
    expect(stateForScore(0)).toBe('not_usable');
    expect(stateForScore(39)).toBe('not_usable');
    expect(stateForScore(40)).toBe('needs_adjustment');
    expect(stateForScore(69)).toBe('needs_adjustment');
    expect(stateForScore(70)).toBe('usable');
    expect(stateForScore(84)).toBe('usable');
    expect(stateForScore(85)).toBe('excellent');
    expect(stateForScore(100)).toBe('excellent');
  });

  it('scores an ideal landscape golf frame as excellent', () => {
    const q = evaluateFrameQuality(makeFrame({ orientation: 'landscape' }), golfIron);
    const r = computeReadiness(q, golfIron);
    expect(r.score).toBeGreaterThanOrEqual(85);
    expect(r.state).toBe('excellent');
    expect(r.confidence).toBe('high');
  });

  it('scores zero with insufficient confidence when no person', () => {
    const q = evaluateFrameQuality(makeFrame({ pose: null }), golfIron);
    const r = computeReadiness(q, golfIron);
    expect(r.score).toBe(0);
    expect(r.state).toBe('not_usable');
    expect(r.confidence).toBe('insufficient');
  });

  it('drops the score for low light', () => {
    const good = computeReadiness(
      evaluateFrameQuality(makeFrame({ orientation: 'landscape' }), golfIron),
      golfIron,
    );
    const dark = computeReadiness(
      evaluateFrameQuality(makeFrame({ orientation: 'landscape', luma: 0.1 }), golfIron),
      golfIron,
    );
    expect(dark.score).toBeLessThan(good.score);
  });

  it('component max values sum to ~100', () => {
    const q = evaluateFrameQuality(makeFrame(), golfIron);
    const r = computeReadiness(q, golfIron);
    const totalMax = r.components.reduce((s, c) => s + c.max, 0);
    expect(Math.round(totalMax)).toBe(100);
  });

  it('default weights sum to 100', () => {
    const total = Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });

  it('renormalizes preset weight overrides back to 100', () => {
    const serve = getPreset('tennis', 'serve');
    const weights = resolveWeights(serve);
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(Math.round(total)).toBe(100);
  });

  it('lowers the score when the implement is at high risk', () => {
    const baseQ = evaluateFrameQuality(makeFrame({ orientation: 'landscape' }), golfIron);
    const riskyQ = { ...baseQ, implementRisk: 'high' as const };
    const base = computeReadiness(baseQ, golfIron);
    const risky = computeReadiness(riskyQ, golfIron);
    expect(risky.score).toBeLessThan(base.score);
  });
});
