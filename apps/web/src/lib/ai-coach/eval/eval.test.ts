// ============================================================
// AI coach eval harness (intelligence upgrade Sprint 3, #8)
// ============================================================

import { runCoachEval, GOLDEN_COACH_CASES, type GoldenCase } from './eval';

describe('#8 coach eval harness', () => {
  it('passes every quality contract across the golden set', () => {
    const report = runCoachEval(GOLDEN_COACH_CASES);
    // Surface any failing case for a clear diff if this ever regresses.
    const failures = report.cases
      .filter((c) => !c.pass)
      .map((c) => `${c.name}: ${c.checks.filter((x) => !x.pass).map((x) => `${x.name}(${x.detail ?? ''})`).join(', ')}`);
    expect(failures).toEqual([]);
    expect(report.ok).toBe(true);
    expect(report.passed).toBe(report.total);
    expect(report.total).toBeGreaterThanOrEqual(6);
  });

  it('actually detects a regression (negative control)', () => {
    // A deliberately-wrong case: claims a fabricated measurement is "grounded".
    const broken: GoldenCase = {
      name: 'broken control',
      ctx: { active_sport: 'golf', user_question: 'why do I slice?', current_session_stats: { shot_count: 20, club_category: 'driver', avg_face_to_path: 6 } },
      expectTier: 'fast',
      groundedResponse: 'Your face-to-path is +40°.', // NOT in the data → grounding fails
    };
    const report = runCoachEval([broken]);
    expect(report.ok).toBe(false);
    expect(report.cases[0].checks.find((c) => c.name === 'grounded-ok')!.pass).toBe(false);
  });

  it('flags a tier-routing regression', () => {
    const wrongTier: GoldenCase = {
      name: 'wrong tier control',
      ctx: { active_sport: 'golf', user_question: 'why do I slice?', primary_diagnosis_confidence: 30 },
      expectTier: 'fast', // wrong — low confidence should route to balanced
    };
    const report = runCoachEval([wrongTier]);
    expect(report.cases[0].checks.find((c) => c.name === 'tier')!.pass).toBe(false);
  });
});
