// ============================================================
// Link Intelligence Agent — topical authority clusters
// ------------------------------------------------------------
// The cluster taxonomy SwingVantage organizes its pages into (7 sports +
// cross-sport). Pages are assigned a cluster during inventory; cluster
// HEALTH (interlinking, orphans, depth, pillar inbound) is computed from
// the link graph. Used by the hub's "Sport cluster authority" panel and
// the content-gap engine (missing topics).
// ============================================================

import type { LinkGraph, LinkSport, ClusterHealth, PageNode } from './types';

export interface ClusterDef {
  id: string;
  label: string;
  sport: LinkSport;
  /** Lowercased fragments that map a page (by keyword/url/title) into this cluster. */
  match: string[];
  /** Sub-topics a complete cluster should cover (drives missing-topic gaps). */
  topics: string[];
}

// Order matters: more specific clusters first so a page lands in the best fit.
export const CLUSTERS: ClusterDef[] = [
  // ── Golf ────────────────────────────────────────────────────
  { id: 'golf-swing-analysis', label: 'Golf swing analysis', sport: 'golf', match: ['golf', 'slice', 'driver', 'iron', 'wedge', 'putt', 'handicap', 'topping', 'smash factor', 'launch monitor'], topics: ['driver slice correction', 'iron contact', 'wedge control', 'putting improvement', 'launch monitor metrics', 'handicap improvement', 'golf practice plans', 'golf drills', 'golf AI coaching'] },
  // ── Tennis ──────────────────────────────────────────────────
  { id: 'tennis-swing-analysis', label: 'Tennis swing analysis', sport: 'tennis', match: ['tennis', 'forehand', 'backhand', 'serve', 'utr', 'ntrp', 'usta', 'footwork'], topics: ['forehand mechanics', 'backhand mechanics', 'serve analysis', 'footwork', 'UTR improvement', 'tennis drills', 'tennis strategy', 'tennis AI coaching'] },
  // ── Pickleball ──────────────────────────────────────────────
  { id: 'pickleball', label: 'Pickleball', sport: 'pickleball', match: ['pickleball', 'third-shot', 'third shot', 'dink', 'paddle'], topics: ['serve mechanics', 'third-shot drop', 'dink mechanics', 'footwork', 'paddle technique', 'pickleball AI coaching'] },
  // ── Padel ───────────────────────────────────────────────────
  { id: 'padel', label: 'Padel', sport: 'padel', match: ['padel', 'bandeja', 'vibora', 'wall play', 'volley'], topics: ['bandeja', 'vibora', 'wall play', 'volley mechanics', 'footwork', 'padel AI coaching'] },
  // ── Baseball ────────────────────────────────────────────────
  { id: 'baseball', label: 'Baseball', sport: 'baseball', match: ['baseball', 'bat speed', 'exit velocity', 'rolling over', 'hitting'], topics: ['bat speed', 'exit velocity', 'hitting mechanics', 'youth development', 'recruiting videos', 'baseball drills', 'baseball AI coaching'] },
  // ── Softball (slow / fast / general) ────────────────────────
  { id: 'softball-slow', label: 'Slow-pitch softball', sport: 'softball', match: ['slow-pitch', 'slow pitch', 'line drive', 'popping up'], topics: ['bat path', 'launch angle', 'line-drive hitting', 'fielding drills', 'slow-pitch bat reviews', 'slow-pitch AI coaching'] },
  { id: 'softball-fast', label: 'Fast-pitch softball', sport: 'softball', match: ['fast-pitch', 'fast pitch', 'pitch recognition'], topics: ['pitch recognition', 'bat speed', 'recruiting film', 'softball drills', 'fast-pitch AI coaching'] },
  { id: 'softball', label: 'Softball', sport: 'softball', match: ['softball'], topics: ['bat path', 'launch angle', 'softball drills', 'softball AI coaching'] },
  // ── Cross-sport / brand ─────────────────────────────────────
  { id: 'cross-sport', label: 'Cross-sport & AI', sport: 'multi', match: ['ai swing', 'video analysis', 'athlete', 'biomechanics', 'recruiting', 'training plan', 'equipment', 'wearable', 'progress', 'general intelligence', 'methodology'], topics: ['AI swing analysis', 'video analysis', 'athlete development', 'biomechanics', 'sports recruiting', 'personalized training plans', 'equipment intelligence', 'health & wearable integrations', 'progress tracking', 'AI coaching agents'] },
];

