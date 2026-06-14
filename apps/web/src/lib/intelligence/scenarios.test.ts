// ============================================================
// Deterministic Evaluation Lab — golden scenarios (brief §16)
// ------------------------------------------------------------
// Runs every golden scenario through the engine and asserts its expected
// diagnosis family, confidence band, urgency, and escalation behaviour. The
// scenario DATA lives in ./golden-scenarios so the admin lab reuses it.
// ============================================================

import { runDeterministicScenarioTest } from './diagnose';
import { GOLDEN_SCENARIOS } from './golden-scenarios';

describe('Deterministic evaluation lab — golden scenarios', () => {
  it.each(GOLDEN_SCENARIOS.map((s) => [s.name, s] as const))('%s', (_name, scenario) => {
    const res = runDeterministicScenarioTest(scenario);
    if (!res.pass) {
      throw new Error(`${scenario.name} failed:\n  - ${res.failures.join('\n  - ')}`);
    }
    expect(res.pass).toBe(true);
  });

  it('every sport is represented by at least one golden scenario', () => {
    const sports = new Set(GOLDEN_SCENARIOS.map((s) => s.input.sport));
    for (const s of ['golf', 'baseball', 'softball_slow', 'softball_fast', 'tennis', 'pickleball', 'padel']) {
      expect(sports.has(s as never)).toBe(true);
    }
  });
});
