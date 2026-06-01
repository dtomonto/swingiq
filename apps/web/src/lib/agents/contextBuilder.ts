// ============================================================
// SwingIQ — Agent Layer: Context Builder
// ------------------------------------------------------------
// Turns the persisted app store into the single normalized
// AgentContext that every deterministic workflow reads. Cheap,
// pure, SSR-safe. Unifies golf launch-monitor sessions and
// non-golf video analyses into one SessionSummary shape so the
// workflows stay sport-neutral.
// ============================================================

import type { SportId, SkillLevel } from '@swingiq/core';
import type { SwingIQState } from '@/store';
import { getSportAgentProfile } from './sportProfiles';
import type {
  AgentContext,
  EquipmentProfile,
  PlanStatus,
  SessionSummary,
  UserProfile,
} from './types';

// ── Helpers ───────────────────────────────────────────────────

function firstName(name: string | null | undefined): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function readString(obj: Record<string, unknown> | null, key: string): string | null {
  const v = obj?.[key];
  return typeof v === 'string' && v.trim() ? v : null;
}

/** Count how many of the given keys hold a meaningful (non-empty) value. */
function countFilled(obj: Record<string, unknown>, keys: string[]): number {
  let n = 0;
  for (const k of keys) {
    const v = obj[k];
    if (v === null || v === undefined) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    n++;
  }
  return n;
}

function daysBetween(fromISO: string | null, now: Date): number | null {
  if (!fromISO) return null;
  const t = new Date(fromISO).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((now.getTime() - t) / 86_400_000);
}

// ── Equipment completeness (per sport) ────────────────────────

const EQUIPMENT_FIELDS: Record<Exclude<SportId, 'golf'>, string[]> = {
  tennis: ['head_size_sq_in', 'weight_strung_oz', 'string_tension_mains', 'grip_size', 'string_brand', 'string_pattern'],
  baseball: ['length_in', 'weight_oz', 'material', 'certification', 'barrel_diameter_in'],
  softball_slow: ['length_in', 'weight_oz', 'material', 'certification_stamps', 'compression_rating'],
  softball_fast: ['length_in', 'weight_oz', 'material', 'certification_stamps', 'end_load_oz'],
};

function buildEquipmentProfile(state: SwingIQState, sport: SportId): EquipmentProfile {
  if (sport === 'golf') {
    const count = state.clubs.length;
    let completeness = 0;
    if (count > 0) {
      completeness = 40;
      if (count >= 5) completeness += 30;
      else if (count >= 3) completeness += 15;
      if (state.clubs.some((c) => c.typical_carry !== null)) completeness += 30;
    }
    return {
      sport,
      completeness: Math.min(completeness, 100),
      itemCount: count,
      sufficientForFit: count >= 3,
    };
  }

  const list = (state.sportEquipment as unknown as Record<string, unknown[]>)[sport] ?? [];
  const count = list.length;
  if (count === 0) {
    return { sport, completeness: 0, itemCount: 0, sufficientForFit: false };
  }
  const fields = EQUIPMENT_FIELDS[sport as Exclude<SportId, 'golf'>] ?? [];
  const first = asRecord(list[0]) ?? {};
  const filled = countFilled(first, fields);
  const completeness = fields.length ? Math.round((filled / fields.length) * 100) : 0;
  return {
    sport,
    completeness,
    itemCount: count,
    sufficientForFit: filled >= 2,
  };
}

// ── Session normalization ─────────────────────────────────────

