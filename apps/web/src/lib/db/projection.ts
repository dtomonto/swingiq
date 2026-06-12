// ============================================================
// SwingVantage — Relational projection
//
// The single, lossless mapping between the in-memory store (the working
// copy the whole app reads/writes) and the Supabase relational tables
// (the account = the source of truth). One direction projects store
// state → table rows for writing; the other assembles fetched rows back
// into store state for hydration.
//
// Keeping this in ONE module means the column lists can never drift
// between the writer and the reader.
// ============================================================

import type {
  LocalClub,
  LocalSession,
  LocalVideoAnalysis,
  TrainingProgress,
  AppSettings,
  SportEquipment,
  TennisRacket,
  BaseballBat,
  SoftballBat,
  AgentClientState,
  SportProfiles,
} from '@/store';
import {
  DEFAULT_SETTINGS,
  DEFAULT_SPORT_EQUIPMENT,
  DEFAULT_TRAINING,
  DEFAULT_AGENT_STATE,
  DEFAULT_COMMUNITY_STATE,
  DEFAULT_TUTORIAL_PROGRESS,
} from '@/store';
import type { GolferProfileInput, Shot } from '@swingiq/core';
import type { CommunityState } from '@/lib/community/types';
import type { TutorialProgress } from '@/lib/tutorial/types';

export type Row = Record<string, unknown>;

// ── small coercion helpers ───────────────────────────────────
// Postgres `numeric` can come back as a string; normalize to number|null.
const num = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : Number(v);
const str = (v: unknown, fallback = ''): string =>
  v === null || v === undefined ? fallback : String(v);
const bool = (v: unknown, fallback = false): boolean =>
  v === null || v === undefined ? fallback : Boolean(v);

// ════════════════════════════════════════════════════════════
//  STATE → ROWS  (for writing to Supabase)
// ════════════════════════════════════════════════════════════

export function golferProfileRow(p: GolferProfileInput, userId: string): Row {
  return {
    user_id: userId,
    name: p.name ?? '',
    handedness: p.handedness ?? 'right',
    handicap: p.handicap ?? null,
    scoring_average: p.scoring_average ?? null,
    low_round: p.low_round ?? null,
    primary_goal: p.primary_goal ?? '',
    current_miss: p.current_miss ?? '',
    desired_shot_shape: p.desired_shot_shape ?? 'straight',
    practice_frequency: p.practice_frequency ?? '',
    practice_environment: p.practice_environment ?? '',
    launch_monitor_owned: p.launch_monitor_owned ?? null,
    home_simulator: p.home_simulator ?? false,
    indoor_outdoor: p.indoor_outdoor ?? 'outdoor',
    ball_used: p.ball_used ?? '',
    mat_or_grass: p.mat_or_grass ?? 'mat',
    skill_level: p.skill_level ?? 'intermediate',
    coaching_style: p.coaching_style ?? 'balanced',
    data_sophistication: p.data_sophistication ?? 'beginner',
    injury_notes: p.injury_notes ?? '',
  };
}

export function sportProfileRows(profiles: SportProfiles, userId: string): Row[] {
  return Object.entries(profiles)
    .filter(([, data]) => !!data)
    .map(([sport, data]) => ({ user_id: userId, sport, data }));
}

export function clubRow(c: LocalClub, userId: string): Row {
  return {
    id: c.id,
    user_id: userId,
    name: c.name,
    category: c.category,
    brand: c.brand,
    model: c.model,
    loft: c.loft ?? null,
    typical_carry: c.typical_carry ?? null,
    typical_total: c.typical_total ?? null,
    shaft_flex: c.shaft_flex ?? '',
    notes: c.notes ?? '',
    sort_order: c.sort_order ?? 0,
    created_at: c.created_at ?? '',
  };
}

export function tennisRacketRow(r: TennisRacket, userId: string): Row {
  return {
    id: r.id, user_id: userId, brand: r.brand, model: r.model, year: r.year,
    head_size_sq_in: r.head_size_sq_in ?? null,
    weight_strung_oz: r.weight_strung_oz ?? null,
    balance_pts_hl: r.balance_pts_hl ?? null,
    swingweight: r.swingweight ?? null,
    stiffness_ra: r.stiffness_ra ?? null,
    string_pattern: r.string_pattern, grip_size: r.grip_size, string_brand: r.string_brand,
    string_tension_mains: r.string_tension_mains ?? null,
    condition: r.condition, notes: r.notes, created_at: r.created_at ?? '',
  };
}

