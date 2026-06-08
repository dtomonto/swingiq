// Pure-logic tests for the bottom nudge winner-selection. The React
// provider/hook are thin wrappers around resolveActiveNudge; this guards
// the one-at-a-time guarantee that fixes the stacked-banner bug.

import { resolveActiveNudge, NUDGE_PRIORITY, type NudgeEntry } from '../nudge-priority';

describe('resolveActiveNudge', () => {
  it('returns null when nothing is registered', () => {
    expect(resolveActiveNudge([])).toBeNull();
  });

  it('returns the only entry', () => {
    expect(resolveActiveNudge([{ id: 'a', priority: 10 }])).toBe('a');
  });

  it('picks the highest priority among many', () => {
    const entries: NudgeEntry[] = [
      { id: 'tutorial', priority: NUDGE_PRIORITY.tutorialWelcome },
      { id: 'continue', priority: NUDGE_PRIORITY.continueProgress },
      { id: 'save', priority: NUDGE_PRIORITY.saveProgress },
    ];
    expect(resolveActiveNudge(entries)).toBe('continue');
  });

  it('resolves ties to the first registered (stable)', () => {
    expect(
      resolveActiveNudge([
        { id: 'first', priority: 20 },
        { id: 'second', priority: 20 },
      ]),
    ).toBe('first');
  });

  it('only ever names ONE winner (the core anti-overlap guarantee)', () => {
    const entries: NudgeEntry[] = [
      { id: 'continue', priority: NUDGE_PRIORITY.continueProgress },
      { id: 'save', priority: NUDGE_PRIORITY.saveProgress },
    ];
    const winner = resolveActiveNudge(entries);
    const losers = entries.filter((e) => e.id !== winner);
    expect(losers).toHaveLength(1);
    expect(losers[0]!.id).toBe('save'); // lower priority never shows alongside
  });

  it('has the documented priority ordering (continue > save > tutorial)', () => {
    expect(NUDGE_PRIORITY.continueProgress).toBeGreaterThan(NUDGE_PRIORITY.saveProgress);
    expect(NUDGE_PRIORITY.saveProgress).toBeGreaterThan(NUDGE_PRIORITY.tutorialWelcome);
  });
});
