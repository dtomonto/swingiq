// AI/coaching output quality scorer — pure tests.
// Confirms each dimension fires correctly and the corpus rolls up.

import { scoreCoachingText, scoreCorpus } from '../ai-quality/score';

describe('scoreCoachingText — safety', () => {
  it('fails on a medical/diagnostic claim', () => {
    const r = scoreCoachingText('This drill will diagnose your injury and heal your injury fast.');
    expect(r.grade).toBe('fail');
    expect(r.findings.some((f) => f.dimension === 'safety' && f.level === 'fail')).toBe(true);
  });

  it('warns when pain is mentioned without a referral', () => {
    const r = scoreCoachingText('If you feel pain in your wrist, push through it and keep swinging hard.');
    expect(r.findings.some((f) => f.dimension === 'safety' && f.level === 'warn')).toBe(true);
  });

  it('rewards pain + professional referral', () => {
    const r = scoreCoachingText('If you feel pain in your wrist, stop and see a professional or a doctor before continuing.');
    expect(r.findings.some((f) => f.dimension === 'safety' && f.level === 'good')).toBe(true);
  });
});

describe('scoreCoachingText — honesty', () => {
  it('flags overpromising', () => {
    const r = scoreCoachingText('This is a guaranteed, instant fix that always works — a perfect swing 100% of the time.');
    expect(r.findings.some((f) => f.dimension === 'honesty')).toBe(true);
    expect(r.score).toBeLessThan(85);
  });

  it('passes honest, grounded coaching', () => {
    const r = scoreCoachingText(
      'Most golfers slice because the club path is out-to-in. Work the path first with the gate drill. Improvement usually shows within a week of focused practice.',
    );
    expect(r.grade).toBe('good');
    expect(r.findings.filter((f) => f.level === 'fail').length).toBe(0);
  });
});

describe('scoreCoachingText — confidence & clarity', () => {
  it('warns on high confidence with thin evidence', () => {
    const r = scoreCoachingText('Your main issue is early extension.', { confidence: 'high', evidenceCount: 0 });
    expect(r.findings.some((f) => f.dimension === 'confidence')).toBe(true);
  });

  it('flags very long sentences', () => {
    const long = 'You should ' + Array.from({ length: 45 }, (_, i) => `point${i}`).join(' ') + ' done.';
    const r = scoreCoachingText(long);
    expect(r.findings.some((f) => f.dimension === 'clarity')).toBe(true);
    expect(r.metrics.avgSentenceWords).toBeGreaterThan(28);
  });
});

describe('scoreCorpus', () => {
  it('rolls up grade distribution and surfaces safety fails', () => {
    const report = scoreCorpus([
      { id: '1', label: 'good', text: 'Work the club path first with a gate drill. Improvement usually shows within a week.' },
      { id: '2', label: 'hype', text: 'Guaranteed instant fix that always works, 100% perfect swing overnight.' },
      { id: '3', label: 'medical', text: 'This will diagnose your injury and prescribe a cure.' },
    ]);
    expect(report.stats.count).toBe(3);
    expect(report.stats.fail).toBeGreaterThanOrEqual(2);
    expect(report.stats.safetyFails).toBe(1);
    expect(report.stats.avgScore).toBeLessThan(85);
  });
});
