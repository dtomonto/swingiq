// ============================================================
// SwingVantage — Feature Education Engine: Coverage & Gaps
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Given a feature and the assets generated for it, this answers three
//   questions the dashboard lives on:
//     1. Which learning assets does this feature WARRANT? (not every
//        feature needs every asset — an admin tool doesn't need an SEO
//        article; a backend API doesn't need an onboarding walkthrough.)
//     2. What's its coverage matrix right now? (missing / draft / published)
//     3. Where are the gaps, ranked by impact? (spec §17)
//
//   Pure and deterministic — no I/O.
// ============================================================

import {
  type FeatureRecord,
  type EducationAsset,
  type AssetType,
  type ContentGap,
  type CoverageEntry,
  type CoverageMatrix,
  ASSET_TYPES,
} from './types';

/**
 * Decide which asset types a feature warrants, from honest rules about what
 * the feature is and who it's for. This is the backbone of gap detection.
 */
export function warrantedAssetTypes(feature: FeatureRecord): AssetType[] {
  const set = new Set<AssetType>();
  const isAdmin = feature.category === 'admin-capability' || feature.audiences.includes('admin');
  const isApiOnly =
    feature.category === 'backend-api' && feature.routes.length === 0 && !isAdmin;
  const isUserFacing = feature.routes.some((r) => !r.startsWith('/admin')) || feature.audiences.some((a) => ['new-user', 'returning-user', 'power-user', 'all', 'parent', 'coach'].includes(a));
  const isPublic = feature.routes.some((r) => !r.startsWith('/admin') && !r.startsWith('/api'));
  const removed = feature.status === 'removed' || feature.category === 'removed';

  // Removed/deprecated features need only a release/migration note.
  if (removed) {
    set.add('release-note');
    set.add('support-enablement');
    return [...set];
  }

  // Always-on baseline for anything that ships.
  set.add('release-note');
  set.add('support-enablement');

  if (isUserFacing) {
    set.add('tutorial');
    set.add('how-to');
    set.add('faq');
    set.add('in-app-help');
    set.add('video-brief');
    set.add('manual');
    set.add('troubleshooting');
  }

  // First-run guidance for net-new user-facing features.
  if (isUserFacing && (feature.category === 'new-feature' || feature.audiences.includes('new-user'))) {
    set.add('onboarding');
  }

  if (isAdmin) {
    set.add('admin-guide');
    set.add('how-to');
    set.add('troubleshooting');
    set.add('course-module'); // staff academy
  }

  if (isApiOnly) {
    set.add('how-to'); // integration how-to for developers
    set.add('troubleshooting');
  }

  // Public, search-valuable surfaces get an SEO/AEO article.
  if (isPublic) {
    set.add('seo-article');
    set.add('faq');
  }

  return ASSET_TYPES.filter((t) => set.has(t)); // stable order
}

const STALE_AFTER_DAYS = 120;
const WEAK_SCORE = 70;

