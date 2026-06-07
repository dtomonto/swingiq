// ============================================================
// Link Intelligence Agent — anchor text intelligence
// ------------------------------------------------------------
// Classifies anchor text and builds a per-destination anchor profile so the
// agent can keep a HEALTHY, natural anchor mix and flag over-optimization
// (the #1 way internal linking turns from helpful to spammy/penalized).
// ============================================================

import type { PageNode, LinkEdge, AnchorKind, AnchorProfile } from './types';

const GENERIC = new Set([
  'click here', 'here', 'read more', 'learn more', 'this', 'this page',
  'link', 'more', 'see more', 'find out more', 'this article', 'read', 'view',
]);
const BRAND = ['swingvantage', 'swingiq', 'swing vantage'];
const CTA = ['start', 'get started', 'try', 'try it', 'try free', 'upload', 'sign up', 'analyze', 'get your', 'start free'];

function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
}

/** Overlap ratio of two short phrases (0..1) by shared significant tokens. */
function overlap(a: string, b: string): number {
  const ta = new Set(tokens(a));
  const tb = tokens(b);
  if (ta.size === 0 || tb.length === 0) return 0;
  const shared = tb.filter((t) => t.length > 2 && ta.has(t)).length;
  return shared / Math.max(ta.size, tb.length);
}

/**
 * Classify an anchor relative to its destination. `dest` may be undefined
 * (e.g. links to non-inventory app routes) — then we classify on text alone.
 */
export function classifyAnchor(anchor: string, dest?: PageNode): AnchorKind {
  const a = anchor.trim().toLowerCase();
  if (!a) return 'generic';
  if (GENERIC.has(a)) return 'generic';
  if (BRAND.some((b) => a.includes(b))) return 'branded';
  if (CTA.some((c) => a === c || a.startsWith(`${c} `))) return 'cta';

  const keyword = dest?.keyword?.toLowerCase();
  if (keyword) {
    if (a === keyword) return 'exact-match';
    const ov = overlap(keyword, a);
    if (ov >= 0.6) return 'partial-match';
  }

  // Navigational: short label matching a section/page title head.
  if (dest && tokens(a).length <= 2 && overlap(dest.title, a) >= 0.5) return 'navigational';

  // Descriptive (multi-word, meaningful) vs natural (short phrase).
  return tokens(a).length >= 3 ? 'descriptive' : 'natural';
}

const EMPTY_BY_KIND = (): Record<AnchorKind, number> => ({
  'exact-match': 0, 'partial-match': 0, 'branded': 0, 'natural': 0,
  'descriptive': 0, 'navigational': 0, 'generic': 0, 'image-alt': 0, 'cta': 0,
});

/**
 * Build the anchor-text profile for one destination from the inbound edges
 * pointing at it. Computes anchor diversity and an over-optimization flag.
 */
export function buildAnchorProfile(dest: PageNode, edges: LinkEdge[]): AnchorProfile {
  const inbound = edges.filter((e) => e.to === dest.url);
  const byKind = EMPTY_BY_KIND();
  const counts = new Map<string, number>();

  for (const e of inbound) {
    const kind = classifyAnchor(e.anchor, dest);
    byKind[kind] += 1;
    const key = e.anchor.trim().toLowerCase() || '(empty)';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const total = inbound.length;
  const topAnchors = [...counts.entries()]
    .map(([anchor, count]) => ({ anchor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Diversity: unique anchors / total, lightly penalizing exact-match dominance.
  const uniqueRatio = total === 0 ? 1 : counts.size / total;
  const exactShare = total === 0 ? 0 : byKind['exact-match'] / total;
  const diversityScore = Math.round(Math.max(0, Math.min(100, (uniqueRatio - exactShare * 0.5) * 100)));

  // Over-optimized: an exact-match anchor dominates a meaningful inbound set.
  const overOptimized = total >= 3 && exactShare > 0.5;

  return { destinationUrl: dest.url, total, byKind, topAnchors, diversityScore, overOptimized };
}

/** Build anchor profiles for every page that has inbound links. */
export function buildAllAnchorProfiles(nodes: PageNode[], edges: LinkEdge[]): AnchorProfile[] {
  return nodes
    .filter((n) => n.inboundCount > 0)
    .map((n) => buildAnchorProfile(n, edges))
    .sort((a, b) => b.total - a.total);
}