const CLUSTER_BY_ID = new Map(CLUSTERS.map((c) => [c.id, c]));

export function clusterById(id: string): ClusterDef | undefined {
  return CLUSTER_BY_ID.get(id);
}

/**
 * Assign a page to its best cluster from sport + free text (keyword/url/title).
 * Prefers a sport-matched cluster whose `match` fragments appear in the text;
 * falls back to the sport's primary cluster, then cross-sport.
 */
export function clusterForPage(sport: LinkSport, text: string): string {
  const hay = text.toLowerCase();
  // 1) Best specific match within the same sport.
  const sameSport = CLUSTERS.filter((c) => c.sport === sport);
  for (const c of sameSport) {
    if (c.match.some((m) => hay.includes(m))) return c.id;
  }
  // 2) Sport's primary (first) cluster.
  if (sameSport[0]) return sameSport[0].id;
  // 3) Cross-sport catch-all.
  return 'cross-sport';
}

/** Pick a plausible pillar page for a cluster: the lowest-priority-number,
 *  shallowest hub/feature page in the cluster (or just the strongest page). */
function pickPillar(pages: PageNode[]): PageNode | undefined {
  if (pages.length === 0) return undefined;
  const hubs = pages.filter((p) => p.pageType === 'sport-hub' || p.pageType === 'feature');
  const pool = hubs.length > 0 ? hubs : pages;
  return [...pool].sort((a, b) => a.priority - b.priority || a.depth - b.depth)[0];
}

/** Compute interlinking/authority health for every cluster from the graph. */
export function computeClusterHealth(graph: LinkGraph): ClusterHealth[] {
  const byCluster = new Map<string, PageNode[]>();
  for (const node of graph.nodes) {
    const arr = byCluster.get(node.cluster) ?? [];
    arr.push(node);
    byCluster.set(node.cluster, arr);
  }

  return CLUSTERS.map((def) => {
    const pages = byCluster.get(def.id) ?? [];
    const pillar = pickPillar(pages);
    const orphanCount = pages.filter((p) => !Number.isFinite(p.depth)).length;
    const finiteDepths = pages.map((p) => p.depth).filter((d) => Number.isFinite(d));
    const avgDepth = finiteDepths.length
      ? Math.round((finiteDepths.reduce((a, b) => a + b, 0) / finiteDepths.length) * 10) / 10
      : 0;
    const inboundToPillar = pillar ? pillar.inboundCount : 0;

    // Authority score (0..100), explainable + bounded:
    //  + coverage of expected topics, + pillar inbound links,
    //  - orphans, - excessive average depth.
    const coverage = pages.length === 0 ? 0 : Math.min(1, pages.length / Math.max(3, def.topics.length));
    const pillarStrength = Math.min(1, inboundToPillar / 4);
    const orphanPenalty = pages.length === 0 ? 0 : orphanCount / pages.length;
    const depthPenalty = Math.min(1, Math.max(0, (avgDepth - 2) / 4));
    const authorityScore = Math.round(
      Math.max(0, Math.min(100,
        coverage * 45 + pillarStrength * 35 + (1 - orphanPenalty) * 10 + (1 - depthPenalty) * 10,
      )),
    );

    // Missing topics: cluster sub-topics not represented by any page keyword/title.
    const present = pages
      .map((p) => `${p.keyword ?? ''} ${p.title}`.toLowerCase())
      .join(' | ');
    const missingTopics = def.topics.filter((t) => {
      const head = t.split(' ')[0];
      return !present.includes(t.toLowerCase()) && !present.includes(head.toLowerCase());
    });

    return {
      id: def.id,
      label: def.label,
      sport: def.sport,
      pillarUrl: pillar?.url,
      pageCount: pages.length,
      supportingCount: Math.max(0, pages.length - (pillar ? 1 : 0)),
      orphanCount,
      avgDepth,
      inboundToPillar,
      authorityScore,
      missingTopics,
    };
  });
}
