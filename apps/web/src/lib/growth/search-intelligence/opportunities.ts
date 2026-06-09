// ============================================================
// SearchIntelligenceOS — Content Opportunity engine (§2.6)
// ------------------------------------------------------------
// Discovers, scores, and frames content to create next, from:
//   • keyword content gaps  — high-opportunity keywords with no owned page
//   • cluster missing topics — sub-topics a sport cluster should cover
//                              (from the existing computeClusterHealth)
// Each opportunity is a production-ready frame (slug, title, intent, internal
// links, schema, CTA, priority + confidence). Honest labels throughout.
// Pure + deterministic.
// ============================================================

import { slug as toSlug } from '../link-intelligence/id';
import { clusterById } from '../link-intelligence/clusters';
import { humanize } from '../format';
import { clamp } from './scoring';
import type { ClusterHealth } from '../link-intelligence/types';
import type {
  PageIntel, KeywordRow, ContentOpportunity, LinkSport, LinkIntent, LinkFunnel,
} from './types';

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function frameTitle(keyword: string, intent: LinkIntent): string {
  const k = keyword.trim();
  if (/^(how to|stop|fix)\b/i.test(k)) return titleCase(k);
  if (intent === 'commercial') return `${titleCase(k)}: How SwingVantage Helps`;
  return `${titleCase(k)} — A Practical Guide`;
}

function schemaFor(intent: LinkIntent, keyword: string): string {
  if (/\b(how to|drill|plan|fix|stop)\b/i.test(keyword)) return 'HowTo + FAQPage';
  if (intent === 'commercial') return 'Article + FAQPage';
  return 'Article';
}

function internalLinksFor(clusterId: string, pages: PageIntel[]): string[] {
  const inCluster = pages.filter((p) => p.cluster === clusterId);
  const pillar = inCluster.find((p) => p.pageType === 'sport-hub' || p.pageType === 'feature');
  const supporting = inCluster
    .filter((p) => p !== pillar)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 2);
  return [pillar?.url, ...supporting.map((p) => p.url)].filter(Boolean) as string[];
}

function mk(input: {
  key: string; title: string; keyword: string; sport: LinkSport;
  intent: LinkIntent; funnelStage: LinkFunnel; clusterId: string;
  secondaryKeywords: string[]; pages: PageIntel[]; priority: number;
  confidence: number; existingMatch: string | null; whyItMatters: string;
}): ContentOpportunity {
  const businessValue = clamp(input.priority);
  return {
    id: `si-opp-${toSlug(input.key)}`,
    title: input.title,
    proposedSlug: input.sport === 'multi' ? toSlug(input.keyword) : `${input.sport}/${toSlug(input.keyword)}`,
    contentType: /\b(how to|drill|plan|fix|stop)\b/i.test(input.keyword) ? 'how-to' : 'seo-page',
    targetKeyword: input.keyword,
    secondaryKeywords: input.secondaryKeywords,
    searchIntent: input.intent,
    audience: 'player',
    funnelStage: input.funnelStage,
    topicCluster: input.clusterId,
    sport: input.sport,
    userPainPoint: `Players searching "${input.keyword}" want a clear, trustworthy answer + a way to act on it.`,
    whyItMatters: input.whyItMatters,
    existingPageMatch: input.existingMatch,
    internalLinksToAdd: internalLinksFor(input.clusterId, input.pages),
    schemaRecommendation: schemaFor(input.intent, input.keyword),
    cta: 'Analyze your swing free with SwingVantage',
    estimatedBusinessValue: businessValue,
    estimatedTrafficValue: clamp(input.priority * 0.8),
    authorityValue: clamp(input.priority * 0.6),
    priorityScore: input.priority,
    confidenceScore: input.confidence,
    status: 'idea',
    dataSource: input.existingMatch ? 'estimated' : 'placeholder',
  };
}

/**
 * Build content opportunities from keyword gaps + cluster missing topics.
 * `minOpportunity` filters keyword gaps to the highest-value ones.
 */
export function buildOpportunities(
  keywords: KeywordRow[],
  clusters: ClusterHealth[],
  pages: PageIntel[],
  opts: { minOpportunity?: number } = {},
): ContentOpportunity[] {
  const min = opts.minOpportunity ?? 55;
  const bySlug = new Map<string, ContentOpportunity>();

  // 1) Keyword content gaps (no owned page).
  const gaps = keywords.filter((k) => !k.hasOwnedPage && k.opportunityScore >= min);
  for (const k of gaps) {
    const secondary = keywords
      .filter((o) => o.topicCluster === k.topicCluster && o.id !== k.id)
      .slice(0, 2)
      .map((o) => o.keyword);
    const opp = mk({
      key: k.normalizedKeyword,
      title: frameTitle(k.keyword, k.intent),
      keyword: k.keyword,
      sport: k.sport,
      intent: k.intent,
      funnelStage: k.funnelStage,
      clusterId: k.topicCluster,
      secondaryKeywords: secondary,
      pages,
      priority: k.opportunityScore,
      confidence: k.sourceConfidence,
      existingMatch: null,
      whyItMatters: `No page targets "${k.keyword}" yet — a strong gap in the ${humanize(k.topicCluster)} cluster.`,
    });
    bySlug.set(opp.proposedSlug, opp);
  }

  // 2) Cluster missing topics (topical-authority completeness).
  for (const c of clusters) {
    if (c.pageCount === 0) continue;
    for (const topic of c.missingTopics.slice(0, 4)) {
      const def = clusterById(c.id);
      const sport = (def?.sport ?? 'multi') as LinkSport;
      const opp = mk({
        key: `${c.id}-${topic}`,
        title: `${titleCase(topic)} (${c.label})`,
        keyword: topic,
        sport,
        intent: 'informational',
        funnelStage: 'consideration',
        clusterId: c.id,
        secondaryKeywords: [],
        pages,
        priority: clamp(60 + (100 - c.authorityScore) * 0.3),
        confidence: 70,
        existingMatch: null,
        whyItMatters: `"${topic}" completes the ${c.label} topic cluster (authority ${c.authorityScore}/100) and strengthens internal-link silo depth.`,
      });
      if (!bySlug.has(opp.proposedSlug)) bySlug.set(opp.proposedSlug, opp);
    }
  }

  return Array.from(bySlug.values()).sort((a, b) => b.priorityScore - a.priorityScore);
}
