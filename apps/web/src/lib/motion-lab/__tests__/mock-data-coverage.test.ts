import { SAMPLE_SPECS, buildSampleSession, isSampleSession } from '../sample';
import { isContinuousSport } from '../continuous-movement';
import type { SportId } from '../types';

const ALL_SPORTS: SportId[] = [
  'golf', 'tennis', 'baseball', 'softball_slow', 'softball_fast', 'pickleball', 'padel',
];

describe('mock data coverage', () => {
  it('provides a sample for all seven sports', () => {
    const covered = new Set(SAMPLE_SPECS.map((s) => s.sport));
    for (const sport of ALL_SPORTS) {
      expect(covered.has(sport)).toBe(true);
    }
  });

  it('every sample runs through the real engine to a complete session', () => {
    for (const spec of SAMPLE_SPECS) {
      const session = buildSampleSession(spec);
      expect(session.status).toBe('complete');
      expect(session.phases.length).toBeGreaterThan(0);
      expect(session.metrics.length).toBeGreaterThan(0);
      expect(session.scoreboard.overall).toBeGreaterThanOrEqual(0);
      expect(session.scoreboard.overall).toBeLessThanOrEqual(100);
      expect(isSampleSession(session)).toBe(true);
      // Samples are single-camera synthetic — never a measured (multi-view) basis.
      expect(session.poseTrack.basis).not.toBe('measured');
    }
  });

  it('attaches continuous-movement only to rally-sport samples', () => {
    for (const spec of SAMPLE_SPECS) {
      const session = buildSampleSession(spec);
      if (isContinuousSport(spec.sport)) {
        expect(session.continuousMovement).toBeDefined();
      } else {
        expect(session.continuousMovement).toBeUndefined();
      }
    }
  });
});
