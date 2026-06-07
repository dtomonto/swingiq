// ============================================================
// SwingVantage — TeamOS: self-contained local-first store
//
// Own localStorage key (swingiq-team-v1). Never touches the main Zustand
// store. SSR-safe, never throws. React hook lives in ./useTeam.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { CapabilityScores, TeamAthlete, TeamState } from './types';

export const TEAM_KEY = 'swingiq-team-v1';
const KEY = TEAM_KEY;
const EVENT = 'swingvantage:team-change';

const hasWindow = () => typeof window !== 'undefined';
const newId = () => `ath_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

const DEFAULT_STATE: TeamState = { version: 1, athletes: [] };

let cache: { raw: string | null; value: TeamState } | null = null;

export function read(): TeamState {
  if (!hasWindow()) return DEFAULT_STATE;
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(KEY); } catch { /* private mode */ }
  if (cache && cache.raw === raw) return cache.value;

  let value: TeamState = DEFAULT_STATE;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<TeamState>;
      value = { version: 1, athletes: Array.isArray(parsed.athletes) ? parsed.athletes : [] };
    } catch { value = DEFAULT_STATE; }
  }
  cache = { raw, value };
  return value;
}

function write(next: TeamState): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    cache = null;
    window.dispatchEvent(new Event(EVENT));
    try { window.dispatchEvent(new StorageEvent('storage', { key: KEY })); } catch { /* ignore */ }
  } catch { /* quota / private mode */ }
}

export function subscribe(cb: () => void): () => void {
  if (!hasWindow()) return () => {};
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb(); };
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', onStorage);
  };
}

// ── mutations ────────────────────────────────────────────────
export function addAthlete(name: string, sport: SportId): TeamAthlete {
  const state = read();
  const athlete: TeamAthlete = {
    id: newId(),
    name: name.trim() || 'New athlete',
    sport,
    scores: {},
    updatedAt: new Date().toISOString(),
  };
  write({ ...state, athletes: [...state.athletes, athlete] });
  return athlete;
}

export function updateAthlete(id: string, patch: Partial<Omit<TeamAthlete, 'id'>>): void {
  const state = read();
  write({
    ...state,
    athletes: state.athletes.map((a) =>
      a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a,
    ),
  });
}

export function setScore(id: string, capability: keyof CapabilityScores, score: number | null): void {
  const state = read();
  write({
    ...state,
    athletes: state.athletes.map((a) => {
      if (a.id !== id) return a;
      const scores = { ...a.scores };
      if (score === null) delete scores[capability];
      else scores[capability] = Math.max(0, Math.min(100, Math.round(score)));
      return { ...a, scores, updatedAt: new Date().toISOString() };
    }),
  });
}

export function removeAthlete(id: string): void {
  const state = read();
  write({ ...state, athletes: state.athletes.filter((a) => a.id !== id) });
}
