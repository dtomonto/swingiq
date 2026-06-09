// ============================================================
// SearchIntelligenceOS — type system (the contract)
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   The shapes SearchIntelligenceOS reasons about — a Project/Site, an
//   enriched PageIntel record (metadata + indexability + graph signals),
//   technical issues, keywords, content opportunities, sitemap/indexing
//   intelligence, decay signals, content briefs, prioritized growth
//   actions, and the executive score battery.
//
//   Zero runtime logic — safe to import anywhere (server, client, tests).
//   Every value that can be uncertain carries a `DataSource` so the UI can
//   stay honest. We REUSE the Link Intelligence page model + the GrowthOS
//   primitives rather than inventing parallel ones.
// ============================================================

import type { DataSource, Scale, PriorityInputs } from '../types';
import type {
  PageType, LinkSport, LinkIntent, LinkFunnel, PageSource,
} from '../link-intelligence/types';

export type { DataSource, Scale, PriorityInputs };
export type { PageType, LinkSport, LinkIntent, LinkFunnel, PageSource };

// ──────────────────────────────────────────────────────────────
// Project / Site (§1) — SwingVantage today, multi-property ready.
// ──────────────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'planned' | 'paused';

export interface Project {
  id: string;
  name: string;
  domain: string;
  canonicalBaseUrl: string;
  projectType: string;
  connectedBusiness: string;
  status: ProjectStatus;
  crawlEnabled: boolean;
  gscConnected: boolean;
  analyticsConnected: boolean;
  sitemapUrl: string;
  robotsUrl: string;
  /** How this project's page data is sourced today. */
  dataSource: DataSource;
}

// ──────────────────────────────────────────────────────────────
// A 0..100 score plus the human-readable reasons behind it.
// ──────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  score: number;
  factors: string[];
}

// ──────────────────────────────────────────────────────────────
// Page Intelligence (§1 Tracked URL, §2.3) — REAL owned metadata.
// ──────────────────────────────────────────────────────────────

export type PagePublishStatus = 'published' | 'draft' | 'unknown';

export interface PageIntel {
  url: string;
  title: string;
  pageType: PageType;
  sport: LinkSport;
  cluster: string;
  source: PageSource;

  // ── Metadata (owned, real) ──
  metaTitle: string;
  metaTitleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number | null;
  keyword?: string;
  intent?: LinkIntent;
  funnelStage?: LinkFunnel;

  // ── Content signals ──
  /** null when the body is not in a registry we own (e.g. static routes). */
  wordCount: number | null;
  wordCountSource: DataSource;
  schemaTypes: string[];
  hasDirectAnswer: boolean;
  faqCount: number;

  // ── Indexing ──
  indexable: boolean;
  robots: string;
  inSitemap: boolean;
  canonicalUrl: string;
  publishStatus: PagePublishStatus;
  lastModified: string | null;

  // ── Internal-link graph (from the shared link graph) ──
  internalLinksIn: number;
  internalLinksOut: number;
  /** BFS hops from the homepage; Number.POSITIVE_INFINITY = orphan. */
  depth: number;
  isOrphan: boolean;

  // ── Computed, explainable scores ──
  qualityScore: number;
  priorityScore: number;
  businessValueScore: number;
  /** Provenance of the row as a whole. */
  dataSource: DataSource;
}

// ──────────────────────────────────────────────────────────────
// Technical SEO issues (§1, §2.7) — severity + explainable fix.
// ──────────────────────────────────────────────────────────────

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

export type IssueCategory =
  | 'metadata'
  | 'content'
  | 'indexability'
  | 'internal-links'
  | 'schema'
  | 'sitemap'
  | 'cannibalization'
  | 'performance';

export interface TechnicalIssue {
  id: string;
  issueType: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  /** The single most relevant URL (issues are emitted per affected page). */
  url: string | null;
  /** All affected URLs (>=1). */
  affectedUrls: string[];
  evidence: string;
  recommendedFix: string;
  fixComplexity: Scale;
  expectedImpact: Scale;
  confidence: number; // 0..100
  autoFixAvailable: boolean;
  requiresApproval: boolean;
  /** 0..100 priority for ordering the audit. */
  priorityScore: number;
  status: 'open' | 'in-progress' | 'resolved' | 'ignored';
  dataSource: DataSource;
}

