// P23 — imported-session data-quality scoring tests.

import { computeImportQuality } from './data-quality';
import type { SessionStats } from './rules';

const complete: SessionStats = {
  shot_count: 35,
  club_category: 'driver',
  avg_face_to_path: 1.2,
  avg_club_path: -0.5,
  avg_face_angle: 0.8,
  avg_attack_angle: -1.0,
  avg_spin_axis: 2.0,
  avg_lateral_offline: 4,
  avg_launch_angle: 14,
  avg_spin_rate: 2600,
  avg_carry: 250,
  avg_ball_speed: 165,
  face_to_path_std_dev: 1.5,
  club_path_std_dev: 1.2,
};

const thin: SessionStats = {
  shot_count: 5,
  club_category: 'driver',
  avg_carry: 240,
  avg_ball_speed: 160,
  // ball-flight only — no club delivery, no dispersion
};

describe('computeImportQuality', () => {
  it('bands a complete, well-sampled import high (≈excellent) with no confidence penalty', () => {
    const q = computeImportQuality(complete);
    expect(q.band).toBe('excellent');
    expect(q.completeness).toBe(1);
    expect(q.completenessFactor).toBe(1);
    expect(q.score).toBeGreaterThanOrEqual(80);
  });

  it('bands a thin, ball-flight-only import low and lowers the confidence factor', () => {
    const q = computeImportQuality(thin);
    expect(['limited', 'poor']).toContain(q.band);
    expect(q.completeness).toBeLessThan(0.5);
    expect(q.completenessFactor).toBeLessThan(1);
    expect(q.completenessFactor).toBeGreaterThanOrEqual(0.7);
    expect(q.reasons.join(' ')).toMatch(/missing|small sample|dispersion/i);
  });

  it('is monotonic: more complete ⇒ higher score + factor', () => {
    expect(computeImportQuality(complete).score).toBeGreaterThan(computeImportQuality(thin).score);
    expect(computeImportQuality(complete).completenessFactor).toBeGreaterThan(
      computeImportQuality(thin).completenessFactor,
    );
  });

  it('keeps the confidence multiplier bounded to [0.7, 1.0]', () => {
    for (const s of [complete, thin, { shot_count: 0, club_category: 'iron' } as SessionStats]) {
      const f = computeImportQuality(s).completenessFactor;
      expect(f).toBeGreaterThanOrEqual(0.7);
      expect(f).toBeLessThanOrEqual(1);
    }
  });
});
