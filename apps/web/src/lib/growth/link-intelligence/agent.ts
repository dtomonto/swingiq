// ============================================================
// Link Intelligence Agent — orchestrator
// ------------------------------------------------------------
// Ties the engine together. `runLinkAgent()` is PURE (no I/O) so it's fast +
// testable and powers live dashboard rendering. `persistLinkAgentResult()`
// writes the run's records into GrowthOS's repositories (so they appear in
// Internal Links, Digital PR, Market Intelligence, Recommendations, and the
// run log) — it upserts by deterministic id, so re-runs don't duplicate.
// ============================================================

import type {
  LinkGraph, LinkFinding, InternalLinkRecommendation, ClusterHealth,
  AiSearchOpportunity, AnchorProfile, LinkNotification, LinkAgentRun, LinkRunCadence,
} from './types';
import type { AuthorityOpportunity, CompetitorInsight, AIRecommendation } from '../types';
import { buildInventory } from './inventory';
import { buildLinkGraph } from './link-graph';
import { analyzeFindings, recommendInternalLinks } from './internal-links';
import { buildAllAnchorProfiles } from './anchor';
import { computeClusterHealth } from './clusters';
import { analyzeAiSearch } from './ai-search';
import { discoverBacklinkOpportunities } from './backlinks';
import { discoverCompetitorGaps } from './competitors';
import { discoverContentGaps } from './content-gaps';
import { deriveNotifications } from './notifications';
import { anyProviderConfigured } from './adapters';
import { id } from './id';
import { AGENT_OWNER } from './constants';

