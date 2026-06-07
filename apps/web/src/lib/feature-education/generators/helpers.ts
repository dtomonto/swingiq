// ============================================================
// SwingVantage — Feature Education Engine: Generator helpers
// ------------------------------------------------------------
// Shared, deterministic building blocks every generator uses so each
// generator stays small and consistent. Pure (no I/O).
// ============================================================

import {
  type FeatureRecord,
  type EducationAsset,
  type AssetType,
  type AssetSection,
  type FeatureEvidence,
  type FeatureAudience,
  DEFAULT_VISIBILITY,
} from '../types';

export interface GenContext {
  now?: Date;
  sourceCommit?: string;
}

/** The real refs an asset is allowed to cite (anti-hallucination). */
export function groundingFor(feature: FeatureRecord): FeatureEvidence[] {
  return feature.evidence.filter((e) =>
    ['route', 'component', 'api', 'db', 'flag', 'nav'].includes(e.kind),
  );
}

/** First user-facing route, else first route of any kind. */
export function primaryRoute(feature: FeatureRecord): string | undefined {
  return feature.routes.find((r) => !r.startsWith('/admin')) ?? feature.routes[0];
}

/** Honest "where to find it" line, grounded in real surfaces only. */
export function whereToFind(feature: FeatureRecord): string {
  if (feature.adminControls.length) {
    return `In the admin dashboard at ${feature.adminControls[0]}.`;
  }
  const route = primaryRoute(feature);
  if (route) return `In the app at ${route}.`;
  if (feature.apiEndpoints.length) return `Via the API endpoint ${feature.apiEndpoints[0]}.`;
  return 'This is an internal capability without a dedicated screen yet.';
}

export function audienceLabel(a: FeatureAudience): string {
  switch (a) {
    case 'new-user':
      return 'people new to SwingVantage';
    case 'returning-user':
      return 'returning athletes';
    case 'power-user':
      return 'experienced users who want the details';
    case 'admin':
      return 'admins and operators';
    case 'support':
      return 'the support team';
    case 'developer':
      return 'developers and integrators';
    case 'coach':
      return 'coaches working with athletes';
    case 'parent':
      return 'parents helping a young athlete';
    case 'enterprise':
      return 'teams and programs';
    default:
      return 'players, parents, and coaches';
  }
}

/** Pick the best audience for an asset from a feature's audiences. */
export function pickAudience(feature: FeatureRecord, fallback: FeatureAudience): FeatureAudience {
  if (feature.audiences.includes(fallback)) return fallback;
  return feature.audiences[0] ?? 'all';
}

/** Build sections from headings, pulling each body from a content map. */
export function sectionsFrom(
  headings: string[],
  content: Record<string, string[] | undefined>,
): AssetSection[] {
  return headings
    .map((heading) => ({ heading, body: content[heading] ?? [] }))
    .filter((s) => s.body.length > 0);
}

/** Common "related features / next steps" lines, grounded in real routes. */
export function relatedLines(feature: FeatureRecord): string[] {
  const lines: string[] = [];
  const route = primaryRoute(feature);
  if (route) lines.push(`Open it directly: ${route}`);
  lines.push('See the full release note for this feature for what changed and why.');
  lines.push('Browse the Tutorial Center for related walkthroughs.');
  return lines;
}

/**
 * Build the common skeleton of an EducationAsset, then merge the
 * generator's specifics. Sets honest defaults: draft status, deterministic
 * generator, grounding evidence, and needsHumanReview inherited from a
 * low-confidence feature.
 */
export function baseAsset(
  feature: FeatureRecord,
  type: AssetType,
  audience: FeatureAudience,
  specifics: Partial<EducationAsset> & Pick<EducationAsset, 'title' | 'summary' | 'sections'>,
  ctx: GenContext = {},
): EducationAsset {
  const now = ctx.now ?? new Date();
  const iso = now.toISOString();
  // An asset that cites no real surface can't be trusted to be accurate.
  const ungrounded = groundingFor(feature).length === 0;
  return {
    id: `asset_${feature.slug}_${type}`,
    featureId: feature.id,
    type,
    audience,
    slug: `${feature.slug}-${type}`,
    visibility: DEFAULT_VISIBILITY[type],
    status: 'draft',
    version: 1,
    sourceCommit: ctx.sourceCommit,
    generator: 'deterministic',
    groundedIn: groundingFor(feature),
    needsHumanReview: feature.needsHumanReview || ungrounded,
    createdAt: iso,
    updatedAt: iso,
    ...specifics,
  };
}
