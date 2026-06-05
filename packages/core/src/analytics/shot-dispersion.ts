// ============================================================
// SwingVantage — Shot Dispersion Calculator
// Computes statistical dispersion metrics from a set of shots.
// Used to render dispersion charts and assess consistency.
// ============================================================

export interface ShotPoint {
  lateral_offline: number;  // yards left (-) or right (+) of target
  carry_distance: number;   // yards
  shot_shape?: string;
}

export interface DispersionStats {
  // Centre of mass
  mean_lateral: number;
  mean_carry: number;

  // Standard deviations
  std_lateral: number;
  std_carry: number;

  // Ellipse (2σ — covers ~95% of shots)
  ellipse_width_yards: number;   // left-right
  ellipse_height_yards: number;  // near-far

  // Percentages
  pct_left: number;
  pct_right: number;
  pct_on_target: number; // within ±5 yards lateral

  // Carry range
  carry_min: number;
  carry_max: number;
  carry_range: number;

  // Consistency grade
  consistency_grade: 'A' | 'B' | 'C' | 'D';
  consistency_label: string;

  // Points for chart rendering (normalized)
  points: ShotPoint[];
  shot_count: number;
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stdDev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function gradeConsistency(stdLateral: number, stdCarry: number): DispersionStats['consistency_grade'] {
  // Benchmarks based on typical amateur/tour scatter
  const totalDispersion = stdLateral + stdCarry * 0.4;
  if (totalDispersion < 8) return 'A';
  if (totalDispersion < 15) return 'B';
  if (totalDispersion < 25) return 'C';
  return 'D';
}

const CONSISTENCY_LABELS: Record<string, string> = {
  A: 'Tour-Level Consistency',
  B: 'Low Handicap Consistency',
  C: 'Average Amateur Consistency',
  D: 'High Dispersion — Primary Issue',
};

export function computeDispersion(shots: ShotPoint[]): DispersionStats {
  if (!shots.length) {
    return {
      mean_lateral: 0, mean_carry: 0,
      std_lateral: 0, std_carry: 0,
      ellipse_width_yards: 0, ellipse_height_yards: 0,
      pct_left: 0, pct_right: 0, pct_on_target: 0,
      carry_min: 0, carry_max: 0, carry_range: 0,
      consistency_grade: 'D', consistency_label: 'No data',
      points: [], shot_count: 0,
    };
  }

  const laterals = shots.map((s) => s.lateral_offline);
  const carries  = shots.map((s) => s.carry_distance);

  const meanLat  = mean(laterals);
  const meanCarry = mean(carries);
  const stdLat   = stdDev(laterals, meanLat);
  const stdCarry = stdDev(carries, meanCarry);

  const pctLeft  = parseFloat(((laterals.filter((l) => l < -2).length / shots.length) * 100).toFixed(1));
  const pctRight = parseFloat(((laterals.filter((l) => l > 2).length / shots.length) * 100).toFixed(1));
  const pctOn    = parseFloat((((shots.length - laterals.filter((l) => Math.abs(l) > 5).length) / shots.length) * 100).toFixed(1));

  const grade = gradeConsistency(stdLat, stdCarry);

  return {
    mean_lateral: parseFloat(meanLat.toFixed(1)),
    mean_carry: parseFloat(meanCarry.toFixed(1)),
    std_lateral: parseFloat(stdLat.toFixed(1)),
    std_carry: parseFloat(stdCarry.toFixed(1)),
    ellipse_width_yards: parseFloat((stdLat * 2 * 1.96).toFixed(1)),   // 95% interval
    ellipse_height_yards: parseFloat((stdCarry * 2 * 1.96).toFixed(1)),
    pct_left: pctLeft,
    pct_right: pctRight,
    pct_on_target: pctOn,
    carry_min: Math.min(...carries),
    carry_max: Math.max(...carries),
    carry_range: parseFloat((Math.max(...carries) - Math.min(...carries)).toFixed(1)),
    consistency_grade: grade,
    consistency_label: CONSISTENCY_LABELS[grade]!,
    points: shots,
    shot_count: shots.length,
  };
}

/** Extract ShotPoints from the raw Shot objects stored in sessions */
export function shotsToDispersionPoints(shots: Array<{
  ball_data: Record<string, unknown>;
}>): ShotPoint[] {
  const result: ShotPoint[] = [];
  for (const s of shots) {
    const lat = s.ball_data['lateral_offline'] ?? s.ball_data['side_carry'];
    const carry = s.ball_data['carry_distance'];
    if (typeof lat !== 'number' || typeof carry !== 'number') continue;
    const pt: ShotPoint = { lateral_offline: lat, carry_distance: carry };
    if (typeof s.ball_data['shot_shape'] === 'string') {
      pt.shot_shape = s.ball_data['shot_shape'] as string;
    }
    result.push(pt);
  }
  return result;
}
