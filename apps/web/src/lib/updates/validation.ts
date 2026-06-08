// ============================================================
// SwingVantage — Update validation + quality gate (pure)
// ------------------------------------------------------------
// Pre-publish checks for product updates. A published, indexable update must
// pass validation; a low quality score flags it for human review instead of
// shipping thin or duplicate content into the index. Used by tests today and
// available to the admin Publishing screen / API route.
// ============================================================

import { getPublicUpdates, isPublicUpdate, type Update } from '@/data/updates';
import {
  buildUpdateFaqs,
  resolveInternalLinks,
  updateAiAnswer,
} from './product-detail';

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

const MIN_SUMMARY_LEN = 40;
const MIN_BENEFIT_LEN = 40;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validate a single update for publication. `allUpdates` is passed so the
 * duplicate-slug check can run against the full set (defaults to the public
 * set). Errors block an indexable publish; warnings are advisory.
 */
export function validateUpdate(update: Update, allUpdates?: Update[]): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const corpus = allUpdates ?? getPublicUpdates();

  if (!update.title?.trim()) errors.push({ field: 'title', message: 'Title is required.' });
  if (!update.slug?.trim()) {
    errors.push({ field: 'slug', message: 'Slug is required.' });
  } else if (!SLUG_RE.test(update.slug)) {
    errors.push({ field: 'slug', message: 'Slug must be lowercase, hyphen-separated, URL-safe.' });
  } else {
    const dupes = corpus.filter((u) => u.slug === update.slug && u.id !== update.id);
    if (dupes.length > 0) errors.push({ field: 'slug', message: `Slug "${update.slug}" is not unique.` });
  }

  if (!update.summary?.trim()) {
    errors.push({ field: 'summary', message: 'Summary is required.' });
  } else if (update.summary.trim().length < MIN_SUMMARY_LEN) {
    warnings.push({ field: 'summary', message: 'Summary is very short — risks thin content.' });
  }

  if (!update.userBenefit?.trim() || update.userBenefit.trim().length < MIN_BENEFIT_LEN) {
    warnings.push({ field: 'userBenefit', message: 'User benefit is missing or thin.' });
  }

  // Indexable updates need real SEO metadata + internal links.
  if (isPublicUpdate(update)) {
    if (!(update.metaTitle || update.title)) {
      errors.push({ field: 'metaTitle', message: 'Meta title (or title) required for an indexable update.' });
    }
    if (!(update.metaDescription || update.summary)) {
      errors.push({ field: 'metaDescription', message: 'Meta description (or summary) required for an indexable update.' });
    }
    const internalLinks = resolveInternalLinks(update);
    if (internalLinks.length < 1) {
      warnings.push({ field: 'internalLinkTargets', message: 'Add at least one relevant internal link.' });
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

export interface QualityScore {
  score: number; // 0–100
  needsHumanReview: boolean;
  breakdown: Record<string, number>;
}

const QUALITY_THRESHOLD = 60;

/**
 * Heuristic 0–100 quality score across completeness, SEO metadata, FAQ depth,
 * internal links, and AI-answer presence. Below threshold ⇒ needs human review.
 */
export function scoreUpdateQuality(update: Update): QualityScore {
  const breakdown: Record<string, number> = {};

  breakdown.summary = update.summary && update.summary.length >= MIN_SUMMARY_LEN ? 20 : update.summary ? 10 : 0;
  breakdown.userValue = update.userBenefit && update.whyItMatters ? 20 : update.userBenefit || update.whyItMatters ? 10 : 0;
  breakdown.seo =
    (update.metaTitle ? 8 : 0) +
    (update.metaDescription ? 8 : 0) +
    (update.seoKeywords && update.seoKeywords.length >= 3 ? 4 : 0);
  const faqCount = buildUpdateFaqs(update).length;
  breakdown.faq = faqCount >= 4 ? 15 : faqCount >= 2 ? 8 : 0;
  breakdown.internalLinks = Math.min(resolveInternalLinks(update).length * 5, 15);
  breakdown.aiAnswer = updateAiAnswer(update).length >= 60 ? 10 : 0;

  const score = Math.min(
    100,
    Object.values(breakdown).reduce((a, b) => a + b, 0),
  );
  return { score, needsHumanReview: score < QUALITY_THRESHOLD, breakdown };
}
