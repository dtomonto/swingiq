// ============================================================
// securityOS — Security Health Score engine (PURE / deterministic)
// ------------------------------------------------------------
// Turns evaluated posture checks into a weighted 0–100 health score with a
// transparent per-category breakdown, a maturity level and a confidence
// figure. PURE: no fs, no env, no React — feed it evaluated checks + weights,
// get a score. Every number traces to a real check; `unknown` checks are
// EXCLUDED from the score and instead drag down the visible confidence.
// ============================================================

import type {
  CategoryScore,
  CheckResult,
  EvaluatedCheck,
  MaturityLevel,
  ScoreBand,
  ScoreCategoryId,
  SecurityScore,
  Severity,
} from './types';
import { RESULT_VALUE, SCORE_CATEGORIES, CATEGORY_LABEL, DEFAULT_WEIGHTS } from './types';

/** Score band from the overall 0–100 number. */
export function scoreBand(n: number): ScoreBand {
  if (n < 40) return 'critical';
  if (n < 60) return 'at_risk';
  if (n < 75) return 'fair';
  if (n < 90) return 'good';
  return 'strong';
}

/** Maturity level from the overall 0–100 number. */
export function maturityFor(n: number): MaturityLevel {
  if (n < 40) return 'Initial';
  if (n < 60) return 'Developing';
  if (n < 75) return 'Defined';
  if (n < 90) return 'Managed';
  return 'Optimized';
}

const isResolved = (r: CheckResult): r is Exclude<CheckResult, 'unknown'> => r !== 'unknown';

/**
 * Score one category from its evaluated checks. Unknown checks are skipped
 * (they don't help or hurt the score) but DO lower the category confidence.
 * Returns score=null when every check is unknown.
 */
export function computeCategoryScore(
  id: ScoreCategoryId,
  checks: EvaluatedCheck[],
): CategoryScore {
  const label = CATEGORY_LABEL[id];
  const weightDefault = SCORE_CATEGORIES.find((c) => c.id === id)?.weight ?? 0;
  if (checks.length === 0) {
    return { id, label, weight: weightDefault, score: null, confidence: 0, checks };
  }
  const resolved = checks.filter((c) => isResolved(c.result));
  const confidence = resolved.length / checks.length;
  if (resolved.length === 0) {
    return { id, label, weight: weightDefault, score: null, confidence: 0, checks };
  }
  let weighted = 0;
  let weightSum = 0;
  for (const c of resolved) {
    const w = c.weight > 0 ? c.weight : 1;
    weighted += RESULT_VALUE[c.result as Exclude<CheckResult, 'unknown'>] * w;
    weightSum += w;
  }
  const score = weightSum > 0 ? Math.round(weighted / weightSum) : null;
  return { id, label, weight: weightDefault, score, confidence, checks };
}

export interface ScoreOptions {
  /** Per-category weight overrides (percent). Falls back to defaults. */
  weights?: Partial<Record<ScoreCategoryId, number>>;
  now?: string;
}

/**
 * Compute the full SecurityScore from every evaluated check. Checks are
 * grouped by category, each category is scored, and the overall is the
 * configured-weight average of the categories that produced a real score.
 * A category that is entirely `unknown` is excluded from the overall (so we
 * never fabricate a number) and lowers the global confidence instead.
 */
export function computeSecurityScore(
  checks: EvaluatedCheck[],
  opts: ScoreOptions = {},
): SecurityScore {
  const weights = { ...DEFAULT_WEIGHTS, ...(opts.weights ?? {}) };
  const now = opts.now ?? new Date().toISOString();

  const categories: CategoryScore[] = SCORE_CATEGORIES.map((meta) =>
    computeCategoryScore(
      meta.id,
      checks.filter((c) => c.category === meta.id),
    ),
  );

  let weighted = 0;
  let weightSum = 0;
  for (const cat of categories) {
    if (cat.score === null) continue;
    const w = Math.max(0, weights[cat.id] ?? 0);
    weighted += cat.score * w;
    weightSum += w;
  }
  const overall = weightSum > 0 ? Math.round(weighted / weightSum) : 0;

  const resolvedCount = checks.filter((c) => c.result !== 'unknown').length;
  const confidence = checks.length > 0 ? Math.round((resolvedCount / checks.length) * 100) : 0;

  const counts = countBySeverity(checks);

  return {
    overall,
    band: scoreBand(overall),
    maturity: maturityFor(overall),
    confidence,
    categories,
    counts,
    generatedAt: now,
  };
}

/**
 * Count failing/partial checks by the severity they'd raise. A `fail` raises
 * at its declared severity; a `partial` raises one notch lower (it's a
 * weakness, not a hole). pass/unknown raise nothing.
 */
export function countBySeverity(checks: EvaluatedCheck[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
  };
  for (const c of checks) {
    if (c.result === 'fail') counts[c.severity] += 1;
    else if (c.result === 'partial') counts[downgrade(c.severity)] += 1;
  }
  return counts;
}

/** Lower a severity by one notch (partial findings are less severe). */
export function downgrade(s: Severity): Severity {
  const order: Severity[] = ['critical', 'high', 'medium', 'low', 'informational'];
  const i = order.indexOf(s);
  return order[Math.min(order.length - 1, i + 1)];
}
