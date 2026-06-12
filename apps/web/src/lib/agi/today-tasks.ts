'use client';

// ============================================================
// SwingVantage — Today's Tasks (daily practice checklist)
// ------------------------------------------------------------
// A tiny, SSR-safe localStorage record of which of the committed
// plan's drills the athlete has checked off TODAY. It is a daily
// ritual list: the done-set auto-resets when the stored day is no
// longer today, so each day starts fresh ("do these again today").
//
// It lives in its own key and never touches the AGI commitment, the
// Zustand store, or backups — it only remembers today's checkmarks.
// It is safe to be missing, corrupt, or cleared and never throws.
// ============================================================

const KEY = 'swingiq-today-tasks-v1';

interface StoredTasks {
  version: 1;
  /** YYYY-MM-DD the doneKeys belong to. A different day → treated as empty. */
  date: string;
  doneKeys: string[];
}

/** Local calendar day (not UTC) so "today" matches the athlete's clock. */
export function todayStr(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Stable per-drill key. Prefers the catalog drillId; falls back to the cue text. */
export function taskKey(sport: string, fix: string, drillId: string | null): string {
  return `${sport}::${drillId ?? fix}`;
}

// ── change notification (powers the useTodayTasks hook) ──
const listeners = new Set<() => void>();
let storeVersion = 0;

export function getTodayTasksVersion(): number {
  return storeVersion;
}

function notifyChange(): void {
  storeVersion++;
  for (const l of listeners) l();
}

export function subscribeTodayTasks(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) notifyChange();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

function read(): StoredTasks {
  const empty: StoredTasks = { version: 1, date: todayStr(), doneKeys: [] };
  if (typeof window === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const p = JSON.parse(raw);
    if (
      p &&
      p.version === 1 &&
      typeof p.date === 'string' &&
      Array.isArray(p.doneKeys) &&
      p.date === todayStr() // stale day → start fresh (daily reset)
    ) {
      return p as StoredTasks;
    }
  } catch {
    // fall through
  }
  return empty;
}

function write(doneKeys: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ version: 1, date: todayStr(), doneKeys } satisfies StoredTasks),
    );
    notifyChange();
  } catch {
    // storage full / unavailable — non-critical
  }
}

/** The set of drill keys completed today (auto-resets daily). Never throws. */
export function loadDoneTaskKeys(): Set<string> {
  return new Set(read().doneKeys);
}

/** Toggle a drill's done state for today. Never throws. */
export function toggleTodayTask(key: string): void {
  const set = new Set(read().doneKeys);
  if (set.has(key)) set.delete(key);
  else set.add(key);
  write([...set]);
}
