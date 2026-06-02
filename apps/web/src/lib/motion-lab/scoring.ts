// ============================================================
// SwingIQ — Motion Lab: Scoring
// ------------------------------------------------------------
// Composes the proxy metrics into transparent component scores
// (Power, Sequencing, Balance, Rotation, Timing, Consistency) and an
// overall Motion Score. The basis is the weakest contributing basis,
// and the disclaimer only drops when everything is 'measured' (never,
// for single-camera video) — so an estimate can't masquerade as fact.
// ============================================================

import type { MotionMetric, MotionScoreboard, MotionScoreComponent, MotionBasis } from './types';

const BASIS_RANK: Record<MotionBasis, number> = {
  placeholder: 0,
  ai_inferred: 1,
  estimated: 2,
  user_entered: 3,
  measured: 4,
};

function weakest(bases: MotionBasis[]): MotionBasis {
  if (bases.length === 0) return 'placeholder';
  return bases.reduce((w, b) => (BASIS_RANK[b] < BASIS_RANK[w] ? b : w), bases[0]);
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

const DISCLAIMER =
  'This Motion Score is a directional estimate from a single-camera video — not a measured biomechanical result.';

interface ComponentSpec {
  id: string;
  label: string;
  weight: number;
  metricIds: string[];
}

const COMPONENTS: ComponentSpec[] = [
  { id: 'power', label: 'Power Efficiency', weight: 1.2, metricIds: ['hip_shoulder_sep', 'hand_speed_peak', 'sequencing'] },
  { id: 'sequencing', label: 'Sequencing', weight: 1.2, metricIds: ['sequencing', 'hip_shoulder_sep'] },
  { id: 'rotation', label: 'Rotation', weight: 1.0, metricIds: ['shoulder_turn', 'hip_turn', 'rom'] },
  { id: 'balance', label: 'Balance', weight: 1.0, metricIds: ['head_stability', 'pelvis_sway', 'balance_finish', 'knee_flex'] },
  { id: 'timing', label: 'Timing', weight: 0.9, metricIds: ['tempo_ratio', 'sequencing'] },
  { id: 'consistency', label: 'Consistency', weight: 0.8, metricIds: ['head_stability', 'spine_change'] },
];

function componentNote(id: string, score: number): string {
  const tier = score >= 80 ? 'a real strength' : score >= 60 ? 'solid, with room to grow' : score >= 40 ? 'a clear opportunity' : 'the place to start';
  const map: Record<string, string> = {
    power: 'How well your body turns rotation into speed',
    sequencing: 'Whether energy flows hips → torso → arms in order',
    rotation: 'How much you turn back and through',
    balance: 'How stable and centred you stay',
    timing: 'How smooth and repeatable your tempo is',
    consistency: 'How steady your posture and head stay',
  };
  return `${map[id]} — ${tier}.`;
}

export function computeScoreboard(metrics: MotionMetric[]): MotionScoreboard {
  const byId = new Map(metrics.map((m) => [m.id, m]));

  const components: MotionScoreComponent[] = COMPONENTS.map((spec) => {
    let sum = 0;
    let wsum = 0;
    for (const id of spec.metricIds) {
      const m = byId.get(id);
      if (m && m.normalizedScore != null) {
        const w = Math.max(0.2, m.confidence);
        sum += m.normalizedScore * w;
        wsum += w;
      }
    }
    const score = wsum > 0 ? Math.round(clamp(sum / wsum)) : 50;
    return { id: spec.id, label: spec.label, score, weight: spec.weight, note: componentNote(spec.id, score) };
  });

  const totalWeight = components.reduce((s, c) => s + c.weight, 0);
  const overall = Math.round(clamp(components.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight));

  const usable = metrics.filter((m) => m.normalizedScore != null);
  const confidence = usable.length
    ? +(usable.reduce((s, m) => s + m.confidence, 0) / usable.length).toFixed(2)
    : 0;
  const basis = weakest(usable.map((m) => m.basis));

  return {
    overall,
    components,
    confidence,
    basis,
    disclaimer: basis === 'measured' ? null : DISCLAIMER,
  };
}
