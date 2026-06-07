// ============================================================
// SwingVantage — TeamOS: types
// ------------------------------------------------------------
// A coach-facing roster of cross-sport capability snapshots. It reuses
// the AGI capability taxonomy (rotation, sequencing, balance, tempo,
// power, consistency) so a coach sees ONE shared language across every
// athlete and sport. Self-contained + local-first; complements the
// Motion Lab CoachDashboard (/coach) with a capability-level team read.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { CapabilityId } from '@/lib/agi';

/** Capability scores 0–100 (higher = stronger). Partial: not all observed. */
export type CapabilityScores = Partial<Record<CapabilityId, number>>;

export interface TeamAthlete {
  id: string;
  name: string;
  sport: SportId;
  scores: CapabilityScores;
  notes?: string;
  updatedAt: string;
}

/** Each athlete's single biggest opportunity (their weakest observed capability). */
export interface AthleteFocus {
  athleteId: string;
  name: string;
  sport: SportId;
  focus: { capability: CapabilityId; name: string; score: number } | null;
}

export interface TeamGap {
  capability: CapabilityId;
  name: string;
  /** How many athletes are weak (below the threshold) in this capability. */
  athletesAffected: number;
  /** Mean score across athletes who have this capability observed. */
  avgScore: number;
}

export interface TeamPulse {
  memberCount: number;
  rosterFocus: AthleteFocus[];
  /** The capability the most athletes are weak in — the group focus. */
  topSharedGap: TeamGap | null;
  /** All gaps, ranked by how many athletes they affect. */
  gaps: TeamGap[];
  summary: string;
}

export interface TeamState {
  version: 1;
  athletes: TeamAthlete[];
}
