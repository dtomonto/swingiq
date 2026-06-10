// ============================================================
// SwingVantage Admin — MotionLab profile inventory
// ------------------------------------------------------------
// Flattens the real MotionLab taxonomy + scoring into a read-only
// inventory the admin surface renders: every sport's motions, their
// phase templates, movement model and overlay expectations, plus how
// the Motion Score is composed. Pure + server-safe — single source of
// truth is lib/motion-lab, never duplicated numbers here.
// ============================================================

import {
  MOTION_SPORTS,
  getPhaseTemplate,
  isRotationalMotion,
  movementModelFor,
  movementModelLabel,
  isContinuousSport,
  SCORE_COMPONENTS,
  type MovementModel,
} from '@/lib/motion-lab';
import type { SportId } from '@swingiq/core';

export interface MotionProfileMotion {
  id: string;
  label: string;
  hint: string;
  movementModel: MovementModel;
  movementModelLabel: string;
  rotational: boolean;
  phases: Array<{ key: string; label: string }>;
}

export interface MotionSportProfile {
  sport: SportId;
  name: string;
  emoji: string;
  accent: string;
  continuous: boolean;
  motions: MotionProfileMotion[];
}

export interface MotionProfileInventory {
  profiles: MotionSportProfile[];
  stats: {
    sports: number;
    motions: number;
    continuousSports: number;
    discreteSports: number;
    scoreComponents: number;
  };
  scoreComponents: ReadonlyArray<{ id: string; label: string; weight: number; metricIds: string[] }>;
}

/** Build the full, read-only MotionLab profile inventory. */
export function buildMotionProfileInventory(): MotionProfileInventory {
  const profiles: MotionSportProfile[] = MOTION_SPORTS.map((sport) => {
    const motions: MotionProfileMotion[] = sport.motions.map((m) => {
      const model = movementModelFor(sport.id, m.id);
      return {
        id: m.id,
        label: m.label,
        hint: m.hint,
        movementModel: model,
        movementModelLabel: movementModelLabel(model),
        rotational: isRotationalMotion(sport.id, m.id),
        phases: getPhaseTemplate(sport.id, m.id).map((p) => ({ key: p.key, label: p.label })),
      };
    });
    return {
      sport: sport.id,
      name: sport.name,
      emoji: sport.emoji,
      accent: sport.accent,
      continuous: isContinuousSport(sport.id),
      motions,
    };
  });

  const motions = profiles.reduce((s, p) => s + p.motions.length, 0);
  const continuousSports = profiles.filter((p) => p.continuous).length;

  return {
    profiles,
    stats: {
      sports: profiles.length,
      motions,
      continuousSports,
      discreteSports: profiles.length - continuousSports,
      scoreComponents: SCORE_COMPONENTS.length,
    },
    scoreComponents: SCORE_COMPONENTS.map((c) => ({
      id: c.id, label: c.label, weight: c.weight, metricIds: [...c.metricIds],
    })),
  };
}
