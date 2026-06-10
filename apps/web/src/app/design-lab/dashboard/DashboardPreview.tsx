'use client';

// Dev-only seeded mount of the REAL golf DashboardContent, so the auth-gated
// dashboard (and its glowing Overall score) can be reviewed without a Supabase
// session. It seeds the Zustand store with a small demo profile + scored
// sessions, mirrors the (app) layout's provider stack (DashboardContent and its
// panels expect them — useAutoSync throws otherwise), and RESTORES the prior
// store on unmount so it never clobbers real local data.

import { useEffect, useState } from 'react';
import type { GolferProfileInput } from '@swingiq/core';
import { useSwingVantageStore, type LocalSession } from '@/store';
import { DashboardContent } from '@/app/(app)/dashboard/DashboardContent';
import { BackgroundTasksProvider } from '@/lib/background-tasks/background-tasks-provider';
import { AutoSyncProvider } from '@/lib/backup/autosync/auto-sync-provider';
import { RelationalSyncProvider } from '@/lib/db';
import { NudgeProvider } from '@/lib/floating/nudge-manager';

const DEMO_PROFILE: GolferProfileInput = {
  name: 'Demo Player',
  handedness: 'right',
  handicap: 12,
  scoring_average: 88,
  low_round: 79,
  primary_goal: 'Break 85 consistently',
  current_miss: 'Slice with the driver',
  desired_shot_shape: 'draw',
  practice_frequency: 'weekly',
  practice_environment: 'range',
  launch_monitor_owned: 'rapsodo',
  home_simulator: false,
  indoor_outdoor: 'outdoor',
  ball_used: 'Pro V1',
  mat_or_grass: 'grass',
  skill_level: 'intermediate',
  coaching_style: 'balanced',
  data_sophistication: 'intermediate',
  injury_notes: '',
};

function demoSessions(): LocalSession[] {
  const now = Date.now();
  const day = 86_400_000;
  return [86, 81, 79].map((score, i) => ({
    id: `demo-session-${i}`,
    name: `Range Session ${3 - i}`,
    date: new Date(now - i * day).toISOString().slice(0, 10),
    sport: 'golf',
    club_name: '7 Iron',
    club_category: 'iron',
    launch_monitor: 'Manual',
    indoor_outdoor: 'outdoor',
    mat_or_grass: 'grass',
    notes: '',
    shot_count: 12,
    shots: [],
    diagnoses: [],
    swing_score: score,
    created_at: new Date(now - i * day).toISOString(),
  }));
}

export function DashboardPreview() {
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    const store = useSwingVantageStore;
    // Snapshot the slices we touch so we can restore real local data on exit.
    const prev = store.getState();
    const snapshot = {
      profile: prev.profile,
      sessions: prev.sessions,
      clubs: prev.clubs,
      setup_step: prev.setup_step,
    };
    store.setState({
      profile: DEMO_PROFILE,
      sessions: demoSessions(),
      // Mark onboarding complete so the activation nudges self-hide and the
      // established-user dashboard shows.
      setup_step: 'complete',
    });
    // Gate DashboardContent until after the seed so it never renders the empty
    // state for a frame — the setState-in-effect is the intended one-shot seed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeeded(true);
    return () => {
      store.setState(snapshot);
    };
  }, []);

  if (!seeded) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Seeding demo data…</div>;
  }

  return (
    <BackgroundTasksProvider>
      <RelationalSyncProvider>
        <AutoSyncProvider>
          <NudgeProvider>
            <div className="mx-auto max-w-5xl px-4 py-6">
              <DashboardContent />
            </div>
          </NudgeProvider>
        </AutoSyncProvider>
      </RelationalSyncProvider>
    </BackgroundTasksProvider>
  );
}