export function baseballBatRow(b: BaseballBat, userId: string): Row {
  return {
    id: b.id, user_id: userId, brand: b.brand, model: b.model, year: b.year,
    length_in: b.length_in ?? null, weight_oz: b.weight_oz ?? null, bat_drop: b.drop ?? null,
    barrel_diameter_in: b.barrel_diameter_in ?? null, material: b.material,
    piece_construction: b.piece_construction, balance: b.balance, certification: b.certification,
    composite_broken_in: b.composite_broken_in ?? null, condition: b.condition,
    notes: b.notes, created_at: b.created_at ?? '',
  };
}

export function softballBatRow(b: SoftballBat, discipline: 'slow' | 'fast', userId: string): Row {
  return {
    id: b.id, user_id: userId, discipline, brand: b.brand, model: b.model, year: b.year,
    length_in: b.length_in ?? null, weight_oz: b.weight_oz ?? null, end_load_oz: b.end_load_oz ?? null,
    balance: b.balance, barrel_length_in: b.barrel_length_in ?? null,
    compression_rating: b.compression_rating ?? null, material: b.material,
    certification_stamps: b.certification_stamps, break_in_status: b.break_in_status,
    condition: b.condition, notes: b.notes, created_at: b.created_at ?? '',
  };
}

export function sessionRow(s: LocalSession, userId: string): Row {
  return {
    id: s.id,
    user_id: userId,
    name: s.name,
    date: s.date,
    sport: s.sport,
    club_name: s.club_name,
    club_category: s.club_category,
    launch_monitor: s.launch_monitor,
    indoor_outdoor: s.indoor_outdoor,
    mat_or_grass: s.mat_or_grass,
    notes: s.notes,
    shot_count: s.shot_count ?? 0,
    swing_score: s.swing_score ?? null,
    diagnoses: s.diagnoses ?? [],
    created_at: s.created_at ?? '',
  };
}

export function shotRow(shot: Shot, sessionId: string, userId: string): Row {
  return {
    id: shot.id,
    session_id: sessionId,
    user_id: userId,
    club_id: shot.club_id ?? null,
    club_name: shot.club_name,
    club_category: shot.club_category,
    shot_number: shot.shot_number,
    date_time: shot.date_time ?? '',
    swing_type: shot.swing_type,
    intended_shot_shape: shot.intended_shot_shape ?? null,
    actual_shot_shape: shot.actual_shot_shape ?? null,
    is_outlier: shot.is_outlier ?? false,
    user_notes: shot.user_notes ?? '',
    ball_data: shot.ball_data ?? {},
    club_data: shot.club_data ?? {},
    strike_data: shot.strike_data ?? {},
    created_at: shot.created_at ?? '',
  };
}

export function videoAnalysisRow(v: LocalVideoAnalysis, userId: string): Row {
  return {
    id: v.id,
    user_id: userId,
    session_id: v.session_id ?? null,
    sport: v.sport,
    file_name: v.file_name,
    overall_score: v.overall_score ?? 0,
    camera_angle: v.camera_angle,
    phases_count: v.phases_count ?? 0,
    issues_count: v.issues_count ?? 0,
    primary_issue: v.primary_issue ?? null,
    // Full analysis JSON — durable per-profile history (Supabase jsonb column).
    // Null when only metadata is known; requires the `analysis` column migration
    // (supabase-video-analysis-fulltext.sql) to be applied.
    analysis: v.analysis ?? null,
    created_at: v.created_at ?? '',
  };
}

export function trainingRow(t: TrainingProgress, userId: string): Row {
  return {
    user_id: userId,
    active_diagnosis_id: t.active_diagnosis_id ?? null,
    active_session_id: t.active_session_id ?? null,
    streak_days: t.streak_days ?? 0,
    last_practice_date: t.last_practice_date ?? null,
    started_at: t.started_at ?? null,
    completed_steps: t.completed_steps ?? [],
    drills_completed: t.drills_completed ?? {},
    milestones_earned: t.milestones_earned ?? [],
  };
}

