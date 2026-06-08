'use client';

// ============================================================
// SwingVantage — useOnboarding()
// ------------------------------------------------------------
// The React entry point to the onboarding state machine. It:
//   • reads the real store data and the persisted "furthest" marker;
//   • resolves the LIVE state as the furthest of the two (never regress);
//   • auto-advances + persists the marker when data implies more progress
//     (so the next render / next device starts from the right place);
//   • hands callers the single next action and simple gating helpers.
//
// Use this — not ad-hoc checks — to decide whether to show identity /
// setup prompts, so a returning athlete is never re-asked who they are.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { useSwingVantageStore } from '@/store';
import { useSport } from '@/contexts/SportContext';
import {
  resolveOnboardingState,
  nextOnboardingStep,
  hasCompletedIdentity,
  isOnboardingComplete,
  type OnboardingSignals,
  type OnboardingStateId,
  type OnboardingRole,
} from './state';

export interface UseOnboarding {
  /** True once the persisted store has hydrated on the client. */
  ready: boolean;
  /** Live onboarding state (furthest of persisted + data-derived). */
  state: OnboardingStateId;
  /** Who the athlete said they are, if asked. */
  role: OnboardingRole | null;
  /** They've answered "who are you?" — stop re-asking identity. */
  hasIdentity: boolean;
  /** Guided setup is done (a real session is in). */
  isComplete: boolean;
  /** The single next action, or null once active. */
  nextStep: ReturnType<typeof nextOnboardingStep>;
  /** Force-advance the durable marker (it only ever moves forward). */
  advance: (state: OnboardingStateId) => void;
  /** Record the athlete's role and mark identity complete. */
  setRole: (role: OnboardingRole) => void;
  /** Deliberate reset ("start fresh" / admin). */
  reset: () => void;
}

export function useOnboarding(): UseOnboarding {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const profile = useSwingVantageStore((s) => s.profile);
  const sportProfiles = useSwingVantageStore((s) => s.sportProfiles);
  const clubs = useSwingVantageStore((s) => s.clubs);
  const sessions = useSwingVantageStore((s) => s.sessions);
  const videoAnalyses = useSwingVantageStore((s) => s.video_analyses);
  const trainingStarted = useSwingVantageStore((s) => s.training.started_at);
  const usageCategory = useSwingVantageStore((s) => s.settings.usage_category);
  const onboarding = useSwingVantageStore((s) => s.onboarding);
  const advance = useSwingVantageStore((s) => s.advanceOnboarding);
  const setOnboardingRole = useSwingVantageStore((s) => s.setOnboardingRole);
  const reset = useSwingVantageStore((s) => s.resetOnboarding);

  const { isGolf, activeSport } = useSport();

  const signals = useMemo<OnboardingSignals>(() => {
    const hasSportProfile = Object.keys(sportProfiles ?? {}).length > 0;
    return {
      hasIdentity: usageCategory != null || onboarding.role != null || !!profile || hasSportProfile,
      hasSportSelected: !!profile || hasSportProfile,
      hasBaseline: clubs.length > 0 || hasSportProfile,
      hasSession: sessions.length > 0 || videoAnalyses.length > 0,
      isActive:
        sessions.some((s) => s.diagnoses.length > 0) ||
        videoAnalyses.some((v) => !!v.primary_issue) ||
        !!trainingStarted,
    };
  }, [
    profile,
    sportProfiles,
    clubs.length,
    sessions,
    videoAnalyses,
    trainingStarted,
    usageCategory,
    onboarding.role,
  ]);

  const state = useMemo(
    () => resolveOnboardingState({ stored: onboarding.furthest, signals }),
    [onboarding.furthest, signals],
  );

  // Persist forward progress so the marker stays the source of truth on the
  // next render and on other devices. advanceOnboarding no-ops when equal.
  useEffect(() => {
    if (ready && state !== onboarding.furthest) advance(state);
  }, [ready, state, onboarding.furthest, advance]);

  const sportLabel = activeSport ? activeSport.replace(/_/g, ' ') : undefined;
  const nextStep = useMemo(
    () => nextOnboardingStep(state, { isGolf, sportLabel }),
    [state, isGolf, sportLabel],
  );

  return {
    ready,
    state,
    role: onboarding.role,
    hasIdentity: hasCompletedIdentity(state),
    isComplete: isOnboardingComplete(state),
    nextStep,
    advance,
    setRole: (role: OnboardingRole) => {
      setOnboardingRole(role);
      advance('identity_completed');
    },
    reset,
  };
}
