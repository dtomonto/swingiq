// ============================================================
// Link Intelligence Agent — internal link analyzer + recommender
// ------------------------------------------------------------
// The real engine. From the link graph it (1) AUDITS the site for orphan,
// broken, weak, deep, over-linked, over-optimized and cannibalization
// issues, and (2) RECOMMENDS specific source→destination internal links
// with a natural anchor, an explainable score, and an auto-safe verdict.
// Output records persist via GrowthOS's repository (kinds link-finding /
// internal-link-rec).
// ============================================================

import type {
  LinkGraph, PageNode, LinkFinding, LinkFindingType, LinkFindingSeverity,
  InternalLinkRecommendation, AnchorKind,
} from './types';
import type { Scale } from '../types';
import { scoreInternalLink, scorePageEquity } from './scoring';
import { classifyAnchor, buildAnchorProfile } from './anchor';
import { evaluateAutoApply } from './guardrails';
import { clusterById } from './clusters';
import { id } from './id';

const nowIso = () => new Date().toISOString();

// Page types that can host a new in-body contextual link as a SOURCE.
const SOURCE_TYPES = new Set<PageNode['pageType']>(['blog', 'seo-programmatic', 'sport-hub', 'feature', 'tool']);
// Page types worth fixing as a DESTINATION (real content, not legal/utility).
const DEST_TYPES = new Set<PageNode['pageType']>(['blog', 'seo-programmatic', 'sport-hub', 'feature', 'tool', 'glossary', 'benchmark', 'comparison', 'video']);

const OVER_LINKED_THRESHOLD = 80; // distinct internal outbound links before it's "too many"

function severityFor(priority: number, base: LinkFindingSeverity): LinkFindingSeverity {
  if (priority <= 2) return base === 'low' ? 'medium' : 'high';
  return base;
}

// ── 1. Audit findings ─────────────────────────────────────────
export function analyzeFindings(graph: LinkGraph): LinkFinding[] {
  const findings: LinkFinding[] = [];
  const finding = (
    findingType: LinkFindingType, page: PageNode, severity: LinkFindingSeverity,
    detail: string, recommendedAction: string, metric: number | null,
  ): LinkFinding => ({
    id: id('lf', findingType, page.url),
    name: `${findingType}: ${page.title}`,
    dataSource: 'real',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    findingType,
    pageUrl: page.url,
    sport: page.sport,
    severity,
    detail,
    recommendedAction,
    metric,
    status: 'open',
  });

  for (const node of graph.nodes) {
    const isContent = DEST_TYPES.has(node.pageType);

    // Orphan: unreachable from the homepage by internal links.
    if (isContent && !Number.isFinite(node.depth)) {
      findings.push(finding('orphan', node, severityFor(node.priority, 'high'),
        'No internal path reaches this page from the homepage — search engines and users can\'t discover it.',
        'Add at least one contextual internal link from a relevant, well-linked page (see recommendations).', null));
      continue; // an orphan is also weak/deep, but one finding is enough
    }

    // Weak inlinks: high-value page with ≤1 internal inbound link.
    if (isContent && Number.isFinite(node.depth) && node.inboundCount <= 1 && node.priority <= 3) {
      findings.push(finding('weak-inlinks', node, severityFor(node.priority, 'medium'),
        `Only ${node.inboundCount} internal inbound link${node.inboundCount === 1 ? '' : 's'} for a P${node.priority} page.`,
        'Add 1–2 contextual internal links from same-cluster pages to build support.', node.inboundCount));
    }

    // Deep page: important content buried ≥4 clicks from home.
    if (isContent && Number.isFinite(node.depth) && node.depth >= 4 && node.priority <= 3) {
      findings.push(finding('deep-page', node, severityFor(node.priority, 'medium'),
        `This P${node.priority} page is ${node.depth} clicks from the homepage.`,
        'Link to it from a shallower hub or pillar page to reduce crawl depth.', node.depth));
    }

    // Over-linked: an unusually high number of internal outbound links.
    if (node.outboundCount > OVER_LINKED_THRESHOLD) {
      findings.push(finding('over-linked', node, 'low',
        `${node.outboundCount} internal outbound links dilute the equity each one passes.`,
        'Trim to the most relevant links; keep contextual links focused.', node.outboundCount));
    }

    // Anchor over-optimization (computed from inbound anchors).
    if (node.inboundCount >= 3) {
      const profile = buildAnchorProfile(node, graph.edges);
      if (profile.overOptimized) {
        findings.push(finding('anchor-over-optimized', node, 'medium',
          `Exact-match anchors dominate this page's ${profile.total} inbound links (diversity ${profile.diversityScore}/100).`,
          'Vary inbound anchors toward descriptive/partial-match phrasing.', profile.diversityScore));
      }
    }
  }

  // Broken internal links (edge destinations that don't resolve).
  for (const e of graph.edges) {
    if (!e.broken) continue;
    const src = graph.byUrl.get(e.from);
    findings.push({
      id: id('lf', 'broken', e.from, e.to),
      name: `broken-internal: ${e.from} → ${e.to}`,
      dataSource: 'real',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      findingType: 'broken-internal',
      pageUrl: e.from,
      sport: src?.sport ?? 'multi',
      severity: 'high',
      detail: `Link to "${e.to}" (anchor: "${e.anchor}") doesn't resolve to a known page.`,
      recommendedAction: 'Fix the URL or remove the link; if the target was renamed, point it at the new page.',
      metric: null,
      status: 'open',
    });
  }

  // Cannibalization: 2+ pages in the same cluster targeting the same keyword.
  const byClusterKeyword = new Map<string, PageNode[]>();
  for (const node of graph.nodes) {
    if (!node.keyword) continue;
    const key = `${node.cluster}::${node.keyword.toLowerCase()}`;
    const arr = byClusterKeyword.get(key) ?? [];
    arr.push(node);
    byClusterKeyword.set(key, arr);
  }
  for (const [, pages] of byClusterKeyword) {
    if (pages.length < 2) continue;
    const [primary, ...rest] = pages.sort((a, b) => a.priority - b.priority);
    for (const dup of rest) {
      findings.push(finding('cannibalization', dup, 'low',
        `Targets the same keyword "${dup.keyword}" as "${primary.title}" — they may compete in search.`,
        `Differentiate intent or consolidate; link the weaker page to "${primary.title}".`, null));
    }
  }

  return findings;
}

