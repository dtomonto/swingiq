// ============================================================
// SwingVantage — Earn-Moment Celebration Ledger
// ------------------------------------------------------------
// A tiny localStorage record of which achievements we've already
// celebrated, plus an `initialized` flag. The flag matters: the
// first time this feature runs for an existing user we seed the
// ledger with everything they've ALREADY earned and celebrate
// nothing — so returning users aren't spammed for past wins. Only
// achievements earned *after* that first run get a celebration.
//
// Deliberately self-contained (its own key, no store-schema change)
// and resilient to private-mode / quota errors.
// ============================================================

const KEY = 'swingiq-celebrated-v1';

export interface CelebrationLedger {
  initialized: boolean;
  ids: string[];
}

const EMPTY: CelebrationLedger = { initialized: false, ids: [] };

export function loadLedger(): CelebrationLedger {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<CelebrationLedger>;
    return {
      initialized: parsed.initialized === true,
      ids: Array.isArray(parsed.ids) ? parsed.ids.filter((x): x is string => typeof x === 'string') : [],
    };
  } catch {
    return EMPTY;
  }
}

export function saveLedger(ledger: CelebrationLedger): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ledger));
  } catch {
    /* ignore quota / privacy-mode write failures */
  }
}