// ──────────────────────────────────────────────────────────────
// Keywords (§1, §2.4) — relative scoring, honest source labels.
// ──────────────────────────────────────────────────────────────

export type KeywordSource = 'owned-page' | 'blog-tag' | 'seed' | 'imported' | 'gsc';

export interface KeywordRow {
  id: string;
  keyword: string;
  normalizedKeyword: string;
  intent: LinkIntent;
  funnelStage: LinkFunnel;
  topicCluster: string;
  sport: LinkSport;
  /** Relative 0..100 estimates (NOT real volumes) until a provider connects. */
  difficultyEstimate: number;
  volumeEstimate: number;
  source: KeywordSource;
  sourceConfidence: number; // 0..100
  /** The URL we already rank/target for this keyword, if any. */
  targetUrl: string | null;
  hasOwnedPage: boolean;
  opportunityScore: number;
  businessValueScore: number;
  contentGapScore: number;
  dataSource: DataSource;
  // ── Real Search Console signals (present only on GSC-sourced rows) ──
  /** Real average position from Search Console. */
  currentRank?: number | null;
  impressions?: number | null;
  clicks?: number | null;
  ctr?: number | null;
}

// ──────────────────────────────────────────────────────────────
// Google Search Console (§2.4/2.5/2.16) — real rank/impression data.
// ──────────────────────────────────────────────────────────────

