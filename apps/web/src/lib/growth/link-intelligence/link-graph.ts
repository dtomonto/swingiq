// ============================================================
// Link Intelligence Agent — internal link graph
// ------------------------------------------------------------
// Merges DECLARED links (each page's relatedLinks / relatedSlugs / CTA)
// with the site's REAL structural links (global nav, hub→silo, index→child)
// to model how authority and crawlers actually flow. Then computes, per
// page: inbound/outbound counts, BFS depth from the homepage (→ orphans),
// and flags edges whose destination doesn't resolve (→ broken internal).
// ============================================================

import type { PageNode, LinkEdge, LinkGraph } from './types';

// Real app routes that exist but are intentionally NOT in the public
// inventory (authenticated / non-indexed). Links to these are valid — not
// broken — they just aren't graph nodes. Prefix-matched.
const KNOWN_APP_ROUTES = [
  '/dashboard', '/upload', '/analyze', '/drills', '/account', '/settings',
  '/login', '/signup', '/profile', '/journey', '/recruiting', '/notes',
  '/bodysync', '/agi', '/fix', '/arc', '/labs', '/motion-lab', '/equipment',
  '/player', '/auth', '/reset-password',
];

function isKnownAppRoute(url: string): boolean {
  return KNOWN_APP_ROUTES.some((r) => url === r || url.startsWith(`${r}/`));
}

const KEY_NAV_TARGETS = ['/features', '/how-it-works', '/blog', '/tools', '/pricing', '/faq', '/learn', '/benchmarks'];

/**
 * The real structural links SwingVantage renders (nav, footer, hub silos,
 * index→child). Only emitted to destinations that exist in the inventory,
 * so structural edges are never "broken".
 */
function structuralEdges(nodes: PageNode[], byUrl: Map<string, PageNode>): LinkEdge[] {
  const edges: LinkEdge[] = [];
  const has = (u: string) => byUrl.has(u);
  const link = (from: string, to: string, anchor: string) => {
    if (has(from) && has(to) && from !== to) edges.push({ from, to, anchor });
  };

  const hubs = nodes.filter((n) => n.pageType === 'sport-hub');

  // Homepage → sport hubs + key nav pages (global nav/footer).
  for (const h of hubs) link('/', h.url, h.title);
  for (const t of KEY_NAV_TARGETS) link('/', t, t.replace('/', '').replace(/-/g, ' ') || 'home');

  // Sport hub → same-sport SEO/blog pages (RelatedGuides silo).
  for (const h of hubs) {
    for (const n of nodes) {
      if (n.url === h.url) continue;
      if (n.sport === h.sport && (n.pageType === 'seo-programmatic' || n.pageType === 'blog')) {
        link(h.url, n.url, n.keyword ?? n.title);
        // silo back-link to the hub strengthens the pillar
        link(n.url, h.url, h.title);
      }
    }
  }

  // Index pages → their children (blog, tools, benchmarks, challenges, learn).
  const indexRules: Array<{ index: string; childPrefix: string }> = [
    { index: '/blog', childPrefix: '/blog/' },
    { index: '/tools', childPrefix: '/tools/' },
    { index: '/benchmarks', childPrefix: '/benchmarks/' },
    { index: '/challenges', childPrefix: '/challenges/' },
    { index: '/learn', childPrefix: '/learn/' },
    { index: '/sample-report', childPrefix: '/sample-report/' },
  ];
  for (const { index, childPrefix } of indexRules) {
    if (!has(index)) continue;
    for (const n of nodes) {
      if (n.url !== index && n.url.startsWith(childPrefix)) link(index, n.url, n.title);
    }
  }

  // Partners hub → audience pages.
  for (const aud of ['/coaches', '/creators', '/teams', '/parents']) link('/partners', aud, aud.replace('/', ''));

  return edges;
}

/**
 * Build the link graph from an inventory: merge + dedupe edges, mark broken
 * internal links, and compute inbound/outbound/depth on each node (mutated
 * in place and returned).
 */
export function buildLinkGraph(nodes: PageNode[]): LinkGraph {
  const byUrl = new Map(nodes.map((n) => [n.url, n]));

  // Collect + dedupe edges (declared first, then structural).
  const seen = new Set<string>();
  const edges: LinkEdge[] = [];
  const push = (e: LinkEdge) => {
    if (e.from === e.to) return;
    const key = `${e.from}|${e.to}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ ...e });
  };
  for (const n of nodes) for (const e of n.outboundLinks) push(e);
  for (const e of structuralEdges(nodes, byUrl)) push(e);

  // Flag broken internal links (destination is neither a page nor a known app route).
  for (const e of edges) {
    if (!byUrl.has(e.to) && !isKnownAppRoute(e.to)) e.broken = true;
  }

  // Reset computed signals.
  for (const n of nodes) {
    n.inboundCount = 0;
    n.outboundCount = 0;
    n.depth = Number.POSITIVE_INFINITY;
  }

  // Adjacency among inventory nodes only (drives counts + BFS).
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    const from = byUrl.get(e.from);
    const to = byUrl.get(e.to);
    if (!from || !to) continue;
    from.outboundCount += 1;
    to.inboundCount += 1;
    const list = adj.get(e.from) ?? [];
    list.push(e.to);
    adj.set(e.from, list);
  }

  // BFS depth from the homepage (fallback: first node).
  const start = byUrl.has('/') ? '/' : nodes[0]?.url;
  if (start) {
    byUrl.get(start)!.depth = 0;
    const queue: string[] = [start];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      const d = byUrl.get(cur)!.depth;
      for (const next of adj.get(cur) ?? []) {
        const node = byUrl.get(next)!;
        if (node.depth > d + 1) {
          node.depth = d + 1;
          queue.push(next);
        }
      }
    }
  }

  return { nodes, edges, byUrl };
}

/** Convenience: the canonical graph built from the live inventory. */
export function isBrokenEdge(e: LinkEdge): boolean {
  return e.broken === true;
}
