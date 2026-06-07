// ============================================================
// SwingVantage — Blog-to-Social: learning loop
//
// Turns recorded metrics into "what's working" rankings, and feeds the
// winners back into generation (preferred hook + platform order). Pure
// aggregation is testable; the async loader degrades to empty (hasData
// false) when there's no data — so the engine just uses its heuristics
// until real numbers exist.
// ============================================================

import type { CtaType, HookType, Platform } from './types';
import { getLearningRows, type LearningRow } from './store';

export interface Ranked {
  key: string;
  ctr: number;
  clicks: number;
  impressions: number;
  engagements: number;
  samples: number;
}

export interface LearnedPreferences {
  hooks: Ranked[];
  ctas: Ranked[];
  platforms: Ranked[];
  hasData: boolean;
}

function rankBy(rows: LearningRow[], pick: (r: LearningRow) => string | null): Ranked[] {
  const acc = new Map<string, Omit<Ranked, 'key' | 'ctr'>>();
  for (const r of rows) {
    const k = pick(r);
    if (!k) continue;
    const a = acc.get(k) ?? { clicks: 0, impressions: 0, engagements: 0, samples: 0 };
    a.clicks += r.clicks;
    a.impressions += r.impressions;
    a.engagements += r.engagements;
    a.samples += 1;
    acc.set(k, a);
  }
  return [...acc.entries()]
    .map(([key, a]) => ({
      key,
      ...a,
      ctr: a.impressions > 0 ? a.clicks / a.impressions : 0,
    }))
    // Best click-through first; engagements break ties when impressions are 0.
    .sort((x, y) => y.ctr - x.ctr || y.engagements - x.engagements || y.clicks - x.clicks);
}

/** Pure: raw rows → ranked preferences. Exported for tests. */
export function aggregateLearning(rows: LearningRow[]): LearnedPreferences {
  return {
    hooks: rankBy(rows, (r) => r.hookType),
    ctas: rankBy(rows, (r) => r.ctaType),
    platforms: rankBy(rows, (r) => r.platform),
    hasData: rows.length > 0,
  };
}

/** Async: load + aggregate. Empty when no metrics / no persistence. */
export async function loadLearnedPreferences(): Promise<LearnedPreferences> {
  return aggregateLearning(await getLearningRows());
}

export const EMPTY_LEARNING: LearnedPreferences = { hooks: [], ctas: [], platforms: [], hasData: false };

/** The clear top hook, if any. */
export function topHook(p: LearnedPreferences): HookType | undefined {
  return (p.hooks[0]?.key as HookType) || undefined;
}
export function topCta(p: LearnedPreferences): CtaType | undefined {
  return (p.ctas[0]?.key as CtaType) || undefined;
}
/** Platforms ordered best-first by measured performance. */
export function rankedPlatforms(p: LearnedPreferences): Platform[] {
  return p.platforms.map((r) => r.key as Platform);
}
