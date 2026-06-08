// ============================================================
// SwingVantage — Mental Performance: self-contained local-first store
//
// Lives in its OWN localStorage key (swingiq-mental-performance-v1), like the
// BodySync / retest / motion-lab stores. It never touches the main Zustand
// store. The document-sync layer (lib/db/document-sync) mirrors this key to
// the user's account so it follows them across devices. SSR-safe, never
// throws. No React/JSX here — the hook is in ./useMentalPerformance.
//
// PRIVACY: journal logs are stored ONLY when the user has explicitly consented
// (settings.storeLogs). saveLog enforces this as defense-in-depth.
// ============================================================

import type {
  MentalState, MentalLog, MentalProfile, MentalSettings, PlanAssignment, TrainingPlan,
} from './types';
import { DEFAULT_MENTAL_STATE } from './constants';
import { emitMentalEvent, mentalEvent } from './telemetry';

export const MENTAL_KEY = 'swingiq-mental-performance-v1';
const KEY = MENTAL_KEY;
const EVENT = 'swingvantage:mental-change';

const hasWindow = () => typeof window !== 'undefined';
const newId = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();
const todayIso = () => nowIso().slice(0, 10);

// ── read (cached so useSyncExternalStore gets a stable reference) ──
let cache: { raw: string | null; value: MentalState } | null = null;

export function read(): MentalState {
  if (!hasWindow()) return DEFAULT_MENTAL_STATE;
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(KEY); } catch { /* private mode */ }
  if (cache && cache.raw === raw) return cache.value;
  let value: MentalState = DEFAULT_MENTAL_STATE;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<MentalState>;
      value = {
        version: 1,
        settings: { ...DEFAULT_MENTAL_STATE.settings, ...parsed.settings },
        profile: { ...DEFAULT_MENTAL_STATE.profile, ...parsed.profile },
        logs: Array.isArray(parsed.logs) ? parsed.logs : [],
        planAssignments: Array.isArray(parsed.planAssignments) ? parsed.planAssignments : [],
      };
    } catch { value = DEFAULT_MENTAL_STATE; }
  }
  cache = { raw, value };
  return value;
}

function write(next: MentalState): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    cache = null; // invalidate so the next read reparses
    window.dispatchEvent(new Event(EVENT));
    // Notify the cloud document-mirror (same-tab listeners watch 'storage').
    try { window.dispatchEvent(new StorageEvent('storage', { key: KEY })); } catch { /* ignore */ }
  } catch { /* quota / private mode — non-critical */ }
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

// ── settings / consent ───────────────────────────────────────
export function setSettings(patch: Partial<MentalSettings>): void {
  const state = read();
  write({ ...state, settings: { ...state.settings, ...patch } });
}

export function consent(): void {
  const state = read();
  write({
    ...state,
    settings: { ...state.settings, enabled: true, consentedAt: state.settings.consentedAt ?? nowIso() },
  });
}

/** Toggle the explicit consent to STORE journal logs. */
export function setStoreLogs(on: boolean): void {
  setSettings({ storeLogs: on });
}

/** Toggle the explicit opt-in to contribute ANONYMIZED aggregate insights. */
export function setShareInsights(on: boolean): void {
  setSettings({ shareAnonymousInsights: on });
}

// ── profile ──────────────────────────────────────────────────
export function setProfile(patch: Partial<MentalProfile>): void {
  const state = read();
  write({ ...state, profile: { ...state.profile, ...patch, updatedAt: nowIso() } });
}

// ── journal logs (consent-gated) ─────────────────────────────
/**
 * Save a journal log. Returns false (and stores nothing) when the user has
 * not consented to storing logs — defense-in-depth for data minimization.
 */
export function saveLog(input: Omit<MentalLog, 'id' | 'date'> & { id?: string; date?: string }): boolean {
  const state = read();
  if (!state.settings.storeLogs) return false;
  const record: MentalLog = {
    ...input,
    id: input.id ?? newId('mlog'),
    date: input.date ?? nowIso(),
  };
  const logs = [record, ...state.logs.filter((l) => l.id !== record.id)]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 500); // bounded history
  write({ ...state, logs });
  // Anonymized, opt-in only (no-ops without consent/provider).
  emitMentalEvent(
    mentalEvent.journalLogged({
      sport: record.sport, emotion: record.emotion, mistake: record.mistake,
      routineId: record.routineUsed, effectiveness: record.effectiveness,
    }),
    state.settings,
  );
  return true;
}

export function deleteLog(id: string): void {
  const state = read();
  write({ ...state, logs: state.logs.filter((l) => l.id !== id) });
}

export function clearAllLogs(): void {
  const state = read();
  write({ ...state, logs: [] });
}

// ── training-plan assignments ────────────────────────────────
export function assignPlan(plan: TrainingPlan): PlanAssignment {
  const state = read();
  const assignment: PlanAssignment = {
    id: newId('mplan'),
    planId: plan.id,
    status: 'active',
    startDate: todayIso(),
    currentDay: 1,
    completedDays: [],
    completionDate: null,
    createdAt: nowIso(),
  };
  // One active assignment per planId — replace any prior.
  const planAssignments = [assignment, ...state.planAssignments.filter((a) => a.planId !== plan.id)].slice(0, 20);
  write({ ...state, planAssignments });
  return assignment;
}

export function advancePlanDay(assignmentId: string, day: number, totalDays: number): void {
  const state = read();
  const planAssignments = state.planAssignments.map((a) => {
    if (a.id !== assignmentId) return a;
    const completedDays = a.completedDays.includes(day) ? a.completedDays : [...a.completedDays, day].sort((x, y) => x - y);
    const done = completedDays.length >= totalDays;
    return {
      ...a,
      completedDays,
      currentDay: Math.min(totalDays, day + 1),
      status: done ? ('completed' as const) : a.status,
      completionDate: done ? nowIso() : a.completionDate,
    };
  });
  write({ ...state, planAssignments });
}

export function abandonPlan(assignmentId: string): void {
  const state = read();
  write({
    ...state,
    planAssignments: state.planAssignments.map((a) =>
      a.id === assignmentId ? { ...a, status: 'abandoned' as const } : a),
  });
}

// ── data portability + erase ─────────────────────────────────
export function exportMental(): MentalState {
  return read();
}

/** Full erase — the user-controlled "delete my mental performance data" action. */
export function clearAllMentalData(): void {
  write({ ...DEFAULT_MENTAL_STATE });
}
