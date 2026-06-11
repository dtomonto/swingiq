// ============================================================
// SwingVantage — Feature Education: shipping-seed builder
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Runs the REAL deterministic generators over every feature in the
//   committed registry to produce the PUBLISHED learning content that ships
//   in source. For each feature it generates the subset of assets the engine
//   says the feature WARRANTS (warrantedAssetTypes) among the shipping types
//   we support: in-app help, FAQ, SEO/AEO article, tutorial, how-to, and
//   admin guide. Using warrantedAssetTypes is the safeguard that keeps an
//   internal tool from getting a user tutorial (it gets a how-to / admin
//   guide instead) and a public page from getting an internal asset.
//
//   Honest by design (mirrors baseAsset + the security gate):
//     - a feature is only published when it is GROUNDED in real evidence
//       (route/component/api/db/flag/nav) AND either confidently detected or
//       explicitly human-reviewed (feature-education-reviewed.json — the
//       70 grounded-but-low-confidence detections confirmed real by evidence);
//     - in-app help is published only when grounded in its own target route;
//     - every asset is security-scanned and only kept if safe to publish at
//       its visibility (so a public asset never leaks an /admin route or a
//       secret), with the scan attached to the asset.
//
//   Deterministic: a FIXED timestamp makes the output byte-stable so the
//   committed `feature-education-seed.json` is diffable and drift-guarded
//   (see __tests__/build-seed.gen.test.ts).
// ============================================================

import REGISTRY from '@/data/feature-registry.json';
import REVIEWED from '@/data/feature-education-reviewed.json';
// Import the specific, dependency-light generators directly (NOT via
// generators/index, which pulls the video-brief → video-studio → @swingiq/core
// chain — unnecessary here and unavailable to a pure build step).
import { generateInAppHelp, generateFaq } from '../generators/support';
import { generateSeoArticle } from '../generators/publishing';
import { generateTutorial, generateHowTo } from '../generators/text';
import { generateAdminGuide } from '../generators/admin';
import { groundingFor, type GenContext } from '../generators/helpers';
import { warrantedAssetTypes } from '../coverage';
import { scanAsset, isSafeToPublish } from '../security';
import type { EducationAsset, FeatureRecord, AssetType, PublishTarget } from '../types';

/** Fixed clock so the generated seed is byte-stable + diffable. */
export const SEED_NOW = new Date('2026-06-11T00:00:00.000Z');

/** The asset types we ship as committed seed content, + their publish target. */
const SHIPPING: Partial<
  Record<AssetType, { gen: (f: FeatureRecord, ctx: GenContext) => EducationAsset; target: PublishTarget }>
> = {
  'in-app-help': { gen: generateInAppHelp, target: 'in-app' },
  faq: { gen: generateFaq, target: 'help-center' },
  'seo-article': { gen: generateSeoArticle, target: 'seo' },
  tutorial: { gen: generateTutorial, target: 'help-center' },
  'how-to': { gen: generateHowTo, target: 'help-center' },
  'admin-guide': { gen: generateAdminGuide, target: 'help-center' },
};

const REVIEWED_IDS = new Set((REVIEWED as { ids?: string[] }).ids ?? []);

function registryFeatures(): FeatureRecord[] {
  return (REGISTRY as unknown as { features?: FeatureRecord[] }).features ?? [];
}

/**
 * Publishable = grounded in real evidence AND either confidently detected or
 * human-reviewed. The reviewed overlay confirms the low-confidence detections
 * that are nonetheless grounded in real source (see feature-education-reviewed.json).
 */
function isConfirmed(f: FeatureRecord): boolean {
  if (f.status === 'removed') return false;
  if (groundingFor(f).length === 0) return false;
  return !f.needsHumanReview || REVIEWED_IDS.has(f.id);
}

/**
 * Generate the published, grounded, safe shipping education assets for every
 * confirmed feature in the committed registry. Pure + deterministic.
 */
export function buildFeatureEducationSeed(now: Date = SEED_NOW): EducationAsset[] {
  const iso = now.toISOString();
  const out: EducationAsset[] = [];

  const finalize = (draft: EducationAsset, target: PublishTarget): EducationAsset => {
    // These assets are published from confirmed features (grounded + either
    // confident or human-reviewed), so the per-asset needs-review flag is
    // cleared even when the source feature was a reviewed low-confidence one.
    const published: EducationAsset = {
      ...draft,
      status: 'published',
      publishTarget: target,
      needsHumanReview: false,
      updatedAt: iso,
    };
    return { ...published, security: scanAsset(published, now) };
  };

  for (const f of registryFeatures()) {
    if (!isConfirmed(f)) continue;

    // In-app help for ANY grounded-route feature — a contextual help card is
    // always useful (even on an admin route; visibility gates who sees it), so
    // it isn't restricted to warrantedAssetTypes. Published only when grounded
    // in its own target route (the seed-help invariant).
    const help = generateInAppHelp(f, { now });
    if (help.inAppHelp && help.groundedIn.some((e) => e.ref === help.inAppHelp!.route)) {
      const pub = finalize(help, 'in-app');
      if (isSafeToPublish(pub)) out.push(pub);
    }

    // The remaining shipping assets the feature WARRANTS — the engine decides
    // which (so an internal tool gets a how-to/admin-guide, not a user tutorial).
    for (const type of warrantedAssetTypes(f)) {
      if (type === 'in-app-help') continue; // handled above
      const entry = SHIPPING[type];
      if (!entry) continue; // not a shipping type (e.g. release-note, video-brief)
      const pub = finalize(entry.gen(f, { now }), entry.target);
      if (isSafeToPublish(pub)) out.push(pub);
    }
  }

  // Stable order so the committed snapshot diffs cleanly.
  return out.sort((a, b) => a.id.localeCompare(b.id));
}
