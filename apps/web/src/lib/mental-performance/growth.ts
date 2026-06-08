// ============================================================
// SwingVantage — Mental Performance × GrowthOS
//
// Surfaces growth opportunities (SEO/AEO/blog/social/internal-link/email/
// tutorial) from the routine library coverage + CentralIntelligenceOS
// insights. Deterministic + keyless. Helpful-first, never spammy.
// ============================================================

import type {
  MentalGrowthOpportunity, MentalIntelligenceSignals, MentalSport,
} from './types';
import { MENTAL_ROUTINES } from './routines';
import { generateMentalInsights } from './intelligence';

const sportLabel = (s: MentalSport): string =>
  s === 'universal' ? 'Multi-sport'
    : s === 'softball_slow' ? 'Slow-Pitch Softball'
      : s === 'softball_fast' ? 'Fast-Pitch Softball'
        : s.charAt(0).toUpperCase() + s.slice(1);

let n = 0;
const oppId = () => `mp-opp-${(n += 1)}`;

/**
 * Build the mental-performance growth opportunity list. `signals` (optional)
 * pulls in CIOS demand to prioritize gaps; without it, opportunities come
 * from routine coverage alone.
 */
export function generateMentalOpportunities(
  signals?: MentalIntelligenceSignals,
): MentalGrowthOpportunity[] {
  const out: MentalGrowthOpportunity[] = [];

  // 1) An AEO/SEO answer page per seeded routine (high-intent, helpful).
  for (const r of MENTAL_ROUTINES) {
    const primary = r.sports[0];
    out.push({
      id: oppId(),
      opportunityType: 'aeo_answer',
      sport: primary,
      keywordCluster: `${sportLabel(primary).toLowerCase()} ${r.situation.toLowerCase()}`,
      recommendedAsset: `/mental-performance/${primary}/${r.slug}`,
      rationale: `"${r.title}" answers a real in-competition question and already exists as a routine — publish/strengthen the matching page.`,
      priorityScore: r.durationSeconds <= 30 ? 78 : 64,
      status: 'open',
    });
  }

  // 2) Internal-link opportunities: analysis/fault → reset routine.
  out.push({
    id: oppId(), opportunityType: 'internal_link', sport: 'universal',
    keywordCluster: 'analysis to mental reset',
    recommendedAsset: 'Link swing-analysis & Fix Stack outputs → matching reset routine',
    rationale: 'Each diagnosed fault has a matching reset routine (routineForContext). Linking them turns a mechanical fix into a complete fix.',
    priorityScore: 82, status: 'open',
  });
  out.push({
    id: oppId(), opportunityType: 'internal_link', sport: 'universal',
    keywordCluster: 'sport hubs to mental hub',
    recommendedAsset: 'Link each sport marketing hub → /mental-performance/[sport]',
    rationale: 'Strengthens topical authority and routes high-intent traffic to the mental pillar.',
    priorityScore: 70, status: 'open',
  });

  // 3) Social + blog from the highest-signal patterns (if we have signals).
  const insights = signals ? generateMentalInsights(signals) : [];
  for (const i of insights.filter((i) => i.kind === 'pattern' && i.sport).slice(0, 4)) {
    out.push({
      id: oppId(), opportunityType: 'social', sport: i.sport ?? 'universal',
      keywordCluster: i.title.toLowerCase(),
      recommendedAsset: `Short-form (Reels/TikTok/Shorts): "${i.title}"`,
      rationale: i.detail,
      priorityScore: 60, status: 'open',
    });
    out.push({
      id: oppId(), opportunityType: 'blog', sport: i.sport ?? 'universal',
      keywordCluster: i.title.toLowerCase(),
      recommendedAsset: `Blog post expanding: "${i.title}"`,
      rationale: 'Pattern has enough demand to justify a long-form, helpful-first article.',
      priorityScore: 55, status: 'open',
    });
  }

  // 4) Onboarding / email loop.
  out.push({
    id: oppId(), opportunityType: 'email', sport: 'universal',
    keywordCluster: 'mental onboarding sequence',
    recommendedAsset: 'Email mini-series: one reset routine per day for 5 days',
    rationale: 'Low-cost retention loop introducing the pillar through the most-used short routines.',
    priorityScore: 52, status: 'open',
  });
  out.push({
    id: oppId(), opportunityType: 'tutorial', sport: 'universal',
    keywordCluster: 'how to use mental performance',
    recommendedAsset: 'Tutorial: "Reset after a mistake in 20 seconds"',
    rationale: 'Feature-education coverage for the new pillar (reuses the existing tutorial pipeline).',
    priorityScore: 50, status: 'open',
  });

  return out.sort((a, b) => b.priorityScore - a.priorityScore);
}

/** Coverage gaps: sports with no sport-specific routine yet (future expansion). */
export function routineCoverageGaps(): MentalSport[] {
  const covered = new Set<MentalSport>();
  for (const r of MENTAL_ROUTINES) for (const s of r.sports) covered.add(s);
  const all: MentalSport[] = ['golf', 'tennis', 'pickleball', 'padel', 'baseball', 'softball_slow', 'softball_fast'];
  return all.filter((s) => !covered.has(s));
}
