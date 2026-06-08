import {
  ONBOARDING_ORDER,
  rankOfState,
  furthestState,
  isAtLeast,
  deriveOnboardingState,
  resolveOnboardingState,
  hasCompletedIdentity,
  isOnboardingComplete,
  nextOnboardingStep,
  type OnboardingSignals,
  type OnboardingStateId,
} from '../state';

const NONE: OnboardingSignals = {
  hasIdentity: false,
  hasSportSelected: false,
  hasBaseline: false,
  hasSession: false,
  isActive: false,
};

describe('onboarding ordering', () => {
  it('ranks states in canonical order', () => {
    expect(ONBOARDING_ORDER[0]).toBe('new_user');
    expect(ONBOARDING_ORDER[ONBOARDING_ORDER.length - 1]).toBe('active_user');
    for (let i = 1; i < ONBOARDING_ORDER.length; i++) {
      expect(rankOfState(ONBOARDING_ORDER[i]!)).toBeGreaterThan(rankOfState(ONBOARDING_ORDER[i - 1]!));
    }
  });

  it('furthestState returns the further-along of two', () => {
    expect(furthestState('new_user', 'sport_selected')).toBe('sport_selected');
    expect(furthestState('active_user', 'new_user')).toBe('active_user');
    expect(furthestState('baseline_started', 'baseline_started')).toBe('baseline_started');
  });

  it('isAtLeast compares correctly', () => {
    expect(isAtLeast('active_user', 'identity_completed')).toBe(true);
    expect(isAtLeast('new_user', 'identity_completed')).toBe(false);
    expect(isAtLeast('sport_selected', 'sport_selected')).toBe(true);
  });
});

describe('deriveOnboardingState', () => {
  it('new_user when there are no signals', () => {
    expect(deriveOnboardingState(NONE)).toBe('new_user');
  });

  it('walks up the ladder as signals turn on', () => {
    expect(deriveOnboardingState({ ...NONE, hasIdentity: true })).toBe('identity_completed');
    expect(deriveOnboardingState({ ...NONE, hasIdentity: true, hasSportSelected: true })).toBe(
      'sport_selected',
    );
    expect(
      deriveOnboardingState({ ...NONE, hasIdentity: true, hasSportSelected: true, hasBaseline: true }),
    ).toBe('baseline_started');
    expect(deriveOnboardingState({ ...NONE, hasSession: true })).toBe('first_session_imported');
    expect(deriveOnboardingState({ ...NONE, isActive: true })).toBe('active_user');
  });

  it('prefers the furthest implied state (isActive dominates)', () => {
    expect(
      deriveOnboardingState({
        hasIdentity: true,
        hasSportSelected: true,
        hasBaseline: true,
        hasSession: true,
        isActive: true,
      }),
    ).toBe('active_user');
  });
});

describe('resolveOnboardingState — never regress', () => {
  it('keeps the stored furthest even if data implies less', () => {
    // An active_user whose data momentarily looks empty must NOT regress.
    expect(resolveOnboardingState({ stored: 'active_user', signals: NONE })).toBe('active_user');
  });

  it('advances past the stored value when data implies more', () => {
    expect(
      resolveOnboardingState({ stored: 'identity_completed', signals: { ...NONE, hasSession: true } }),
    ).toBe('first_session_imported');
  });

  it('places a pre-existing user from data alone (no stored progress)', () => {
    // Backfill case: legacy user with sessions, stored still default.
    expect(resolveOnboardingState({ stored: 'new_user', signals: { ...NONE, isActive: true } })).toBe(
      'active_user',
    );
  });
});

describe('gating helpers', () => {
  it('hasCompletedIdentity once at/after identity_completed', () => {
    expect(hasCompletedIdentity('new_user')).toBe(false);
    expect(hasCompletedIdentity('identity_completed')).toBe(true);
    expect(hasCompletedIdentity('active_user')).toBe(true);
  });

  it('isOnboardingComplete once a session is imported', () => {
    expect(isOnboardingComplete('baseline_started')).toBe(false);
    expect(isOnboardingComplete('first_session_imported')).toBe(true);
    expect(isOnboardingComplete('active_user')).toBe(true);
  });
});

describe('nextOnboardingStep', () => {
  it('gives one concrete action for every pre-active state', () => {
    const states: OnboardingStateId[] = [
      'new_user',
      'identity_completed',
      'sport_selected',
      'baseline_started',
      'first_session_imported',
    ];
    for (const s of states) {
      const step = nextOnboardingStep(s);
      expect(step).not.toBeNull();
      expect(step!.href).toMatch(/^\//);
      expect(step!.cta.length).toBeGreaterThan(0);
      expect(step!.title.length).toBeGreaterThan(0);
    }
  });

  it('returns null for active_user (agent layer takes over)', () => {
    expect(nextOnboardingStep('active_user')).toBeNull();
  });

  it('tailors the baseline step to golf vs non-golf', () => {
    const golf = nextOnboardingStep('sport_selected', { isGolf: true });
    const tennis = nextOnboardingStep('sport_selected', { isGolf: false, sportLabel: 'Tennis' });
    expect(golf!.href).toBe('/equipment/golf');
    expect(tennis!.href).not.toBe('/equipment/golf');
  });
});
