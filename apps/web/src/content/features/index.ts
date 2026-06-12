// ============================================================
// SwingVantage — Public Feature Registry (index + helpers)
// ------------------------------------------------------------
// Aggregates the per-theme shards into one ordered catalogue and exposes the
// helpers the /features hub and /features/[slug] detail pages use. Keeping the
// data in shards (each <600 lines) avoids the merge-conflict churn that the big
// single-file registries caused (see roadmap #20).
// ============================================================

import type { Feature, FeatureGroup } from './types';
import { ANALYSIS_FEATURES } from './features.analysis';
import { TRAINING_FEATURES } from './features.training';
import { PROGRESS_FEATURES } from './features.progress';
import { EQUIPMENT_FEATURES } from './features.equipment';
import { PLATFORM_FEATURES } from './features.platform';

export type { Feature, FeatureGroup, FeatureGuideStep, FeatureFaq, FeatureLink } from './types';

/** Every feature, flat. Order within a group is the array order in each shard. */
export const ALL_FEATURES: Feature[] = [
  ...ANALYSIS_FEATURES,
  ...TRAINING_FEATURES,
  ...PROGRESS_FEATURES,
  ...EQUIPMENT_FEATURES,
  ...PLATFORM_FEATURES,
];

/** Display order of groups on the /features hub (mirrors the original page). */
export const GROUP_ORDER: string[] = [
  'Swing Diagnosis',
  'Data Import',
  'Training & Drills',
  '3D Motion Analysis — Motion Lab',
  'Equipment',
  'Progress & AI Coach',
  'Cross-Sport Intelligence',
  'Recruiting',
  'Health & Readiness — BodySync',
  'Learn & Reference',
  'Data Safety',
];

/** Features grouped + ordered for the hub. */
export const FEATURE_GROUPS: FeatureGroup[] = GROUP_ORDER.map((heading) => ({
  heading,
  features: ALL_FEATURES.filter((f) => f.group === heading),
})).filter((g) => g.features.length > 0);

const BY_SLUG: Map<string, Feature> = new Map(ALL_FEATURES.map((f) => [f.slug, f]));

/** Look up a feature by slug (without leading slash). */
export function getFeature(slug: string): Feature | undefined {
  return BY_SLUG.get(slug);
}

/** All feature slugs — for generateStaticParams + sitemap. */
export function allFeatureSlugs(): string[] {
  return ALL_FEATURES.map((f) => f.slug);
}

/** Resolve a feature's related features to full objects (skips dangling slugs). */
export function relatedFeatures(feature: Feature): Feature[] {
  return (feature.relatedSlugs ?? [])
    .map((s) => BY_SLUG.get(s))
    .filter((f): f is Feature => Boolean(f));
}

/** Public URL path for a feature detail page. */
export function featureHref(feature: Pick<Feature, 'slug'>): string {
  return `/features/${feature.slug}`;
}
