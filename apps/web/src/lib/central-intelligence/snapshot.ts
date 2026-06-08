// ============================================================
// CentralIntelligenceOS — Store adapter (pure)
// ------------------------------------------------------------
// Maps the main local-first app store (swingiq-store) into the
// engine's source-agnostic inputs: a ProfileSnapshot for the
// completion scorer and SessionInputs for the valid-session counter.
// Kept pure (takes a narrow state-like object) so it's unit-testable
// without React or zustand.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { GolferProfileInput } from '@swingiq/core';
import type { ProfileSnapshot } from './profile-completion';
import type { SessionInputs, SessionLike, VideoAnalysisLike } from './sessions';
import { isValidSession } from './sessions';

/** Narrow read-only view of the main store, for the adapters. */
export interface StoreStateLike {
  profile: GolferProfileInput | null;
  sportProfiles: Record<string, Record<string, unknown> | undefined>;
  clubs: unknown[];
  sportEquipment: Record<string, unknown[]>;
  sessions: SessionLike[];
  video_analyses: VideoAnalysisLike[];
}

const NON_GOLF_SPORTS: SportId[] = [
  'tennis', 'pickleball', 'padel', 'baseball', 'softball_slow', 'softball_fast',
];

/**
 * Determine the user's primary sport. Order of precedence:
 *   1. explicit override (user-chosen), if valid
 *   2. the sport with the most VALID recorded sessions
 *   3. golf if a golf profile exists
 *   4. the first non-golf sport with a saved profile
 *   5. null (no data yet)
 */
export function derivePrimarySport(state: StoreStateLike, override?: SportId | null): SportId | null {
  if (override) return override;

  const counts = new Map<SportId, number>();
  for (const s of state.sessions) {
    if (isValidSession(s).valid) counts.set(s.sport, (counts.get(s.sport) ?? 0) + 1);
  }
  for (const v of state.video_analyses) {
    if (!v.session_id && (v.overall_score ?? 0) + (v.phases_count ?? 0) > 0) {
      counts.set(v.sport, (counts.get(v.sport) ?? 0) + 1);
    }
  }
  let best: { sport: SportId; n: number } | null = null;
  for (const [sport, n] of counts) {
    if (!best || n > best.n) best = { sport, n };
  }
  if (best && best.n > 0) return best.sport;

  if (state.profile) return 'golf';

  for (const sport of NON_GOLF_SPORTS) {
    const p = state.sportProfiles[sport];
    if (p && Object.keys(p).length > 0) return sport;
  }
  return null;
}

/** First non-null of a list — used for golf's "performance baseline". */
function firstNumber(...vals: Array<number | null | undefined>): number | null {
  for (const v of vals) if (typeof v === 'number' && Number.isFinite(v)) return v;
  return null;
}

/** Flatten the golf profile into the engine's flat field record. */
function golfFields(p: GolferProfileInput): Record<string, unknown> {
  return {
    skill_level: p.skill_level,
    primary_goal: p.primary_goal,
    current_miss: p.current_miss,
    desired_shot_shape: p.desired_shot_shape,
    handedness: p.handedness,
    practice_environment: p.practice_environment,
    practice_frequency: p.practice_frequency,
    launch_monitor_owned: p.launch_monitor_owned ?? null,
    injury_notes: p.injury_notes,
    // Derived: any of scoring average / handicap / low round satisfies the baseline.
    performance_baseline: firstNumber(p.scoring_average, p.handicap, p.low_round),
  };
}

export function hasEquipmentForSport(state: StoreStateLike, sport: SportId): boolean {
  if (sport === 'golf') return (state.clubs?.length ?? 0) > 0;
  return (state.sportEquipment?.[sport]?.length ?? 0) > 0;
}

/** Build the ProfileSnapshot for the user's primary sport. */
export function buildProfileSnapshot(
  state: StoreStateLike,
  override?: SportId | null,
  completedAt?: string | null,
): ProfileSnapshot {
  const primarySport = derivePrimarySport(state, override);
  if (!primarySport) {
    return { primarySport: null, fields: {}, hasEquipment: false, completedAt: null };
  }
  const fields =
    primarySport === 'golf' && state.profile
      ? golfFields(state.profile)
      : { ...(state.sportProfiles[primarySport] ?? {}) };
  return {
    primarySport,
    fields,
    hasEquipment: hasEquipmentForSport(state, primarySport),
    completedAt: completedAt ?? null,
  };
}

/** Build the valid-session counter inputs from the store. */
export function buildSessionInputs(state: StoreStateLike): SessionInputs {
  return { sessions: state.sessions ?? [], videoAnalyses: state.video_analyses ?? [] };
}
