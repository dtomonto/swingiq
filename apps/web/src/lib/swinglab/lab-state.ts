// ============================================================
// SwingVantage — SwingLab 2.0: personalization logic (Phase 2b/2c)
// ------------------------------------------------------------
// PURE, deterministic mapping from a user's real state to the lab map's
// personalization (recommended next station, resume, per-station status).
// No React / no store here so it stays trivially unit-testable; the
// client hook (useLabPersonalization) feeds it values from AgentContext.
//
// HONESTY RULE: status is only set from POSITIVE evidence of use, or a
// meaningful absence ("new"). Stations we have no signal for stay
// neutral — we never fabricate a badge. The recommended station reuses
// the existing, proven Next-Best-Action engine.
// ============================================================

import type { LabPersonalization, StationStatus } from './types';

/** Stable Next-Best-Action ids → the station that action lives in. */
const ACTION_STATION: Record<string, string> = {
  finish_profile: 'player-profile-wall',
  view_progress: 'player-profile-wall',
  upload_baseline: 'motion-capture-studio',
  upload_follow_up: 'motion-capture-studio',
  refresh_baseline: 'motion-capture-studio',
  run_diagnosis: 'motion-capture-studio',
  create_plan: 'training-plan-lab',
  continue_plan: 'training-plan-lab',
  pre_game: 'training-plan-lab',
  update_equipment: 'equipment-bay',
  generate_report: 'film-room',
  review_last: 'film-room',
};

/** Fallback: map a destination href to the station that owns that route. */
export function hrefToStation(href: string): string {
  if (href.startsWith('/profile') || href.startsWith('/progress') || href.startsWith('/journey')) return 'player-profile-wall';
  if (href.startsWith('/training') || href.startsWith('/practice') || href.startsWith('/drills') || href.startsWith('/pre-round') || href.startsWith('/fix')) return 'training-plan-lab';
  if (href.startsWith('/equipment') || href.startsWith('/bag')) return 'equipment-bay';
  if (href.startsWith('/reports') || href.startsWith('/sessions') || href.startsWith('/compare') || href.startsWith('/library') || href.startsWith('/retest')) return 'film-room';
  if (href.startsWith('/ai-coach') || href.startsWith('/agi')) return 'ai-coach-console';
  if (href.startsWith('/recruiting')) return 'recruiting-studio';
  if (href.startsWith('/bodysync')) return 'recovery-readiness-dock';
  if (href.startsWith('/tutorial') || href.startsWith('/learn')) return 'learning-academy-wing';
  if (href.startsWith('/video') || href.startsWith('/diagnose') || href.startsWith('/motion') || href.startsWith('/import') || href.startsWith('/data')) return 'motion-capture-studio';
  return 'entry-atrium';
}

/** Resolve a Next-Best-Action to its station (id first, href fallback). */
export function actionToStation(action: { id: string; href: string }): string {
  return ACTION_STATION[action.id] ?? hrefToStation(action.href);
}

export type PlanStatusValue = 'none' | 'in_progress' | 'completed';

/** Real signals read from the user's normalized AgentContext. */
export interface LabSignals {
  /** Has a golf or sport profile. */
  hasProfile: boolean;
  /** Sessions + video analyses across all sports. */
  captures: number;
  /** Active-sport training plan status. */
  planStatus: PlanStatusValue;
  /** Clubs logged in the bag. */
  clubCount: number;
  /** ISO timestamp of last activity, or null. */
  lastActivityAt: string | null;
}

const VISITED: StationStatus = { kind: 'visited', label: 'In use' };
const NEW: StationStatus = { kind: 'new', label: 'New' };
const IN_PROGRESS: StationStatus = { kind: 'in_progress', label: 'In progress' };

/**
 * Build the personalization payload from a recommended station + real signals.
 * Pure and deterministic.
 */
export function buildLabPersonalization(
  recommendedStationId: string | null,
  s: LabSignals,
): LabPersonalization {
  const statusById: Record<string, StationStatus> = {};

  // Profile — clear positive/absence signal.
  statusById['player-profile-wall'] = s.hasProfile ? VISITED : NEW;

  // Motion capture — any captured swing counts as use.
  statusById['motion-capture-studio'] = s.captures > 0 ? VISITED : NEW;

  // Training plan — in-progress / done / worth-starting (only once there's data).
  if (s.planStatus === 'in_progress') statusById['training-plan-lab'] = IN_PROGRESS;
  else if (s.planStatus === 'completed') statusById['training-plan-lab'] = VISITED;
  else if (s.captures > 0) statusById['training-plan-lab'] = NEW;

  // Equipment + film — only mark when there's positive evidence (else neutral).
  if (s.clubCount > 0) statusById['equipment-bay'] = VISITED;
  if (s.captures > 0) statusById['film-room'] = VISITED;

  const resume = s.lastActivityAt ? { label: 'Pick up where you left off', href: '/dashboard' } : null;

  return {
    mode: 'personalized',
    recommendedStationId,
    resume,
    statusById,
  };
}

// ── Phase 3: guided lab flow ──────────────────────────────────
// The canonical improvement loop, in order. Each step is "done" only
// from real evidence; the first not-done step is the user's "current"
// step (it lines up with the recommended station). The AI Coach is the
// always-on guide, not a sequential step, so it's intentionally omitted.

export type GuidedStepStatus = 'done' | 'current' | 'upcoming';

export interface GuidedStep {
  stationId: string;
  /** Plain-language instruction for this step. */
  title: string;
  status: GuidedStepStatus;
}

const GUIDED_SEQUENCE: Array<{ stationId: string; title: string; done: (s: LabSignals) => boolean }> = [
  { stationId: 'player-profile-wall', title: 'Set up your athlete profile', done: (s) => s.hasProfile },
  { stationId: 'motion-capture-studio', title: 'Capture a swing to analyze', done: (s) => s.captures > 0 },
  { stationId: 'training-plan-lab', title: 'Build and run your plan', done: (s) => s.planStatus !== 'none' },
  { stationId: 'film-room', title: 'Review and prove the change', done: (s) => s.planStatus === 'completed' },
];

/**
 * Build the ordered guided path. Steps are `done` from real evidence; the
 * first not-done step becomes `current`; the rest are `upcoming`. Pure.
 */
export function buildGuidedPath(s: LabSignals): GuidedStep[] {
  let currentAssigned = false;
  return GUIDED_SEQUENCE.map((step) => {
    let status: GuidedStepStatus;
    if (step.done(s)) {
      status = 'done';
    } else if (!currentAssigned) {
      status = 'current';
      currentAssigned = true;
    } else {
      status = 'upcoming';
    }
    return { stationId: step.stationId, title: step.title, status };
  });
}
