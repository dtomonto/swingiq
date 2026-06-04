'use client';

// ============================================================
// SwingIQ — AGI: combined React hook
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

import { useMemo } from 'react';
import { useMotionSessions } from '@/lib/motion-lab';
import { useSwingIQStore } from '@/store';
import { runAthleteGI } from '../engine';
import type { AthleteGIResult } from '../types';
import { bundleFromMotionSessions } from './motion-lab';
import { bundleFromStore } from './store-sessions';
import { identityFromStore } from './profile';
import { mergeBundles } from './merge';

export function useAthleteGI(): AthleteGIResult {
  const motionSessions = useMotionSessions();
  const profile = useSwingIQStore((s) => s.profile);
  const sportProfiles = useSwingIQStore((s) => s.sportProfiles);
  const sessions = useSwingIQStore((s) => s.sessions);
  const videos = useSwingIQStore((s) => s.video_analyses);

  return useMemo(() => {
    const identity = identityFromStore(profile, sportProfiles);
    const bundle = mergeBundles(
      [bundleFromMotionSessions(motionSessions), bundleFromStore(sessions, videos)],
      identity,
    );
    return runAthleteGI(bundle);
  }, [motionSessions, profile, sportProfiles, sessions, videos]);
}
