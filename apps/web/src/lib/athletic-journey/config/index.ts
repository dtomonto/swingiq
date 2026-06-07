// ============================================================
// SwingVantage — Athletic Journey: config barrel + lookups
// ------------------------------------------------------------
// One place to resolve a sport's journey config and its stages.
// Adding a future sport = add a config module and register it here.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { SportJourneyConfig, StageDefinition } from '../types';
import { GOLF_CONFIG } from './golf';
import { TENNIS_CONFIG } from './tennis';

export { JOURNEY_THRESHOLDS, JOURNEY_VERSION, JOURNEY_DISCLAIMER } from './thresholds';
export {
  SPORT_AVAILABILITY,
  AVAILABLE_SPORTS,
  IN_DEVELOPMENT_SPORTS,
  JOURNEY_SPORTS,
  getSportAvailability,
  isJourneyLive,
  SPORT_AVAILABILITY_MESSAGE,
} from './sports';
export { GOLF_CONFIG } from './golf';
export { TENNIS_CONFIG } from './tennis';

/** Live journey configs keyed by sport. Future sports register here. */
const SPORT_CONFIGS: Partial<Record<SportId, SportJourneyConfig>> = {
  golf: GOLF_CONFIG,
  tennis: TENNIS_CONFIG,
};

/** Returns the journey config for a sport, or null if its journey isn't live. */
export function getSportConfig(sport: SportId): SportJourneyConfig | null {
  return SPORT_CONFIGS[sport] ?? null;
}

export function getStages(sport: SportId): StageDefinition[] {
  return getSportConfig(sport)?.stages ?? [];
}

export function getStageByCode(sport: SportId, code: string): StageDefinition | null {
  return getStages(sport).find((s) => s.code === code) ?? null;
}

export function getStageByOrder(sport: SportId, order: number): StageDefinition | null {
  const stages = getStages(sport);
  const clamped = Math.max(0, Math.min(stages.length - 1, Math.round(order)));
  return stages[clamped] ?? null;
}
