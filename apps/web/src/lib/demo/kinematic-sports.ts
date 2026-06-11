// ============================================================
// SwingVantage — Kinematic overlay config (per sport)
//
// Drives the animated "Kinematic tracking active" panel on the home
// hero. Accent / name come straight from the sport registry (single
// source of truth, no drift); the phase labels + metric chips are
// REPRESENTATIVE of what the motion-lab engine surfaces — the panel
// is an illustrative live-tracking visual, not a specific athlete.
// ============================================================

import { ALL_SPORTS_INCLUDING_GOLF } from '@swingiq/core';

export type ImplementKind = 'club' | 'racket' | 'paddle' | 'bat';

export interface KinematicMetric {
  /** Real motion-lab metric name. */
  label: string;
  unit: string;
  /** Representative display range the panel animates between. */
  range: [number, number];
}

export interface KinematicSport {
  id: string;
  /** "Golf" */
  name: string;
  /** Plural athlete noun: "golfers", "tennis players" — for the live caption. */
  noun: string;
  emoji: string;
  /** Accent hex from the sport registry. */
  accent: string;
  implement: ImplementKind;
  /** Ordered, human-readable swing phases the panel chips through. */
  phases: string[];
  /** Representative overlay metrics (real names) the panel rotates. */
  metrics: KinematicMetric[];
}

/** Shared core overlay metrics — the kinematic signals every rotary
 *  swing shares (names mirror lib/motion-lab/biomechanics.ts). Ranges are
 *  WIDE on purpose: the panel maps each sport's live pose into the band on a
 *  shared scale, so a full golf turn rides the top of the band while a compact
 *  pickleball stroke sits near the bottom — the cross-sport spread shows up in
 *  the numbers, not just the figure. */
const CORE_METRICS: KinematicMetric[] = [
  { label: 'Hip Rotation', unit: '°', range: [22, 50] },
  { label: 'Shoulder Turn', unit: '°', range: [36, 100] },
  { label: 'X-Factor', unit: '°', range: [18, 55] },
  { label: 'Sequencing', unit: '/100', range: [62, 94] },
  { label: 'Tempo', unit: ':1', range: [2.6, 3.3] },
];

/** Per-sport enrichment keyed by registry sport id. */
const ENRICHMENT: Record<
  string,
  { noun: string; implement: ImplementKind; phases: string[]; extra?: KinematicMetric }
> = {
  golf: {
    noun: 'golfers',
    implement: 'club',
    phases: ['Address', 'Backswing', 'Transition', 'Downswing', 'Impact', 'Follow-through'],
    extra: { label: 'Attack Angle', unit: '°', range: [-5, -1] },
  },
  tennis: {
    noun: 'tennis players',
    implement: 'racket',
    phases: ['Ready', 'Unit Turn', 'Backswing', 'Forward Swing', 'Contact', 'Follow-through'],
    extra: { label: 'Racket Speed', unit: 'mph', range: [72, 86] },
  },
  pickleball: {
    noun: 'pickleball players',
    implement: 'paddle',
    phases: ['Ready', 'Split Step', 'Compact Prep', 'Forward Swing', 'Contact', 'Recovery'],
    extra: { label: 'Paddle Face', unit: '°', range: [-3, 3] },
  },
  padel: {
    noun: 'padel players',
    implement: 'racket',
    phases: ['Ready', 'Split Step', 'Wall Read', 'Preparation', 'Contact', 'Recovery'],
    extra: { label: 'Contact Height', unit: 'in', range: [60, 74] },
  },
  baseball: {
    noun: 'hitters',
    implement: 'bat',
    phases: ['Stance', 'Load', 'Stride', 'Hip Fire', 'Contact', 'Extension'],
    extra: { label: 'Bat Speed', unit: 'mph', range: [62, 76] },
  },
  softball_slow: {
    noun: 'hitters',
    implement: 'bat',
    phases: ['Stance', 'Load', 'Stride', 'Hip Fire', 'Contact', 'Extension'],
    extra: { label: 'Attack Angle', unit: '°', range: [6, 14] },
  },
  softball_fast: {
    noun: 'hitters',
    implement: 'bat',
    phases: ['Stance', 'Load', 'Rapid Stride', 'Hip Fire', 'Contact', 'Extension'],
    extra: { label: 'Bat Speed', unit: 'mph', range: [58, 70] },
  },
};

/** All sports, registry order (golf first), enriched for the kinematic panel. */
export const KINEMATIC_SPORTS: KinematicSport[] = ALL_SPORTS_INCLUDING_GOLF.map((s) => {
  const e = ENRICHMENT[s.id] ?? {
    noun: 'athletes',
    implement: 'club' as ImplementKind,
    phases: ['Setup', 'Load', 'Transition', 'Contact', 'Finish'],
  };
  return {
    id: s.id,
    name: s.name,
    noun: e.noun,
    emoji: s.emoji,
    accent: s.accent_hex,
    implement: e.implement,
    phases: e.phases,
    metrics: e.extra ? [...CORE_METRICS, e.extra] : CORE_METRICS,
  };
});
