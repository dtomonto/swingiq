// ============================================================
// PublishingOS — validation engine (pure)
// ------------------------------------------------------------
// Every entity runs validation before it can be published. This module is the
// generic gate (required fields, slug format + collisions, JSON-schema sanity,
// placeholder/secret leakage, thin-content, indexability). Surface-specific
// depth (e.g. update FAQ depth, SEO internal links) is layered by the caller via
// `extraChecks` — keeping this file dependency-free and unit-testable.
// ============================================================

import type {
  PublishEntityType,
  PublishValidationResult,
  ValidationCheck,
  ValidationStatus,
} from './types';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PLACEHOLDER_RE = /\b(lorem ipsum|todo|tbd|placeholder|xxx|coming soon|fixme)\b/i;
const SECRETISH_RE = /(sk-[a-z0-9]{8,}|service_role|BEGIN (RSA|EC|PRIVATE) KEY|password\s*[:=])/i;

/** Minimum body length (chars) for a surface that is meant to rank. */
const RANK_MIN_BODY = 200;

export interface ValidationInput {
  entityType: PublishEntityType;
  title?: string;
  slug?: string;
  /** Concatenated public body text, used for thin-content + secret checks. */
  body?: string;
  metaTitle?: string;
  metaDescription?: string;
  /** Raw schema/JSON-LD string to sanity-check as valid JSON. */
  schemaJson?: string;
  /** Whether this surface is intended to be indexed (drives SEO depth). */
  indexable?: boolean;
  /** Whether the surface needs to rank in search (drives content minimums). */
  rankIntended?: boolean;
  /** Slugs already taken by OTHER entities of the same type (collision check). */
  existingSlugs?: string[];
}

const check = (
  id: string,
  label: string,
  level: ValidationCheck['level'],
  passed: boolean,
  detail?: string,
): ValidationCheck => ({ id, label, level, passed, detail });

/** Run the generic gate. `extraChecks` lets a surface add its own depth. */
export function validateEntity(
  input: ValidationInput,
  extraChecks: ValidationCheck[] = [],
): PublishValidationResult {
  const checks: ValidationCheck[] = [];
  const title = input.title?.trim() ?? '';
  const slug = input.slug?.trim() ?? '';
  const body = input.body?.trim() ?? '';

  checks.push(check('title', 'Title is present', 'error', title.length > 0));

  if (slug) {
    checks.push(check('slug-format', 'Slug is URL-safe (lowercase, hyphenated)', 'error', SLUG_RE.test(slug)));
    const collides = (input.existingSlugs ?? []).includes(slug);
    checks.push(
      check('slug-unique', 'Slug does not collide with an existing route', 'error', !collides,
        collides ? `Another ${input.entityType} already uses "${slug}".` : undefined),
    );
  }

  // No placeholder / secret leakage into anything public.
  const haystack = `${title} ${body} ${input.metaDescription ?? ''}`;
  checks.push(
    check('no-placeholder', 'No obvious placeholder text', 'warning', !PLACEHOLDER_RE.test(haystack)),
  );
  checks.push(
    check('no-secret-leak', 'No secret / key / credential leakage', 'error', !SECRETISH_RE.test(haystack)),
  );

  // Schema / JSON-LD validity (only when supplied).
  if (input.schemaJson) {
    let validJson = true;
    try {
      JSON.parse(input.schemaJson);
    } catch {
      validJson = false;
    }
    checks.push(check('schema-json', 'Structured data is valid JSON', 'error', validJson));
  }

  // Indexable surfaces need real metadata.
  if (input.indexable) {
    const mt = input.metaTitle?.trim() || title;
    const md = input.metaDescription?.trim() || '';
    checks.push(check('meta-title', 'Meta title present (≤ 60 chars ideal)', 'error', mt.length > 0,
      mt.length > 60 ? 'Meta title is long — may be truncated in search.' : undefined));
    checks.push(check('meta-desc', 'Meta description present (50–160 chars)', md.length >= 50 && md.length <= 160 ? 'info' : 'warning',
      md.length > 0, md.length === 0 ? 'Add a meta description for better search snippets.' : undefined));
  }

  // Rank-intended pages must not be thin.
  if (input.rankIntended) {
    checks.push(
      check('content-length', `Body has at least ${RANK_MIN_BODY} characters`, 'warning', body.length >= RANK_MIN_BODY,
        body.length < RANK_MIN_BODY ? 'Content looks thin for a page meant to rank.' : undefined),
    );
  }

  checks.push(...extraChecks);

  const errors = checks.filter((c) => c.level === 'error' && !c.passed).map((c) => c.detail ?? c.label);
  const warnings = checks.filter((c) => c.level === 'warning' && !c.passed).map((c) => c.detail ?? c.label);

  const status: ValidationStatus =
    errors.length > 0 ? 'failed' : warnings.length > 0 ? 'warnings' : 'passed';

  return {
    status,
    ok: errors.length === 0,
    checks,
    errors,
    warnings,
    checkedAt: new Date().toISOString(),
  };
}

/** Convenience: an empty/unknown validation result (nothing checked yet). */
export function unknownValidation(): PublishValidationResult {
  return { status: 'unknown', ok: false, checks: [], errors: [], warnings: [], checkedAt: new Date().toISOString() };
}
