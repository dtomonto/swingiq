// ============================================================
// SwingIQ — Score Improvement Predictor
// Estimates how many strokes per round a golfer could save by
// fixing a specific swing metric, based on strokes-gained
// relationships derived from tour research.
//
// NOTE: These are statistical estimates, not guarantees.
// All figures are labeled as approximations.
// ============================================================

export interface MetricImprovement {
  metric: string;
  metric_label: string;
  current_value: number;
  target_value: number;
  unit: string;
}

export interface StrokeSavingEstimate {
  metric: string;
  metric_label: string;
  current_value: number;
  target_value: number;
  unit: string;
  estimated_strokes_saved_per_round: number;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
  handicap_improvement_estimate: number;
  is_estimate: true;
}

export interface StrokeSavingReport {
  estimates: StrokeSavingEstimate[];
  total_potential_savings: number;
  prioritized_action: string;
  caveat: string;
  is_estimate: true;
}

// ── Strokes-gained lookup per metric ─────────────────────────
// Based on published research (Broadie, TrackMan analytics, DECADE research)
// Values represent approximate strokes saved per 1-unit improvement

const STROKES_SAVED_PER_UNIT: Record<string, {
  strokes_per_unit: number;
  unit: string;
  label: string;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
}> = {
  face_to_path: {
    strokes_per_unit: 0.12,
    unit: '°',
    label: 'Face-to-Path',
    confidence: 'high',
    reasoning: 'Every 1° improvement in face-to-path reduces lateral miss by ~3 yards, saving an estimated 0.12 strokes per round via GIR improvement.',
  },
  carry_distance: {
    strokes_per_unit: 0.03,
    unit: 'yds',
    label: 'Carry Distance',
    confidence: 'medium',
    reasoning: 'Each additional 10 yards of carry is worth ~0.3 strokes per round through shorter approach shots.',
  },
  smash_factor: {
    strokes_per_unit: 0.6,
    unit: '',
    label: 'Smash Factor',
    confidence: 'medium',
    reasoning: 'Each 0.1 increase in smash factor translates to ~6 mph ball speed gain and ~15 yards carry, saving roughly 0.5–0.7 strokes per round.',
  },
  spin_rate_driver: {
    strokes_per_unit: 0.002,
    unit: 'rpm',
    label: 'Driver Spin Rate',
    confidence: 'medium',
    reasoning: 'Reducing driver spin from >3500 to 2400–2800 rpm can add 15–25 yards, worth ~0.4–0.8 strokes per round.',
  },
  gir_percentage: {
    strokes_per_unit: 0.5,
    unit: '%',
    label: 'GIR Percentage',
    confidence: 'high',
    reasoning: 'Each 1% GIR improvement saves approximately 0.5 strokes per round based on DECADE research.',
  },
  lateral_miss: {
    strokes_per_unit: 0.04,
    unit: 'yds',
    label: 'Lateral Miss',
    confidence: 'medium',
    reasoning: 'Reducing lateral miss by 1 yard reduces penalty/recovery situations and improves scoring position.',
  },
  attack_angle_driver: {
    strokes_per_unit: 0.05,
    unit: '°',
    label: 'Attack Angle (Driver)',
    confidence: 'medium',
    reasoning: 'Moving from -5° to +3° attack angle adds ~25 yards for the same club speed, worth ~0.4 strokes per round.',
  },
};

// Handicap factor: roughly 18 x strokes_per_round / 18 holes
function handicapChange(strokesPerRound: number): number {
  // Handicap index ≈ scoring average - par * 0.96
  // 1 stroke saved per round ≈ 0.96 handicap improvement
  return parseFloat((strokesPerRound * 0.96).toFixed(1));
}

export function predictStrokeSavings(improvements: MetricImprovement[]): StrokeSavingReport {
  const estimates: StrokeSavingEstimate[] = improvements.map((imp) => {
    const lookup = STROKES_SAVED_PER_UNIT[imp.metric];

    if (!lookup) {
      return {
        metric: imp.metric,
        metric_label: imp.metric_label,
        current_value: imp.current_value,
        target_value: imp.target_value,
        unit: imp.unit,
        estimated_strokes_saved_per_round: 0,
        confidence: 'low' as const,
        reasoning: 'No strokes-gained model available for this metric.',
        handicap_improvement_estimate: 0,
        is_estimate: true as const,
      };
    }

    const delta = Math.abs(imp.target_value - imp.current_value);
    const saved = parseFloat((delta * lookup.strokes_per_unit).toFixed(2));

    return {
      metric: imp.metric,
      metric_label: lookup.label,
      current_value: imp.current_value,
      target_value: imp.target_value,
      unit: lookup.unit,
      estimated_strokes_saved_per_round: saved,
      confidence: lookup.confidence,
      reasoning: lookup.reasoning,
      handicap_improvement_estimate: handicapChange(saved),
      is_estimate: true as const,
    };
  });

  const total = parseFloat(
    estimates.reduce((s, e) => s + e.estimated_strokes_saved_per_round, 0).toFixed(2)
  );

  const best = estimates.sort((a, b) => b.estimated_strokes_saved_per_round - a.estimated_strokes_saved_per_round)[0];

  return {
    estimates,
    total_potential_savings: total,
    prioritized_action: best
      ? `Focus on ${best.metric_label} first — estimated saving: ${best.estimated_strokes_saved_per_round} strokes/round.`
      : 'Continue working on your diagnosed issues.',
    caveat:
      'These are statistical approximations based on published strokes-gained research. Individual results vary significantly based on skill level, playing conditions, and consistency of improvement.',
    is_estimate: true,
  };
}

// ── Convenience: build from DiagnosisOutput ───────────────────

interface SimpleDiagnosisStats {
  avg_face_to_path?: number;
  avg_lateral_miss?: number;
  avg_smash_factor?: number;
  avg_spin_rate?: number;
  avg_carry?: number;
}

export function predictFromDiagnosis(
  diagnosisId: string,
  currentStats: SimpleDiagnosisStats,
): StrokeSavingReport {
  const improvements: MetricImprovement[] = [];

  if (diagnosisId === 'slice_weak_fade' || diagnosisId === 'hook_overdraw') {
    if (currentStats.avg_face_to_path !== undefined) {
      improvements.push({
        metric: 'face_to_path',
        metric_label: 'Face-to-Path',
        current_value: Math.abs(currentStats.avg_face_to_path),
        target_value: 1.5,
        unit: '°',
      });
    }
    if (currentStats.avg_lateral_miss !== undefined) {
      improvements.push({
        metric: 'lateral_miss',
        metric_label: 'Lateral Miss',
        current_value: currentStats.avg_lateral_miss,
        target_value: 8,
        unit: 'yds',
      });
    }
  }

  if (diagnosisId === 'low_smash_factor' && currentStats.avg_smash_factor !== undefined) {
    improvements.push({
      metric: 'smash_factor',
      metric_label: 'Smash Factor',
      current_value: currentStats.avg_smash_factor,
      target_value: 1.47,
      unit: '',
    });
  }

  if (diagnosisId === 'high_spin_driver' && currentStats.avg_spin_rate !== undefined) {
    improvements.push({
      metric: 'spin_rate_driver',
      metric_label: 'Driver Spin Rate',
      current_value: currentStats.avg_spin_rate,
      target_value: 2600,
      unit: 'rpm',
    });
  }

  return predictStrokeSavings(improvements);
}
