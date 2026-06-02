// ============================================================
// SwingIQ — Skill Transfer Map: Data + Selector
// ------------------------------------------------------------
// A small, honest catalog of movement principles shared across the
// five sports, plus a selector that surfaces transfer patterns for
// the sports a given player actually trains.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { MovementPrinciple, TransferPattern } from './types';

export const SKILL_TRANSFER_MAP: MovementPrinciple[] = [
  {
    id: 'kinetic_sequencing',
    name: 'Ground-up sequencing',
    description:
      'Power is built from the ground up — legs and hips lead, the torso and arms follow. Rushing the top of the chain leaks speed and control.',
    expressions: {
      golf: 'Start the downswing with the lower body so the club drops into the slot.',
      tennis: 'Drive from the legs into the serve and groundstrokes before the arm fires.',
      baseball: 'Hips fire before the hands — "squish the bug", barrel comes last.',
      softball_slow: 'Let the lower half start the swing so the barrel stays back.',
      softball_fast: 'Lower-half transfer first to handle velocity without lunging.',
    },
  },
  {
    id: 'hip_shoulder_separation',
    name: 'Hip–shoulder separation',
    description:
      'Storing a gap between the hips and shoulders before release creates a stretch that adds effortless speed.',
    expressions: {
      golf: 'Hips open while the shoulders stay closed a beat longer in transition.',
      tennis: 'Coil the shoulders against the hips during the unit turn.',
      baseball: 'Create and hold hip-shoulder separation before launch.',
      softball_slow: 'A small separation keeps the swing connected, not all-arms.',
      softball_fast: 'Separation buys time to adjust to the rise/drop.',
    },
  },
  {
    id: 'early_shoulder_rotation',
    name: 'Early shoulder rotation (common fault)',
    description:
      'Spinning the shoulders open too early throws the swing off-plane. The same root habit shows up differently in each sport.',
    expressions: {
      golf: 'Shows up as an over-the-top move and a slice.',
      tennis: 'Shows up as opening the shoulders early and making late contact.',
      baseball: 'Shows up as pulling off the ball and weak contact.',
      softball_slow: 'Shows up as rolling over and weak grounders.',
      softball_fast: 'Shows up as early rotation and missing the inside pitch.',
    },
  },
  {
    id: 'athletic_posture',
    name: 'Athletic posture & balance',
    description:
      'A stable, athletic base — weight centered, spine tilted from the hips — lets you rotate around a consistent axis.',
    expressions: {
      golf: 'Hold your spine angle and hip depth through impact.',
      tennis: 'Stay balanced through the stroke and recover to a ready base.',
      baseball: 'Keep a balanced stance and stay centered through the turn.',
      softball_slow: 'Quiet, balanced base so you can time the arc.',
      softball_fast: 'Balanced base to react without drifting forward.',
    },
  },
  {
    id: 'contact_timing',
    name: 'Timing to contact',
    description:
      'Meeting the ball at the right point in the swing — not early, not late — is a timing skill that carries between striking sports.',
    expressions: {
      golf: 'Control your low point so contact is ball-first.',
      tennis: 'Meet the ball out in front for clean, repeatable contact.',
      baseball: 'Match your timing to the pitch and contact out front.',
      softball_slow: 'Wait for the ball to reach the optimal height before committing.',
      softball_fast: 'Start early enough to catch up to velocity at the right depth.',
    },
  },
];

/** A principle by id (or undefined). */
export function getPrinciple(id: string): MovementPrinciple | undefined {
  return SKILL_TRANSFER_MAP.find((p) => p.id === id);
}

const TRANSFER_NOTE =
  'These are related ideas — a pattern that helps one swing often helps the other, but it may transfer differently. Treat it as a hint, not a guarantee.';

/**
 * Transfer patterns linking a player's PRIMARY sport to each of their OTHER
 * sports, for every principle expressed in both. With a single sport, returns
 * an empty list (the UI then shows the principles for that sport instead).
 */
export function getSkillTransfers(primary: SportId, others: SportId[]): TransferPattern[] {
  const out: TransferPattern[] = [];
  const targets = others.filter((s) => s !== primary);
  for (const principle of SKILL_TRANSFER_MAP) {
    const fromExpr = principle.expressions[primary];
    if (!fromExpr) continue;
    for (const to of targets) {
      const toExpr = principle.expressions[to];
      if (!toExpr) continue;
      out.push({
        principleId: principle.id,
        principle: principle.name,
        fromSport: primary,
        toSport: to,
        fromExpression: fromExpr,
        toExpression: toExpr,
        note: TRANSFER_NOTE,
      });
    }
  }
  return out;
}