export interface GscRow {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscSummary {
  rowCount: number;
  totalClicks: number;
  totalImpressions: number;
  avgPosition: number;
  avgCtr: number;
  fetchedAt: string;
}

export interface GscSnapshot {
  siteUrl: string;
  summary: GscSummary;
  keywords: KeywordRow[];
  rankings: RankingSnapshot[];
}

// ──────────────────────────────────────────────────────────────
// Imported rank + backlink rows (§2.5, §2.9) — from CSV import.
// These carry verified, user-provided values (DataSource 'imported').
// ──────────────────────────────────────────────────────────────

export interface RankingSnapshot {
  id: string;
  keyword: string;
  url: string;
  position: number;
  searchEngine: string;
  device: string;
  checkedAt: string;
  source: string;
  dataSource: DataSource;
}

export interface BacklinkRecord {
  id: string;
  sourceUrl: string;
  sourceDomain: string;
  targetUrl: string;
  anchorText: string;
  linkType: string;
  nofollow: boolean;
  firstSeen: string;
  authorityEstimate: number | null;
  dataSource: DataSource;
}

// ──────────────────────────────────────────────────────────────
// Content opportunities (§1, §2.6) — what to create next.
// ──────────────────────────────────────────────────────────────

export type OpportunityStatus =
  | 'idea' | 'approved' | 'in-draft' | 'published' | 'needs-refresh' | 'archived';

export interface ContentOpportunity {
  id: string;
  title: string;
  proposedSlug: string;
  contentType: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  searchIntent: LinkIntent;
  audience: string;
  funnelStage: LinkFunnel;
  topicCluster: string;
  sport: LinkSport;
  userPainPoint: string;
  whyItMatters: string;
  /** A page that already (partly) covers this, if any. */
  existingPageMatch: string | null;
  internalLinksToAdd: string[];
  schemaRecommendation: string;
  cta: string;
  estimatedBusinessValue: number;
  estimatedTrafficValue: number;
  authorityValue: number;
  priorityScore: number;
  confidenceScore: number;
  status: OpportunityStatus;
  dataSource: DataSource;
}

// ──────────────────────────────────────────────────────────────
// Sitemap & indexing intelligence (§2.14).
// ──────────────────────────────────────────────────────────────

export type SitemapFlag =
  | 'ok'
  | 'missing-from-sitemap'
  | 'in-sitemap-not-inventory'
  | 'utility-url'
  | 'noindex-conflict';

export interface SitemapEntry {
  url: string;
  inInventory: boolean;
  inSitemap: boolean;
  indexable: boolean;
  flag: SitemapFlag;
  note: string;
  /** 1..100 ordered submission/indexing priority (1 = submit first). */
  indexingPriority: number;
}

// ──────────────────────────────────────────────────────────────
// Content decay / refresh (§2.15) — heuristic until GSC connects.
// ──────────────────────────────────────────────────────────────

export type DecayReason =
  | 'stale-metadata' | 'thin-content' | 'weak-internal-links'
  | 'no-direct-answer' | 'aging-content' | 'missing-schema';

export interface DecaySignal {
  url: string;
  title: string;
  riskScore: number; // 0..100 (higher = more at risk)
  reasons: DecayReason[];
  recommendedAction: 'refresh' | 'expand' | 'merge' | 'redirect' | 'monitor';
  detail: string;
  dataSource: DataSource;
}

// ──────────────────────────────────────────────────────────────
// Content brief (§2.13) — deterministic, production-ready.
// ──────────────────────────────────────────────────────────────

export interface BriefInput {
  topic: string;
  targetKeyword?: string;
  sport?: LinkSport;
  intent?: LinkIntent;
  audience?: string;
}

export interface ContentBrief {
  objective: string;
  audience: string;
  searchIntent: LinkIntent;
  primaryKeyword: string;
  secondaryKeywords: string[];
  proposedSlug: string;
  titleOptions: string[];
  metaDescriptionOptions: string[];
  h1: string;
  outline: { heading: string; subpoints: string[] }[];
  directAnswerBlock: string;
  faqs: { question: string; answer: string }[];
  howToSteps: string[];
  schemaRecommendations: string[];
  internalLinksToAdd: string[];
  externalCitationNeeds: string[];
  cta: string;
  trustElements: string[];
  differentiationAngle: string;
  qualityChecklist: string[];
  aeoGeoChecklist: string[];
  noFabricationWarning: string;
}

// ──────────────────────────────────────────────────────────────
// Growth actions (§2.12) — the daily command center feed.
// ──────────────────────────────────────────────────────────────

export type ActionCategory =
  | 'technical' | 'content' | 'internal-links' | 'keywords'
  | 'indexing' | 'authority' | 'decay' | 'aeo-geo';

export type ActionBand = 'critical' | 'high' | 'medium' | 'low';

export interface SearchAction {
  id: string;
  title: string;
  category: ActionCategory;
  relatedUrl: string | null;
  summary: string;
  whyItMatters: string;
  evidence: string;
  recommendedSteps: string[];
  estimatedEffort: Scale;
  expectedOutcome: string;
  riskIfIgnored: string;
  completionCriteria: string;
  priorityScore: number;
  band: ActionBand;
  canClaudeImplement: boolean;
  requiresApproval: boolean;
  status: 'open' | 'in-progress' | 'done' | 'dismissed';
  dataSource: DataSource;
}

// ──────────────────────────────────────────────────────────────
// Executive score battery (§2.1).
// ──────────────────────────────────────────────────────────────

export interface SearchScores {
  searchHealth: ScoreBreakdown;
  technical: ScoreBreakdown;
  indexability: ScoreBreakdown;
  contentAuthority: ScoreBreakdown;
  internalLinking: ScoreBreakdown;
  keywordOpportunity: ScoreBreakdown;
  aeoReadiness: ScoreBreakdown;
  backlinkAuthority: ScoreBreakdown;
  growthMomentum: ScoreBreakdown;
}

// ──────────────────────────────────────────────────────────────
// Run log (§1 Crawl Run, adapted to a registry-derived "scan").
// ──────────────────────────────────────────────────────────────

export interface SearchIntelRun {
  id: string;
  name: string;
  projectId: string;
  dataSource: DataSource;
  ranAt: string;
  createdAt: string;
  updatedAt: string;
  pagesAnalyzed: number;
  issuesFound: number;
  criticalIssues: number;
  keywordsTracked: number;
  opportunitiesFound: number;
  actionsGenerated: number;
  searchHealth: number;
  summary: string;
  highlights: string[];
}
