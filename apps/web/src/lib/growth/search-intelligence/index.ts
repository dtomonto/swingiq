// ============================================================
// SearchIntelligenceOS — public surface
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   SearchIntelligenceOS is GrowthOS's Ahrefs-class "visibility brain". It
//   reuses the Link Intelligence agent (inventory, link graph, clusters, AEO,
//   backlinks) and adds: a technical SEO audit, page intelligence, a keyword
//   engine, content opportunities, sitemap/indexing intelligence, decay
//   detection, a content-brief generator, an explainable score battery, and a
//   prioritized growth-action feed. It NEVER fabricates rankings, volumes,
//   backlinks, or traffic — every value is honestly labeled.
//
//   Start here:  runSearchIntel()  → a full, in-memory analysis result.
// ============================================================

export { runSearchIntel, persistSearchIntel, type SearchIntelResult } from './engine';
export { listProjects, activeProject, projectById, PROJECTS } from './projects';
export { buildPageIntel, findPageIntel } from './page-intel';
export { auditSite } from './audit';
export { buildKeywords } from './keywords';
export { KEYWORD_SEEDS } from './keyword-seeds';
export { buildOpportunities } from './opportunities';
export { analyzeSitemap, buildSitemapPathSet, isInSitemap, isUtilityUrl, type SitemapAnalysis } from './sitemap-intel';
export { detectDecay } from './decay';
export { generateBrief } from './briefs';
export {
  parseCsv, parseCsvRows, toCsv, importKeywords, importRankings, importBacklinks, importByKind,
  type CsvValue, type ImportResult, type ImportKind,
} from './csv';
export { computeScores } from './scores';
export { synthesizeActions } from './actions';
export {
  scorePageQuality, scorePageBusinessValue, scorePagePriority,
  scoreKeywordOpportunity, scoreIssuePriority, scoreActionPriority, actionBand, clamp,
} from './scoring';
export type * from './types';
