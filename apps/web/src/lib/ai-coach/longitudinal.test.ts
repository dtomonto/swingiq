// ============================================================
// Longitudinal coach memory (intelligence upgrade Sprint 2, #5)
// ============================================================

import { buildCoachPrompt, buildLongitudinalContext, type CoachContext } from '../ai-coach-prompts';
import { cacheKey } from './response-cache';

const HISTORY = [
  { date: '2026-06-08', primary_issue: 'Open face / slice', swing_score: 62 },
  { date: '2026-06-01', primary_issue: 'Open face / slice', swing_score: 55 },
];

describe('#5 buildLongitudinalContext', () => {
  it('formats recent sessions newest-first with labels', () => {
    const block = buildLongitudinalContext(HISTORY);
    expect(block).toContain('[RECENT HISTORY');
    expect(block).toContain('Last session (2026-06-08)');
    expect(block).toContain('2 sessions ago (2026-06-01)');
    expect(block).toContain('score: 62');
  });

  it('returns empty string for no history', () => {
    expect(buildLongitudinalContext([])).toBe('');
  });
});

describe('#5 buildCoachPrompt longitudinal wiring', () => {
  const base: CoachContext = {
    active_sport: 'golf',
    user_question: 'why do I slice?',
    current_session_stats: { shot_count: 20, avg_face_to_path: 3 },
  };

  it('includes the recent-history block when history is supplied', () => {
    const { user } = buildCoachPrompt({ ...base, recent_history: HISTORY });
    expect(user).toContain('[RECENT HISTORY');
    expect(user).toContain('Last session');
    // History sits between the data context and the question.
    expect(user.indexOf('[END DATA CONTEXT]')).toBeLessThan(user.indexOf('[RECENT HISTORY'));
    expect(user.indexOf('[RECENT HISTORY')).toBeLessThan(user.search(/question:/i));
  });

  it('omits the history block when none is supplied', () => {
    const { user } = buildCoachPrompt(base);
    expect(user).not.toContain('[RECENT HISTORY');
  });
});

describe('#5/#6 cache key accounts for history', () => {
  const base: CoachContext = { active_sport: 'golf', user_question: 'why do I slice?' };
  it('produces a different cache key when the recent history differs', () => {
    expect(cacheKey({ ...base, recent_history: HISTORY })).not.toBe(cacheKey(base));
    expect(cacheKey({ ...base, recent_history: HISTORY })).toBe(cacheKey({ ...base, recent_history: HISTORY }));
  });
});
