// ============================================================
// SignalRadar OS — Strategy Brief generator (PURE)
// ------------------------------------------------------------
// Distills the whole signal set into a short, decision-ready brief:
// what changed, what matters, what to do next, which sport needs
// attention, which competitor is gaining attention, what content to
// create, what product issue to fix, what reputation risk to watch, and
// the single top opportunity. Deterministic — derived from the dashboard
// roll-up + signals, never fabricated.
// ============================================================

import type {
  Signal, SignalDashboard, CompetitorInsight, SignalSport,
} from './types';
import { SPORT_LABEL, OPPORTUNITY_LABEL } from './labels';

export interface StrategyBriefAction {
  action: string;
  detail: string;
  signalId?: string;
  priority: number;
}

export interface StrategyBrief {
  signalCount: number;
  headline: string;
  highlights: string[];
  topActions: StrategyBriefAction[];
  sportToWatch: { sport: SignalSport; label: string; count: number } | null;
  competitorGainingAttention: { name: string; count: number } | null;
  contentToCreate: { title: string; signalId: string }[];
  productToFix: { title: string; signalId: string }[];
  reputationToWatch: { title: string; signalId: string }[];
  topOpportunity: { title: string; action: string; signalId: string } | null;
}

const summarize = (s: Signal, n = 80) => (s.title || s.cleanText).slice(0, n);

export function buildStrategyBrief(
  signals: Signal[],
  dashboard: SignalDashboard,
  competitorInsights: CompetitorInsight[],
): StrategyBrief {
  const live = signals.filter((s) => s.status !== 'archived' && s.status !== 'ignored');
  const byPriority = (a: Signal, b: Signal) => b.scores.priority - a.scores.priority;

  // Sport to watch — busiest known sport.
  const topSportBucket = dashboard.bySport.find((b) => b.key !== 'unknown' && b.key !== 'multi_sport');
  const sportToWatch = topSportBucket
    ? { sport: topSportBucket.key as SignalSport, label: SPORT_LABEL[topSportBucket.key as SignalSport] ?? topSportBucket.label, count: topSportBucket.count }
    : null;

  // Competitor gaining attention — most-referenced.
  const topComp = competitorInsights.find((c) => c.signalCount > 0);
  const competitorGainingAttention = topComp ? { name: topComp.competitorName, count: topComp.signalCount } : null;

  const contentToCreate = live
    .filter((s) => s.classification.intent === 'seo_content_opportunity' || s.classification.intent === 'coaching_need')
    .sort(byPriority).slice(0, 3)
    .map((s) => ({ title: summarize(s), signalId: s.id }));

  const productToFix = live
    .filter((s) => s.classification.intent === 'bug_report' || s.classification.intent === 'feature_request')
    .sort(byPriority).slice(0, 3)
    .map((s) => ({ title: summarize(s), signalId: s.id }));

  const reputationToWatch = live
    .filter((s) => s.classification.intent === 'reputation_risk' || s.classification.sentiment === 'negative')
    .sort(byPriority).slice(0, 3)
    .map((s) => ({ title: summarize(s), signalId: s.id }));

  const topActions: StrategyBriefAction[] = dashboard.needsAttention.slice(0, 5).map((s) => ({
    action: OPPORTUNITY_LABEL[s.classification.opportunity],
    detail: summarize(s, 90),
    signalId: s.id,
    priority: s.scores.priority,
  }));

  const topSignal = [...live].sort(byPriority)[0];
  const topOpportunity = topSignal
    ? { title: summarize(topSignal, 90), action: OPPORTUNITY_LABEL[topSignal.classification.opportunity], signalId: topSignal.id }
    : null;

  // Highlights — honest, count-derived "what matters".
  const highlights: string[] = [];
  const t = dashboard.totals;
  if (t.newCount) highlights.push(`${t.newCount} new signal${t.newCount === 1 ? '' : 's'} to review.`);
  if (t.highPriority) highlights.push(`${t.highPriority} high-priority item${t.highPriority === 1 ? '' : 's'} need action.`);
  if (t.negativeRisk) highlights.push(`${t.negativeRisk} negative / reputation signal${t.negativeRisk === 1 ? '' : 's'} to watch.`);
  if (t.seoOpportunities) highlights.push(`${t.seoOpportunities} SEO / content opportunit${t.seoOpportunities === 1 ? 'y' : 'ies'}.`);
  if (t.backlinkOpportunities) highlights.push(`${t.backlinkOpportunities} backlink lead${t.backlinkOpportunities === 1 ? '' : 's'}.`);
  if (sportToWatch) highlights.push(`${sportToWatch.label} is the most active sport (${sportToWatch.count}).`);
  if (competitorGainingAttention) highlights.push(`${competitorGainingAttention.name} is the most-referenced competitor (${competitorGainingAttention.count}).`);
  if (!highlights.length) highlights.push('No signals yet — add or import to generate a brief.');

  const headline = live.length === 0
    ? 'No signals collected yet'
    : `${live.length} active signal${live.length === 1 ? '' : 's'}` +
      (sportToWatch ? ` · focus: ${sportToWatch.label}` : '') +
      (t.highPriority ? ` · ${t.highPriority} high-priority` : '');

  return {
    signalCount: live.length,
    headline,
    highlights,
    topActions,
    sportToWatch,
    competitorGainingAttention,
    contentToCreate,
    productToFix,
    reputationToWatch,
    topOpportunity,
  };
}
