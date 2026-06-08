// ============================================================
// SwingVantage Admin — Data Quality auditor (isomorphic, pure)
// ------------------------------------------------------------
// Deterministic, keyless data-hygiene checks over the SEO content
// registry — the richest structured content the app ships. Every
// finding is COMPUTED from real data (duplicate slugs/titles/meta,
// length problems, thin content, slug↔sport mismatches, missing CTAs),
// so the Data Quality board never invents issues and shows passing
// checks honestly too.
//
// Pure + structurally typed (operates on a minimal SeoPageLike) so it
// is fully unit testable without importing the heavy content module.
// ============================================================

export type DqSeverity = 'critical' | 'warning' | 'info';

/** The minimal shape the checks need — the real SeoPage is a superset. */
export interface SeoPageLike {
  slug: string;
  sport: string;
  keyword: string;
  title: string;
  metaDescription: string;
  directAnswer: string;
  problemExplanation: string[];
  drills: unknown[];
  faqs: unknown[];
  cta: { href: string; label?: string };
  publishStatus: string;
}

export interface DataQualityIssue {
  id: string;
  /** The page(s) the issue concerns, e.g. a slug or "a ↔ b". */
  entity: string;
  detail: string;
}

export interface DataQualityCategory {
  id: string;
  label: string;
  severity: DqSeverity;
  /** What this check looks at. */
  description: string;
  /** How an operator fixes a finding. */
  fix: string;
  /** Deep link to the tool that resolves it. */
  href: string;
  issues: DataQualityIssue[];
}

export interface DataQualityReport {
  generatedAt: string;
  scanned: number;
  categories: DataQualityCategory[];
  totals: { critical: number; warning: number; info: number; issues: number; cleanChecks: number };
}

// Known sport slug prefixes → the `sport` value they imply.
const SLUG_SPORT_PREFIX: Record<string, string[]> = {
  golf: ['golf'],
  tennis: ['tennis'],
  baseball: ['baseball'],
  softball: ['softball_slow', 'softball_fast', 'softball'],
  pickleball: ['pickleball'],
  padel: ['padel'],
};

const TITLE_MAX = 60;
const TITLE_MIN = 15;
const META_MAX = 160;
const META_MIN = 70;

/** Group keys that map to >1 page → duplicates. */
function findDuplicates<T extends SeoPageLike>(
  pages: T[],
  keyOf: (p: T) => string,
  normalize = true,
): { key: string; slugs: string[] }[] {
  const map = new Map<string, string[]>();
  for (const p of pages) {
    const raw = keyOf(p);
    if (!raw) continue;
    const key = normalize ? raw.trim().toLowerCase() : raw;
    const arr = map.get(key) ?? [];
    arr.push(p.slug);
    map.set(key, arr);
  }
  return [...map.entries()]
    .filter(([, slugs]) => slugs.length > 1)
    .map(([key, slugs]) => ({ key, slugs }));
}

/**
 * Run every data-quality check over the given pages and return a full,
 * categorized report (including checks that passed, with empty issues).
 * `now` is injectable for deterministic tests.
 */
