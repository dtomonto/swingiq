// ============================================================
// SwingVantage — Feature Education Engine: Content Quality Scoring
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Every generated asset is scored on 13 dimensions (spec §6) from honest,
//   deterministic signals in the content itself — grounding, completeness vs
//   its template, reading clarity, presence of steps/links, brand safety
//   (reuses Video Studio's vetClaims), and release-readiness. Below the
//   threshold → the asset is routed to "needs review" with plain reasons.
//
//   Pure + deterministic — no I/O, no LLM. Same asset → same score.
// ============================================================

import { vetClaims } from '@/lib/video-studio';
import {
  type EducationAsset,
  type QualityScore,
  type QualityDimension,
  QUALITY_DIMENSIONS,
} from './types';
import { PROMPTS } from './prompts';
import { assetText, scanAsset } from './security';

const WEIGHTS: Record<QualityDimension, number> = {
  accuracy: 0.15,
  completeness: 0.12,
  clarity: 0.1,
  usefulness: 0.1,
  stepQuality: 0.06,
  technicalCorrectness: 0.1,
  brand: 0.1,
  accessibility: 0.05,
  seo: 0.05,
  internalLinks: 0.04,
  coverage: 0.05,
  supportReadiness: 0.04,
  releaseReadiness: 0.04,
};

const DEFAULT_THRESHOLD = 70;

const STEP_TYPES = new Set(['tutorial', 'how-to', 'onboarding']);
const SEO_TYPES = new Set(['seo-article', 'faq', 'release-note']);
const SUPPORT_TYPES = new Set(['faq', 'troubleshooting', 'support-enablement']);

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function hasRouteRef(lines: string[]): boolean {
  return lines.some((l) => /(^|\s)\/[a-z][\w/-]*/.test(l));
}

export function scoreAsset(asset: EducationAsset, thresholdOverride?: number): QualityScore {
  const threshold = thresholdOverride ?? DEFAULT_THRESHOLD;
  const lines = assetText(asset);
  const grounded = asset.groundedIn.length > 0;
  const claims = vetClaims(lines);
  const brandBlocked = claims.some((c) => c.severity === 'block');
  const security = asset.security ?? scanAsset(asset);
  const securityBlocked = security.findings.some((f) => f.severity === 'block');

  // completeness vs the template
  const expected =
    asset.type === 'faq'
      ? Math.max(6, 1)
      : asset.type === 'video-brief'
        ? 5
        : PROMPTS[asset.type].sections.length;
  const present = asset.type === 'faq' ? (asset.faqs?.length ?? 0) : asset.sections.length;
  const completeness = clamp((Math.min(present, expected) / Math.max(1, expected)) * 100);

  // clarity from average words/line
  const wordCounts = lines.map((l) => l.split(/\s+/).filter(Boolean).length).filter((n) => n > 0);
  const avgWords = wordCounts.length ? wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length : 0;
  const clarity = clamp(100 - Math.max(0, avgWords - 22) * 3);

  const stepCount = asset.steps?.length ?? 0;
  const dimensions: Record<QualityDimension, number> = {
    accuracy: clamp((grounded ? 92 : 45) - (asset.needsHumanReview ? 25 : 0)),
    completeness,
    clarity,
    usefulness: clamp(70 + (stepCount ? 10 : 0) + (asset.faqs?.length ? 10 : 0) + (hasRouteRef(lines) ? 10 : 0)),
    stepQuality: STEP_TYPES.has(asset.type)
      ? clamp(stepCount >= 4 ? 95 : stepCount >= 2 ? 75 : 40)
      : 80,
    technicalCorrectness: clamp(grounded && !brandBlocked && !securityBlocked ? 90 : 55),
    brand: clamp(brandBlocked ? 35 : claims.length ? 75 : 95),
    accessibility:
      asset.type === 'video-brief'
        ? clamp(asset.sections.some((s) => /caption|accessib/i.test(s.heading)) ? 92 : 60)
        : asset.type === 'in-app-help'
          ? 85
          : 90,
    seo: SEO_TYPES.has(asset.type)
      ? clamp(asset.seo && asset.seo.keywords.length >= 3 ? 90 : 60)
      : 80,
    internalLinks: clamp(hasRouteRef(lines) || lines.some((l) => /tutorial center|related/i.test(l)) ? 85 : 55),
    coverage: clamp(
      lines.some((l) => /internal capability without a dedicated screen/i.test(l)) ? 50 : grounded ? 90 : 55,
    ),
    supportReadiness: SUPPORT_TYPES.has(asset.type)
      ? clamp(lines.some((l) => /escalat/i.test(l)) ? 90 : 70)
      : 80,
    releaseReadiness: clamp(!asset.needsHumanReview && !brandBlocked && !securityBlocked ? 90 : 50),
  };

  const overall = clamp(
    QUALITY_DIMENSIONS.reduce((sum, d) => sum + dimensions[d] * WEIGHTS[d], 0),
  );

  const reasons: string[] = [];
  for (const d of QUALITY_DIMENSIONS) {
    if (dimensions[d] < threshold) reasons.push(`Low ${d} (${dimensions[d]}).`);
  }
  if (brandBlocked) reasons.push('Brand: a forbidden claim was detected — fix before publishing.');
  if (securityBlocked) reasons.push('Security: blocking finding(s) detected — see the security scan.');
  if (asset.needsHumanReview) reasons.push('Flagged for human review (low-confidence detection or ungrounded).');

  const passed = overall >= threshold && !brandBlocked && (asset.visibility !== 'public' || !securityBlocked);

  return { dimensions, overall, passed, threshold, reasons };
}

/** Score and attach quality + security to an asset (returns a new object). */
export function withQuality(asset: EducationAsset, now: Date = new Date()): EducationAsset {
  const security = scanAsset(asset, now);
  const quality = scoreAsset({ ...asset, security });
  const needsHumanReview = asset.needsHumanReview || !quality.passed || !security.safeToPublishPublicly && asset.visibility === 'public';
  return {
    ...asset,
    security,
    quality,
    needsHumanReview,
    status: asset.status === 'draft' && !quality.passed ? 'needs-review' : asset.status,
  };
}
