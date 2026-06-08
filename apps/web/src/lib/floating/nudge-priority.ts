// ============================================================
// SwingVantage — Bottom nudge: pure priority logic
// ------------------------------------------------------------
// The framework-free core of the nudge manager (no React/JSX) so it
// is unit-testable in the `node` jest env. The React provider/hook/
// region live in ./nudge-manager.tsx and re-export everything here.
// ============================================================

export interface NudgeEntry {
  id: string;
  /** Higher wins. */
  priority: number;
}

/**
 * Pure winner-selection: the highest-priority entry's id, or null when none
 * are registered. Ties resolve to the first registered (stable). This single
 * function is what guarantees only ONE bottom nudge can ever be active.
 */
export function resolveActiveNudge(entries: NudgeEntry[]): string | null {
  let best: NudgeEntry | null = null;
  for (const entry of entries) {
    if (!best || entry.priority > best.priority) best = entry;
  }
  return best ? best.id : null;
}

/**
 * Canonical priorities for the app bottom nudge slot. Higher = more
 * consequential / shown first. Keep all nudge priorities here so the
 * ordering is auditable in one place.
 */
export const NUDGE_PRIORITY = {
  /** "We found a newer backup — restore?" An unmissable data decision. */
  continueProgress: 30,
  /** "Save your progress / create a free account." Conversion. */
  saveProgress: 20,
  /** "New here? Take the tour." Gentle onboarding nudge. */
  tutorialWelcome: 10,
} as const;
