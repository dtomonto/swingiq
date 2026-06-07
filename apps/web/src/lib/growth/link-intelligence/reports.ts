// ============================================================
// Link Intelligence Agent — report builder
// ------------------------------------------------------------
// Builds the weekly / monthly executive narrative from a run result. Pure +
// computed on demand (the LinkAgentRun record holds the persisted snapshot).
// ============================================================

import type {
  LinkAgentRun, LinkFinding, InternalLinkRecommendation, ClusterHealth,
  AiSearchOpportunity, LinkRunCadence,
} from './types';
import type { AuthorityOpportunity, CompetitorInsight } from '../types';

export interface ReportSection {
  heading: string;
  lines: string[];
}

export interface LinkReport {
  cadence: LinkRunCadence;
  title: string;
  createdAt: string;
  headline: string;
  sections: ReportSection[];
}

export interface ReportInput {
  run: LinkAgentRun;
  findings: LinkFinding[];
  recommendations: InternalLinkRecommendation[];
  opportunities: AuthorityOpportunity[];
  competitorGaps: CompetitorInsight[];
  aiSearch: AiSearchOpportunity[];
  clusters: ClusterHealth[];
}

const titleFor: Record<LinkRunCadence, string> = {
  daily: 'Daily link health check',
  weekly: 'Weekly link intelligence report',
  monthly: 'Monthly link strategy report',
  manual: 'Link intelligence report',
};

export function buildReport(cadence: LinkRunCadence, input: ReportInput): LinkReport {
  const { run, recommendations, opportunities, competitorGaps, aiSearch, clusters } = input;

  const autoSafe = recommendations.filter((r) => r.autoSafe).length;
  const topClusters = [...clusters].filter((c) => c.pageCount > 0).sort((a, b) => b.authorityScore - a.authorityScore);
  const weakAeo = aiSearch.slice(0, 5);

  const sections: ReportSection[] = [
    {
      heading: 'Internal link health',
      lines: [
        `Health score: ${run.internalLinkHealth}/100 across ${run.pagesAnalyzed} pages and ${run.internalLinksMapped} internal links.`,
        `${run.orphansFound} orphan page(s), ${run.brokenFound} broken internal link(s).`,
        `${run.recommendationsGenerated} internal-link recommendation(s) — ${autoSafe} safe to auto-apply, ${run.recommendationsGenerated - autoSafe} need review.`,
      ],
    },
    {
      heading: 'Backlink opportunities',
      lines: [
        `${run.backlinkOppsDiscovered} white-hat opportunit(ies) discovered (in Digital PR).`,
        ...opportunities.slice(0, 5).map((o) => `• ${o.opportunityType}: ${o.targetOutlet}`),
      ],
    },
    {
      heading: 'Competitor link gaps',
      lines: [
        `${run.competitorGapsFound} gap(s) identified (in Market Intelligence).`,
        ...competitorGaps.slice(0, 4).map((g) => `• ${g.competitor}: ${g.recommendedAction}`),
      ],
    },
    {
      heading: 'Sport cluster authority',
      lines: topClusters.slice(0, 8).map((c) => `• ${c.label}: ${c.authorityScore}/100 (${c.pageCount} pages, ${c.orphanCount} orphan, avg depth ${c.avgDepth})`),
    },
    {
      heading: 'AI search (AEO/GEO) readiness',
      lines: [
        `Average citation readiness: ${run.aeoReadiness}/100.`,
        ...weakAeo.map((a) => `• ${a.title} — ${a.score}/100: ${a.recommendations[0]}`),
      ],
    },
    {
      heading: 'Recommended next steps',
      lines: [
        autoSafe > 0 ? `Apply ${autoSafe} safe internal links (one click each).` : 'Review the highest-scored internal-link recommendations.',
        run.orphansFound > 0 ? `Fix ${run.orphansFound} orphan page(s) first — they're invisible to search.` : 'No orphans — keep it that way.',
        'Qualify the top backlink opportunities and draft outreach (human-approved).',
      ],
    },
  ];

  const headline =
    `Internal-link health ${run.internalLinkHealth}/100 · ${run.orphansFound} orphans · ${run.brokenFound} broken · ` +
    `${run.recommendationsGenerated} recs · ${run.backlinkOppsDiscovered} backlink opps.`;

  return {
    cadence,
    title: titleFor[cadence],
    createdAt: run.ranAt,
    headline,
    sections,
  };
}

/** Find the most relevant finding counts for quick headline stats. */
export function summarizeFindings(findings: LinkFinding[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const f of findings) counts[f.findingType] = (counts[f.findingType] ?? 0) + 1;
  return counts;
}
