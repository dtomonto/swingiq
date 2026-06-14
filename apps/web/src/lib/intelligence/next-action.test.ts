// ============================================================
// Deterministic diagnosis → next-action adapter tests
// ============================================================

import { diagnosisToActionCandidate } from './next-action';
import { analyzeDeterministicSession } from './diagnose';
import { rankNextActions } from '@/lib/next-action/rank';

describe('diagnosisToActionCandidate', () => {
  it('maps a diagnosis into a valid, ranker-ready candidate', () => {
    const d = analyzeDeterministicSession({ sport: 'golf', issue: 'fat', skillLevel: 'intermediate' });
    const c = diagnosisToActionCandidate(d);
    expect(c.id).toBe('deterministic::golf::fat_contact');
    expect(c.source).toBe('priority');
    expect(c.title).toContain('Fat');
    expect(c.severity).toBeGreaterThan(0);
    expect(c.severity).toBeLessThanOrEqual(1);
    expect(c.confidence).toBeGreaterThan(0);
    expect(c.confidence).toBeLessThanOrEqual(1);
    expect(c.href).toBe('/diagnose');
  });

  it('a critical, urgent fault outranks a minor one', () => {
    const critical = diagnosisToActionCandidate(
      analyzeDeterministicSession({ sport: 'golf', issue: 'shank', priorFailedAttempts: 2 }),
    );
    const minor = diagnosisToActionCandidate(
      analyzeDeterministicSession({ sport: 'golf', issue: 'low_launch' }),
    );
    expect(critical.severity).toBeGreaterThan(minor.severity);
  });

  it('feeds the unified ranker and can be the primary next action', () => {
    const d = analyzeDeterministicSession({ sport: 'golf', issue: 'slice' });
    const feed = rankNextActions([
      diagnosisToActionCandidate(d),
      { id: 'funnel::x', source: 'funnel', title: 'Upload a video', severity: 0.3, confidence: 0.5 },
    ]);
    expect(feed.primary?.id).toBe('deterministic::golf::slice');
  });

  it('surfaces the escalation reason in detail when escalation is recommended', () => {
    const d = analyzeDeterministicSession({ sport: 'golf', issue: 'slice', symptoms: ['hook'] });
    expect(d.escalateToAI).toBe(true);
    const c = diagnosisToActionCandidate(d);
    expect(c.detail).toBeTruthy();
  });
});
