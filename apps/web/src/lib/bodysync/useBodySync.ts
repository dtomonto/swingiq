'use client';

// ============================================================
// SwingVantage — BodySync: React hook
//
// Binds the pure store (./store) to React via useSyncExternalStore, and
// derives the live readiness assessment, coaching recommendation, and
// insights for the active sport. Kept separate from store.ts so the pure
// store stays JSX/React-free and unit-testable.
// ============================================================

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useSport } from '@/contexts/SportContext';
import type {
  BodySyncState, ManualCheckin, ReadinessAssessment, CoachingRecommendation, HealthInsight,
} from './types';
import { DEFAULT_BODYSYNC_STATE } from './constants';
import { assessReadiness } from './scoring';
import { buildRecommendation } from './coaching';
import { generateInsights, type PerformancePoint } from './insights';
import {
  read, subscribe, todayKey, saveCheckin, deleteCheckin, setPermissions,
  setSettings, consent, setBaselines, upsertConnection, disconnectProvider,
  clearAllHealthData, exportBodySync, samplesFromSummaries,
} from './store';

export interface UseBodySync {
  state: BodySyncState;
  enabled: boolean;
  consented: boolean;
  today: ManualCheckin | null;
  history: ManualCheckin[];
  assessment: ReadinessAssessment | null;
  recommendation: CoachingRecommendation | null;
  insights: HealthInsight[];
  saveCheckin: typeof saveCheckin;
  deleteCheckin: typeof deleteCheckin;
  setPermissions: typeof setPermissions;
  setSettings: typeof setSettings;
  consent: typeof consent;
  setBaselines: typeof setBaselines;
  upsertConnection: typeof upsertConnection;
  disconnectProvider: typeof disconnectProvider;
  clearAllHealthData: typeof clearAllHealthData;
  exportBodySync: typeof exportBodySync;
}

export function useBodySync(performance: PerformancePoint[] = []): UseBodySync {
  const state = useSyncExternalStore(subscribe, read, () => DEFAULT_BODYSYNC_STATE);
  const { activeSport } = useSport();

  const today = useMemo(
    () => state.checkins.find((c) => c.date === todayKey()) ?? null,
    [state.checkins],
  );
  const history = useMemo(
    () => state.checkins.filter((c) => c.date !== todayKey()),
    [state.checkins],
  );

  const samples = useMemo(() => samplesFromSummaries(state.summaries), [state.summaries]);

  const assessment = useMemo<ReadinessAssessment | null>(() => {
    if (!state.settings.enabled) return null;
    if (!today && history.length === 0 && samples.length === 0) return null;
    return assessReadiness({ today, history, samples, baselines: state.baselines }, todayKey());
  }, [state.settings.enabled, today, history, samples, state.baselines]);

  const recommendation = useMemo<CoachingRecommendation | null>(
    () => (assessment ? buildRecommendation(assessment, activeSport, today) : null),
    [assessment, activeSport, today],
  );

  const insights = useMemo<HealthInsight[]>(
    () => (state.settings.enabled ? generateInsights(state.checkins, performance) : []),
    [state.settings.enabled, state.checkins, performance],
  );

  return {
    state,
    enabled: state.settings.enabled,
    consented: !!state.settings.consentedAt,
    today,
    history,
    assessment,
    recommendation,
    insights,
    saveCheckin: useCallback(saveCheckin, []),
    deleteCheckin: useCallback(deleteCheckin, []),
    setPermissions: useCallback(setPermissions, []),
    setSettings: useCallback(setSettings, []),
    consent: useCallback(consent, []),
    setBaselines: useCallback(setBaselines, []),
    upsertConnection: useCallback(upsertConnection, []),
    disconnectProvider: useCallback(disconnectProvider, []),
    clearAllHealthData: useCallback(clearAllHealthData, []),
    exportBodySync: useCallback(exportBodySync, []),
  };
}