export function runDataQualityReport(
  pages: SeoPageLike[],
  now: Date = new Date(),
): DataQualityReport {
  const categories: DataQualityCategory[] = [];

  // 1) Duplicate slugs — routing collision (critical).
  categories.push({
    id: 'dup-slug',
    label: 'Duplicate slugs',
    severity: 'critical',
    description: 'Two or more pages share the same URL slug, which collides at the route level.',
    fix: 'Give each page a unique slug in the SEO registry.',
    href: '/admin/seo',
    issues: findDuplicates(pages, (p) => p.slug, false).map((d) => ({
      id: `dup-slug:${d.key}`,
      entity: d.key,
      detail: `${d.slugs.length} pages share this slug.`,
    })),
  });

  // 2) Duplicate titles — cannibalization (warning).
  categories.push({
    id: 'dup-title',
    label: 'Duplicate titles',
    severity: 'warning',
    description: 'Multiple pages use the same <title>, which can cannibalize rankings.',
    fix: 'Differentiate each title around its unique keyword/intent.',
    href: '/admin/seo',
    issues: findDuplicates(pages, (p) => p.title).map((d) => ({
      id: `dup-title:${d.key}`,
      entity: d.slugs.join(' ↔ '),
      detail: `Shared title: "${d.key}".`,
    })),
  });

  // 3) Duplicate meta descriptions (warning).
  categories.push({
    id: 'dup-meta',
    label: 'Duplicate meta descriptions',
    severity: 'warning',
    description: 'Pages reusing the same meta description weaken each result’s snippet.',
    fix: 'Write a distinct meta description per page.',
    href: '/admin/seo',
    issues: findDuplicates(pages, (p) => p.metaDescription).map((d) => ({
      id: `dup-meta:${d.key.slice(0, 24)}`,
      entity: d.slugs.join(' ↔ '),
      detail: 'These pages share one meta description.',
    })),
  });

  // 4) Duplicate target keywords — cannibalization (warning).
  categories.push({
    id: 'dup-keyword',
    label: 'Keyword cannibalization',
    severity: 'warning',
    description: 'More than one page targets the exact same keyword.',
    fix: 'Consolidate or re-target one page to a distinct keyword.',
    href: '/admin/seo',
    issues: findDuplicates(pages, (p) => p.keyword).map((d) => ({
      id: `dup-keyword:${d.key}`,
      entity: d.slugs.join(' ↔ '),
      detail: `Both target "${d.key}".`,
    })),
  });

  // 5) Title length (info).
  categories.push({
    id: 'title-length',
    label: 'Title length',
    severity: 'info',
    description: `Titles should be ~${TITLE_MIN}–${TITLE_MAX} characters to avoid truncation.`,
    fix: 'Tighten long titles; expand thin ones.',
    href: '/admin/seo',
    issues: pages
      .filter((p) => p.title.length > TITLE_MAX || p.title.length < TITLE_MIN)
      .map((p) => ({
        id: `title-length:${p.slug}`,
        entity: p.slug,
        detail: `Title is ${p.title.length} chars (target ${TITLE_MIN}–${TITLE_MAX}).`,
      })),
  });

  // 6) Meta description length (info).
  categories.push({
    id: 'meta-length',
    label: 'Meta description length',
    severity: 'info',
    description: `Meta descriptions should be ~${META_MIN}–${META_MAX} characters.`,
    fix: 'Rewrite to land within range.',
    href: '/admin/seo',
    issues: pages
      .filter((p) => p.metaDescription.length > META_MAX || p.metaDescription.length < META_MIN)
      .map((p) => ({
        id: `meta-length:${p.slug}`,
        entity: p.slug,
        detail: `Meta is ${p.metaDescription.length} chars (target ${META_MIN}–${META_MAX}).`,
      })),
  });

  // 7) Thin / empty content (warning).
  categories.push({
    id: 'thin-content',
    label: 'Thin or empty content',
    severity: 'warning',
    description: 'Published pages missing a direct answer, explanation, drills or FAQs.',
    fix: 'Fill the missing fields before the page earns trust and rankings.',
    href: '/admin/content',
    issues: pages
      .map((p) => {
        const missing: string[] = [];
        if (!p.directAnswer?.trim()) missing.push('direct answer');
        if (!p.problemExplanation?.length) missing.push('explanation');
        if (!p.drills?.length) missing.push('drills');
        if (!p.faqs?.length) missing.push('FAQs');
        return { p, missing };
      })
      .filter((x) => x.missing.length > 0)
      .map((x) => ({
        id: `thin-content:${x.p.slug}`,
        entity: x.p.slug,
        detail: `Missing: ${x.missing.join(', ')}.`,
      })),
  });

  // 8) Slug ↔ sport mismatch (warning) — mistagged sport.
  categories.push({
    id: 'sport-mismatch',
    label: 'Slug ↔ sport mismatch',
    severity: 'warning',
    description: 'The slug’s leading segment names a sport that disagrees with the page’s sport tag.',
    fix: 'Correct the sport tag or the slug so they agree.',
    href: '/admin/sports',
    issues: pages
      .filter((p) => {
        const prefix = p.slug.split('/')[0];
        const allowed = SLUG_SPORT_PREFIX[prefix];
        return allowed ? !allowed.includes(p.sport) : false;
      })
      .map((p) => ({
        id: `sport-mismatch:${p.slug}`,
        entity: p.slug,
        detail: `Slug implies "${p.slug.split('/')[0]}" but sport is "${p.sport}".`,
      })),
  });

  // 9) Missing CTA (info).
  categories.push({
    id: 'cta-missing',
    label: 'Missing call-to-action',
    severity: 'info',
    description: 'A page without a CTA href leaves the reader with no next step.',
    fix: 'Add a CTA href/label in the registry.',
    href: '/admin/seo',
    issues: pages
      .filter((p) => !p.cta?.href?.trim())
      .map((p) => ({ id: `cta-missing:${p.slug}`, entity: p.slug, detail: 'No CTA href.' })),
  });

  // Totals
  let critical = 0;
  let warning = 0;
  let info = 0;
  let cleanChecks = 0;
  for (const c of categories) {
    if (c.issues.length === 0) {
      cleanChecks += 1;
      continue;
    }
    if (c.severity === 'critical') critical += c.issues.length;
    else if (c.severity === 'warning') warning += c.issues.length;
    else info += c.issues.length;
  }

  return {
    generatedAt: now.toISOString(),
    scanned: pages.length,
    categories,
    totals: { critical, warning, info, issues: critical + warning + info, cleanChecks },
  };
}
