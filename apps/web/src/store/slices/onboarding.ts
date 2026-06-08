import type { SwingVantageSlice, SwingVantageStore } from '../types';
import { DEFAULT_ONBOARDING } from '../types';
import { furthestState, isOnboardingComplete } from '@/lib/onboarding/state';

/**
 * Durable onboarding progress. The persisted `furthest` value is monotonic —
 * `advanceOnboarding` only ever moves it forward (via furthestState), which is
 * what guarantees a returning athlete is never demoted to an earlier step.
 * `resetOnboarding` is the deliberate escape hatch (admin / "start fresh").
 */
export const createOnboardingSlice: SwingVantageSlice<
  Pick<
    SwingVantageStore,
    'onboarding' | 'advanceOnboarding' | 'setOnboardingRole' | 'resetOnboarding'
  >
> = (set) => ({
  onboarding: DEFAULT_ONBOARDING,

  advanceOnboarding: (state) =>
    set((s) => {
      const furthest = furthestState(s.onboarding.furthest, state);
      const completedAt =
        s.onboarding.completedAt ??
        (isOnboardingComplete(furthest) ? new Date().toISOString() : null);
      // No-op guard: don't churn the persisted object if nothing changed.
      if (furthest === s.onboarding.furthest && completedAt === s.onboarding.completedAt) {
        return s;
      }
      return { onboarding: { ...s.onboarding, furthest, completedAt } };
    }),

  setOnboardingRole: (role) =>
    set((s) => (s.onboarding.role === role ? s : { onboarding: { ...s.onboarding, role } })),

  resetOnboarding: () => set({ onboarding: DEFAULT_ONBOARDING }),
});
