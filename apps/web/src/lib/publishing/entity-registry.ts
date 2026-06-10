// ============================================================
// PublishingOS — Publishable Areas registry (pure)
// ------------------------------------------------------------
// The honest operating map of every admin-controlled product surface: where its
// live value is read from today, how PublishingOS publishes it, its blast
// radius, and the recommended next integration step. This powers the
// "Publishable Areas Audit" view and keeps the system from pretending a surface
// is live-connected when it is really file-backed or mock-backed.
//
// Labels are deliberately conservative — never claim "live-connected" unless the
// public read path actually consults the durable override.
// ============================================================

import type { PublishEntityType, PublishMode, RiskLevel } from './types';
import { classifyRisk } from './risk';

/** Honesty label for how a surface currently reaches production. */
export type SourceLabel =
  | 'live-connected' // public read merges the durable PublishingOS override
  | 'db-ready' // durable store wired; public read migration pending
  | 'file-backed' // value lives in a git-tracked data file
  | 'mock-backed' // value comes from in-process seed/mock data
  | 'hardcoded' // value is inlined in source
  | 'needs-integration'; // no publish path yet

export interface PublishableArea {
  /** Stable key (also the nav/search anchor). */
  key: string;
  /** Human label shown in the audit table. */
  area: string;
  entityType: PublishEntityType;
  /** Where the live value is read from today. */
  source: SourceLabel;
  publishMode: PublishMode;
  riskLevel: RiskLevel;
  /** True when the public surface honours PublishingOS publish decisions. */
  liveConnected: boolean;
  /** The admin tool that controls this surface today. */
  adminHref: string;
  /** The public surface(s) this controls. */
  publicRoutes: string[];
  /** System/owner responsible. */
  owner: string;
  /** What to do next to make this fully live-connected. */
  recommendedAction: string;
}

/**
 * The catalog. `riskLevel` is derived from the same classifier the runtime
 * uses, so the audit and the live confirmation flow can never disagree.
 */
function area(
  partial: Omit<PublishableArea, 'riskLevel'> & { riskLevel?: RiskLevel },
): PublishableArea {
  return { riskLevel: classifyRisk(partial.entityType, 'publish'), ...partial };
}

