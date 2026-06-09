// ============================================================
// SearchIntelligenceOS — Technical SEO Audit engine (§2.7)
// ------------------------------------------------------------
// Produces severity-ranked TechnicalIssue[] from the enriched page inventory
// + the Link Intelligence graph findings. Runs ONLY checks we can make
// honestly from owned data:
//   • metadata: title/description missing, too short/long, duplicate
//   • content:  thin content, missing direct-answer/FAQ blocks (AEO)
//   • schema:   missing structured data on owned content
//   • internal: orphans / broken / weak inlinks / depth / cannibalization
//               (mapped from the existing LinkFinding analysis — no rebuild)
//   • sitemap:  indexable pages missing from the sitemap; utility URLs in it
//
// Length/missing/duplicate checks run only on pages whose metadata we OWN
// (SEO guides + blog) so we never assert a "missing description" on a page
// whose body isn't in a registry. Pure + deterministic.
// ============================================================

import { id } from '../link-intelligence/id';
import type { LinkFinding } from '../link-intelligence/types';
import { scoreIssuePriority } from './scoring';
import type {
  PageIntel, TechnicalIssue, IssueSeverity, IssueCategory, Scale,
} from './types';

const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;
const THIN_WORDS = 300;

interface IssueDraft {
  issueType: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  url: string | null;
  affectedUrls: string[];
  evidence: string;
  recommendedFix: string;
  fixComplexity: Scale;
  expectedImpact: Scale;
  confidence: number;
  autoFixAvailable: boolean;
  requiresApproval: boolean;
}

function finalize(d: IssueDraft): TechnicalIssue {
  return {
    id: id('si-issue', d.issueType, d.url ?? d.affectedUrls[0] ?? 'site'),
    ...d,
    priorityScore: scoreIssuePriority({
      severity: d.severity,
      affectedCount: d.affectedUrls.length,
      expectedImpact: d.expectedImpact,
      fixComplexity: d.fixComplexity,
      confidence: d.confidence,
    }),
    status: 'open',
    dataSource: 'real',
  };
}

/** Map a Link Intelligence finding into a technical issue (reuse, don't rebuild). */
function fromLinkFinding(f: LinkFinding): IssueDraft {
  const map: Record<string, { category: IssueCategory; severity: IssueSeverity; impact: Scale; complexity: Scale }> = {
    orphan: { category: 'internal-links', severity: 'high', impact: 'high', complexity: 'low' },
    'broken-internal': { category: 'internal-links', severity: 'high', impact: 'medium', complexity: 'low' },
    'weak-inlinks': { category: 'internal-links', severity: 'medium', impact: 'medium', complexity: 'low' },
    'deep-page': { category: 'internal-links', severity: 'low', impact: 'low', complexity: 'medium' },
    cannibalization: { category: 'cannibalization', severity: 'medium', impact: 'medium', complexity: 'medium' },
    'anchor-over-optimized': { category: 'internal-links', severity: 'low', impact: 'low', complexity: 'low' },
    'over-linked': { category: 'internal-links', severity: 'low', impact: 'low', complexity: 'low' },
  };
  const m = map[f.findingType] ?? { category: 'internal-links' as const, severity: 'low' as const, impact: 'low' as const, complexity: 'low' as const };
  return {
    issueType: f.findingType,
    category: m.category,
    severity: m.severity,
    title: f.name,
    description: f.detail,
    url: f.pageUrl,
    affectedUrls: [f.pageUrl],
    evidence: f.metric !== null ? `Metric: ${f.metric}.` : f.detail,
    recommendedFix: f.recommendedAction,
    fixComplexity: m.complexity,
    expectedImpact: m.impact,
    confidence: 90,
    autoFixAvailable: f.findingType === 'orphan' || f.findingType === 'weak-inlinks',
    requiresApproval: false, // internal-link edits flow through the existing approval workflow
  };
}

/**
 * Audit the site. `linkFindings` come from the existing `analyzeFindings(graph)`
 * so we never re-implement the orphan/broken/depth logic.
 */
