// ============================================================
// AI output grounding (intelligence upgrade Sprint 2, #2)
// ============================================================

import { validateGrounding, extractContextNumbers } from './grounding';
import type { CoachContext } from '../ai-coach-prompts';

const ctx = (stats: CoachContext['current_session_stats']): CoachContext => ({
  active_sport: 'golf',
  user_question: 'why do I slice?',
  current_session_stats: stats,
});

const DATA = ctx({
  shot_count: 20,
  avg_carry: 244.7,
  avg_face_to_path: 6.2,
  avg_club_path: -2.1,
  avg_ball_speed: 132,
  avg_spin_rate: 7100,
  avg_lateral_offline: 8.4,
});

describe('#2 extractContextNumbers', () => {
  it('collects stat values (and absolute variants for signed metrics)', () => {
    const nums = extractContextNumbers(DATA);
    expect(nums).toContain(6.2);
    expect(nums).toContain(244.7);
    expect(nums).toContain(8.4); // abs of lateral offline
  });
});

describe('#2 validateGrounding', () => {
  it('passes a response whose measurements trace to the data (within rounding)', () => {
    const r = validateGrounding(
      'Your face-to-path averaged +6.2°, and you carried 245 yards. Club path was -2°.',
      DATA,
    );
    expect(r.grounded).toBe(true);
    expect(r.referencedData).toBe(true);
    expect(r.ungroundedClaims).toHaveLength(0);
    expect(r.measurementClaims).toBe(3);
  });

  it('flags a fabricated measurement not present in the data', () => {
    const r = validateGrounding(
      'Your face-to-path is +12° and your ball speed is 150 mph.',
      DATA,
    );
    expect(r.grounded).toBe(false);
    expect(r.ungroundedClaims).toEqual(expect.arrayContaining(['+12°', '150 mph']));
  });

  it('ignores prescriptive (non-measurement) numbers', () => {
    const r = validateGrounding(
      'Hit 30 balls over 2 sessions, 15 minutes each, focusing on tempo.',
      DATA,
    );
    expect(r.grounded).toBe(true);
    expect(r.measurementClaims).toBe(0);
  });

  it('matches a signed metric phrased as an absolute miss ("8 yards right")', () => {
    const r = validateGrounding('Your average miss is about 8 yards right.', DATA);
    expect(r.grounded).toBe(true);
    expect(r.referencedData).toBe(true);
  });

  it('flags every measurement when there is no data context', () => {
    const r = validateGrounding('You carry 250 yards with +3° face-to-path.', ctx(undefined));
    expect(r.grounded).toBe(false);
    expect(r.measurementClaims).toBe(2);
    expect(r.ungroundedClaims).toHaveLength(2);
  });

  it('is grounded for a measurement-free response', () => {
    const r = validateGrounding('Focus on a square face at impact and a neutral grip.', DATA);
    expect(r.grounded).toBe(true);
    expect(r.referencedData).toBe(false);
    expect(r.measurementClaims).toBe(0);
  });
});