// ── 2. Internal link recommendations ──────────────────────────

const MAX_PER_DEST = 2;
const MAX_TOTAL = 80;

/** A natural, non-exact descriptive anchor derived from a destination. */
function suggestedAnchor(dest: PageNode): string {
  const base = dest.title.replace(/\(.*?\)/g, '').replace(/\s*[|–-]\s.*$/, '').trim();
  return base.length > 60 ? `${base.slice(0, 57)}…` : base;
}

function riskFor(anchorKind: AnchorKind, dest: PageNode): Scale {
  if (anchorKind === 'exact-match') return 'medium';
  if (dest.sensitive) return 'medium';
  return 'low';
}

export function recommendInternalLinks(graph: LinkGraph): InternalLinkRecommendation[] {
  // Existing edges, so we never recommend a duplicate link.
  const existing = new Set(graph.edges.map((e) => `${e.from}|${e.to}`));

  // Destinations worth strengthening, most under-supported first.
  const destinations = graph.nodes
    .filter((n) => DEST_TYPES.has(n.pageType))
    .map((n) => ({ node: n, equity: scorePageEquity(n) }))
    .filter((d) => d.equity.need >= 25 || !Number.isFinite(d.node.depth) || d.node.inboundCount <= 1)
    .sort((a, b) => b.equity.need - a.equity.need);

  const recs: InternalLinkRecommendation[] = [];

  for (const { node: dest } of destinations) {
    if (recs.length >= MAX_TOTAL) break;
    const destProfile = buildAnchorProfile(dest, graph.edges);
    const anchorText = suggestedAnchor(dest);
    const anchorKind = classifyAnchor(anchorText, dest);

    // Candidate sources: relevant content pages not already linking to dest.
    const candidates = graph.nodes
      .filter((s) =>
        s.url !== dest.url &&
        SOURCE_TYPES.has(s.pageType) &&
        !s.sensitive &&
        (s.cluster === dest.cluster || s.sport === dest.sport) &&
        !existing.has(`${s.url}|${dest.url}`))
      .map((s) => ({ s, sc: scoreInternalLink(s, dest, anchorKind) }))
      .sort((a, b) => b.sc.score - a.sc.score);

    let made = 0;
    for (const { s, sc } of candidates) {
      if (made >= MAX_PER_DEST || recs.length >= MAX_TOTAL) break;
      if (sc.score < 35) break; // not worth recommending below this

      const auto = evaluateAutoApply({ source: s, dest, anchorKind, score: sc.score, destProfile });
      const clusterLabel = clusterById(dest.cluster)?.label ?? dest.cluster;

      recs.push({
        id: id('ilr', s.url, dest.url),
        name: `${s.title} → ${dest.title}`,
        dataSource: 'real',
        createdAt: nowIso(),
        updatedAt: nowIso(),
        sourceUrl: s.url,
        destinationUrl: dest.url,
        anchorText,
        anchorKind,
        contextSentence: `On "${s.title}", add a contextual sentence linking to ${dest.title} — e.g. "…see our guide on ${anchorText.toLowerCase()}."`,
        placement: s.pageType === 'sport-hub' ? 'Related guides / silo module' : 'In-body contextual paragraph',
        purpose: `Strengthen ${clusterLabel} topical authority and pass equity to an under-linked page.`,
        targetKeyword: dest.keyword ?? dest.title,
        userBenefit: `Readers of "${s.title}" get a relevant next step toward ${dest.title}.`,
        cluster: dest.cluster,
        riskLevel: riskFor(anchorKind, dest),
        score: sc.score,
        scoreFactors: sc.factors,
        autoSafe: auto.safe,
        status: 'pending',
      });
      existing.add(`${s.url}|${dest.url}`);
      made += 1;
    }
  }

  return recs.sort((a, b) => b.score - a.score);
}
