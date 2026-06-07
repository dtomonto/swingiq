// ============================================================
// Link Intelligence Agent — competitor link-gap engine
// ------------------------------------------------------------
// Emits competitor backlink GAPS as GrowthOS CompetitorInsight records
// (kind `competitor`, insightType "backlink-gap") so they flow into the
// existing Market Intelligence module. Until a real backlink API is
// connected, gaps are curated hypotheses labeled `placeholder` (the live
// adapter would replace these with measured competitor backlinks).
// ============================================================

import type { CompetitorInsight, Scale } from '../types';
import { anyProviderConfigured } from './adapters';
import { AGENT_OWNER } from './constants';
import { id } from './id';

interface GapSeed {
  key: string;
  competitor: string;
  evidence: string;
  marketingImplication: string;
  recommendedAction: string;
  swingVantagePage: string;
  confidence: Scale;
}

// Competitor CATEGORIES (not individual brands) + the link patterns they tend
// to earn that SwingVantage can realistically compete for. White-hat only.
const GAPS: GapSeed[] = [
  { key: 'golf-app-review-roundups', competitor: 'AI golf swing analysis apps', evidence: 'Competing golf apps are commonly listed in "best golf swing apps" review roundups and golf-tech blogs.', marketingImplication: 'SwingVantage is missing from many of these roundups despite a free tier.', recommendedAction: 'Request inclusion in relevant golf-app comparison articles; lead with the free analysis differentiator.', swingVantagePage: '/golf-swing-analysis', confidence: 'medium' },
  { key: 'tennis-coach-directories', competitor: 'Tennis video analysis tools', evidence: 'Tennis analysis tools earn links from coaching directories and academy resource pages.', marketingImplication: 'SwingVantage has little presence on tennis coaching resource pages.', recommendedAction: 'Pitch the free tennis analysis page to coaching directories + UTR/USTA community resources.', swingVantagePage: '/tennis-swing-analysis', confidence: 'medium' },
  { key: 'baseball-recruiting-links', competitor: 'Baseball/softball hitting apps', evidence: 'Hitting apps earn links from travel-ball orgs and recruiting resource pages.', marketingImplication: 'Youth org + recruiting resource links are an open, realistic gap.', recommendedAction: 'Offer the exit-velocity guide + recruiting-video tool to youth orgs and recruiting sites.', swingVantagePage: '/blog/baseball-exit-velocity-guide', confidence: 'medium' },
  { key: 'pickleball-fast-growth', competitor: 'Pickleball coaching platforms', evidence: 'Pickleball is fast-growing with relatively low backlink competition on technique content.', marketingImplication: 'First-mover opportunity for technique guides that earn editorial links.', recommendedAction: 'Publish + pitch authoritative pickleball technique guides to community sites and newsletters.', swingVantagePage: '/blog/pickleball-third-shot-drop-guide', confidence: 'medium' },
  { key: 'padel-low-competition', competitor: 'Padel training apps', evidence: 'Padel English-language technique content is sparse; competitors have thin backlink profiles here.', marketingImplication: 'Strong, defensible authority opportunity in an underserved niche.', recommendedAction: 'Build the padel technique cluster and earn links from padel community sites.', swingVantagePage: '/blog/padel-bandeja-explained', confidence: 'low' },
  { key: 'sports-tech-press', competitor: 'Sports-tech startups broadly', evidence: 'Sports-tech startups earn coverage via data-led PR stories and launch platforms.', marketingImplication: 'SwingVantage can earn editorial links with original swing-fault data.', recommendedAction: 'Run a data-led digital-PR story from aggregated, anonymized benchmark data.', swingVantagePage: '/benchmarks', confidence: 'medium' },
];

/**
 * Discover competitor backlink gaps as CompetitorInsight records.
 * Deterministic ids → idempotent. `env` only affects honest labeling.
 */
export function discoverCompetitorGaps(env: NodeJS.ProcessEnv = process.env): CompetitorInsight[] {
  const now = new Date().toISOString();
  const providerConnected = anyProviderConfigured(env);

  return GAPS.map((g) => ({
    id: id('competitor-li', g.key),
    name: `Backlink gap: ${g.competitor}`,
    dataSource: providerConnected ? 'estimated' : 'placeholder',
    owner: AGENT_OWNER,
    notes: `Suggested SwingVantage page to compete: ${g.swingVantagePage}.`,
    createdAt: now,
    updatedAt: now,
    competitor: g.competitor,
    insightType: 'backlink-gap',
    funnelImplication: 'Authority/awareness — backlinks improve organic discovery upstream of the funnel.',
    productImplication: 'None directly; informs which content the product surfaces.',
    marketingImplication: g.marketingImplication,
    confidence: g.confidence,
    evidence: providerConnected
      ? g.evidence
      : `${g.evidence} (Hypothesis from known patterns — connect a backlink API for measured competitor links.)`,
    recommendedAction: g.recommendedAction,
    status: 'idea',
  }));
}
