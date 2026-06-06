// ============================================================
// SwingVantage — Daily Notes: Unit Tests
// ------------------------------------------------------------
// Verifies the free-text → fault extractor is useful on everyday
// language, stays sport-scoped, never fabricates on empty/neutral
// input, and that the feel→score mapping is honest and monotonic.
// ============================================================

import {
  extractFaultsFromText,
  feelToScore,
  summarizeNote,
  FEEL_LABELS,
  todayISODate,
  type DailyNote,
  type PlayFeel,
} from '..';

describe('daily notes — fault extraction', () => {
  it('picks up casual golf language', () => {
    const faults = extractFaultsFromText('Sliced it off the tee all day and topped a couple', 'golf');
    const ids = faults.map((f) => f.id);
    expect(ids).toContain('slice_tendency');
    expect(ids).toContain('thin_contact');
  });

  it('returns nothing for empty or neutral text', () => {
    expect(extractFaultsFromText('', 'golf')).toEqual([]);
    expect(extractFaultsFromText('   ', 'golf')).toEqual([]);
    expect(extractFaultsFromText('Felt great, best day in ages', 'golf')).toEqual([]);
  });

  it('is sport-scoped — golf terms do not fire for tennis', () => {
    const faults = extractFaultsFromText('shanked a few and chunked it', 'tennis');
    expect(faults.map((f) => f.id)).not.toContain('shank');
  });

  it('detects tennis-specific language', () => {
    const faults = extractFaultsFromText('double faulted twice and was late on the backhand', 'tennis');
    const ids = faults.map((f) => f.id);
    expect(ids).toContain('serve_toss_inconsistency');
    expect(ids).toContain('late_contact');
  });

  it('detects bat-sport language', () => {
    const faults = extractFaultsFromText('kept rolling over and popped up twice', 'baseball');
    const ids = faults.map((f) => f.id);
    expect(ids).toContain('rolled_over');
    expect(ids).toContain('pop_up');
  });

  it('catches cross-sport tempo/consistency notes for any sport', () => {
    const golf = extractFaultsFromText('felt rushed and inconsistent', 'golf');
    const soft = extractFaultsFromText('felt rushed and inconsistent', 'softball_fast');
    expect(golf.map((f) => f.id)).toEqual(expect.arrayContaining(['tempo_off', 'inconsistent']));
    expect(soft.map((f) => f.id)).toEqual(expect.arrayContaining(['tempo_off', 'inconsistent']));
  });

  it('flags curated matches so retests can light up', () => {
    const faults = extractFaultsFromText('came over the top and stood up through impact', 'golf');
    const otp = faults.find((f) => f.id === 'over_the_top');
    expect(otp).toBeDefined();
  });

  it('caps the number of detected faults and sorts by confidence', () => {
    const faults = extractFaultsFromText(
      'sliced hooked pulled pushed topped fat shanked chunked rushed inconsistent',
      'golf',
    );
    expect(faults.length).toBeLessThanOrEqual(6);
    for (let i = 1; i < faults.length; i++) {
      expect(faults[i - 1].confidence).toBeGreaterThanOrEqual(faults[i].confidence);
    }
  });

  it('every extracted fault carries 0–1 confidence and a label', () => {
    const faults = extractFaultsFromText('sliced it', 'golf');
    for (const f of faults) {
      expect(f.label.length).toBeGreaterThan(0);
      expect(f.confidence).toBeGreaterThan(0);
      expect(f.confidence).toBeLessThanOrEqual(1);
      expect(typeof f.curated).toBe('boolean');
    }
  });
});

describe('daily notes — feel scoring', () => {
  it('maps feel to an honest, monotonic 0–100 score', () => {
    const feels: PlayFeel[] = [1, 2, 3, 4, 5];
    const scores = feels.map(feelToScore);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThan(scores[i - 1]);
    }
    expect(Math.min(...scores)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...scores)).toBeLessThanOrEqual(100);
  });
});

describe('daily notes — helpers', () => {
  it('todayISODate returns a YYYY-MM-DD string', () => {
    expect(todayISODate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('summarizes a note with feel + faults', () => {
    const note: DailyNote = {
      id: 'n1',
      date: todayISODate(),
      sport: 'golf',
      feel: 2,
      text: 'sliced it',
      faults: [{ id: 'slice_tendency', label: 'Slice tendency', confidence: 0.6, curated: false }],
      context: '',
      created_at: new Date().toISOString(),
    };
    const summary = summarizeNote(note);
    expect(summary).toContain(FEEL_LABELS[2]);
    expect(summary).toContain('Slice tendency');
  });
});
