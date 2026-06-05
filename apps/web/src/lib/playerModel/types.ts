// ============================================================
// SwingVantage — Training Twin Foundation (Player Model): Types
// ------------------------------------------------------------
// A structured, user-owned summary of "who this player is right
// now", assembled from their OWN saved data. It is the foundation
// for a future Training Twin / AI memory — NOT an autonomous coach.
// Honest by construction and fully exportable/deletable.
// ============================================================

import type { SportId, SkillLevel } from '@swingiq/core';
import type { TrendDirection } from '@/lib/agents';

export interface PlayerModelInput {
  sport: SportId;
  sportLabel: string;
  skillLevel?: SkillLevel | null;
  goal?: string | null;
  /** Plain-language physical constraints (e.g. "low back"). */
  constraints?: string[];
  /** 0–100 completeness of equipment data. */
  equipmentCompleteness: number;
  sessionsLogged: number;
  trendDirection: TrendDirection;
  recurringFaults: string[];
  /** Names of drills the user marked as helpful. */
  drillsThatHelped: string[];
  nextBestAction: string;
}

export interface PlayerModel {
  sport: SportId;
  generatedAt: string;
  /** Whether there is enough data for the model to say anything useful. */
  hasData: boolean;
  /** Derived, plain-language observations about the player. */
  tendencies: string[];
  recurringFaults: string[];
  /** Drills that have worked for this player. */
  whatWorks: string[];
  goal: string | null;
  constraints: string[];
  nextBestAction: string;
  /** A compact natural-language summary — the seed for a future AI twin/memory. */
  summaryText: string;
  /** Honest label: foundation, not an autonomous coach. */
  disclaimer: string;
}
