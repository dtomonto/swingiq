// ============================================================
// SwingVantage — Owner Insights: the growth framework (strategy)
// ------------------------------------------------------------
// Encodes the North-Star + funnel the whole product is steering toward,
// aligned to the canonical go-to-market order: GROW FREE USERS → ADS →
// MEMBERSHIP (see docs/MONETIZATION_STRATEGY.md). This is always known —
// it's the scoreboard, independent of which analytics provider is wired.
// ============================================================

import type { FunnelStage, NorthStar } from './types';

export const NORTH_STAR: NorthStar = {
  name: 'Weekly Active Improvers',
  definition:
    'Players who complete at least one swing check or logged practice action in a 7-day window.',
  why:
    'It rewards the two things that matter pre-revenue at once — people showing up (growth) and ' +
    'getting value (engagement). Ads and memberships only work later if this number is real and rising.',
};

/** The AARRR funnel, framed for SwingVantage and the current GTM phase. */
export const FUNNEL: FunnelStage[] = [
  {
    id: 'acquisition',
    label: 'Acquisition',
    question: 'Are new players discovering SwingVantage?',
    metric: 'New signups / week (organic + referral + SEO)',
    target: 'Compounding week over week',
    phase: 'now',
  },
  {
    id: 'activation',
    label: 'Activation',
    question: 'Do new players reach their first “aha”?',
    metric: '% of signups who complete a first swing check',
    target: '≥ 40% activate',
    phase: 'now',
  },
  {
    id: 'retention',
    label: 'Retention',
    question: 'Do players keep coming back?',
    metric: 'Weekly Active Improvers + week-1 return rate',
    target: '≥ 25% return in week 1',
    phase: 'now',
  },
  {
    id: 'referral',
    label: 'Referral',
    question: 'Do players bring other players?',
    metric: 'Credited referral signups ÷ inviters (K-factor)',
    target: 'Climbing toward 0.5+',
    phase: 'now',
  },
  {
    id: 'revenue',
    label: 'Revenue',
    question: 'Can engaged free users be monetized — gently?',
    metric: 'Ad RPM first, then membership conversion',
    target: 'Ads first (Phase 2); membership later (Phase 3)',
    phase: 'next',
  },
];

export function stageById(id: FunnelStage['id']): FunnelStage | undefined {
  return FUNNEL.find((s) => s.id === id);
}
