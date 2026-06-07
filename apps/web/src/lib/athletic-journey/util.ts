// ============================================================
// SwingVantage — Athletic Journey: small pure math helpers
// ============================================================

export const clamp = (n: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, n));

export const mean = (xs: number[]): number =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

export const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Weighted mean; pairs with weight 0 or non-finite values are ignored. */
export function weightedMean(pairs: Array<[value: number, weight: number]>): number {
  let num = 0;
  let den = 0;
  for (const [v, w] of pairs) {
    if (!Number.isFinite(v) || !Number.isFinite(w) || w <= 0) continue;
    num += v * w;
    den += w;
  }
  return den > 0 ? num / den : 0;
}

/** Whole days since an ISO timestamp, or null when absent/invalid. */
export function daysSince(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now - t) / 86_400_000));
}

/** Map a 1..5 self-assessment to a 0..100 score (1→10 … 5→90). */
export const assessmentToScore = (rating: number): number =>
  clamp((clamp(rating, 1, 5) - 1) * 20 + 10, 0, 100);

/** Saturating 0..100 score: value/saturation, capped at 100. */
export const saturate = (value: number, saturation: number): number =>
  saturation <= 0 ? 0 : clamp((value / saturation) * 100, 0, 100);