export const PUBLISHABLE_AREAS: PublishableArea[] = [
  area({
    key: 'update',
    area: 'Product updates (changelog)',
    entityType: 'update',
    source: 'live-connected',
    publishMode: 'instant',
    liveConnected: true,
    adminHref: '/admin/publishing',
    publicRoutes: ['/updates'],
    owner: 'Content',
    recommendedAction: 'None — toggles persist to the durable override and the public list honours them.',
  }),
  area({
    key: 'dev-update',
    area: 'Developer updates',
    entityType: 'dev-update',
    source: 'db-ready',
    publishMode: 'instant',
    liveConnected: false,
    adminHref: '/admin/publishing',
    publicRoutes: ['/dev-updates'],
    owner: 'Content',
    recommendedAction: 'Wire /dev-updates read path to merge the durable override (mirror /updates).',
  }),
  area({
    key: 'seo-page',
    area: 'SEO / AEO / GEO pages',
    entityType: 'seo-page',
    source: 'file-backed',
    publishMode: 'hybrid',
    liveConnected: false,
    adminHref: '/admin/seo',
    publicRoutes: ['/seo/*'],
    owner: 'SEO',
    recommendedAction: 'Instant-publish state via override; new pages publish deploy-backed (source-controlled).',
  }),
  area({
    key: 'blog-post',
    area: 'Blog posts',
    entityType: 'blog-post',
    source: 'file-backed',
    publishMode: 'hybrid',
    liveConnected: false,
    adminHref: '/admin/content',
    publicRoutes: ['/blog/*'],
    owner: 'Content',
    recommendedAction: 'Merge durable override into effectiveBlogStatus read path.',
  }),
  area({
    key: 'milestone',
    area: 'Milestone authority pages',
    entityType: 'milestone',
    source: 'file-backed',
    publishMode: 'deploy_backed',
    liveConnected: false,
    adminHref: '/admin/milestones',
    publicRoutes: ['/updates/milestones/*'],
    owner: 'Growth',
    recommendedAction: 'Milestone pages are source-controlled — publish deploy-backed via a PR job.',
  }),
  area({
    key: 'library-video',
    area: 'Public training videos',
    entityType: 'library-video',
    source: 'file-backed',
    publishMode: 'instant',
    liveConnected: false,
    adminHref: '/admin/library',
    publicRoutes: ['/learn/*'],
    owner: 'Content',
    recommendedAction: 'Migrate library-publish-store overrides to the durable override store.',
  }),
  area({
    key: 'homepage-module',
    area: 'Homepage modules',
    entityType: 'homepage-module',
    source: 'hardcoded',
    publishMode: 'instant',
    liveConnected: false,
    adminHref: '/admin/publishing',
    publicRoutes: ['/'],
    owner: 'Marketing',
    recommendedAction: 'Extract module copy/order into a config entity, then DB-publish with homepage revalidation.',
  }),
  area({
    key: 'sport-config',
    area: 'Sport configuration',
    entityType: 'sport-config',
    source: 'file-backed',
    publishMode: 'hybrid',
    liveConnected: false,
    adminHref: '/admin/sports',
    publicRoutes: ['/golf', '/tennis', '/baseball', '/softball', '/pickleball', '/padel'],
    owner: 'Sports',
    recommendedAction: 'Instant-publish overridable fields; structural config changes stay deploy-backed.',
  }),
  area({
    key: 'feature-flag',
    area: 'Feature flags',
    entityType: 'feature-flag',
    source: 'db-ready',
    publishMode: 'instant',
    liveConnected: false,
    adminHref: '/admin/feature-flags',
    publicRoutes: ['(app-wide)'],
    owner: 'Engineering',
    recommendedAction: 'High-risk flag changes route through PublishingOS confirmation + audit.',
  }),
  area({
    key: 'announcement',
    area: 'Announcements',
    entityType: 'announcement',
    source: 'file-backed',
    publishMode: 'instant',
    liveConnected: false,
    adminHref: '/admin/publishing',
    publicRoutes: ['(global banner)'],
    owner: 'Marketing',
    recommendedAction: 'Move banner copy into an announcement entity with scheduled publish.',
  }),
  area({
    key: 'trust-copy',
    area: 'Trust / privacy copy',
    entityType: 'trust-copy',
    source: 'file-backed',
    publishMode: 'deploy_backed',
    liveConnected: false,
    adminHref: '/admin/legal',
    publicRoutes: ['/privacy', '/terms'],
    owner: 'Legal',
    recommendedAction: 'High-risk/legal — keep deploy-backed with explicit review; never instant.',
  }),
  area({
    key: 'roadmap-entry',
    area: 'Public roadmap',
    entityType: 'roadmap-entry',
    source: 'file-backed',
    publishMode: 'instant',
    liveConnected: false,
    adminHref: '/admin/development',
    publicRoutes: ['/dev-updates'],
    owner: 'Product',
    recommendedAction: 'Model roadmap entries as publishable entities with instant publish.',
  }),
];

/** Look up a single area by its entity type. */
export function areaForType(entityType: PublishEntityType): PublishableArea | undefined {
  return PUBLISHABLE_AREAS.find((a) => a.entityType === entityType);
}

/** Coverage rollup for the audit header. */
export interface AreasSummary {
  total: number;
  liveConnected: number;
  dbReady: number;
  fileBacked: number;
  needsIntegration: number;
  highRisk: number;
}

export function summarizeAreas(areas: PublishableArea[] = PUBLISHABLE_AREAS): AreasSummary {
  return {
    total: areas.length,
    liveConnected: areas.filter((a) => a.liveConnected).length,
    dbReady: areas.filter((a) => a.source === 'db-ready').length,
    fileBacked: areas.filter((a) => a.source === 'file-backed').length,
    needsIntegration: areas.filter((a) => a.source === 'needs-integration' || a.source === 'hardcoded').length,
    highRisk: areas.filter((a) => a.riskLevel === 'high' || a.riskLevel === 'critical').length,
  };
}
