'use client';

// ============================================================
// SwingVantage — TeamOS: React hook
// ============================================================

import { useMemo, useSyncExternalStore } from 'react';
import * as store from './store';
import { buildTeamPulse } from './engine';
import type { TeamPulse, TeamState } from './types';

export interface UseTeam {
  state: TeamState;
  pulse: TeamPulse;
  addAthlete: typeof store.addAthlete;
  updateAthlete: typeof store.updateAthlete;
  setScore: typeof store.setScore;
  removeAthlete: typeof store.removeAthlete;
}

export function useTeam(): UseTeam {
  const state = useSyncExternalStore(store.subscribe, store.read, store.read);
  const pulse = useMemo(() => buildTeamPulse(state.athletes), [state.athletes]);
  return {
    state,
    pulse,
    addAthlete: store.addAthlete,
    updateAthlete: store.updateAthlete,
    setScore: store.setScore,
    removeAthlete: store.removeAthlete,
  };
}