export function settingsRow(s: AppSettings, userId: string): Row {
  return {
    user_id: userId,
    units: s.units,
    theme: s.theme,
    color_theme: s.colorTheme,
    show_estimated_warnings: s.show_estimated_warnings,
    coaching_style: s.coaching_style,
    coaching_tone: s.coaching_tone ?? 'beginner',
    default_club_for_diagnose: s.default_club_for_diagnose,
    onboarding_complete: s.onboarding_complete,
    language: s.language ?? null,
    usage_category: s.usage_category ?? null,
    usage_category_set_at: s.usage_category_set_at ?? null,
  };
}

export function communityRow(c: CommunityState, userId: string): Row {
  return { user_id: userId, xp_total: c.xpTotal ?? 0, data: c };
}

export function tutorialRow(t: TutorialProgress, userId: string): Row {
  return { user_id: userId, data: t };
}

export function agentRow(a: AgentClientState, userId: string): Row {
  return { user_id: userId, data: a };
}

/** Flatten every shot across all sessions into shot rows (with session_id). */
export function allShotRows(sessions: LocalSession[], userId: string): Row[] {
  const rows: Row[] = [];
  for (const s of sessions) {
    for (const shot of s.shots ?? []) rows.push(shotRow(shot, s.id, userId));
  }
  return rows;
}

// ════════════════════════════════════════════════════════════
//  ROWS → STATE  (for hydrating the store from Supabase)
// ════════════════════════════════════════════════════════════

export function rowToGolferProfile(r: Row | null): GolferProfileInput | null {
  if (!r) return null;
  return {
    name: str(r.name),
    handedness: str(r.handedness, 'right') as GolferProfileInput['handedness'],
    handicap: num(r.handicap),
    scoring_average: num(r.scoring_average),
    low_round: num(r.low_round),
    primary_goal: str(r.primary_goal),
    current_miss: str(r.current_miss),
    desired_shot_shape: str(r.desired_shot_shape, 'straight') as GolferProfileInput['desired_shot_shape'],
    practice_frequency: str(r.practice_frequency),
    practice_environment: str(r.practice_environment),
    launch_monitor_owned: (r.launch_monitor_owned ?? null) as GolferProfileInput['launch_monitor_owned'],
    home_simulator: bool(r.home_simulator),
    indoor_outdoor: str(r.indoor_outdoor, 'outdoor') as GolferProfileInput['indoor_outdoor'],
    ball_used: str(r.ball_used),
    mat_or_grass: str(r.mat_or_grass, 'mat') as GolferProfileInput['mat_or_grass'],
    skill_level: str(r.skill_level, 'intermediate') as GolferProfileInput['skill_level'],
    coaching_style: str(r.coaching_style, 'balanced') as GolferProfileInput['coaching_style'],
    data_sophistication: str(r.data_sophistication, 'beginner') as GolferProfileInput['data_sophistication'],
    injury_notes: str(r.injury_notes),
  };
}

export function rowsToSportProfiles(rows: Row[]): SportProfiles {
  const out: SportProfiles = {};
  for (const r of rows) {
    const sport = str(r.sport);
    if (sport) out[sport as keyof SportProfiles] = (r.data ?? {}) as Record<string, unknown>;
  }
  return out;
}

export function rowToClub(r: Row): LocalClub {
  return {
    id: str(r.id),
    name: str(r.name),
    category: str(r.category, 'iron') as LocalClub['category'],
    brand: str(r.brand),
    model: str(r.model),
    loft: num(r.loft),
    typical_carry: num(r.typical_carry),
    typical_total: num(r.typical_total),
    shaft_flex: str(r.shaft_flex),
    notes: str(r.notes),
    sort_order: Number(r.sort_order ?? 0),
    created_at: str(r.created_at),
  };
}

