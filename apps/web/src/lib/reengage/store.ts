// ============================================================
// SwingVantage — Re-engagement OS: self-contained local-first store
//
// Own localStorage key (swingiq-reengage-v1). Holds the user's channel
// preferences, quiet hours, and the frequency-cap bookkeeping. SSR-safe,
// never throws. React hook lives in ./useReengage.
// ============================================================

import type { NudgeState, NudgePrefs, TriggerId } from './types';

export const REENGAGE_KEY = 'swingiq-reengage-v1';
const KEY = REENGAGE_KEY;
const EVENT = 'swingvantage:reengage-change';

const hasWindow = () => typeof window !== 'undefined';

export const DEFAULT_PREFS: NudgePrefs = {
  inApp: true,
  push: false,
  email: false,
  quietHours: { enabled: true, startHour: 21, endHour: 8 },
};

export const DEFAULT_STATE: NudgeState = {
  version: 1,
  prefs: DEFAULT_PREFS,
  lastShown: {},
  dismissed: {},
  lastAnyAt: null,
};

let cache: { raw: string | null; value: NudgeState } | null = null;

export function read(): NudgeState {
  if (!hasWindow()) return DEFAULT_STATE;
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(KEY); } catch { /* private mode */ }
  if (cache && cache.raw === raw) return cache.value;

  let value: NudgeState = DEFAULT_STATE;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<NudgeState>;
      value = {
        version: 1,
        prefs: {
          ...DEFAULT_PREFS,
          ...parsed.prefs,
          quietHours: { ...DEFAULT_PREFS.quietHours, ...parsed.prefs?.quietHours },
        },
        lastShown: parsed.lastShown ?? {},
        dismissed: parsed.dismissed ?? {},
        lastAnyAt: parsed.lastAnyAt ?? null,
      };
    } catch { value = DEFAULT_STATE; }
  }
  cache = { raw, value };
  return value;
}

function write(next: NudgeState): void {
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
export function setPrefs(patch: Partial<NudgePrefs>): void {
  const s = read();
  write({ ...s, prefs: { ...s.prefs, ...patch, quietHours: { ...s.prefs.quietHours, ...patch.quietHours } } });
}

/** Record that a nudge was shown (updates the trigger + global caps). */
export function markShown(triggerId: TriggerId): void {
  const s = read();
  const now = new Date().toISOString();
  write({ ...s, lastShown: { ...s.lastShown, [triggerId]: now }, lastAnyAt: now });
}

/** Record an explicit dismissal — snoozes the trigger for its cooldown. */
export function dismiss(triggerId: TriggerId): void {
  const s = read();
  write({ ...s, dismissed: { ...s.dismissed, [triggerId]: new Date().toISOString() } });
}

export function resetCaps(): void {
  const s = read();
  write({ ...s, lastShown: {}, dismissed: {}, lastAnyAt: null });
}
