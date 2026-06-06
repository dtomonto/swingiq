// ============================================================
// Player Recruiting Hub — film quality + reel engine (pure)
// ------------------------------------------------------------
// Heuristic clip-quality scoring, duplicate detection, reel-style
// catalog per sport, and the warnings the AI surfaces ("reel too
// long", "practice-only", "not enough game footage"). No model
// calls — deterministic and testable. The optional AI layer only
// re-words these findings, never invents new ones.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { Clip, FilmAsset, HighlightReel } from './types';

// ── Reel styles per sport ────────────────────────────────────

export interface ReelStyle {
  key: string;
  label: string;
  blurb: string;
  sports: SportId[];
}

const BASEBALL_SOFTBALL: SportId[] = ['baseball', 'softball_fast', 'softball_slow'];

export const REEL_STYLES: ReelStyle[] = [
  // Baseball / softball
  { key: 'hitting', label: 'Hitting reel', blurb: 'Best swings — full-speed + slow-mo, with results.', sports: BASEBALL_SOFTBALL },
  { key: 'fielding', label: 'Fielding reel', blurb: 'Range, hands, footwork, transfer.', sports: BASEBALL_SOFTBALL },
  { key: 'arm', label: 'Throwing arm reel', blurb: 'Arm strength + accuracy across throws.', sports: BASEBALL_SOFTBALL },
  { key: 'pop_time', label: 'Catcher pop-time reel', blurb: 'Receiving, transfer, and pop times.', sports: BASEBALL_SOFTBALL },
  { key: 'pitching', label: 'Pitching reel', blurb: 'Mechanics, velo, command, pitch mix.', sports: BASEBALL_SOFTBALL },
  { key: 'full_eval_bb', label: 'Full player evaluation', blurb: 'Complete two-way look for a coach.', sports: BASEBALL_SOFTBALL },
  // Golf
  { key: 'driver', label: 'Driver swing reel', blurb: 'Face-on + down-the-line driver swings.', sports: ['golf'] },
  { key: 'irons', label: 'Iron swing reel', blurb: 'Iron strikes with ball flight.', sports: ['golf'] },
  { key: 'wedge', label: 'Wedge control reel', blurb: 'Distance wedges + spin control.', sports: ['golf'] },
  { key: 'tournament', label: 'Tournament shots reel', blurb: 'Shots under real competition.', sports: ['golf'] },
  { key: 'short_game', label: 'Short-game reel', blurb: 'Chipping, pitching, bunkers, putting.', sports: ['golf'] },
  { key: 'full_eval_golf', label: 'Full player evaluation', blurb: 'Tee-to-green look for a coach.', sports: ['golf'] },
  // Tennis
  { key: 'serve', label: 'Serve reel', blurb: 'First + second serve, both sides.', sports: ['tennis'] },
  { key: 'groundstrokes', label: 'Forehand / backhand reel', blurb: 'Groundstroke variety + depth.', sports: ['tennis'] },
  { key: 'match_points', label: 'Match-play points', blurb: 'Live points showing decision-making.', sports: ['tennis'] },
  { key: 'movement', label: 'Movement / footwork reel', blurb: 'Court coverage + recovery.', sports: ['tennis'] },
  { key: 'net', label: 'Net-play reel', blurb: 'Volleys, transitions, overheads.', sports: ['tennis'] },
  { key: 'full_eval_tennis', label: 'Full player evaluation', blurb: 'Complete game for a coach.', sports: ['tennis'] },
];

export function reelStylesForSport(sport: SportId): ReelStyle[] {
  return REEL_STYLES.filter((s) => s.sports.includes(sport));
}

export function reelStyleLabel(key: string): string {
  return REEL_STYLES.find((s) => s.key === key)?.label ?? key;
}

// ── Clip / film quality heuristics ───────────────────────────

const GAME_CATEGORIES = ['full_game', 'tournament_footage', 'match_play', 'full_at_bat', 'coach_evaluation'];
const EVALUATION_ANGLES = ['face_on', 'down_the_line', 'behind', 'side', 'broadcast'];

/**
 * Heuristic 0–100 film quality from the metadata we have (no pixels):
 * rewards a known angle, a sensible clip length, real context (event/date),
 * and game/evaluation categories; penalizes missing context + extreme length.
 */
