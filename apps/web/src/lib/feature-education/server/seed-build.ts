// ============================================================
// SwingVantage — Feature Education: shipping-seed builder
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Runs the REAL deterministic generators over every feature in the
//   committed registry to produce the PUBLISHED, user-facing learning
//   content that ships in source: an in-app-help card for each grounded
//   feature, plus a public FAQ + SEO/AEO article for public features.
//
//   Honest by design (mirrors baseAsset + the security gate):
//     - only features with real grounding evidence + confident detection
//       are published (ungrounded / needs-review features are skipped);
//     - in-app help is published only when it is grounded in its own
//       target route;
//     - public FAQ/SEO is published only for public features and only
//       when the security scanner says it is safe to publish publicly
//       (so a public asset never leaks an /admin route or internal detail).
//
//   Deterministic: a FIXED timestamp makes the output byte-stable so the
//   committed `feature-education-seed.json` is diffable and drift-guarded
//   (see __tests__/build-seed.gen.test.ts).
// ============================================================

import REGISTRY from '@/data/feature-registry.json';
// Import the specific, dependency-light generators directly (NOT via
// generators/index, which pulls the video-brief → video-studio → @swingiq/core
// chain — unnecessary here and unavailable to a pure build step).
import { generateInAppHelp, generateFaq } from '../generators/support';
import { generateSeoArticle } from '../generators/publishing';
import { groundingFor } from '../generators/helpers';
import { scanAsset, isSafeToPublish } from '../security';
import type { EducationAsset, FeatureRecord, PublishTarget } from '../types';

/** Fixed clock so the generated seed is byte-stable + diffable. */
export const SEED_NOW = new Date('2026-06-11T00:00:00.000Z');

function registryFeatures(): FeatureRecord[] {
  return (REGISTRY as unknown as { features?: FeatureRecord[] }).features ?? [];
}

/** Public = reachable on a non-admin, non-api route. */
function isPublicFeature(f: FeatureRecord): boolean {
  return f.routes.some((r) => !r.startsWith('/admin') && !r.startsWith('/api'));
}

/**
 * Generate the published, grounded, safe shipping education assets for every
 * feature in the committed registry. Pure + deterministic.
 */
export function buildFeatureEducationSeed(now: Date = SEED_NOW): EducationAsset[] {
  const iso = now.toISOString();
  const out: EducationAsset[] = [];

  const publish = (asset: EducationAsset, target: PublishTarget): EducationAsset => {
    const withMeta: EducationAsset = {
      ...asset,
      status: 'published',
      publishTarget: target,
      updatedAt: iso,
    };
    return { ...withMeta, security: scanAsset(withMeta, now) };
  };

  for (const f of registryFeatures()) {
    // Honest: never auto-publish low-confidence or ungrounded features.
    if (f.needsHumanReview || groundingFor(f).length === 0) continue;

    // In-app help — published only when grounded in its own target route.
    const help = generateInAppHelp(f, { now });
    if (help.inAppHelp && help.groundedIn.some((e) => e.ref === help.inAppHelp!.route)) {
      const pub = publish(help, 'in-app');
      if (isSafeToPublish(pub)) out.push(pub);
    }

    // Public FAQ + SEO/AEO article — public features only, security-gated.
    if (isPublicFeature(f)) {
      const faq = publish(generateFaq(f, { now }), 'help-center');
      if (isSafeToPublish(faq)) out.push(faq);
      const seo = publish(generateSeoArticle(f, { now }), 'seo');
      if (isSafeToPublish(seo)) out.push(seo);
    }
  }

  // Stable order so the committed snapshot diffs cleanly.
  return out.sort((a, b) => a.id.localeCompare(b.id));
}
