import { buildRetestProtocol } from '../retest-protocols';
import { buildSampleSession, SAMPLE_SPECS } from '../sample';

const golf = SAMPLE_SPECS.find((s) => s.sport === 'golf')!;
const tennis = SAMPLE_SPECS.find((s) => s.sport === 'tennis')!;

describe('buildRetestProtocol', () => {
  it('produces a complete, well-formed protocol', () => {
    const session = buildSampleSession(golf);
    const p = buildRetestProtocol(session);

    expect(p.title.length).toBeGreaterThan(0);
    expect(p.focus.length).toBeGreaterThan(0);
    expect(p.timeframeDays).toBeGreaterThan(0);
    expect(p.reproduce.length).toBeGreaterThanOrEqual(1);
    expect(p.successCriterion.length).toBeGreaterThan(0);
  });

  it('reuses the session’s own phase markers for every checkpoint', () => {
    const session = buildSampleSession(golf);
    const p = buildRetestProtocol(session);
    const phaseKeys = new Set(session.phases.map((ph) => ph.key));

    expect(p.checkpoints.length).toBeGreaterThanOrEqual(1);
    expect(p.checkpoints.length).toBeLessThanOrEqual(3);
    for (const c of p.checkpoints) {
      expect(phaseKeys.has(c.phaseKey)).toBe(true);
      expect(c.watchFor.length).toBeGreaterThan(0);
    }
  });

  it('folds in a movement check for rally sports only', () => {
    const rally = buildRetestProtocol(buildSampleSession(tennis));
    const swing = buildRetestProtocol(buildSampleSession(golf));
    expect(rally.movementCheck).not.toBeNull();
    expect(swing.movementCheck).toBeNull();
  });

  it('carries the session basis (single-camera estimate)', () => {
    const p = buildRetestProtocol(buildSampleSession(golf));
    expect(p.basis).not.toBe('measured');
  });
});
