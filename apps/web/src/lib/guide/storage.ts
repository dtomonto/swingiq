// ============================================================
// SwingVantage — Guide: Companion State (localStorage)
// ------------------------------------------------------------
// Tiny, self-contained record for the floating guide ("genie"):
//   - autoOpen:   whether tips pop open on their own (Clippy-style)
//   - seenPages:  routes the user has already acknowledged, so we
//                 don't re-pop the same tip forever
//   - hidden:     the user fully tucked the companion away
//
// IMPORTANT: this lives in its OWN localStorage key. It does NOT
// touch the Zustand store, the backup schema, or export/import —
// so existing data flows are completely unaffected. It is safe to
// be missing, corrupt, or cleared at any time, and is SSR-safe.
// ============================================================

const KEY = 'swingiq-guide-v1';

export interface GuideState {
  version: 1;
  /** Tips open automatically on a page you haven't acknowledged yet. */
  autoOpen: boolean;
  /** Route paths the user has already seen the tip for (no auto re-pop). */
  seenPages: string[];
  /** The user tucked the whole companion away. */
  hidden: boolean;
}

export const DEFAULT_GUIDE_STATE: GuideState = {
  version: 1,
  autoOpen: true,
  seenPages: [],
  hidden: false,
};

/** Read the saved guide state, falling back to defaults if absent/unreadable. */
export function loadGuideState(): GuideState {
  if (typeof window === 'undefined') return { ...DEFAULT_GUIDE_STATE };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_GUIDE_STATE };
    const parsed = JSON.parse(raw) as Partial<GuideState>;
    if (!parsed || parsed.version !== 1) return { ...DEFAULT_GUIDE_STATE };
    return {
      version: 1,
      autoOpen: parsed.autoOpen ?? DEFAULT_GUIDE_STATE.autoOpen,
      seenPages: Array.isArray(parsed.seenPages) ? parsed.seenPages : [],
      hidden: parsed.hidden ?? DEFAULT_GUIDE_STATE.hidden,
    };
  } catch {
    return { ...DEFAULT_GUIDE_STATE };
  }
}

/** Merge a patch into the saved state and persist it. Returns the new state. */
export function patchGuideState(patch: Partial<Omit<GuideState, 'version'>>): GuideState {
  const next: GuideState = { ...loadGuideState(), ...patch, version: 1 };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // storage full / unavailable — non-critical, the UI still works in-memory
    }
  }
  return next;
}

/** Record that the user has acknowledged the tip for `pathname`. */
export function markPageSeen(pathname: string): GuideState {
  const state = loadGuideState();
  if (state.seenPages.includes(pathname)) return state;
  // Keep the list bounded — only the most recent routes matter.
  const seenPages = [...state.seenPages, pathname].slice(-60);
  return patchGuideState({ seenPages });
}
