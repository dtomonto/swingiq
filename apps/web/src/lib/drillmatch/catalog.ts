// ============================================================
// SwingIQ — DrillMatch: Unified Drill Catalog
// ------------------------------------------------------------
// Normalizes the EXISTING per-sport drill libraries in
// @swingiq/core into one `DrillCandidate[]`. No drill content is
// invented or duplicated here — every candidate is adapted from a
// real library entry (golf video drills + the four multi-sport
// drill sets). When those libraries grow, this catalog grows.
// ============================================================

import {
  VIDEO_DRILLS,
  BASEBALL_DRILLS,
  TENNIS_DRILLS,
  FAST_PITCH_DRILLS,
  SLOW_PITCH_DRILLS,
  type SportId,
  type SkillLevel,
  type SportDrillRecommendation,
  type VideoDrillRecommendation,
} from '@swingiq/core';
import type { DrillCandidate, DrillLocation } from './types';

// ── Equipment we never penalize a player for "missing" ────────
// The core implement of each sport (and a ball) is assumed present.
const ASSUMED_EQUIPMENT = new Set([
  'ball',
  'balls',
  'bat',
  'club',
  'clubs',
  'racquet',
  'racket',
  'glove',
]);

const FILLER = new Set(['a', 'an', 'the', 'your', 'optional', 'and', 'or', 'with']);

/** Split an "equipment needed" string into clean, lower-cased tokens. */
function parseEquipment(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,/]|\band\b|\bor\b/i)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && !FILLER.has(s));
}

// Equipment keywords to scan for in golf drills (which carry no
// structured equipment field). Conservative + honest.
const GOLF_EQUIPMENT_KEYWORDS = [
  'wall',
  'chair',
  'stool',
  'alignment stick',
  'headcover',
  'tee',
  'mirror',
  'impact bag',
  'towel',
  'shaft',
  'bucket',
];

function inferGolfEquipment(text: string): string[] {
  const lower = text.toLowerCase();
  return GOLF_EQUIPMENT_KEYWORDS.filter((kw) => lower.includes(kw));
}

const FIELD_KEYWORDS = ['cage', 'range', 'court', 'field', 'screen', 'live bp', 'tee work', 'mound'];
const HOME_KEYWORDS = ['wall', 'mirror', 'chair', 'towel', 'living room', 'at home'];

function inferLocation(text: string): DrillLocation {
  const lower = text.toLowerCase();
  const field = FIELD_KEYWORDS.some((k) => lower.includes(k));
  const home = HOME_KEYWORDS.some((k) => lower.includes(k));
  if (field && !home) return 'field';
  if (home && !field) return 'home';
  return 'either';
}

/**
 * Rough, transparent minutes estimate from a reps/duration string.
 * Deliberately simple — it is guidance for the "fits your window" hint,
 * never presented as a precise figure.
 */