export function auditSite(pages: PageIntel[], linkFindings: LinkFinding[]): TechnicalIssue[] {
  const issues: IssueDraft[] = [];
  const owned = pages.filter((p) => p.dataSource === 'real' && (p.source === 'seo-catalog' || p.source === 'blog'));

  // ── Per-page metadata + content checks (owned pages only) ──
  for (const p of owned) {
    // Title length
    if (p.metaTitleLength === 0) {
      issues.push(meta(p, 'meta-title-missing', 'high', 'Missing meta title', `${p.url} has no title.`, 'Write a 30–60 char descriptive title with the target keyword near the front.'));
    } else if (p.metaTitleLength < TITLE_MIN) {
      issues.push(meta(p, 'meta-title-short', 'low', 'Meta title too short', `Title is ${p.metaTitleLength} chars (< ${TITLE_MIN}).`, `Expand the title toward ${TITLE_MIN}–${TITLE_MAX} chars without keyword-stuffing.`));
    } else if (p.metaTitleLength > TITLE_MAX) {
      issues.push(meta(p, 'meta-title-long', 'low', 'Meta title too long', `Title is ${p.metaTitleLength} chars (> ${TITLE_MAX}) and may truncate in SERPs.`, `Trim the title to ${TITLE_MAX} chars while keeping the keyword.`));
    }

    // Description length / presence (owned pages always carry a description field)
    const descLen = p.metaDescriptionLength ?? 0;
    if (!p.metaDescription || descLen === 0) {
      issues.push(meta(p, 'meta-desc-missing', 'high', 'Missing meta description', `${p.url} has no meta description.`, 'Write a 70–160 char description that earns the click and includes the keyword.'));
    } else if (descLen < DESC_MIN) {
      issues.push(meta(p, 'meta-desc-short', 'low', 'Meta description too short', `Description is ${descLen} chars (< ${DESC_MIN}).`, `Expand toward ${DESC_MIN}–${DESC_MAX} chars with a benefit + CTA.`));
    } else if (descLen > DESC_MAX) {
      issues.push(meta(p, 'meta-desc-long', 'low', 'Meta description too long', `Description is ${descLen} chars (> ${DESC_MAX}) and may truncate.`, `Trim to ${DESC_MAX} chars.`));
    }

    // Thin content
    if (p.wordCount !== null && p.wordCount < THIN_WORDS) {
      issues.push({
        issueType: 'thin-content', category: 'content',
        severity: p.pageType === 'seo-programmatic' ? 'high' : 'medium',
        title: 'Thin content', description: `${p.url} has only ${p.wordCount} words.`,
        url: p.url, affectedUrls: [p.url],
        evidence: `${p.wordCount} words (< ${THIN_WORDS}).`,
        recommendedFix: 'Expand with a worked example, a drill/how-to, and an FAQ block so it fully answers the query.',
        fixComplexity: 'medium', expectedImpact: 'high', confidence: 85,
        autoFixAvailable: false, requiresApproval: true,
      });
    }

    // AEO: missing direct-answer block (SEO guides carry this field)
    if (p.source === 'seo-catalog' && !p.hasDirectAnswer) {
      issues.push({
        issueType: 'missing-direct-answer', category: 'content', severity: 'medium',
        title: 'Missing direct-answer block', description: `${p.url} has no concise direct-answer paragraph.`,
        url: p.url, affectedUrls: [p.url],
        evidence: 'No direct-answer field populated.',
        recommendedFix: 'Add a 2–3 sentence direct answer at the very top (AEO/GEO citation-ready).',
        fixComplexity: 'low', expectedImpact: 'medium', confidence: 90,
        autoFixAvailable: true, requiresApproval: true,
      });
    }

    // AEO: no FAQ block on an SEO guide
    if (p.source === 'seo-catalog' && p.faqCount === 0) {
      issues.push({
        issueType: 'missing-faq', category: 'content', severity: 'low',
        title: 'No FAQ block', description: `${p.url} has no FAQs (missed AEO + FAQPage schema).`,
        url: p.url, affectedUrls: [p.url],
        evidence: '0 FAQs.', recommendedFix: 'Add 3–5 question/answer pairs + FAQPage schema.',
        fixComplexity: 'low', expectedImpact: 'medium', confidence: 88,
        autoFixAvailable: true, requiresApproval: true,
      });
    }

    // Schema presence
    if (p.schemaTypes.length === 0) {
      issues.push({
        issueType: 'missing-schema', category: 'schema', severity: 'low',
        title: 'No structured data', description: `${p.url} declares no schema.org type.`,
        url: p.url, affectedUrls: [p.url],
        evidence: 'No schema types found.', recommendedFix: 'Add the most fitting schema (Article / HowTo / FAQPage).',
        fixComplexity: 'low', expectedImpact: 'low', confidence: 80,
        autoFixAvailable: true, requiresApproval: true,
      });
    }
  }

  // ── Duplicate metadata across owned pages ──
  pushDuplicates(issues, owned, (p) => p.metaTitle.trim().toLowerCase(), 'duplicate-title', 'metadata', 'Duplicate meta titles', 'share an identical title (cannibalization risk)', 'Differentiate each title by intent/sub-topic.');
  pushDuplicates(issues, owned, (p) => (p.metaDescription ?? '').trim().toLowerCase(), 'duplicate-desc', 'metadata', 'Duplicate meta descriptions', 'share an identical description', 'Write a unique description per page.');

  // ── Keyword cannibalization (same target keyword on multiple pages) ──
  pushDuplicates(
    issues,
    pages.filter((p) => p.keyword),
    (p) => (p.keyword ?? '').trim().toLowerCase(),
    'keyword-cannibalization', 'cannibalization',
    'Keyword cannibalization', 'target the same keyword (split authority)',
    'Consolidate to one canonical page or differentiate the intent; add internal links to the primary.',
  );

  // ── Sitemap / indexing ──
  for (const p of pages) {
    if (p.indexable && !p.inSitemap) {
      issues.push({
        issueType: 'missing-from-sitemap', category: 'sitemap', severity: 'medium',
        title: 'Indexable page missing from sitemap', description: `${p.url} is indexable but not in the XML sitemap.`,
        url: p.url, affectedUrls: [p.url],
        evidence: 'Not emitted by app/sitemap.ts.',
        recommendedFix: 'Add the page to its sitemap registry (CURATED_URLS or the relevant dynamic source).',
        fixComplexity: 'low', expectedImpact: 'medium', confidence: 92,
        autoFixAvailable: true, requiresApproval: true,
      });
    }
  }

  // ── Internal-link findings (reused) ──
  for (const f of linkFindings) issues.push(fromLinkFinding(f));

  return issues.map(finalize).sort((a, b) => b.priorityScore - a.priorityScore);
}

