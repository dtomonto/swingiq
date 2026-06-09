// ============================================================
// SearchIntelligenceOS — Content decay / refresh detection (§2.15)
// ------------------------------------------------------------
// Without Search Console traffic we cannot SEE clicks decline, so we flag
// pages STRUCTURALLY at risk of decay (thin, weakly linked, no direct answer,
// missing schema, aging) and label every signal `estimated`. When GSC is
// connected, real click/impression/rank deltas replace these heuristics.
// Pure + deterministic (accepts `now` for testability).
// ============================================================

import type { PageIntel, DecaySignal, DecayReason } from './types';
import { clamp } from './scoring';

const AGING_DAYS = 180;

const ACTION_BY_REASON: Record<DecayReason, DecaySignal['recommendedAction']> = {
  'thin-content': 'expand',
  'weak-internal-links': 'refresh',
  'no-direct-answer': 'refresh',
  'missing-schema': 'refresh',
  'stale-metadata': 'refresh',
  'aging-content': 'refresh',
};

export function detectDecay(pages: PageIntel[], now: number = Date.now()): DecaySignal[] {
  const out: DecaySignal[] = [];

  for (const p of pages) {
    const reasons: DecayReason[] = [];
    let risk = 0;

    if (p.wordCount !== null && p.wordCount < 400) { reasons.push('thin-content'); risk += 28; }
    if (p.internalLinksIn <= 1) { reasons.push('weak-internal-links'); risk += 22; }
    if (p.source === 'seo-catalog' && !p.hasDirectAnswer) { reasons.push('no-direct-answer'); risk += 16; }
    if (p.schemaTypes.length === 0 && (p.source === 'seo-catalog' || p.source === 'blog')) { reasons.push('missing-schema'); risk += 10; }

    if (p.lastModified) {
      const ageDays = (now - new Date(p.lastModified).getTime()) / 86_400_000;
      if (ageDays > AGING_DAYS) { reasons.push('aging-content'); risk += Math.min(20, (ageDays - AGING_DAYS) / 30 * 4); }
    }

    const riskScore = clamp(risk);
    if (riskScore < 35 || reasons.length === 0) continue;

    out.push({
      url: p.url,
      title: p.title,
      riskScore,
      reasons,
      recommendedAction: ACTION_BY_REASON[reasons[0]],
      detail: `Structural decay risk on a ${p.pageType} page: ${reasons.map((r) => r.replace(/-/g, ' ')).join(', ')}.`,
      dataSource: 'estimated',
    });
  }

  return out.sort((a, b) => b.riskScore - a.riskScore);
}
