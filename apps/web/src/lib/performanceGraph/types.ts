// ============================================================
// SwingVantage — Performance Graph Foundation: Types
// ------------------------------------------------------------
// A typed, relationship-friendly model linking the entities that
// make up a player's improvement history. This is the FOUNDATION
// for a future SwingVantage Performance Graph — a real, queryable data
// structure today, NOT a proprietary ML graph (no such claim).
// ============================================================

import type { SportId } from '@swingiq/core';

export type GraphNodeType =
  | 'user'
  | 'sport'
  | 'session'
  | 'fault'
  | 'drill'
  | 'retest';

export type GraphEdgeType =
  | 'plays'        // user → sport
  | 'has_session'  // sport → session
  | 'diagnosed'    // session → fault
  | 'addressed_by' // fault → drill
  | 'helped'       // drill → fault (positive feedback)
  | 'retested_as'; // fault → retest

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  sport?: SportId;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: GraphEdgeType;
  /** Optional strength (e.g. how many times observed). */
  weight?: number;
}

export interface PerformanceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Compact input assembled from existing client data. */
export interface PerformanceGraphInput {
  userId: string;
  sports: SportId[];
  sessions: { id: string; sport: SportId; focus: string | null }[];
  /** drillId → faultId pairs the user marked "helped". */
  helpedDrills: { drillId: string; drillName: string; faultId: string; faultName: string; sport: SportId }[];
  retests: { id: string; sport: SportId; focus: string }[];
}

export interface GraphSummary {
  nodeCount: number;
  edgeCount: number;
  countsByType: Record<GraphNodeType, number>;
  /** The fault with the most connections, if any. */
  mostConnectedFault: { id: string; label: string; connections: number } | null;
}
