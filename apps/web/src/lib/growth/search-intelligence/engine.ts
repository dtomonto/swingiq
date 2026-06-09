// ============================================================
// SearchIntelligenceOS — orchestrator (§ build-order 4/10)
// ------------------------------------------------------------
// `runSearchIntel()` is PURE (no I/O): it runs the Link Intelligence agent
// ONCE (reusing its inventory, graph, findings, clusters, AEO analysis,
// backlink + competitor discovery — never rebuilding them) and layers the new
// SearchIntelligenceOS engines on top (page intel, technical audit, keywords,
// opportunities, sitemap, decay, scores, actions). Powers live dashboard
// rendering + tests.
//
// `persistSearchIntel()` is the thin, separate persistence layer — it upserts
// the run + actions into growth_records when Supabase is configured, and is a
// graceful no-op otherwise (the dashboards recompute live, like the Link
// Intelligence pages).
// ============================================================

import { runLinkAgent, type LinkAgentResult } from '../link-intelligence';
import { buildPageIntel } from './page-intel';
import { auditSite } from './audit';
import { buildKeywords } from './keywords';
import { buildOpportunities } from './opportunities';
import { detectDecay } from './decay';
import { analyzeSitemap, type SitemapAnalysis } from './sitemap-intel';
import { computeScores } from './scores';
import { synthesizeActions } from './actions';
import { activeProject } from './projects';
import type {
  Project, PageIntel, TechnicalIssue, KeywordRow, ContentOpportunity,
  DecaySignal, SearchScores, SearchAction, SearchIntelRun, RankingSnapshot, GscSummary,
} from './types';

export interface SearchIntelResult {
  project: Project;
  run: SearchIntelRun;
  pages: PageIntel[];
  issues: TechnicalIssue[];
  keywords: KeywordRow[];
  opportunities: ContentOpportunity[];
  decay: DecaySignal[];
  sitemap: SitemapAnalysis;
  scores: SearchScores;
  actions: SearchAction[];
  /** The full Link Intelligence result (reused panels: AEO, backlinks, gaps, clusters). */
  link: LinkAgentResult;
  /** Real Search Console rankings when a snapshot was synced + passed in. */
  gscRankings: RankingSnapshot[];
  gscSummary: GscSummary | null;
  gscConnected: boolean;
}

export interface RunSearchIntelOptions {
  env?: NodeJS.ProcessEnv;
  now?: number;
  /** Real GSC keyword rows (from a synced snapshot) — merged over estimates. */
  gscKeywords?: KeywordRow[];
  gscRankings?: RankingSnapshot[];
  gscSummary?: GscSummary | null;
}

export function runSearchIntel(opts: RunSearchIntelOptions = {}): SearchIntelResult {
  const env = opts.env ?? process.env;
  const now = opts.now ?? Date.now();
  const ranAt = new Date(now).toISOString();
  const project = activeProject();

  // Reuse the Link Intelligence agent (single inventory + graph build).
  const link = runLinkAgent({ cadence: 'manual', env });

  const pages = buildPageIntel(link.graph);
  const issues = auditSite(pages, link.findings);
  const keywords = buildKeywords(pages, { gsc: opts.gscKeywords });
  const opportunities = buildOpportunities(keywords, link.clusters, pages);
  const decay = detectDecay(pages, now);
  const sitemap = analyzeSitemap(pages);

  const scores = computeScores({
    pages, issues, keywords, decay,
    internalLinkHealth: link.run.internalLinkHealth,
    aeoReadiness: link.run.aeoReadiness,
    backlinkOpportunityScore: link.run.backlinkOpportunityScore,
    backlinkProviderConnected: link.providerConnected,
  });

  const actions = synthesizeActions({ issues, opportunities, decay });

  const criticalIssues = issues.filter((i) => i.severity === 'critical').length;
  const run: SearchIntelRun = {
    id: `si-run-${project.id}-${ranAt.slice(0, 10)}`,
    name: `Scan — ${ranAt.slice(0, 10)}`,
    projectId: project.id,
    dataSource: 'real',
    ranAt,
    createdAt: ranAt,
    updatedAt: ranAt,
    pagesAnalyzed: pages.length,
    issuesFound: issues.length,
    criticalIssues,
    keywordsTracked: keywords.length,
    opportunitiesFound: opportunities.length,
    actionsGenerated: actions.length,
    searchHealth: scores.searchHealth.score,
    summary: `${pages.length} pages · health ${scores.searchHealth.score}/100 · ${issues.length} issues (${criticalIssues} critical) · ${keywords.length} keywords · ${opportunities.length} opportunities · ${actions.length} actions.`,
    highlights: [
      `Search health ${scores.searchHealth.score}/100 (technical ${scores.technical.score}, content ${scores.contentAuthority.score}).`,
      actions[0] ? `Top action: ${actions[0].title}.` : 'No urgent actions — nice.',
      `${sitemap.missingFromSitemap} indexable page(s) missing from the sitemap.`,
    ],
  };

  return {
    project, run, pages, issues, keywords, opportunities, decay, sitemap, scores, actions, link,
    gscRankings: opts.gscRankings ?? [],
    gscSummary: opts.gscSummary ?? null,
    gscConnected: Boolean(opts.gscKeywords && opts.gscKeywords.length > 0),
  };
}

/**
 * Persist the run + actions into growth_records (server-only). Upserts by id.
 * No-ops gracefully when Supabase isn't configured — the dashboards recompute
 * live on every load, so persistence is a convenience, not a requirement.
 */
export async function persistSearchIntel(result: SearchIntelResult): Promise<{ persisted: number }> {
  const now = new Date().toISOString();
  const rows = [
    { id: result.run.id, kind: 'search-run', data: result.run, created_at: now, updated_at: now },
    ...result.actions.map((a) => ({ id: a.id, kind: 'search-action', data: a, created_at: now, updated_at: now })),
  ];

  try {
    const { createSupabaseAdminClient } = await import('@/lib/supabase-admin');
    const client = createSupabaseAdminClient();
    if (client) {
      const { error } = await client.from('growth_records').upsert(rows, { onConflict: 'id' });
      if (!error) return { persisted: rows.length };
    }
  } catch {
    // fall through — persistence is best-effort
  }
  return { persisted: 0 };
}