export function estimateMinutes(text: string): number {
  const lower = text.toLowerCase();
  const minuteMatch = lower.match(/(\d+)\s*min/);
  if (minuteMatch) return clamp(parseInt(minuteMatch[1], 10), 2, 30);

  const numbers = (lower.match(/\d+/g) ?? []).map((n) => parseInt(n, 10));
  const repWords = /(rep|swing|hit|toss|pump|ball)/.test(lower);
  if (numbers.length > 0 && repWords) {
    // sets × reps when two numbers ("3 sets of 15"); else just the rep count.
    const total = numbers.length >= 2 ? numbers[0] * numbers[1] : numbers[0];
    return clamp(Math.round(total * 0.25), 3, 20);
  }
  return 8;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ── Family tagging (for fuzzy fault↔drill matching) ───────────
// Maps free-text in a drill to coarse skill families that line up
// with the fault ontology's `drillFamilies` vocabulary.
const FAMILY_KEYWORDS: Record<string, string[]> = {
  'posture & hip depth': ['posture', 'spine', 'hip depth', 'early extension', 'wall', 'loss of posture'],
  'rotation & sequencing': ['rotate', 'rotation', 'separation', 'hip fire', 'sequence', 'sequencing'],
  'transition & sequencing': ['transition', 'pump', 'slot', 'lag', 'casting', 'tempo', 'rhythm'],
  'swing path': ['path', 'inside', 'over the top', 'gate', 'out-to-in', 'headcover'],
  'contact & low point': ['contact', 'low point', 'strike', 'impact', 'compression'],
  'load & stride': ['load', 'stride', 'weight transfer', 'weight shift', 'lunge', 'drift'],
  'barrel path': ['barrel', 'cast', 'knob', 'bat lag', 'chop', 'roll over'],
  'launch & depth': ['launch', 'depth', 'toss height', 'arc', 'line drive', 'pop up'],
  'setup & alignment': ['setup', 'address', 'alignment', 'stance', 'grip', 'ready position'],
};

function tagFamilies(text: string): string[] {
  const lower = text.toLowerCase();
  const out: string[] = [];
  for (const [family, kws] of Object.entries(FAMILY_KEYWORDS)) {
    if (kws.some((kw) => lower.includes(kw))) out.push(family);
  }
  return out;
}

// ── Normalizers ───────────────────────────────────────────────

function fromGolfDrill(d: VideoDrillRecommendation): DrillCandidate {
  const text = [d.name, d.goal, ...d.steps, d.focus_feel].join(' ');
  const skill = d.skill_level;
  return {
    id: d.id,
    sport: 'golf',
    faultIds: d.issue_id ? [d.issue_id] : [],
    families: tagFamilies(text),
    name: d.name,
    goal: d.goal,
    steps: d.steps,
    repsOrDuration: d.reps_or_duration,
    estimatedMinutes: estimateMinutes(d.reps_or_duration),
    skillLevel: skill,
    difficulty: skillToDifficulty(skill),
    equipment: inferGolfEquipment(text),
    location: inferLocation(text),
    feelCue: d.focus_feel,
    coachingHint: d.coach_channel_hint,
    youtubeSearchUrl: d.youtube_search_url,
    safetyNote: null,
    source: 'golf_video',
  };
}

function fromSportDrill(d: SportDrillRecommendation): DrillCandidate {
  const text = [d.name, d.goal, ...d.steps, d.focus_feel].join(' ');
  return {
    id: d.id,
    sport: d.sport_id,
    faultIds: d.issue_id ? [d.issue_id] : [],
    families: tagFamilies(text),
    name: d.name,
    goal: d.goal,
    steps: d.steps,
    repsOrDuration: d.reps_or_duration,
    estimatedMinutes: estimateMinutes(d.reps_or_duration),
    skillLevel: d.skill_level,
    difficulty: d.difficulty,
    equipment: parseEquipment(d.equipment_needed),
    location: inferLocation(text + ' ' + d.equipment_needed),
    feelCue: d.focus_feel,
    coachingHint: d.coach_channel_hint,
    youtubeSearchUrl: d.youtube_search_url,
    safetyNote: d.safety_note,
    source: 'sport',
  };
}

function skillToDifficulty(skill: SkillLevel): 'beginner' | 'intermediate' | 'advanced' {
  if (skill === 'beginner') return 'beginner';
  if (skill === 'intermediate') return 'intermediate';
  return 'advanced'; // advanced + elite both map to advanced difficulty
}

/** True when an equipment token is assumed present (no penalty for it). */
export function isAssumedEquipment(token: string): boolean {
  return ASSUMED_EQUIPMENT.has(token.trim().toLowerCase());
}

// ── The catalog (built once) ──────────────────────────────────

export const ALL_DRILL_CANDIDATES: DrillCandidate[] = [
  ...VIDEO_DRILLS.map(fromGolfDrill),
  ...BASEBALL_DRILLS.map(fromSportDrill),
  ...TENNIS_DRILLS.map(fromSportDrill),
  ...FAST_PITCH_DRILLS.map(fromSportDrill),
  ...SLOW_PITCH_DRILLS.map(fromSportDrill),
];

const BY_SPORT = new Map<SportId, DrillCandidate[]>();
for (const c of ALL_DRILL_CANDIDATES) {
  const list = BY_SPORT.get(c.sport) ?? [];
  list.push(c);
  BY_SPORT.set(c.sport, list);
}

export function getCandidatesForSport(sport: SportId): DrillCandidate[] {
  return BY_SPORT.get(sport) ?? [];
}

/** Drills whose source `issue_id` directly equals the fault id. */
export function getCandidatesForFault(sport: SportId, faultId: string): DrillCandidate[] {
  return getCandidatesForSport(sport).filter((c) => c.faultIds.includes(faultId));
}

export function getDrillCandidateById(id: string): DrillCandidate | undefined {
  return ALL_DRILL_CANDIDATES.find((c) => c.id === id);
}
