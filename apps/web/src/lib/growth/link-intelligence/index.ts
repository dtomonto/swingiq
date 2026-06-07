// ============================================================
// Link Intelligence Agent — public surface
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   The Link Intelligence Agent is GrowthOS's "links brain". It reads your
//   real pages, maps how they link to each other, and continuously improves:
//     • internal links (orphans, broken, depth, anchors, recommendations)
//     • backlink opportunities (white-hat → Digital PR)
//     • competitor link gaps (→ Market Intelligence)
//     • AEO/GEO citation readiness + linkable-asset content ideas
//   It NEVER fakes data and NEVER sends outreach without human approval.
//
//   Start here:  runLinkAgent()  → a full, in-memory analysis result.
// ============================================================

export { runLinkAgent, persistLinkAgentResult, type LinkAgentResult } from './agent';
export { buildInventory, normalizeUrl } from './inventory';
export { buildLinkGraph } from './link-graph';
export { analyzeFindings, recommendInternalLinks } from './internal-links';
export { classifyAnchor, buildAnchorProfile, buildAllAnchorProfiles } from './anchor';
export { CLUSTERS, clusterForPage, clusterById, computeClusterHealth } from './clusters';
export { analyzeAiSearch } from './ai-search';
export { discoverBacklinkOpportunities } from './backlinks';
export { discoverCompetitorGaps } from './competitors';
export { discoverContentGaps } from './content-gaps';
export { draftOutreach, makeApprovalTask, advanceOutreach, OUTREACH_PIPELINE } from './outreach';
export { buildReport, summarizeFindings, type LinkReport } from './reports';
export { deriveNotifications } from './notifications';
export {
  scoreInternalLink, scorePageEquity, scoreBacklinkOpportunity, scoreCitation, ANCHOR_QUALITY,
} from './scoring';
export {
  evaluateAutoApply, validateWhiteHat, SAFE_AUTO_APPLY_MIN_SCORE, ALWAYS_REQUIRES_APPROVAL,
  BLACKLISTED_TACTICS,
} from './guardrails';
export { providerStatuses, anyProviderConfigured, ALL_PROVIDERS } from './adapters';
export { AGENT_OWNER, TARGET_DOMAIN } from './constants';
export { INTERNAL_LINK_RECS_SEED, LINK_FINDINGS_SEED, LINK_RUNS_SEED } from './seed';
export type * from './types';
