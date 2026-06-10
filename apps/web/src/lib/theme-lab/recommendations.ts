// ============================================================
// Theme Lab — admin recommendation engine (#3 step 6). Looks at the operator's
// Theme Lab state (experiments, library drafts, publish records) and proposes
// governance actions: expand / pause / rollback / retire / promote. PURE.
//
// HONESTY: real "expand the winning variant" calls need per-theme outcome
// analytics, which aren't wired yet. When no `usage` signal is supplied the
// engine does NOT invent winners — it emits a single `needs-data` advisory for
// each running experiment and otherwise sticks to STRUCTURAL recommendations it
// can prove from local state (promote stale drafts, roll back high-risk
// publishes). This mirrors the repo's `needs_data_source` convention.
// ============================================================

import type { ThemeExperimentConfig } from './experiments';
import type { LibraryTheme } from './library';
import type { ThemePublishRecord } from './publish';

export type ThemeOpsAction = 'expand' | 'pause' | 'rollback' | 'retire' | 'promote' | 'needs-data';
export type ThemeOpsConfidence = 'low' | 'medium' | 'high';

export interface ThemeOpsRecommendation {
  id: string;
  action: ThemeOpsAction;
  /** The theme / experiment / draft the action targets. */
  subject: string;
  title: string;
  reason: string;
  confidence: ThemeOpsConfidence;
}

/** Per-subject outcome signal. `positive` is any success metric (e.g. starts). */
export interface UsageSignal {
  exposure: number;
  positive?: number;
}

export interface ThemeOpsInput {
  experiments?: ThemeExperimentConfig[];
  catalog?: LibraryTheme[];
  publishRecords?: ThemePublishRecord[];
  /** Optional per-theme usage analytics. Absent → needs-data for experiments. */
  usage?: Record<string, UsageSignal>;
  /** Minimum exposures before an experiment verdict is trusted (default 200). */
  minExposure?: number;
}

function rate(u: UsageSignal | undefined): number | null {
  if (!u || u.exposure <= 0 || u.positive == null) return null;
  return u.positive / u.exposure;
}

/**
 * Build the ranked governance recommendations. Deterministic; safe to call on
 * every render.
 */
export function buildThemeOpsRecommendations(input: ThemeOpsInput): ThemeOpsRecommendation[] {
  const experiments = input.experiments ?? [];
  const catalog = input.catalog ?? [];
  const publishRecords = input.publishRecords ?? [];
  const usage = input.usage;
  const minExposure = input.minExposure ?? 200;

  const recs: ThemeOpsRecommendation[] = [];

  // ── Experiments ──────────────────────────────────────────
  for (const exp of experiments.filter((e) => e.status === 'running')) {
    if (!usage) {
      recs.push({
        id: `needs-data:${exp.id}`,
        action: 'needs-data',
        subject: exp.id,
        title: `Wire analytics for "${exp.name}"`,
        reason:
          'This experiment is running but no per-variant outcome analytics are connected, so a winner can\'t be called yet.',
        confidence: 'high',
      });
      continue;
    }
    const scored = exp.variants
      .map((v) => ({ themeId: v.themeId, rate: rate(usage[v.themeId]), exposure: usage[v.themeId]?.exposure ?? 0 }))
      .filter((s) => s.rate != null) as { themeId: string; rate: number; exposure: number }[];
    const enough = scored.filter((s) => s.exposure >= minExposure);
    if (enough.length < exp.variants.length) {
      recs.push({
        id: `pause:${exp.id}`,
        action: 'pause',
        subject: exp.id,
        title: `Keep gathering data for "${exp.name}"`,
        reason: `Not every variant has reached ${minExposure} exposures yet — hold before calling a winner.`,
        confidence: 'low',
      });
      continue;
    }
    const best = [...enough].sort((a, b) => b.rate - a.rate)[0];
    const worst = [...enough].sort((a, b) => a.rate - b.rate)[0];
    if (best && worst && best.rate > worst.rate * 1.1) {
      recs.push({
        id: `expand:${exp.id}`,
        action: 'expand',
        subject: best.themeId,
        title: `Expand the winner of "${exp.name}"`,
        reason: `${best.themeId} leads at ${(best.rate * 100).toFixed(1)}% vs ${(worst.rate * 100).toFixed(1)}% over ≥${minExposure} exposures.`,
        confidence: best.exposure >= minExposure * 3 ? 'high' : 'medium',
      });
    }
  }

  // ── Publishes: broad + high-risk → recommend rollback ────
  for (const p of publishRecords.filter((r) => r.status === 'published' && r.risk === 'high')) {
    recs.push({
      id: `rollback:${p.id}`,
      action: 'rollback',
      subject: p.themeId,
      title: `Review high-risk publish of ${p.themeId}`,
      reason: `Published at scope "${p.scope}" with HIGH risk (the theme isn't a contrast-gated live theme). Roll back or promote it properly.`,
      confidence: 'medium',
    });
  }

  // ── Library: stale drafts → recommend promote-or-retire ──
  for (const d of catalog.filter((t) => t.source !== 'published' && t.status === 'draft')) {
    recs.push({
      id: `promote:${d.id}`,
      action: 'promote',
      subject: d.id,
      title: `Finish or drop draft "${d.name}"`,
      reason:
        'Draft/generated theme sitting in the library. Refine it in the builder and export its CSS to publish, or retire it to keep the library clean.',
      confidence: 'low',
    });
  }

  // ── Retire (only with usage): live theme nobody uses ─────
  if (usage) {
    for (const t of catalog.filter((t) => t.source === 'published' && t.status === 'live')) {
      const u = usage[t.id];
      if (u && u.exposure === 0) {
        recs.push({
          id: `retire:${t.id}`,
          action: 'retire',
          subject: t.id,
          title: `Consider retiring "${t.name}"`,
          reason: 'Live theme with zero exposures in the window — a candidate to retire and simplify the catalog.',
          confidence: 'low',
        });
      }
    }
  }

  const order: Record<ThemeOpsAction, number> = {
    rollback: 0,
    expand: 1,
    pause: 2,
    retire: 3,
    promote: 4,
    'needs-data': 5,
  };
  return recs.sort((a, b) => order[a.action] - order[b.action]);
}
