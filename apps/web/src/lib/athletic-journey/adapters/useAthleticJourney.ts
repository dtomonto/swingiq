'use client';

// ============================================================
// SwingVantage — Athletic Journey: combined React hook
// ------------------------------------------------------------
// The one-call integration point. Reads the main app store
// (read-only) and the journey-local store, assembles the signal
// bundle, runs the engine, and records a daily history snapshot.
// Returns null for sports whose journey isn't live yet (the UI
// shows the in-development card for those).
// ============================================================

import { useEffect, useMemo } from 'react';
import type { SportId } from '@swingiq/core';
import { useSwingVantageStore } from '@/store';
import type { JourneyDashboard } from '../types';
import { buildJourneyDashboard } from '../engine';
import { isJourneyLive } from '../config';
import { buildSignalsFromStore } from './from-store';
import {
  useJourneyStoreData,
  recordSnapshot,
} from '../store';

export function useAthleticJourney(sport: SportId): JourneyDashboard | null {
  const golfProfile = useSwingVantageStore((s) => s.profile);
  const sportProfiles = useSwingVantageStore((s) => s.sportProfiles);
  const sessions = useSwingVantageStore((s) => s.sessions);
  const videos = useSwingVantageStore((s) => s.video_analyses);
  const dailyNotes = useSwingVantageStore((s) => s.dailyNotes);
  const training = useSwingVantageStore((s) => s.training);

  const journey = useJourneyStoreData();
  // Depend only on the slices the dashboard is actually built from — NOT the
  // whole `journey` object. recordSnapshot (below) writes to journey.history,
  // which produces a new top-level store reference but leaves these slices
  // referentially stable (write() spreads the rest). Memoizing on the whole
  // object would recompute `dashboard` on every history write, re-firing the
  // snapshot effect → infinite render loop (React #185).
  const { ratings, selfAssessments, profileExtras, completedMilestones } = journey;

  const live = isJourneyLive(sport);

  const dashboard = useMemo<JourneyDashboard | null>(() => {
    if (!live) return null;
    const signals = buildSignalsFromStore({
      sport,
      golfProfile,
      sportProfiles,
      sessions,
      videos,
      dailyNotes,
      training,
      ratings,
      selfAssessments: selfAssessments[sport] ?? [],
      profileExtra: profileExtras[sport] ?? {},
    });
    const completedMilestoneIds = new Set(completedMilestones[sport] ?? []);
    return buildJourneyDashboard(signals, { completedMilestoneIds });
  }, [
    live, sport, golfProfile, sportProfiles, sessions, videos, dailyNotes, training,
    ratings, selfAssessments, profileExtras, completedMilestones,
  ]);

  // Persist today's snapshot for the history timeline (dedupes per day).
  useEffect(() => {
    if (!dashboard) return;
    recordSnapshot(sport, {
      date: new Date().toISOString().slice(0, 10),
      stageCode: dashboard.currentStage.code,
      stageOrder: dashboard.stageOrderEstimate,
      momentum: dashboard.momentum.score,
      confidence: dashboard.confidence,
    });
  }, [dashboard, sport]);

  return dashboard;
}