// ── helpers ──

function meta(
  p: PageIntel, issueType: string, severity: IssueSeverity,
  title: string, evidence: string, fix: string,
): IssueDraft {
  return {
    issueType, category: 'metadata', severity, title,
    description: `${title} on ${p.url}.`, url: p.url, affectedUrls: [p.url],
    evidence, recommendedFix: fix,
    fixComplexity: 'low', expectedImpact: severity === 'high' ? 'high' : 'medium',
    confidence: 92, autoFixAvailable: true, requiresApproval: true,
  };
}

function pushDuplicates(
  out: IssueDraft[], pages: PageIntel[], key: (p: PageIntel) => string,
  issueType: string, category: IssueCategory, title: string, verb: string, fix: string,
): void {
  const groups = new Map<string, PageIntel[]>();
  for (const p of pages) {
    const k = key(p);
    if (!k) continue;
    const arr = groups.get(k) ?? [];
    arr.push(p);
    groups.set(k, arr);
  }
  for (const [k, group] of groups) {
    if (group.length < 2) continue;
    const urls = group.map((p) => p.url);
    out.push({
      issueType, category, severity: 'medium', title,
      description: `${group.length} pages ${verb}: "${k.slice(0, 60)}".`,
      url: urls[0], affectedUrls: urls,
      evidence: urls.join(', '),
      recommendedFix: fix,
      fixComplexity: 'medium', expectedImpact: 'medium', confidence: 85,
      autoFixAvailable: false, requiresApproval: true,
    });
  }
}
