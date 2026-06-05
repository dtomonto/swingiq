// ============================================================
// SwingVantage — Performance Graph Foundation: Builder + Queries
// ------------------------------------------------------------
// Assembles a relationship graph from existing client data and
// offers small query utilities. Deterministic and dependency-free
// so it can later be persisted to a real graph store unchanged.
// ============================================================

import type { SportId } from '@swingiq/core';
import type {
  GraphEdge,
  GraphNode,
  GraphNodeType,
  GraphSummary,
  PerformanceGraph,
  PerformanceGraphInput,
} from './types';

export const PERFORMANCE_GRAPH_DISCLAIMER =
  'This is the foundation for the SwingVantage Performance Graph — a real map of how your sessions, faults, drills and retests connect. It is a transparent data model, not a proprietary AI graph (yet). It grows richer the more you use SwingVantage.';

function faultNodeId(sport: SportId, faultId: string): string {
  return `fault:${sport}:${faultId}`;
}

export function buildPerformanceGraph(input: PerformanceGraphInput): PerformanceGraph {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const addNode = (n: GraphNode) => {
    if (!nodes.has(n.id)) nodes.set(n.id, n);
  };

  const userId = `user:${input.userId}`;
  addNode({ id: userId, type: 'user', label: 'You' });

  for (const sport of input.sports) {
    const sportId = `sport:${sport}`;
    addNode({ id: sportId, type: 'sport', label: sport, sport });
    edges.push({ from: userId, to: sportId, type: 'plays' });
  }

  for (const s of input.sessions) {
    const sessionId = `session:${s.id}`;
    addNode({ id: sessionId, type: 'session', label: s.focus ?? 'Session', sport: s.sport });
    edges.push({ from: `sport:${s.sport}`, to: sessionId, type: 'has_session' });
    if (s.focus) {
      const fId = faultNodeId(s.sport, s.focus);
      addNode({ id: fId, type: 'fault', label: s.focus, sport: s.sport });
      edges.push({ from: sessionId, to: fId, type: 'diagnosed' });
    }
  }

  for (const h of input.helpedDrills) {
    const drillId = `drill:${h.drillId}`;
    const fId = faultNodeId(h.sport, h.faultName);
    addNode({ id: drillId, type: 'drill', label: h.drillName, sport: h.sport });
    addNode({ id: fId, type: 'fault', label: h.faultName, sport: h.sport });
    edges.push({ from: fId, to: drillId, type: 'addressed_by' });
    edges.push({ from: drillId, to: fId, type: 'helped', weight: 1 });
  }

  for (const r of input.retests) {
    const retestId = `retest:${r.id}`;
    const fId = faultNodeId(r.sport, r.focus);
    addNode({ id: retestId, type: 'retest', label: `Retest: ${r.focus}`, sport: r.sport });
    addNode({ id: fId, type: 'fault', label: r.focus, sport: r.sport });
    edges.push({ from: fId, to: retestId, type: 'retested_as' });
  }

  return { nodes: [...nodes.values()], edges };
}

/** Node ids directly connected to a node (either direction). */
export function neighbors(graph: PerformanceGraph, nodeId: string): string[] {
  const set = new Set<string>();
  for (const e of graph.edges) {
    if (e.from === nodeId) set.add(e.to);
    if (e.to === nodeId) set.add(e.from);
  }
  return [...set];
}

export function summarizeGraph(graph: PerformanceGraph): GraphSummary {
  const countsByType = {
    user: 0, sport: 0, session: 0, fault: 0, drill: 0, retest: 0,
  } as Record<GraphNodeType, number>;
  for (const n of graph.nodes) countsByType[n.type]++;

  let mostConnectedFault: GraphSummary['mostConnectedFault'] = null;
  for (const n of graph.nodes) {
    if (n.type !== 'fault') continue;
    const connections = neighbors(graph, n.id).length;
    if (!mostConnectedFault || connections > mostConnectedFault.connections) {
      mostConnectedFault = { id: n.id, label: n.label, connections };
    }
  }

  return {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    countsByType,
    mostConnectedFault,
  };
}
