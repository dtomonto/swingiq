// ============================================================
// SwingIQ — AGI: golden-athlete evaluation (CI gate)
// ------------------------------------------------------------
// Runs the engine against hand-labeled athletes and asserts the headline
// conclusions are correct. Run via `npm run eval:agi` or as part of the suite.
// A failure here means a rule change degraded output QUALITY, not just mechanics.
// ============================================================

import { EVAL_CASES, runEvalCase } from './harness';

describe('AGI golden-athlete evaluation', () => {
  it.each(EVAL_CASES.map((c) => [c.id, c] as const))('%s', (_id, c) => {
    const result = runEvalCase(c);
    if (!result.pass) {
      throw new Error(`Eval "${c.id}" failed (${c.description}):\n  - ${result.failures.join('\n  - ')}`);
    }
    expect(result.pass).toBe(true);
  });
});
