// ============================================================
// SwingVantage — Feature Education Engine: Generator registry + orchestrator
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   `GENERATORS` maps every asset type to its deterministic generator.
//   `generatePackage` looks at a feature, decides which assets it WARRANTS
//   (via coverage.warrantedAssetTypes), and produces them all as DRAFTS.
//   `enhanceAsset` is the OPTIONAL LLM polish seam — a safe no-op by default
//   so the whole pipeline runs key-free and deterministic.
// ============================================================

import { type FeatureRecord, type EducationAsset, type AssetType } from '../types';
import { warrantedAssetTypes } from '../coverage';
import { type GenContext } from './helpers';

import { generateTutorial, generateHowTo, generateManual, generateOnboarding } from './text';
import {
  generateFaq,
  generateTroubleshooting,
  generateSupportEnablement,
  generateInAppHelp,
} from './support';
import { generateReleaseNote, generateSeoArticle } from './publishing';
import { generateAdminGuide, generateCourseModule } from './admin';
import { generateVideoBrief } from './video-brief';

export * from './helpers';
export { recommendInAppHelp } from './support';
export { suggestedUpdateTrailer } from './publishing';
export { buildVideoOpportunity, buildVideoBrief } from './video-brief';

/** Every asset type → its deterministic generator. */
export const GENERATORS: Record<AssetType, (feature: FeatureRecord, ctx?: GenContext) => EducationAsset> = {
  tutorial: generateTutorial,
  'how-to': generateHowTo,
  manual: generateManual,
  onboarding: generateOnboarding,
  faq: generateFaq,
  troubleshooting: generateTroubleshooting,
  'support-enablement': generateSupportEnablement,
  'in-app-help': generateInAppHelp,
  'release-note': generateReleaseNote,
  'seo-article': generateSeoArticle,
  'admin-guide': generateAdminGuide,
  'course-module': generateCourseModule,
  'video-brief': generateVideoBrief,
};

/** Generate a single asset of a given type for a feature. */
export function generateAsset(
  feature: FeatureRecord,
  type: AssetType,
  ctx: GenContext = {},
): EducationAsset {
  return GENERATORS[type](feature, ctx);
}

/**
 * Generate the full DRAFT education package for a feature: every asset type it
 * warrants (or an explicit subset). Deterministic — same feature → same package.
 */
export function generatePackage(
  feature: FeatureRecord,
  opts: { types?: AssetType[]; ctx?: GenContext } = {},
): EducationAsset[] {
  const types = opts.types && opts.types.length ? opts.types : warrantedAssetTypes(feature);
  return types.map((t) => GENERATORS[t](feature, opts.ctx ?? {}));
}

/**
 * OPTIONAL polish: when an AI text provider is configured, re-word an asset's
 * copy for extra shine. This default is a safe no-op that returns the input
 * unchanged — keeping the engine deterministic and key-free. A real enhancer
 * MUST preserve meaning + grounding and re-run brand/security checks (see
 * docs/FEATURE_EDUCATION_ENGINE.md → "Adding an LLM enhancer").
 */
export async function enhanceAsset(asset: EducationAsset): Promise<EducationAsset> {
  return asset;
}
