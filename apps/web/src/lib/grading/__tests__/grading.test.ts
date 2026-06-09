import {
  GOLF_PROFILES, nextProfile, defaultBenchmarks, GRADE_DIMENSIONS,
} from '../profiles';
import { gradeFromDelta, gradeSession } from '../grade';
import { inferGolfProfile, profileFromHandicap, profileFromSwingScore } from '../classify';
import type { SwingScores } from '@swingiq/core';

const scores = (over: Partial<SwingScores>): SwingScores => ({
  overall: 50, driver: 50, iron: 50, wedge: 50, short_game: 50, putting: 50,
  face_control: 50, path_control: 50, strike_quality: 50, distance_control: 50,
  launch_spin_optimization: 50, dispersion: 50, consistency: 50, video_mechanics: 50, practice_compliance: 50,
  ...over,
});

describe('profiles', () => {
  it('has 7 ordered profiles Beginner → Professional', () => {
    expect(GOLF_PROFILES).toHaveLength(7);
    expect(GOLF_PROFILES.map((p) => p.id)).toEqual([
      'beginner', 'developing', 'intermediate', 'advanced', 'competitive', 'elite', 'professional',
    ]);
    expect(GOLF_PROFILES.map((p) => p.order)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    // expectation rises with level
    for (let i = 1; i < GOLF_PROFILES.length; i++) {
      expect(GOLF_PROFILES[i]!.expected).toBeGreaterThan(GOLF_PROFILES[i - 1]!.expected);
    }
  });

  it('nextProfile walks up and stops at the top', () => {
    expect(nextProfile('beginner')!.id).toBe('developing');
    expect(nextProfile('professional')).toBeNull();
  });

  it('defaultBenchmarks covers every profile × dimension', () => {
    const t = defaultBenchmarks();
    for (const p of GOLF_PROFILES) {
      for (const d of GRADE_DIMENSIONS) expect(typeof t[p.id][d]).toBe('number');
    }
  });
});

describe('classify', () => {
  it('maps handicap to profile (lower = higher level)', () => {
    expect(profileFromHandicap(36)).toBe('beginner');
    expect(profileFromHandicap(24)).toBe('developing');
    expect(profileFromHandicap(15)).toBe('intermediate');
    expect(profileFromHandicap(8)).toBe('advanced');
    expect(profileFromHandicap(3)).toBe('competitive');
    expect(profileFromHandicap(0)).toBe('elite');
    expect(profileFromHandicap(-4)).toBe('professional');
  });

  it('prefers handicap, then skill level, then data, then default', () => {
    expect(inferGolfProfile({ handicap: 10 })).toMatchObject({ profileId: 'advanced', basis: 'handicap', confidence: 'high' });
    expect(inferGolfProfile({ skillLevel: 'beginner' })).toMatchObject({ profileId: 'beginner', basis: 'skill_level' });
    expect(inferGolfProfile({ avgOverallScore: 75 })).toMatchObject({ basis: 'data' });
    expect(inferGolfProfile({})).toMatchObject({ profileId: 'developing', basis: 'default' });
  });

  it('maps a swing score to the highest profile it clears', () => {
    expect(profileFromSwingScore(40)).toBe('beginner');
    expect(profileFromSwingScore(90)).toBe('professional');
  });
});

describe('gradeFromDelta', () => {
  it('grades relative to expectation', () => {
    expect(gradeFromDelta(12)).toBe('A');
    expect(gradeFromDelta(0)).toBe('B'); // meeting expectation
    expect(gradeFromDelta(-10)).toBe('C');
    expect(gradeFromDelta(-25)).toBe('D');
    expect(gradeFromDelta(-40)).toBe('F');
  });
});

describe('gradeSession — profile-aware', () => {
  it('the SAME score grades higher for a beginner than a professional', () => {
    const s = scores({ overall: 50, face_control: 50, strike_quality: 50 });
    const asBeginner = gradeSession({ scores: s, profileId: 'beginner' });
    const asPro = gradeSession({ scores: s, profileId: 'professional' });
    expect(asBeginner.overall.grade <= asPro.overall.grade).toBe(true); // 'A' < 'F'
    expect(asBeginner.vsProfile).toBe('exceeding');
    expect(asPro.vsProfile).toBe('below');
  });

  it('meeting your level lands a B and names the benchmark', () => {
    const r = gradeSession({ scores: scores({ overall: 40, face_control: 40 }), profileId: 'beginner' });
    expect(r.overall.grade).toBe('B');
    expect(r.profileLabel).toBe('Beginner');
    expect(r.overall.expected).toBe(40);
    expect(r.explanation.join(' ')).toMatch(/Beginner benchmark/i);
  });

  it('reports improvement vs the player\'s own baseline', () => {
    const r = gradeSession({ scores: scores({ overall: 55 }), profileId: 'intermediate', ownBaselineOverall: 48 });
    expect(r.vsBaseline).toMatchObject({ direction: 'improving' });
    expect(r.vsBaseline!.delta).toBe(7);
  });

  it('shows what the next level needs', () => {
    const r = gradeSession({ scores: scores({}), profileId: 'beginner' }); // all 50, next=developing(48)
    expect(r.nextLevel!.id).toBe('developing');
    // 50 already clears developing's 48 → no gaps; drop scores to create one
    const r2 = gradeSession({ scores: scores({ face_control: 30 }), profileId: 'beginner' });
    expect(r2.nextLevel!.gaps.some((g) => g.dimension === 'face_control')).toBe(true);
  });
});
