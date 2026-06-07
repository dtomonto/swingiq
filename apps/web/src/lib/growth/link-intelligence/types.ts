// ============================================================
// Link Intelligence Agent — analysis types (GrowthOS-native)
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   The shapes the agent computes IN MEMORY from your real pages — the
//   page inventory, the internal-link graph, anchor profiles, cluster
//   health, and explainable score breakdowns. The *persisted* record
//   types (what shows up in GrowthOS tables) live in ../types.ts and are
//   re-exported here for convenience.
//
//   Zero runtime logic — safe to import anywhere (server, client, tests).
// ============================================================

import type {
  InternalLinkRecommendation, LinkFinding, LinkAgentRun, AnchorKind,
  LinkFindingSeverity, LinkFindingType, LinkFindingStatus, LinkRunCadence,
  InternalLinkStatus,
} from '../types';

export type {
  InternalLinkRecommendation, LinkFinding, LinkAgentRun, AnchorKind,
  LinkFindingSeverity, LinkFindingType, LinkFindingStatus, LinkRunCadence,
  InternalLinkStatus,
};

/** Coarse page category used to drive internal-link rules. */
export type PageType =
  | 'home'
  | 'sport-hub'
  | 'feature'
  | 'blog'
  | 'tutorial'
  | 'seo-programmatic'
  | 'tool'
  | 'comparison'
  | 'glossary'
  | 'faq'
  | 'partner'
  | 'challenge'
  | 'benchmark'
  | 'sample-report'
  | 'video'
  | 'legal'
  | 'other';

/** Sport a page belongs to (multi = cross-sport / brand). */
export type LinkSport = 'golf' | 'tennis' | 'pickleball' | 'padel' | 'baseball' | 'softball' | 'multi';

export type LinkIntent = 'informational' | 'commercial' | 'transactional' | 'navigational';
export type LinkFunnel = 'awareness' | 'consideration' | 'conversion';

/** Where a page came from in the inventory build (provenance, for honesty). */
export type PageSource = 'seo-catalog' | 'library' | 'blog' | 'static';

/** One internal link declared on a page (source → destination + anchor). */
export interface LinkEdge {
  from: string; // site-relative path, leading slash
  to: string;   // site-relative path, leading slash
  anchor: string;
  /** Set during graph build: destination is not a known page. */
  broken?: boolean;
}

/** A single page in the site inventory + its computed link signals. */
export interface PageNode {
  /** Site-relative path with a leading slash, e.g. "/golf/fix-slice". */
  url: string;
  title: string;
  pageType: PageType;
  sport: LinkSport;
  cluster: string;
  keyword?: string;
  intent?: LinkIntent;
  funnelStage?: LinkFunnel;
  /** 1 (highest) .. 5 (lowest) — build/SEO priority. */
  priority: number;
  /** Declared internal links out of this page (from relatedLinks etc.). */
  outboundLinks: LinkEdge[];
  source: PageSource;
  /** True for money/conversion pages — guardrails forbid auto-editing these. */
  sensitive: boolean;

  // ── computed during graph build ──
  inboundCount: number;
  outboundCount: number;
  /** BFS hops from the homepage; Number.POSITIVE_INFINITY = orphan. */
  depth: number;
}

/** The whole internal link graph. */
export interface LinkGraph {
  nodes: PageNode[];
  edges: LinkEdge[];
  /** url → node, for O(1) lookups. */
  byUrl: Map<string, PageNode>;
}

/** Per-destination anchor-text profile (anchor diversity / over-optimization). */
export interface AnchorProfile {
  destinationUrl: string;
  total: number;
  byKind: Record<AnchorKind, number>;
  topAnchors: { anchor: string; count: number }[];
  /** 0..100 — higher is healthier (more diverse). */
  diversityScore: number;
  /** True when one exact-match anchor dominates (manipulation risk). */
  overOptimized: boolean;
}

/** Topical-authority cluster health. */
export interface ClusterHealth {
  id: string;
  label: string;
  sport: LinkSport;
  pillarUrl?: string;
  pageCount: number;
  supportingCount: number;
  orphanCount: number;
  /** Average BFS depth of pages in the cluster (lower = better crawl). */
  avgDepth: number;
  /** Internal links pointing at the pillar page. */
  inboundToPillar: number;
  /** 0..100 — overall cluster authority/interlinking health. */
  authorityScore: number;
  /** Cluster sub-topics with no published page yet (content gaps). */
  missingTopics: string[];
}

/** A 0..100 score plus the human-readable reasons behind it. */
export interface ScoreBreakdown {
  score: number;
  factors: string[];
}

/** AEO/GEO citation readiness for one page. */
export interface AiSearchOpportunity {
  url: string;
  title: string;
  sport: LinkSport;
  score: number;
  factors: string[];
  /** Concrete, ordered suggestions to raise citation likelihood. */
  recommendations: string[];
}

/** A dashboard/notification item the agent raises. */
export type LinkNotificationKind =
  | 'orphan' | 'broken-link' | 'rec-ready' | 'outreach-approval'
  | 'toxic-backlink' | 'cluster-decline' | 'report-ready' | 'provider-disconnected';

export interface LinkNotification {
  id: string;
  kind: LinkNotificationKind;
  severity: LinkFindingSeverity;
  title: string;
  detail: string;
  href?: string;
  createdAt: string;
}
