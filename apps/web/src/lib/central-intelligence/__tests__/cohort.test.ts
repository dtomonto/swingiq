// ============================================================
// Cohort similarity recommender (intelligence upgrade Sprint 5, #23)
// ============================================================

import { cohortRecommendation, type CohortRecord } from '../cohort';

const r = (faultId: string, skillLevel: string | null, helpedWith: string | null): CohortRecord => ({
  faultId,
  skillLevel,
  helpedWith,
});

describe('#23 cohortRecommendation', () => {
  it('suppresses below the k-anonymity minimum', () => {
    const recs = [r('slice', 'beginner', 'gate drill'), r('slice', 'beginner', 'gate drill')];
    const out = cohortRecommendation(recs, { faultId: 'slice', skillLevel: 'beginner' }, { minCohort: 5 });
    expect(out.suppressed).toBe(true);
    expect(out.topFixes).toHaveLength(0);
  });

  it('surfaces the most common fix once the cohort is large enough', () => {
    const recs = [
      r('slice', 'beginner', 'gate drill'),
      r('slice', 'beginner', 'gate drill'),
      r('slice', 'beginner', 'gate drill'),
      r('slice', 'beginner', 'grip change'),
    ];
    const out = cohortRecommendation(recs, { faultId: 'slice', skillLevel: 'beginner' }, { minCohort: 3 });
    expect(out.suppressed).toBe(false);
    expect(out.topFixes[0].label).toBe('gate drill');
    expect(out.skillMatched).toBe(true);
    expect(out.message).toMatch(/at your level/);
  });

  it('widens to all skill levels when the same-skill cohort is too small', () => {
    const recs = [
      r('slice', 'beginner', 'gate drill'),
      r('slice', 'intermediate', 'gate drill'),
      r('slice', 'advanced', 'gate drill'),
    ];
    const out = cohortRecommendation(recs, { faultId: 'slice', skillLevel: 'beginner' }, { minCohort: 3 });
    expect(out.suppressed).toBe(false);
    expect(out.skillMatched).toBe(false);
    expect(out.cohortSize).toBe(3);
  });

  it('ignores records for other faults', () => {
    const recs = [
      r('slice', 'beginner', 'gate drill'),
      r('slice', 'beginner', 'gate drill'),
      r('slice', 'beginner', 'gate drill'),
      r('hook', 'beginner', 'grip change'),
    ];
    const out = cohortRecommendation(recs, { faultId: 'slice' }, { minCohort: 3 });
    expect(out.cohortSize).toBe(3);
    expect(out.topFixes.every((b) => b.label !== 'grip change')).toBe(true);
  });
});
