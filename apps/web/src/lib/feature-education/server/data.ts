// ============================================================
// SwingVantage — Feature Education Engine: server data layer
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   The one place the admin pages + API routes get their data. It:
//     - reads the registry (repo, which falls back to the committed snapshot),
//     - refreshes each feature's coverage from its generated assets,
//     - runs the app-map scan (Video Studio surfaces + admin nav) to enrich
//       and keep the registry current ("Scan now"),
//     - computes gaps, drift, and a coverage summary for the dashboard.
//
//   Server-only (imports the admin nav + repo). Never import from a client
//   component.
// ============================================================

import { APP_SURFACES } from '@/lib/video-studio';
import { NAV_ITEMS } from '@/lib/admin/nav';
import { getRepo } from '../repo';
import {
  featureFromSurface,
  featureFromNav,
  mergeFeatures,
  type SurfaceLike,
  type NavLike,
} from '../detection';
import {
  refreshCoverage,
  computeGaps,
  coverageSummary,
  warrantedAssetTypes,
  gapForFeature,
} from '../coverage';
import { detectDrift } from '../drift';
import { SEEDED_IN_APP_HELP } from './seed-help';
import {
  makeFeeAudit,
  type FeatureRecord,
  type EducationAsset,
  type ContentGap,
  type DriftFinding,
  type AssetVersion,
  type FeeAuditLog,
} from '../types';

/** Build feature records from the live app map (surfaces + admin nav). */
export function appMapFeatures(now: Date = new Date()): FeatureRecord[] {
  const surfaceFeatures = APP_SURFACES.map((s) => {
    const like: SurfaceLike = {
      id: s.id,
      page: s.page,
      label: s.label,
      description: s.description,
      audience: s.audience,
      sport: s.sport,
      isPublic: s.traits.isPublic,
    };
    return featureFromSurface(like, now);
  });
  const navFeatures = NAV_ITEMS.map((n) => {
    const like: NavLike = {
      id: n.id,
      label: n.label,
      href: n.href,
      blurb: n.blurb,
      permission: n.permission,
      built: n.built,
    };
    return featureFromNav(like, now);
  });
  return mergeFeatures([], [...surfaceFeatures, ...navFeatures]);
}

/** Load the registry with coverage recomputed from current assets. */
export async function loadFeatures(now: Date = new Date()): Promise<FeatureRecord[]> {
  const repo = getRepo();
  const [features, assets] = await Promise.all([repo.listFeatures(), repo.listAssets()]);
  return features
    .map((f) => refreshCoverage(f, assets, now))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Re-detect from the app map, merge into the registry, recompute coverage +
 * drift, and persist. This is the admin "Scan now" action.
 */
export async function runScan(actor = 'admin', now: Date = new Date()): Promise<{
  features: FeatureRecord[];
  drift: DriftFinding[];
  detected: number;
}> {
  const repo = getRepo();
  const [previous, assets] = await Promise.all([repo.listFeatures(), repo.listAssets()]);
  const detected = appMapFeatures(now);
  const merged = mergeFeatures(previous, detected).map((f) => refreshCoverage(f, assets, now));

  await repo.upsertFeatures(merged);

  const drift = detectDrift(merged, assets, { previous, now });
  await repo.saveDrift(drift);
  await repo.appendAudit(
    makeFeeAudit('scan', 'registry', `Scanned app map: ${merged.length} features, ${drift.length} drift findings.`, {
      actor,
      detail: { features: merged.length, detected: detected.length, drift: drift.length },
      now,
    }),
  );

  return { features: merged.sort((a, b) => a.name.localeCompare(b.name)), drift, detected: detected.length };
}

export interface OverviewData {
  features: FeatureRecord[];
  assets: EducationAsset[];
  gaps: ContentGap[];
  drift: DriftFinding[];
  summary: ReturnType<typeof coverageSummary>;
  audit: FeeAuditLog[];
  persistent: boolean;
  backend: string;
  needsReviewCount: number;
}

/** Everything the dashboard overview needs, in one call. */
export async function loadOverview(now: Date = new Date()): Promise<OverviewData> {
  const repo = getRepo();
  const [rawFeatures, assets, storedDrift, audit] = await Promise.all([
    repo.listFeatures(),
    repo.listAssets(),
    repo.listDrift(),
    repo.listAudit(20),
  ]);
  const features = rawFeatures
    .map((f) => refreshCoverage(f, assets, now))
    .sort((a, b) => a.name.localeCompare(b.name));
  const gaps = computeGaps(features, assets, now);
  const drift = storedDrift.length ? storedDrift : detectDrift(features, assets, { now });
  const needsReviewCount = assets.filter((a) => a.status === 'needs-review' || a.needsHumanReview).length;
  return {
    features,
    assets,
    gaps,
    drift,
    summary: coverageSummary(features),
    audit,
    persistent: repo.isPersistent(),
    backend: repo.backendLabel(),
    needsReviewCount,
  };
}

export interface FeatureDetailData {
  feature: FeatureRecord;
  assets: EducationAsset[];
  versionsByAsset: Record<string, AssetVersion[]>;
  warranted: ReturnType<typeof warrantedAssetTypes>;
  gap: ContentGap | null;
}

/** Full detail for one feature (assets + versions + gap). */
export async function loadFeatureDetail(
  id: string,
  now: Date = new Date(),
): Promise<FeatureDetailData | null> {
  const repo = getRepo();
  const feature = await repo.getFeature(id);
  if (!feature) return null;
  const allAssets = await repo.listAssetsForFeature(id);
  const withCov = refreshCoverage(feature, allAssets, now);
  const versionsByAsset: Record<string, AssetVersion[]> = {};
  await Promise.all(
    allAssets.map(async (a) => {
      versionsByAsset[a.id] = await repo.listVersions(a.id);
    }),
  );
  return {
    feature: withCov,
    assets: allAssets.sort((a, b) => a.type.localeCompare(b.type)),
    versionsByAsset,
    warranted: warrantedAssetTypes(withCov),
    gap: gapForFeature(withCov, allAssets, now),
  };
}

/** Lightweight counts for the Command Center alert (no full overview build). */
export async function loadAlertCounts(now: Date = new Date()): Promise<{
  features: number;
  gaps: number;
  drift: number;
  needsReview: number;
}> {
  const repo = getRepo();
  const [features, assets, drift] = await Promise.all([
    repo.listFeatures(),
    repo.listAssets(),
    repo.listDrift(),
  ]);
  const withCov = features.map((f) => refreshCoverage(f, assets, now));
  const gaps = computeGaps(withCov, assets, now);
  const needsReview = assets.filter((a) => a.status === 'needs-review' || a.needsHumanReview).length;
  return { features: withCov.length, gaps: gaps.length, drift: drift.length, needsReview };
}

/** Published in-app help, queryable by route (the in-app reader uses this). */
export async function publishedInAppHelpForRoute(route: string): Promise<EducationAsset[]> {
  const repo = getRepo();
  const stored = await repo.listAssets();
  // Union committed/curated seed cards with repo assets so published help shows
  // out of the box regardless of backend. A repo asset with the same id wins
  // (set last), so the admin pipeline can override or retire a seeded card.
  const byId = new Map<string, EducationAsset>();
  for (const a of [...SEEDED_IN_APP_HELP, ...stored]) byId.set(a.id, a);
  return [...byId.values()].filter(
    (a) => a.type === 'in-app-help' && a.status === 'published' && a.inAppHelp?.route === route,
  );
}
