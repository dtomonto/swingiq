// ============================================================
// Generate N driver-only launch-monitor CSVs that tell ONE coherent
// story: a golfer fixing a slice. Each session has 12 shots (>=10 so the
// diagnostic engine detects patterns). An open-face / slice fault is
// strong in the first session and improves over time but stays the
// player's top fix in the latest session — so /diagnose, the dashboard
// primary diagnosis, /fix and /training all show the SAME real, teachable
// issue, while /progress and /arc show a big overall climb.
//
// Columns map to packages/core normalizer fields (face_to_path,
// spin_axis, lateral_offline are read directly from their columns).
// Targets tuned to scoring/engine.ts + diagnostic/rules.ts
// ("Open Face / Slice Pattern" fires when avg_face_to_path > 3.5).
//
//   node scripts/video-studio/make-progress-csvs.mjs [count]
//   -> scripts/video-studio/fixtures/progress-1.csv ... -N.csv
// ============================================================

import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'fixtures');
const N = Number(process.argv[2] || 5);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const lerp = (a, b, t) => a + (b - a) * t;
// 12-shot zero-mean pattern → controlled, repeatable per-session dispersion.
const J = [-1.4, 1.1, -0.7, 1.5, -1.2, 0.6, -0.3, 1.3, -1.5, 0.9, -0.5, 0.2];
const HEADER = [
  'Club', 'Ball Speed (mph)', 'Club Speed (mph)', 'Launch Angle (deg)', 'Spin Rate (rpm)',
  'Carry (yds)', 'Total (yds)', 'Club Path (deg)', 'Face Angle (deg)', 'Face to Path (deg)',
  'Spin Axis (deg)', 'Side Distance (yds)',
].join(',');

for (let i = 0; i < N; i++) {
  const t = N === 1 ? 1 : i / (N - 1); // 0 (worst) -> 1 (best)
  const smash = lerp(1.40, 1.49, t);
  const clubSpeed = lerp(98, 101, t);
  const ballSpeed = smash * clubSpeed;
  const carryAvg = lerp(228, 250, t);
  const carryStd = lerp(0.075, 0.02, t) * carryAvg;
  const launch = lerp(10.5, 13, t);
  const spin = lerp(3100, 2450, t);
  const clubPath = lerp(-3.0, 0.8, t);        // out-to-in -> neutral
  const faceToPath = lerp(6.5, 3.8, t);        // slice improves but stays > 3.5 (top fix)
  const spinAxis = lerp(10, 4, t);             // right tilt (slice) easing
  const lateral = lerp(22, 9, t);              // miss right, yards, shrinking
  const faceAngle = clubPath + faceToPath;

  const rows = [HEADER];
  for (let s = 0; s < J.length; s++) {
    const carry = carryAvg + J[s] * carryStd;
    rows.push([
      'Driver',
      (ballSpeed + J[s] * 0.8).toFixed(1),
      (clubSpeed + J[s] * 0.5).toFixed(1),
      (launch + J[s] * 0.3).toFixed(1),
      Math.round(spin + J[s] * 40),
      Math.round(carry),
      Math.round(carry * 1.07),
      (clubPath + J[s] * 0.4).toFixed(1),
      (faceAngle + J[s] * 0.4).toFixed(1),
      (faceToPath + J[s] * 0.3).toFixed(1),
      (spinAxis + J[s] * 0.6).toFixed(1),
      Math.round(lateral + J[s] * 2),
    ].join(','));
  }
  writeFileSync(join(OUT, `progress-${i + 1}.csv`), rows.join('\n') + '\n');
}
console.log(`wrote ${N} driver CSVs (12 shots, improving slice) to ${OUT}`);
