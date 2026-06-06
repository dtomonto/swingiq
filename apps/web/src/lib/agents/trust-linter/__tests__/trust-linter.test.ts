// ============================================================
// SwingVantage — Agent: Trust / Honesty Linter — Unit Tests
// ============================================================

import { lintCopy, lintMany, hasBlockingIssues } from '../engine';

const ids = (text: string) => lintCopy(text).map((f) => f.ruleId);

describe('lintCopy — overclaims', () => {
  it('flags guarantees and hype as blocking/warnings', () => {
    const findings = lintCopy('Guaranteed to fix your slice instantly!');
    expect(ids('Guaranteed to fix your slice instantly!')).toEqual(
      expect.arrayContaining(['guarantee', 'instant']),
    );
    expect(hasBlockingIssues(findings)).toBe(true);
  });

  it('flags unprovable superlatives', () => {
    expect(ids('The best swing app, the only one you need.')).toEqual(
      expect.arrayContaining(['superlative']),
    );
  });
});

describe('lintCopy — context-gated medical rule', () => {
  it('does NOT flag swing "diagnosis"', () => {
    expect(lintCopy('Your swing diagnosis is ready in under a minute.')).toHaveLength(0);
  });

  it('flags treatment language in a health context', () => {
    const f = lintCopy('This will treat your knee pain and heal the injury.');
    expect(f.some((x) => x.category === 'medical')).toBe(true);
    expect(hasBlockingIssues(f)).toBe(true);
  });

  it('does NOT flag "treat" outside a health context', () => {
    expect(lintCopy('We treat every golfer’s data with care.')).toHaveLength(0);
  });
});

describe('lintCopy — privacy claims', () => {
  it('flags a misleading local-only data claim', () => {
    expect(ids('Your data never leaves your device.')).toContain('privacy-local-only');
  });

  it('keeps a TRUE video-privacy claim', () => {
    expect(lintCopy('Your video never leaves your device, and frames aren’t stored.')).toHaveLength(0);
  });
});

describe('lintCopy — measurement overclaims', () => {
  it('flags lab-grade claims', () => {
    expect(ids('Get lab-grade accuracy from your phone.')).toContain('lab-grade');
  });

  it('flags calling a single-camera estimate a measurement', () => {
    expect(ids('We measured your hip angle from the video.')).toContain('exact-measurement');
  });

  it('reserves "measured" for real sensor data', () => {
    expect(lintCopy('The launch monitor measured your ball speed.')).toHaveLength(0);
  });

  it('passes honest, confident copy clean', () => {
    expect(
      lintCopy(
        'SwingVantage gives you one clear thing to work on. Single-camera values are directional estimates, not lab measurements.',
      ),
    ).toHaveLength(0);
  });
});

describe('lintCopy — options', () => {
  it('respects minSeverity', () => {
    const f = lintCopy('It is pure magic and works instantly.', { minSeverity: 'warning' });
    const r = f.map((x) => x.ruleId);
    expect(r).toContain('instant'); // warning kept
    expect(r).not.toContain('magic'); // info dropped
  });

  it('respects ignored rules', () => {
    expect(lintCopy('Guaranteed results.', { ignore: ['guarantee'] })).toHaveLength(0);
  });
});

describe('lintMany — CI aggregation', () => {
  it('aggregates findings and flags blocking errors', () => {
    const report = lintMany({
      hero: 'Guaranteed results!',
      sub: 'Improve your swing one fix at a time.',
    });
    expect(report.totals.errors).toBe(1);
    expect(report.hasBlocking).toBe(true);
    expect(report.items).toHaveLength(1); // only the hero had a finding
    expect(report.items[0].id).toBe('hero');
  });

  it('passes a clean bundle with no blocking issues', () => {
    const report = lintMany([
      { id: 'a', text: 'Find your #1 priority.' }, // honest "#1 priority" — not flagged
      { id: 'b', text: 'Build a short practice plan.' },
    ]);
    expect(report.hasBlocking).toBe(false);
    expect(report.items).toHaveLength(0);
  });
});