function normalizeSessions(state: SwingIQState): SessionSummary[] {
  const fromSessions: SessionSummary[] = state.sessions.map((s) => {
    const top = s.diagnoses[0];
    return {
      id: s.id,
      sport: s.sport ?? 'golf',
      source: 'session',
      date: s.date || s.created_at,
      name: s.name,
      primaryFocus: top?.rule?.name ?? null,
      focusConfidence: typeof top?.confidence === 'number' ? top.confidence : null,
      score: s.swing_score,
      shotCount: s.shots.length,
      hasDiagnosis: s.diagnoses.length > 0,
    };
  });

  const fromVideos: SessionSummary[] = state.video_analyses.map((v) => ({
    id: v.id,
    sport: v.sport,
    source: 'video',
    date: v.created_at,
    name: v.file_name,
    primaryFocus: v.primary_issue,
    focusConfidence: null,
    score: v.overall_score > 0 ? v.overall_score : null,
    shotCount: 0,
    hasDiagnosis: !!v.primary_issue,
  }));

  return [...fromSessions, ...fromVideos].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

// ── Plan status heuristic ─────────────────────────────────────

function derivePlanStatus(state: SwingIQState): PlanStatus {
  const t = state.training;
  if (!t.active_diagnosis_id) return 'none';
  // If a session was logged after the plan started, the loop closed.
  if (t.started_at) {
    const startedMs = new Date(t.started_at).getTime();
    const hasFollowUp = state.sessions.some(
      (s) => new Date(s.created_at).getTime() > startedMs,
    );
    if (hasFollowUp) return 'completed';
  }
  return 'in_progress';
}

// ── Main builder ──────────────────────────────────────────────

export function buildAgentContext(
  state: SwingIQState,
  activeSport: SportId,
  now: Date = new Date(),
): AgentContext {
  const sportProfileObj = asRecord((state.sportProfiles as Record<string, unknown>)[activeSport]);
  const golfProfile = state.profile;

  const hasGolfProfile = !!golfProfile;
  const hasSportProfile = !!sportProfileObj;

  const name = firstName(golfProfile?.name) ?? firstName(readString(sportProfileObj, 'name'));

  const skillLevel: SkillLevel | null =
    (golfProfile?.skill_level as SkillLevel | undefined) ??
    (readString(sportProfileObj, 'skill_level') as SkillLevel | null) ??
    null;

  const goal =
    golfProfile?.primary_goal ??
    readString(sportProfileObj, 'primary_goal') ??
    readString(sportProfileObj, 'goal') ??
    null;

  const allSessions = normalizeSessions(state);
  const sportSessions = allSessions.filter((s) => s.sport === activeSport);
  const latestSession = sportSessions[0] ?? null;
  const latestDiagnosedSession = sportSessions.find((s) => s.hasDiagnosis) ?? null;

  const equipment = buildEquipmentProfile(state, activeSport);

  // Last activity = newest of: any session/video, last practice date.
  const activityTimes: number[] = [];
  for (const s of allSessions) {
    const t = new Date(s.date).getTime();
    if (!Number.isNaN(t)) activityTimes.push(t);
  }
  if (state.training.last_practice_date) {
    const t = new Date(state.training.last_practice_date).getTime();
    if (!Number.isNaN(t)) activityTimes.push(t);
  }
  const lastActivityMs = activityTimes.length ? Math.max(...activityTimes) : null;
  const lastActivityAt = lastActivityMs ? new Date(lastActivityMs).toISOString() : null;

  const planStatus = derivePlanStatus(state);

  const profile: UserProfile = {
    firstName: name,
    sport: activeSport,
    skillLevel,
    goal,
    usageCategory: state.settings.usage_category,
    exists: hasGolfProfile || hasSportProfile,
  };

  return {
    now: now.toISOString(),
    activeSport,
    sportLabel: getSportAgentProfile(activeSport).label,
    profile,
    golfProfile,
    sportProfiles: state.sportProfiles as Record<string, unknown>,
    hasGolfProfile,
    hasSportProfile,
    clubCount: state.clubs.length,
    equipment,
    sessions: allSessions,
    sportSessions,
    latestSession,
    latestDiagnosedSession,
    sessionCount: sportSessions.length,
    planStatus,
    hasActivePlan: planStatus !== 'none',
    streakDays: state.training.streak_days,
    lastPracticeDate: state.training.last_practice_date,
    lastActivityAt,
    daysSinceLastActivity: daysBetween(lastActivityAt, now),
    usageCategory: state.settings.usage_category,
    coachingStyle: state.settings.coaching_style,
    units: state.settings.units,
  };
}
