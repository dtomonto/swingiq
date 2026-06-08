'use client';

// ============================================================
// SwingVantage — Mental Performance: React hook
//
// Binds the pure store (./store) to React via useSyncExternalStore and derives
// the live, sport-aware suggestions: a recommended reset routine, the active
// training plan, and journal insights. Kept separate from store.ts so the
// pure store stays JSX/React-free and unit-testable.
// ============================================================

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useSport } from '@/contexts/SportContext';
import type {
  MentalState, MentalRoutine, MentalJournalInsights, PlanAssignment, MentalSport,
} from './types';
import { DEFAULT_MENTAL_STATE } from './constants';
import { routineForContext, getRoutinesForSport } from './routines';
import { generateJournalInsights } from './journal';
import {
  read, subscribe, setSettings, consent, setStoreLogs, setShareInsights, setProfile,
  saveLog, deleteLog, clearAllLogs, assignPlan, advancePlanDay, abandonPlan,
  exportMental, clearAllMentalData,
} from './store';

export interface UseMentalPerformance {
  state: MentalState;
  enabled: boolean;
  consented: boolean;
  storeLogs: boolean;
  shareInsights: boolean;
  activeSport: MentalSport;
  /** A sensible suggested reset for the active sport. */
  suggestedRoutine: MentalRoutine;
  /** All routines that serve the active sport. */
  sportRoutines: MentalRoutine[];
  /** The most recent active plan assignment, if any. */
  activePlan: PlanAssignment | null;
  insights: MentalJournalInsights;
  setSettings: typeof setSettings;
  consent: typeof consent;
  setStoreLogs: typeof setStoreLogs;
  setShareInsights: typeof setShareInsights;
  setProfile: typeof setProfile;
  saveLog: typeof saveLog;
  deleteLog: typeof deleteLog;
  clearAllLogs: typeof clearAllLogs;
  assignPlan: typeof assignPlan;
  advancePlanDay: typeof advancePlanDay;
  abandonPlan: typeof abandonPlan;
  exportMental: typeof exportMental;
  clearAllMentalData: typeof clearAllMentalData;
}

export function useMentalPerformance(): UseMentalPerformance {
  const state = useSyncExternalStore(subscribe, read, () => DEFAULT_MENTAL_STATE);
  const { activeSport } = useSport();

  const suggestedRoutine = useMemo(
    () => routineForContext(activeSport, state.settings.lastSituation ?? undefined),
    [activeSport, state.settings.lastSituation],
  );

  const sportRoutines = useMemo(() => getRoutinesForSport(activeSport), [activeSport]);

  const activePlan = useMemo<PlanAssignment | null>(
    () => state.planAssignments.find((a) => a.status === 'active') ?? null,
    [state.planAssignments],
  );

  const insights = useMemo(() => generateJournalInsights(state.logs), [state.logs]);

  return {
    state,
    enabled: state.settings.enabled,
    consented: !!state.settings.consentedAt,
    storeLogs: state.settings.storeLogs,
    shareInsights: state.settings.shareAnonymousInsights,
    activeSport,
    suggestedRoutine,
    sportRoutines,
    activePlan,
    insights,
    setSettings: useCallback(setSettings, []),
    consent: useCallback(consent, []),
    setStoreLogs: useCallback(setStoreLogs, []),
    setShareInsights: useCallback(setShareInsights, []),
    setProfile: useCallback(setProfile, []),
    saveLog: useCallback(saveLog, []),
    deleteLog: useCallback(deleteLog, []),
    clearAllLogs: useCallback(clearAllLogs, []),
    assignPlan: useCallback(assignPlan, []),
    advancePlanDay: useCallback(advancePlanDay, []),
    abandonPlan: useCallback(abandonPlan, []),
    exportMental: useCallback(exportMental, []),
    clearAllMentalData: useCallback(clearAllMentalData, []),
  };
}
