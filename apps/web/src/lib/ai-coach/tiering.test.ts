// ============================================================
// Coach model tiering (intelligence upgrade Sprint 3, #4)
// ============================================================

import { selectCoachTier } from './tiering';
import type { CoachContext } from '../ai-coach-prompts';

const ctx = (over: Partial<CoachContext>): CoachContext => ({
  active_sport: 'golf',
  user_question: 'why do I slice?',
  ...over,
});

describe('#4 selectCoachTier', () => {
  it('keeps routine, high-confidence questions on the fast tier', () => {
    expect(selectCoachTier(ctx({ primary_diagnosis_confidence: 85 }))).toBe('fast');
    expect(selectCoachTier(ctx({}))).toBe('fast');
  });

  it('escalates a low-confidence diagnosis to balanced', () => {
    expect(selectCoachTier(ctx({ primary_diagnosis_confidence: 40 }))).toBe('balanced');
  });

  it('escalates a low-confidence video read to balanced', () => {
    expect(selectCoachTier(ctx({ primary_video_issue_confidence: 0.3 }))).toBe('balanced');
  });

  it('escalates long / multi-part questions', () => {
    expect(selectCoachTier(ctx({ user_question: 'a'.repeat(220) }))).toBe('balanced');
    expect(selectCoachTier(ctx({ user_question: 'why do I slice? and how do I fix it?' }))).toBe('balanced');
  });

  it('does not escalate a normal single question with good confidence', () => {
    expect(selectCoachTier(ctx({ user_question: 'how do I fix my grip?', primary_diagnosis_confidence: 80 }))).toBe('fast');
  });
});
