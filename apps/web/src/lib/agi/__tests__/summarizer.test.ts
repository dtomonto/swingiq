// ============================================================
// SwingIQ — AGI: athlete summarizer tests
// ------------------------------------------------------------
// The narrative must be GROUNDED (no invented facts), lead with a
// readiness caution verbatim, end with a verbatim plan action, handle
// missing fields honestly, and the validator must reject hallucinations.
// ============================================================

import { buildAthleteSummary, validateAthleteNarrative, narrateAthleteSummary, athleteSummaryJson } from '../summarizer';
import type { AthleteGIResult } from '../types';

function result(overrides: Partial<AthleteGIResult> = {}): AthleteGIResult {
  const base = {
    model: {
      sports: ['golf', 'tennis'],
      primarySport: 'golf',
      readiness: { caution: null },
    },
    plan: {
      keystone: {
        capability: 'rotation',
        name: 'Rotation',
        why: 'your turn is leaking power before contact',
        sportsHelped: ['golf', 'tennis'],
        drills: [{ sport: 'golf', fix: 'turn your chest fully back, then let the hips lead down', drillId: 'rot1' }],
      },
      todayNote: 'keep it light — your readiness is building, so groove the move at half speed',
      retestReminder: 'Re-film the same angle in a week to check rotation.',
    },
    trust: { grade: 'B' },
    keystoneTranslations: [
      { sport: 'golf', sportLabel: 'Golf', text: 'fuller shoulder turn at the top' },
      { sport: 'tennis', sportLabel: 'Tennis', text: 'a complete unit turn before the forward swing' },
    ],
  };
  return { ...base, ...overrides } as unknown as AthleteGIResult;
}

describe('buildAthleteSummary', () => {
  it('opens with the keystone and why it spans sports, ends with the verbatim plan action', () => {
    const s = buildAthleteSummary(result());
    expect(s.source).toBe('local');
    expect(s.narrative).toContain('keystone');
    expect(s.narrative).toContain('Rotation');
    expect(s.narrative).toContain('your turn is leaking power before contact');
    // cross-sport framing names the athlete's sports (from translations)
    expect(s.narrative).toContain('Golf');
    expect(s.narrative).toContain('Tennis');
    // ends with the verbatim drill fix from the plan
    expect(s.narrative.trim().endsWith('turn your chest fully back, then let the hips lead down.')).toBe(true);
  });

  it('mentions today\'s recommended effort verbatim', () => {
    const s = buildAthleteSummary(result());
    expect(s.narrative).toContain('keep it light — your readiness is building, so groove the move at half speed');
  });

  it('leads with the readiness caution verbatim when present', () => {
    const s = buildAthleteSummary(result({
      model: { sports: ['golf', 'tennis'], primarySport: 'golf', readiness: { caution: 'You flagged shoulder discomfort — ease off and rest if it hurts.' } },
    } as Partial<AthleteGIResult>));
    expect(s.narrative.startsWith('You flagged shoulder discomfort — ease off and rest if it hurts.')).toBe(true);
  });

  it('quotes the trust grade exactly', () => {
    expect(buildAthleteSummary(result()).narrative).toContain('trust grade of B');
  });

  it('says "not yet measured" for a null keystone and null today note', () => {
    const s = buildAthleteSummary(result({
      plan: { keystone: null, todayNote: null, retestReminder: 'Re-film soon.' },
    } as Partial<AthleteGIResult>));
    expect(s.narrative).toContain('not yet measured');
    expect(s.narrative).toContain("Today's recommended effort is not yet measured");
    // still ends with a verbatim plan action (retest reminder fallback)
    expect(s.narrative.trim().endsWith('Re-film soon.')).toBe(true);
  });

  it('lands in a reasonable length band (~120 words)', () => {
    const words = buildAthleteSummary(result()).narrative.split(/\s+/).filter(Boolean).length;
    expect(words).toBeGreaterThan(50);
    expect(words).toBeLessThan(200);
  });

  it('exposes the exact { narrative } payload shape', () => {
    const json = athleteSummaryJson(result());
    expect(Object.keys(json)).toEqual(['narrative']);
    expect(typeof json.narrative).toBe('string');
  });
});

describe('validateAthleteNarrative', () => {
  it('accepts the grounded deterministic narrative', () => {
    const r = result();
    const { narrative } = buildAthleteSummary(r);
    expect(validateAthleteNarrative(narrative, r).ok).toBe(true);
  });

  it('rejects an invented number', () => {
    const r = result();
    const v = validateAthleteNarrative('You improved your rotation by 42% this month.', r);
    expect(v.ok).toBe(false);
    expect(v.violations.join(' ')).toContain('42');
  });

  it('rejects a sport outside the roster', () => {
    const r = result(); // golf + tennis only
    const v = validateAthleteNarrative('This will also help your baseball swing.', r);
    expect(v.ok).toBe(false);
    expect(v.violations.join(' ')).toContain('baseball');
  });

  it('rejects medical / guarantee language', () => {
    const r = result();
    expect(validateAthleteNarrative('This guarantees you avoid injury.', r).ok).toBe(false);
  });
});

describe('narrateAthleteSummary', () => {
  it('stays deterministic (source local) when the LLM enhancer is off', async () => {
    const s = await narrateAthleteSummary(result());
    expect(s.source).toBe('local');
    expect(s.narrative).toContain('Rotation');
  });
});