function isStale(updatedAt: string | undefined, now: Date): boolean {
  if (!updatedAt) return false;
  const ageMs = now.getTime() - new Date(updatedAt).getTime();
  return ageMs > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

/** Map an asset's status into a coverage status. */
function coverageStatusFor(asset: EducationAsset, now: Date): CoverageEntry['status'] {
  if (isStale(asset.updatedAt, now)) return 'stale';
  switch (asset.status) {
    case 'published':
      return 'published';
    case 'approved':
      return 'approved';
    case 'needs-review':
      return 'needs-review';
    case 'deprecated':
    case 'archived':
      return 'stale';
    default:
      return 'draft';
  }
}

/** Recompute the coverage matrix on a feature from its assets. */
export function refreshCoverage(
  feature: FeatureRecord,
  assets: EducationAsset[],
  now: Date = new Date(),
): FeatureRecord {
  const matrix: CoverageMatrix = {};
  // Prefer the most advanced asset per type (published > approved > draft).
  const rank: Record<CoverageEntry['status'], number> = {
    published: 5,
    approved: 4,
    'needs-review': 3,
    draft: 2,
    stale: 1,
    missing: 0,
  };
  for (const a of assets.filter((x) => x.featureId === feature.id)) {
    const status = coverageStatusFor(a, now);
    const entry: CoverageEntry = {
      status,
      assetId: a.id,
      score: a.quality?.overall,
      updatedAt: a.updatedAt,
    };
    const existing = matrix[a.type];
    if (!existing || rank[status] >= rank[existing.status]) matrix[a.type] = entry;
  }
  return { ...feature, coverage: matrix };
}

/**
 * Compute the prioritized content gap for one feature: which warranted
 * assets are missing or weak, plus a 0–100 priority.
 */
export function gapForFeature(
  feature: FeatureRecord,
  assets: EducationAsset[],
  now: Date = new Date(),
): ContentGap | null {
  const warranted = warrantedAssetTypes(feature);
  const withCoverage = refreshCoverage(feature, assets, now);
  const cov = withCoverage.coverage;

  const missing: AssetType[] = [];
  const weak: AssetType[] = [];
  for (const t of warranted) {
    const entry = cov[t];
    if (!entry || entry.status === 'missing') {
      missing.push(t);
    } else if (entry.status === 'stale' || (entry.score !== undefined && entry.score < WEAK_SCORE)) {
      weak.push(t);
    }
  }

  if (missing.length === 0 && weak.length === 0) return null;

  const reasons: string[] = [];
  if (missing.length) reasons.push(`Missing: ${missing.join(', ')}.`);
  if (weak.length) reasons.push(`Needs work (stale/low-score): ${weak.join(', ')}.`);
  if (feature.needsHumanReview) reasons.push('Feature detection is low-confidence — confirm scope.');

  return {
    featureId: feature.id,
    featureName: feature.name,
    missing,
    weak,
    priorityScore: gapPriority(feature, missing.length, weak.length, warranted.length),
    reasons,
  };
}

/**
 * Priority blends feature importance (audience reach + category) with how
 * much is missing. Higher = fix first (spec §17).
 */
export function gapPriority(
  feature: FeatureRecord,
  missingCount: number,
  weakCount: number,
  warrantedCount: number,
): number {
  const reach = audienceReach(feature.audiences);
  const importance = categoryImportance(feature.category);
  const incompleteness =
    warrantedCount === 0 ? 0 : (missingCount + weakCount * 0.5) / warrantedCount; // 0–1
  const publicBoost = feature.routes.some((r) => !r.startsWith('/admin') && !r.startsWith('/api')) ? 10 : 0;
  const betaBoost = feature.status === 'beta' || feature.category === 'new-feature' ? 8 : 0;
  const score = reach * 0.35 + importance * 0.25 + incompleteness * 100 * 0.4 + publicBoost + betaBoost;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function audienceReach(audiences: FeatureRecord['audiences']): number {
  if (audiences.includes('all')) return 100;
  let r = 0;
  if (audiences.includes('new-user')) r += 45;
  if (audiences.includes('returning-user')) r += 30;
  if (audiences.includes('parent')) r += 15;
  if (audiences.includes('coach')) r += 15;
  if (audiences.includes('power-user')) r += 10;
  if (audiences.includes('enterprise')) r += 10;
  if (audiences.includes('admin')) r += 8;
  if (audiences.includes('support')) r += 5;
  if (audiences.includes('developer')) r += 5;
  return Math.min(100, r);
}

function categoryImportance(category: FeatureRecord['category']): number {
  const map: Partial<Record<FeatureRecord['category'], number>> = {
    'new-feature': 100,
    'account-auth': 90,
    monetization: 90,
    'security-privacy': 85,
    'workflow-change': 75,
    'admin-capability': 60,
    'analytics-reporting': 55,
    enhancement: 50,
    'ui-change': 45,
    'user-setting': 45,
    'backend-api': 40,
    'support-troubleshooting': 40,
    deprecated: 30,
    removed: 25,
  };
  return map[category] ?? 50;
}

/** All gaps across the registry, ranked highest-priority first. */
export function computeGaps(
  features: FeatureRecord[],
  assets: EducationAsset[],
  now: Date = new Date(),
): ContentGap[] {
  return features
    .map((f) => gapForFeature(f, assets, now))
    .filter((g): g is ContentGap => g !== null)
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

/** Registry-wide coverage summary for the dashboard header. */
export function coverageSummary(features: FeatureRecord[]): {
  totalFeatures: number;
  fullyCovered: number;
  partiallyCovered: number;
  uncovered: number;
  coveragePct: number;
} {
  let fully = 0;
  let partial = 0;
  let none = 0;
  for (const f of features) {
    const warranted = warrantedAssetTypes(f);
    const covered = warranted.filter((t) => {
      const s = f.coverage[t]?.status;
      return s === 'published' || s === 'approved';
    }).length;
    if (warranted.length === 0 || covered === warranted.length) fully++;
    else if (covered === 0) none++;
    else partial++;
  }
  const total = features.length;
  const coveragePct = total === 0 ? 0 : Math.round((fully / total) * 100);
  return { totalFeatures: total, fullyCovered: fully, partiallyCovered: partial, uncovered: none, coveragePct };
}