export function scoreFilmQuality(f: FilmAsset): number {
  let score = 50;
  if (f.cameraAngle && EVALUATION_ANGLES.includes(f.cameraAngle)) score += 12;
  else if (f.cameraAngle) score += 6;
  if (f.date) score += 6;
  if (f.opponentOrEvent?.trim()) score += 8;
  if (f.resultOutcome?.trim()) score += 6;
  if (GAME_CATEGORIES.includes(f.category)) score += 10;
  const d = f.durationSeconds ?? null;
  if (d != null) {
    if (d >= 4 && d <= 240) score += 6;
    if (d > 600) score -= 12; // very long raw footage is hard to evaluate
    if (d < 2) score -= 8;
  }
  if (!f.cameraAngle && !f.opponentOrEvent && !f.date) score -= 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export interface FilmFinding {
  level: 'good' | 'warn' | 'info';
  message: string;
  filmId?: string;
}

/** Detect likely-duplicate films (same category + angle + date + similar title). */
export function findDuplicateFilm(film: FilmAsset[]): FilmFinding[] {
  const out: FilmFinding[] = [];
  const seen = new Map<string, FilmAsset>();
  for (const f of film) {
    if (f.deletedAt) continue;
    const key = `${f.category}|${f.cameraAngle ?? ''}|${f.date ?? ''}|${f.title.trim().toLowerCase().slice(0, 20)}`;
    const prior = seen.get(key);
    if (prior) {
      out.push({ level: 'warn', message: `"${f.title}" looks like a duplicate of "${prior.title}".`, filmId: f.id });
    } else {
      seen.set(key, f);
    }
  }
  return out;
}

/** Library-level findings: weak clips, missing game footage, missing slow-mo, etc. */
export function analyzeFilmLibrary(film: FilmAsset[]): FilmFinding[] {
  const live = film.filter((f) => !f.deletedAt);
  const findings: FilmFinding[] = [];
  if (!live.length) {
    findings.push({ level: 'info', message: 'No film yet — your first upload is the single biggest profile boost.' });
    return findings;
  }
  const hasGame = live.some((f) => GAME_CATEGORIES.includes(f.category));
  if (!hasGame) {
    findings.push({ level: 'warn', message: 'No game / match / tournament footage. Coaches discount practice-only film — add at least one.' });
  }
  const weak = live.filter((f) => (f.qualityScore ?? scoreFilmQuality(f)) < 45);
  for (const f of weak.slice(0, 5)) {
    findings.push({ level: 'warn', message: `"${f.title}" is missing context (angle / event / result). Add metadata or replace it.`, filmId: f.id });
  }
  if (!live.some((f) => f.featured)) {
    findings.push({ level: 'info', message: 'Nothing is featured yet — feature your strongest clip so it opens the profile.' });
  }
  findings.push(...findDuplicateFilm(live));
  return findings;
}

// ── Reel analysis ────────────────────────────────────────────

export interface ReelAnalysis {
  totalSeconds: number;
  clipCount: number;
  flashCount: number;
  evaluationCount: number;
  hasSlowMo: boolean;
  hasFullSpeed: boolean;
  findings: FilmFinding[];
  /** Recommended clip order (ids): strong flash opener → evaluation → mix. */
  recommendedOrder: string[];
}

const RECOMMENDED_REEL_SECONDS = 100; // ~90s primary reel target

export function analyzeReel(reel: HighlightReel, clips: Clip[], film: FilmAsset[]): ReelAnalysis {
  const reelClips = reel.clipIds
    .map((id) => clips.find((c) => c.id === id))
    .filter((c): c is Clip => !!c);
  const filmById = new Map(film.map((f) => [f.id, f]));

  const totalSeconds = reelClips.reduce((s, c) => s + Math.max(0, c.endSeconds - c.startSeconds), 0);
  const flash = reelClips.filter((c) => c.kind === 'flash');
  const evaluation = reelClips.filter((c) => c.kind === 'evaluation');
  const hasSlowMo = reelClips.some((c) => c.speed === 'slow');
  const hasFullSpeed = reelClips.some((c) => c.speed === 'full');

  const findings: FilmFinding[] = [];
  if (!reelClips.length) {
    findings.push({ level: 'info', message: 'Add clips to start building this reel.' });
  }
  if (totalSeconds > RECOMMENDED_REEL_SECONDS + 50) {
    findings.push({
      level: 'warn',
      message: `Reel is ${Math.round(totalSeconds)}s. Coaches often stop early — aim for a ~90s primary reel.`,
    });
  }
  if (reelClips.length > 0 && !evaluation.length) {
    findings.push({ level: 'warn', message: 'All clips are "flash". Add evaluation clips that show repeatable mechanics.' });
  }
  if (reelClips.length > 0 && !flash.length) {
    findings.push({ level: 'info', message: 'No "flash" opener — lead with your most impressive clip to earn the next 30 seconds.' });
  }
  if (reelClips.length >= 3 && !hasSlowMo) {
    findings.push({ level: 'info', message: 'Consider adding a slow-motion clip so coaches can read your mechanics.' });
  }
  if (reelClips.length >= 3 && !hasFullSpeed) {
    findings.push({ level: 'info', message: 'Include at least one full-speed clip so coaches see real game tempo.' });
  }
  // Low-value clips inside the reel.
  for (const c of reelClips) {
    const f = filmById.get(c.filmId);
    if (f && (f.qualityScore ?? scoreFilmQuality(f)) < 40) {
      findings.push({ level: 'warn', message: `Clip "${c.label}" comes from low-context film — it may weaken the reel.`, filmId: f.id });
    }
  }

  // Recommended order: best flash first, then alternate evaluation/flash.
  const ordered: Clip[] = [];
  const flashQ = [...flash];
  const evalQ = [...evaluation];
  if (flashQ.length) ordered.push(flashQ.shift()!);
  while (flashQ.length || evalQ.length) {
    if (evalQ.length) ordered.push(evalQ.shift()!);
    if (flashQ.length) ordered.push(flashQ.shift()!);
  }

  return {
    totalSeconds,
    clipCount: reelClips.length,
    flashCount: flash.length,
    evaluationCount: evaluation.length,
    hasSlowMo,
    hasFullSpeed,
    findings,
    recommendedOrder: ordered.map((c) => c.id),
  };
}
