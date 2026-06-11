// ============================================================
// SignalRadar OS — per-sport intelligence view (PURE)
// ------------------------------------------------------------
// SwingVantage is multi-sport, so signals roll up per sport: volume,
// sentiment, the questions being asked, pain points, content openings,
// which competitors show up, and the highest-priority recent items.
// Pure + deterministic — reuses the same classified/scored signals.
// ============================================================

import type { Signal, SignalSport, DistributionBucket, SignalRadarConfig } from './types';
import { normalizeText } from './classify';

export interface SportView {
  sport: SignalSport;
  total: number;
  bySentiment: DistributionBucket[];
  topQuestions: Signal[];
  painPoints: Signal[];
  contentOpportunities: Signal[];
  topCompetitors: DistributionBucket[];
  recentHighPriority: Signal[];
  recommendedActions: string[];
}

const ACTIVE = (s: Signal) => s.status !== 'archived' && s.status !== 'ignored';

export function buildSportView(
  signals: Signal[],
  sport: SignalSport,
  config: SignalRadarConfig,
  competitors: { id: string; name: string; terms: string[]; enabled: boolean }[],
): SportView {
  const live = signals.filter((s) => ACTIVE(s) && s.classification.sport === sport);

  const sentimentCounts = new Map<string, number>();
  for (const s of live) {
    const k = s.classification.sentiment;
    sentimentCounts.set(k, (sentimentCounts.get(k) ?? 0) + 1);
  }
  const bySentiment = Array.from(sentimentCounts.entries())
    .map(([key, count]) => ({ key, label: key, count }))
    .sort((a, b) => b.count - a.count);

  const byPriority = (a: Signal, b: Signal) => b.scores.priority - a.scores.priority;

  const topQuestions = live
    .filter((s) => s.classification.intent === 'seo_content_opportunity' || s.classification.intent === 'product_question')
    .sort(byPriority)
    .slice(0, 5);

  const painPoints = live
    .filter((s) => s.classification.sentiment === 'negative' || s.classification.intent === 'bug_report' || s.classification.intent === 'support_issue')
    .sort(byPriority)
    .slice(0, 5);

  const contentOpportunities = live
    .filter((s) => s.classification.opportunity === 'create_content' || s.classification.intent === 'coaching_need')
    .sort(byPriority)
    .slice(0, 5);

  // Which competitors are named in this sport's signals.
  const compCounts = new Map<string, number>();
  for (const c of competitors.filter((x) => x.enabled)) {
    const terms = c.terms.map(normalizeText);
    const n = live.filter((s) => {
      const hay = normalizeText(`${s.title ?? ''} ${s.cleanText}`);
      return terms.some((t) => t && hay.includes(t));
    }).length;
    if (n > 0) compCounts.set(c.name, n);
  }
  const topCompetitors = Array.from(compCounts.entries())
    .map(([key, count]) => ({ key, label: key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recentHighPriority = [...live]
    .filter((s) => s.scores.priority >= 50)
    .sort((a, b) => (Date.parse(b.discoveredAt) || 0) - (Date.parse(a.discoveredAt) || 0))
    .slice(0, 5);

  const recommendedActions = deriveActions({ total: live.length, topQuestions, painPoints, topCompetitors });

  // `config` reserved for future per-sport keyword tuning; referenced to keep
  // the signature stable and avoid an unused-param lint.
  void config;

  return {
    sport,
    total: live.length,
    bySentiment,
    topQuestions,
    painPoints,
    contentOpportunities,
    topCompetitors,
    recentHighPriority,
    recommendedActions,
  };
}

function deriveActions(input: {
  total: number;
  topQuestions: Signal[];
  painPoints: Signal[];
  topCompetitors: DistributionBucket[];
}): string[] {
  const out: string[] = [];
  if (input.total === 0) return ['No signals for this sport yet — set up a Google Alert or import a feed to start tracking demand.'];
  if (input.topQuestions.length) out.push(`Answer ${input.topQuestions.length} recurring question${input.topQuestions.length === 1 ? '' : 's'} with a page, FAQ or tool.`);
  if (input.painPoints.length) out.push(`Address ${input.painPoints.length} pain point${input.painPoints.length === 1 ? '' : 's'} (negative / bug / support).`);
  if (input.topCompetitors.length) out.push(`Sharpen positioning vs ${input.topCompetitors[0].label} in this sport.`);
  out.push('Prioritize this sport’s surface if demand stays high.');
  return out;
}

/** The 7 canonical SwingVantage sports that can hold a per-sport view. */
export const VIEWABLE_SPORTS: SignalSport[] = [
  'golf', 'tennis', 'baseball', 'softball_fast', 'softball_slow', 'pickleball', 'padel',
];
