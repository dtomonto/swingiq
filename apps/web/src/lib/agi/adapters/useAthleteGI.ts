'use client';

// ============================================================
// SwingVantage — AGI: combined React hook
// ------------------------------------------------------------
// The one-call integration point for the app. Reads every available local
// signal — Motion Lab sessions, launch-monitor sessions, saved video analyses,
// and the declared profile/goal — fuses them, and runs the full Athlete
// General Intelligence pipeline. Any surface can drop this in:
//
//   const gi = useAthleteGI();
//
// Browser-only data; returns an honest empty result during SSR.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { useMotionSessions } from '@/lib/motion-lab';
import { useSwingVantageStore } from '@/store';
import { runAthleteGI } from '../engine';
import { loadHistory, recordSnapshot } from '../history';
import type { AthleteGIResult } from '../types';
import { bundleFromMotionSessions } from './motion-lab';
import { bundleFromStore } from './store-sessions';
import { bundleFromDailyNotes } from './daily-notes';
import { identityFromStore } from './profile';
import { useReadinessSnapshot } from './readiness';
import { useProvenDrills } from './feedback';
import { mergeBundles } from './merge';

export function useAthleteGI(): AthleteGIResult {
  const motionSessions = useMotionSessions();
  const profile = useSwingVantageStore((s) => s.profile);
  const sportProfiles = useSwingVantageStore((s) => s.sportProfiles);
  const sessions = useSwingVantageStore((s) => s.sessions);
  const videos = useSwingVantageStore((s) => s.video_analyses);
  const dailyNotes = useSwingVantageStore((s) => s.dailyNotes);
  const readiness = useReadinessSnapshot();
  const provenDrills = useProvenDrills();
  // Read prior snapshots once on mount (excludes today, so progress is honest).
  const [history] = useState(loadHistory);

  const result = useMemo(() => {
    const identity = identityFromStore(profile, sportProfiles);
    const bundle = mergeBundles(
      [
        bundleFromMotionSessions(motionSessions),
        bundleFromStore(sessions, videos),
        bundleFromDailyNotes(dailyNotes),
      ],
      identity,
    );
    return runAthleteGI({ ...bundle, readiness, history, provenDrills });
  }, [motionSessions, profile, sportProfiles, sessions, videos, dailyNotes, readiness, history, provenDrills]);

  // Persist today's snapshot for next time (dedupes per day; no-op without data).
  useEffect(() => {
    recordSnapshot(result.model);
  }, [result]);

  return result;
}
