// ============================================================
// SwingIQ — Agent Layer: Sport Profiles
// ------------------------------------------------------------
// Per-sport language, cues, filming tips, equipment vocabulary,
// and pre-game guidance. Deterministic data the workflows read
// so every sport gets native-sounding, appropriate copy.
// ============================================================

import type { SportId } from '@swingiq/core';

export interface SportAgentProfile {
  id: SportId;
  label: string;
  shortLabel: string;
  emoji: string;
  /** The implement the athlete swings. */
  implement: string;
  /** The motion noun ("swing" / "stroke"). */
  motion: string;
  /** The data source language used in copy. */
  inputNoun: string; // "session" (golf) vs "video" (others)
  /** Equipment category the Equipment Fit agent reasons about. */
  equipmentNoun: string;
  /** A safe, general improvement focus when we have little data. */
  defaultFocus: string;
  /** Sport-specific one-line coaching cue used in low-data states. */
  defaultCue: string;
  /** Pre-game / pre-round language. */
  preGameLabel: string;
  /** Filming tips shown by the Intake Quality agent (non-golf primarily). */
  filmingTips: string[];
  /** Pre-game swing thoughts (kept to fundamentals — 1–2 are surfaced). */
  preGameThoughts: string[];
  preGameWarmup: string;
  preGameAvoid: string;
}

export const SPORT_AGENT_PROFILES: Record<SportId, SportAgentProfile> = {
  golf: {
    id: 'golf',
    label: 'Golf',
    shortLabel: 'Golf',
    emoji: '⛳',
    implement: 'club',
    motion: 'swing',
    inputNoun: 'session',
    equipmentNoun: 'clubs',
    defaultFocus: 'center-face contact and consistent strike',
    defaultCue: 'Smooth tempo, finish balanced — let the loft do the work.',
    preGameLabel: 'Pre-Round',
    filmingTips: [
      'Film down-the-line (behind you, looking at the target) or face-on.',
      'Keep the whole club and the ball in frame from setup to finish.',
      'Use 120fps or higher if your phone supports it for a cleaner image.',
    ],
    preGameThoughts: [
      'Smooth tempo and center contact.',
      'Commit to your start line and trust it.',
    ],
    preGameWarmup: 'Start with wedges, build to mid-irons, finish with a few drivers — half-speed first.',
    preGameAvoid: 'Do not chase distance on the first few swings or rebuild your swing on the range.',
  },
  tennis: {
    id: 'tennis',
    label: 'Tennis',
    shortLabel: 'Tennis',
    emoji: '🎾',
    implement: 'racket',
    motion: 'stroke',
    inputNoun: 'video',
    equipmentNoun: 'racket',
    defaultFocus: 'clean contact out in front with a stable base',
    defaultCue: 'Split-step, turn early, and meet the ball in front of you.',
    preGameLabel: 'Pre-Match',
    filmingTips: [
      'Film side-on so your full swing path and contact point are visible.',
      'Capture a few reps of the same stroke (forehand or backhand) rather than mixing.',
      'Make sure the racket head stays in frame through the follow-through.',
    ],
    preGameThoughts: [
      'Early preparation and contact out front.',
      'Move your feet — get set before every ball.',
    ],
    preGameWarmup: 'Mini-tennis to feel clean contact, then build to baseline rallies and a few serves.',
    preGameAvoid: 'Do not over-hit early or tinker with your technique right before the match.',
  },
  baseball: {
    id: 'baseball',
    label: 'Baseball',
    shortLabel: 'Baseball',
    emoji: '⚾',
    implement: 'bat',
    motion: 'swing',
    inputNoun: 'video',
    equipmentNoun: 'bat',
    defaultFocus: 'a short, direct path to the ball and solid contact',
    defaultCue: 'See it deep, stay short to the ball, and drive through it.',
    preGameLabel: 'Game Prep',
    filmingTips: [
      'Film from the side (open side) so bat path and contact are visible.',
      'Keep hips, hands, and the bat in frame from load through finish.',
      'Tee work films cleanest — it isolates your swing from pitch timing.',
    ],
    preGameThoughts: [
      'Stay short and direct to the ball.',
      'See the ball deep and trust your hands.',
    ],
    preGameWarmup: 'Easy tee work to feel your path, then soft toss to time it up.',
    preGameAvoid: 'Do not try to pull everything for power — let your A-swing show up naturally.',
  },
  softball_slow: {
    id: 'softball_slow',
    label: 'Slow Pitch Softball',
    shortLabel: 'Slow Pitch',
    emoji: '🥎',
    implement: 'bat',
    motion: 'swing',
    inputNoun: 'video',
    equipmentNoun: 'bat',
    defaultFocus: 'matching the arc with a slight up-swing and line-drive contact',
    defaultCue: 'Let the ball travel, match the arc, and drive through the middle.',
    preGameLabel: 'Game Prep',
    filmingTips: [
      'Film from the side so your contact height and bat path are visible.',
      'Capture full reps from load to finish — the arc timing matters.',
      'Tee or soft-toss reps isolate your swing best for analysis.',
    ],
    preGameThoughts: [
      'Let the ball travel and match the arc.',
      'Drive line drives through the middle, not under the ball.',
    ],
    preGameWarmup: 'Tee work at your contact height, then live arc timing with soft toss.',
    preGameAvoid: 'Do not lunge at the ball or try to lift everything for distance early.',
  },
  softball_fast: {
    id: 'softball_fast',
    label: 'Fast Pitch Softball',
    shortLabel: 'Fast Pitch',
    emoji: '🥎',
    implement: 'bat',
    motion: 'swing',
    inputNoun: 'video',
    equipmentNoun: 'bat',
    defaultFocus: 'a compact, on-time swing with contact out front',
    defaultCue: 'Get loaded early, stay compact, and meet it out front.',
    preGameLabel: 'Game Prep',
    filmingTips: [
      'Film from the side so your load, stride, and contact point are visible.',
      'Keep the whole swing in frame — fast pitch swings are quick and compact.',
      'Tee work films cleanest for mechanics; add soft toss for timing.',
    ],
    preGameThoughts: [
      'Load early and stay compact.',
      'Be on time — contact out in front.',
    ],
    preGameWarmup: 'Quick tee reps to feel a compact path, then soft toss to sharpen timing.',
    preGameAvoid: 'Do not get long or late — keep the swing short and start your load early.',
  },
};

export function getSportAgentProfile(sport: SportId): SportAgentProfile {
  return SPORT_AGENT_PROFILES[sport] ?? SPORT_AGENT_PROFILES.golf;
}