export function rowToTennisRacket(r: Row): TennisRacket {
  return {
    id: str(r.id), brand: str(r.brand), model: str(r.model), year: str(r.year),
    head_size_sq_in: num(r.head_size_sq_in), weight_strung_oz: num(r.weight_strung_oz),
    balance_pts_hl: num(r.balance_pts_hl), swingweight: num(r.swingweight),
    stiffness_ra: num(r.stiffness_ra), string_pattern: str(r.string_pattern),
    grip_size: str(r.grip_size), string_brand: str(r.string_brand),
    string_tension_mains: num(r.string_tension_mains),
    condition: str(r.condition, 'good') as TennisRacket['condition'],
    notes: str(r.notes), created_at: str(r.created_at),
  };
}

export function rowToBaseballBat(r: Row): BaseballBat {
  return {
    id: str(r.id), brand: str(r.brand), model: str(r.model), year: str(r.year),
    length_in: num(r.length_in), weight_oz: num(r.weight_oz), drop: num(r.bat_drop),
    barrel_diameter_in: num(r.barrel_diameter_in),
    material: str(r.material) as BaseballBat['material'],
    piece_construction: str(r.piece_construction) as BaseballBat['piece_construction'],
    balance: str(r.balance) as BaseballBat['balance'],
    certification: str(r.certification),
    composite_broken_in: r.composite_broken_in === null || r.composite_broken_in === undefined
      ? null : Boolean(r.composite_broken_in),
    condition: str(r.condition, 'good') as BaseballBat['condition'],
    notes: str(r.notes), created_at: str(r.created_at),
  };
}

export function rowToSoftballBat(r: Row): SoftballBat {
  return {
    id: str(r.id), brand: str(r.brand), model: str(r.model), year: str(r.year),
    length_in: num(r.length_in), weight_oz: num(r.weight_oz), end_load_oz: num(r.end_load_oz),
    balance: str(r.balance) as SoftballBat['balance'],
    barrel_length_in: num(r.barrel_length_in), compression_rating: num(r.compression_rating),
    material: str(r.material) as SoftballBat['material'],
    certification_stamps: str(r.certification_stamps),
    break_in_status: str(r.break_in_status) as SoftballBat['break_in_status'],
    condition: str(r.condition, 'good') as SoftballBat['condition'],
    notes: str(r.notes), created_at: str(r.created_at),
  };
}

export function rowsToSportEquipment(
  tennis: Row[], baseball: Row[], softball: Row[],
): SportEquipment {
  return {
    tennis: tennis.map(rowToTennisRacket),
    // Pickleball/padel paddle equipment is not in the relational schema yet —
    // it is doc-mirrored, so projection returns empty lists here.
    pickleball: [],
    padel: [],
    baseball: baseball.map(rowToBaseballBat),
    softball_slow: softball.filter((r) => str(r.discipline, 'slow') === 'slow').map(rowToSoftballBat),
    softball_fast: softball.filter((r) => str(r.discipline) === 'fast').map(rowToSoftballBat),
  };
}

function rowToShot(r: Row): Shot {
  return {
    id: str(r.id),
    session_id: str(r.session_id),
    user_id: str(r.user_id),
    club_id: (r.club_id ?? null) as string | null,
    club_name: str(r.club_name),
    club_category: str(r.club_category) as Shot['club_category'],
    shot_number: Number(r.shot_number ?? 1),
    date_time: str(r.date_time),
    swing_type: str(r.swing_type, 'full') as Shot['swing_type'],
    intended_shot_shape: (r.intended_shot_shape ?? null) as Shot['intended_shot_shape'],
    actual_shot_shape: (r.actual_shot_shape ?? null) as Shot['actual_shot_shape'],
    is_outlier: bool(r.is_outlier),
    user_notes: str(r.user_notes),
    ball_data: (r.ball_data ?? {}) as Shot['ball_data'],
    club_data: (r.club_data ?? {}) as Shot['club_data'],
    strike_data: (r.strike_data ?? {}) as Shot['strike_data'],
    created_at: str(r.created_at),
  };
}