export interface LinkAgentResult {
  run: LinkAgentRun;
  graph: LinkGraph;
  findings: LinkFinding[];
  recommendations: InternalLinkRecommendation[];
  backlinkOpportunities: AuthorityOpportunity[];
  competitorGaps: CompetitorInsight[];
  contentGaps: AIRecommendation[];
  aiSearch: AiSearchOpportunity[];
  clusters: ClusterHealth[];
  anchorProfiles: AnchorProfile[];
  notifications: LinkNotification[];
  providerConnected: boolean;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function internalLinkHealth(graph: LinkGraph, findings: LinkFinding[]): number {
  const total = graph.nodes.length || 1;
  const orphans = findings.filter((f) => f.findingType === 'orphan').length;
  const weak = findings.filter((f) => f.findingType === 'weak-inlinks').length;
  const broken = findings.filter((f) => f.findingType === 'broken-internal').length;
  const finiteDepths = graph.nodes.map((n) => n.depth).filter((d) => Number.isFinite(d));
  const avgDepth = finiteDepths.length ? finiteDepths.reduce((a, b) => a + b, 0) / finiteDepths.length : 0;

  const orphanPenalty = (orphans / total) * 100 * 0.35;
  const weakPenalty = (weak / total) * 100 * 0.15;
  const brokenPenalty = Math.min(20, broken) * 1.5;
  const depthPenalty = clamp(Math.max(0, (avgDepth - 2.5) * 6));
  return clamp(100 - orphanPenalty - weakPenalty - brokenPenalty - Math.min(20, depthPenalty));
}

function avgBacklinkScore(opps: AuthorityOpportunity[]): number {
  const scores = opps.map((o) => Number(o.notes?.match(/score (\d+)/i)?.[1] ?? 0)).filter((n) => n > 0);
  return scores.length ? clamp(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}

/** Run the full agent in-memory (no persistence). Safe for tests + live render. */
export function runLinkAgent(opts: { cadence?: LinkRunCadence; env?: NodeJS.ProcessEnv } = {}): LinkAgentResult {
  const cadence = opts.cadence ?? 'manual';
  const env = opts.env ?? process.env;
  const ranAt = new Date().toISOString();

  const nodes = buildInventory();
  const graph = buildLinkGraph(nodes);

  const findings = analyzeFindings(graph);
  const recommendations = recommendInternalLinks(graph);
  const anchorProfiles = buildAllAnchorProfiles(graph.nodes, graph.edges);
  const clusters = computeClusterHealth(graph);
  const aiSearch = analyzeAiSearch(graph);

  const backlinkOpportunities = discoverBacklinkOpportunities(env);
  const competitorGaps = discoverCompetitorGaps(env);
  const contentGaps = discoverContentGaps();

  const providerConnected = anyProviderConfigured(env);
  const internalLinksMapped = graph.edges.filter((e) => graph.byUrl.has(e.from) && graph.byUrl.has(e.to)).length;
  const orphansFound = findings.filter((f) => f.findingType === 'orphan').length;
  const brokenFound = findings.filter((f) => f.findingType === 'broken-internal').length;

  const health = internalLinkHealth(graph, findings);
  const backlinkOpportunityScore = avgBacklinkScore(backlinkOpportunities);
  const aeoReadiness = aiSearch.length ? clamp(aiSearch.reduce((a, b) => a + b.score, 0) / aiSearch.length) : 0;

  const run: LinkAgentRun = {
    id: id('link-run', cadence, ranAt),
    name: `${cadence} run — ${ranAt.slice(0, 10)}`,
    dataSource: 'real',
    owner: AGENT_OWNER,
    createdAt: ranAt,
    updatedAt: ranAt,
    cadence,
    ranAt,
    pagesAnalyzed: graph.nodes.length,
    internalLinksMapped,
    orphansFound,
    brokenFound,
    recommendationsGenerated: recommendations.length,
    backlinkOppsDiscovered: backlinkOpportunities.length,
    competitorGapsFound: competitorGaps.length,
    internalLinkHealth: health,
    backlinkOpportunityScore,
    aeoReadiness,
    summary: `Analyzed ${graph.nodes.length} pages · health ${health}/100 · ${orphansFound} orphans · ${brokenFound} broken · ${recommendations.length} internal-link recs · ${backlinkOpportunities.length} backlink opps.`,
    highlights: [
      `${recommendations.filter((r) => r.autoSafe).length} internal links are safe to auto-apply.`,
      orphansFound > 0 ? `${orphansFound} orphan page(s) need a contextual inbound link.` : 'No orphan pages — good.',
      `${backlinkOpportunities.length} white-hat backlink opportunities ready to qualify.`,
    ],
  };

  const notifications = deriveNotifications({ findings, recommendations, opportunities: backlinkOpportunities, clusters, providerConnected });

  return {
    run, graph, findings, recommendations, backlinkOpportunities, competitorGaps,
    contentGaps, aiSearch, clusters, anchorProfiles, notifications, providerConnected,
  };
}

/**
 * Persist a run into GrowthOS repositories (server-only). Upserts by id.
 *
 * IMPORTANT: internal-link recommendations + audit findings are NOT bulk-saved
 * here — they're recomputable and rendered LIVE on their pages, and a single
 * rec persists on demand when a human acts on it (the apply API). We only
 * persist the records OTHER modules consume (backlink opps → Digital PR,
 * competitor gaps → Market Intel, content ideas → Recommendations) plus the
 * run log. This keeps a DB-backed run to ~30 fast upserts (no function-timeout
 * risk) instead of ~150 sequential round-trips.
 */
export async function persistLinkAgentResult(result: LinkAgentResult): Promise<{ persisted: number }> {
  const now = new Date().toISOString();
  const rows = [
    ...result.backlinkOpportunities.map((d) => ({ id: d.id, kind: 'authority', data: d, created_at: now, updated_at: now })),
    ...result.competitorGaps.map((d) => ({ id: d.id, kind: 'competitor', data: d, created_at: now, updated_at: now })),
    ...result.contentGaps.map((d) => ({ id: d.id, kind: 'recommendation', data: d, created_at: now, updated_at: now })),
    { id: result.run.id, kind: 'link-run', data: result.run, created_at: now, updated_at: now },
  ];

  // Fast path: ONE bulk upsert when Supabase is configured (avoids ~N slow
  // round-trips → function timeouts). Matches the growth_records shape.
  const { createSupabaseAdminClient } = await import('@/lib/supabase-admin');
  const client = createSupabaseAdminClient();
  if (client) {
    const { error } = await client.from('growth_records').upsert(rows, { onConflict: 'id' });
    if (!error) return { persisted: rows.length };
    // fall through to the in-process store on error (e.g. table missing)
  }

  // Keyless / error fallback: in-process memory store (instant).
  const { authorityRepo, competitorsRepo, recommendationsRepo, linkRunsRepo } = await import('../repository');
  await Promise.all([
    ...result.backlinkOpportunities.map((d) => authorityRepo.create(d)),
    ...result.competitorGaps.map((d) => competitorsRepo.create(d)),
    ...result.contentGaps.map((d) => recommendationsRepo.create(d)),
    linkRunsRepo.create(result.run),
  ]);
  return { persisted: rows.length };
}
