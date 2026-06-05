// ============================================================
// SwingVantage — Start Here: Returning-User Record
// ------------------------------------------------------------
// A tiny, self-contained localStorage record used ONLY by the
// /start flow to power the "Welcome back" state for a returning
// first-time visitor.
//
// IMPORTANT: this lives in its OWN localStorage key. It does NOT
// touch the Zustand store, the backup schema, or export/import —
// so existing data flows are completely unaffected. It is safe to
// be missing, corrupt, or cleared at any time.
// ============================================================

import type {
  OnboardingSportId,
  UserType,
  StartSkillLevel,
} from './quickStart';

const KEY = 'swingiq-start-here-v1';

export interface StartHereRecord {
  version: 1;
  sportId: OnboardingSportId;
  sportLabel: string;
  emoji: string;
  userType: UserType;
  skill: StartSkillLevel;
  /** The top-priority focus the user landed on. */
  focus: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  drills: string[];
  plan: string[];
  completedAt: string;
  retestDate: string;
}

/** Read the saved Start Here record, or null if absent/unreadable. */
export function loadStartHere(): StartHereRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StartHereRecord;
    if (!parsed || parsed.version !== 1 || !parsed.sportId) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persist the Start Here record. Never throws. */
export function saveStartHere(record: StartHereRecord): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    // storage full / unavailable — non-critical
  }
}

/** Remove the Start Here record (used by "start fresh"). Never throws. */
export function clearStartHere(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