/** Re-nest shot rows into their sessions to rebuild LocalSession[]. */
export function rowsToSessions(sessionRows: Row[], shotRows: Row[]): LocalSession[] {
  const shotsBySession = new Map<string, Shot[]>();
  for (const sr of shotRows) {
    const sid = str(sr.session_id);
    const list = shotsBySession.get(sid) ?? [];
    list.push(rowToShot(sr));
    shotsBySession.set(sid, list);
  }
  for (const list of shotsBySession.values()) {
    list.sort((a, b) => a.shot_number - b.shot_number);
  }
  return sessionRows.map((r) => {
    const id = str(r.id);
    return {
      id,
      name: str(r.name),
      date: str(r.date),
      sport: str(r.sport, 'golf') as LocalSession['sport'],
      club_name: str(r.club_name),
      club_category: str(r.club_category),
      launch_monitor: str(r.launch_monitor),
      indoor_outdoor: str(r.indoor_outdoor, 'outdoor') as LocalSession['indoor_outdoor'],
      mat_or_grass: str(r.mat_or_grass, 'mat') as LocalSession['mat_or_grass'],
      notes: str(r.notes),
      shot_count: Number(r.shot_count ?? 0),
      shots: shotsBySession.get(id) ?? [],
      diagnoses: (r.diagnoses ?? []) as LocalSession['diagnoses'],
      swing_score: num(r.swing_score),
      created_at: str(r.created_at),
    };
  });
}

export function rowToVideoAnalysis(r: Row): LocalVideoAnalysis {
  return {
    id: str(r.id),
    session_id: (r.session_id ?? null) as string | null,
    sport: str(r.sport, 'golf') as LocalVideoAnalysis['sport'],
    file_name: str(r.file_name),
    overall_score: Number(r.overall_score ?? 0),
    camera_angle: str(r.camera_angle),
    phases_count: Number(r.phases_count ?? 0),
    issues_count: Number(r.issues_count ?? 0),
    primary_issue: (r.primary_issue ?? null) as string | null,
    // Tolerant of the column being absent on older deployments → null.
    analysis: (r.analysis ?? null) as LocalVideoAnalysis['analysis'],
    created_at: str(r.created_at),
  };
}

export function rowToTraining(r: Row | null): TrainingProgress {
  if (!r) return DEFAULT_TRAINING;
  return {
    active_diagnosis_id: (r.active_diagnosis_id ?? null) as string | null,
    active_session_id: (r.active_session_id ?? null) as string | null,
    completed_steps: (r.completed_steps ?? []) as number[],
    drills_completed: (r.drills_completed ?? {}) as TrainingProgress['drills_completed'],
    started_at: (r.started_at ?? null) as string | null,
    streak_days: Number(r.streak_days ?? 0),
    last_practice_date: (r.last_practice_date ?? null) as string | null,
    milestones_earned: (r.milestones_earned ?? []) as string[],
  };
}

export function rowToSettings(r: Row | null): AppSettings {
  if (!r) return DEFAULT_SETTINGS;
  return {
    units: str(r.units, 'yards') as AppSettings['units'],
    theme: str(r.theme, 'light') as AppSettings['theme'],
    colorTheme: str(r.color_theme, 'standard') as AppSettings['colorTheme'],
    show_estimated_warnings: bool(r.show_estimated_warnings, true),
    coaching_style: str(r.coaching_style, 'balanced') as AppSettings['coaching_style'],
    coaching_tone: str(r.coaching_tone, 'beginner') as AppSettings['coaching_tone'],
    default_club_for_diagnose: str(r.default_club_for_diagnose, 'Driver'),
    onboarding_complete: bool(r.onboarding_complete),
    language: (r.language ?? undefined) as AppSettings['language'],
    usage_category: (r.usage_category ?? null) as AppSettings['usage_category'],
    usage_category_set_at: (r.usage_category_set_at ?? null) as string | null,
  };
}

export function rowToCommunity(r: Row | null): CommunityState {
  if (!r || !r.data) return DEFAULT_COMMUNITY_STATE;
  return r.data as CommunityState;
}

export function rowToTutorial(r: Row | null): TutorialProgress {
  if (!r || !r.data) return DEFAULT_TUTORIAL_PROGRESS;
  return r.data as TutorialProgress;
}

export function rowToAgent(r: Row | null): AgentClientState {
  if (!r || !r.data) return DEFAULT_AGENT_STATE;
  return r.data as AgentClientState;
}

export const EMPTY_SPORT_EQUIPMENT = DEFAULT_SPORT_EQUIPMENT;
