// ============================================================
// SwingVantage — Agent: Live Practice Companion — Persistence
// ------------------------------------------------------------
// Own localStorage key (mirrors agi/commitment) so an in-progress
// session survives a reload WITHOUT touching the main store schema.
// SSR-safe and never throws.
// ============================================================

import type { CompanionState } from './types';

export const COMPANION_KEY = 'swingiq-practice-companion-v1';

export function saveCompanion(state: CompanionState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(COMPANION_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / privacy-mode failures
  }
}

export function loadCompanion(): CompanionState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COMPANION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CompanionState;
    return parsed && Array.isArray(parsed.drills) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearCompanion(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(COMPANION_KEY);
  } catch {
    // ignore
  }
}
