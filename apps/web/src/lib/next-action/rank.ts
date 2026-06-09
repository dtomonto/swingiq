// ============================================================
// SwingVantage — Unified next-best-action ranker (recommendation #22)
// ------------------------------------------------------------
// The app has several engines that each surface "what to do next": the priority
// engine, physical readiness, the AGI keystone, drill-match, retest prompts, and
// the activation funnel. Shown separately they compete for attention. This pure
// layer normalizes every source into one ActionCandidate shape and ranks them
// into a single, confident feed — one clear next step, not five panels.
//
// Score = severity × confidence × source-weight × recency. Weights are tunable
// (default favors highest-leverage sources like the cross-sport keystone).
// Deterministic + side-effect-free; adapters from each engine are thin wiring.
// ============================================================

export type ActionSource = 'keystone' | 'priority' | 'retest' | 'readiness' | 'funnel' | 'drill';

export interface ActionCandidate {
  /** Stable id; duplicates across sources are de-duped (highest score wins). */
  id: string;
  source: ActionSource;
  title: string;
  detail?: string;
  href?: string;
  /** 0–1 how urgent/important this is. */
  severity: number;
  /** 0–1 how confident the source is. */
  confidence: number;
  /** 0–1 recency (1 = just now). Defaults to 0.5 when absent. */
  recency?: number;
}

export interface RankedAction extends ActionCandidate {
  /** 0–1 composite score. */
  score: number;
  rank: number;
}

export interface NextActionFeed {
  /** The single best next step (highest score), or null when there's nothing. */
  primary: RankedAction | null;
  /** All candidates, de-duped and ranked best-first. */
  actions: RankedAction[];
}

/** Relative leverage of each source. Tunable; cross-sport keystone leads. */
export const DEFAULT_SOURCE_WEIGHTS: Record<ActionSource, number> = {
  keystone: 1.0,
  priority: 0.9,
  retest: 0.85,
  readiness: 0.8,
  funnel: 0.7,
  drill: 0.6,
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

export interface RankOptions {
  weights?: Partial<Record<ActionSource, number>>;
  /** Cap the feed length (default: all). */
  limit?: number;
}

/** Composite score for one candidate. */
export function scoreCandidate(c: ActionCandidate, weights: Record<ActionSource, number> = DEFAULT_SOURCE_WEIGHTS): number {
  const w = weights[c.source] ?? 0.5;
  const recency = clamp01(c.recency ?? 0.5);
  // Confidence dampens but never zeroes a high-severity item; recency is a
  // gentle tie-breaker so a fresh signal edges out a stale one.
  const conf = 0.5 + 0.5 * clamp01(c.confidence);
  const rec = 0.7 + 0.3 * recency;
  return +(clamp01(c.severity) * conf * w * rec).toFixed(4);
}

/** Consolidate candidates from every source into one ranked feed. */
export function rankNextActions(candidates: ActionCandidate[], opts: RankOptions = {}): NextActionFeed {
  const weights = { ...DEFAULT_SOURCE_WEIGHTS, ...opts.weights };

  // De-dupe by id, keeping the highest-scoring instance.
  const best = new Map<string, { c: ActionCandidate; score: number }>();
  for (const c of candidates) {
    const score = scoreCandidate(c, weights);
    const prev = best.get(c.id);
    if (!prev || score > prev.score) best.set(c.id, { c, score });
  }

  const ranked: RankedAction[] = [...best.values()]
    .sort((a, b) => b.score - a.score)
    .map(({ c, score }, i) => ({ ...c, score, rank: i + 1 }));

  const limited = typeof opts.limit === 'number' ? ranked.slice(0, Math.max(0, opts.limit)) : ranked;
  return { primary: limited[0] ?? null, actions: limited };
}
