// ============================================================
// SwingVantage — AGI: Insight feedback (local-first)
// ------------------------------------------------------------
// "Helpful?" / "Not me" on each insight — the correction path the audit flagged
// as missing, and the first real learning signal. Stored in its OWN localStorage
// key (never touches the store, backup, or other AGI keys). SSR-safe, never
// throws. Down-voted insights are hidden; the verdicts can later feed re-ranking
// and the data moat.
// ============================================================

export type InsightVerdict = 'up' | 'down';

const KEY = 'swingiq-agi-insight-feedback-v1';

/** Map of insightId → latest verdict. */
export function loadInsightFeedback(): Record<string, InsightVerdict> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, InsightVerdict>) : {};
  } catch {
    return {};
  }
}

export function recordInsightFeedback(insightId: string, verdict: InsightVerdict): void {
  if (typeof window === 'undefined') return;
  try {
    const all = loadInsightFeedback();
    all[insightId] = verdict;
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* best-effort */
  }
}

export function clearInsightFeedback(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
