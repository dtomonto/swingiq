// ============================================================
// Generate N driver-only launch-monitor CSVs that improve over time,
// so the seeded sessions produce a rising swing-score trend on /progress
// and /arc. Metrics are tuned against packages/core scoring/engine.ts:
// face control (0.25) + strike/smash (0.25) dominate, then path (0.15),
// carry consistency (0.15), launch/spin (0.10).
//
//   node scripts/video-studio/make-progress-csvs.mjs [count]
//   -> writes scripts/video-studio/fixtures/progress-1.csv ... -N.csv
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
// Zero-mean unit-ish pattern → controlled, repeatable per-session dispersion.
const JITTER = [-1.3, 0.7, -0.4, 1.4, -0.9, 0.5];
const HEADER = 'Club,Ball Speed (mph),Club Speed (mph),Launch Angle (deg),Spin Rate (rpm),Carry (yds),Total (yds),Club Path (deg),Face Angle (deg)';

for (let i = 0; i < N; i++) {
  const t = N === 1 ? 1 : i / (N - 1); // 0 (worst) → 1 (best)
  const smash = lerp(1.40, 1.49, t);
  const clubSpeed = lerp(98, 101, t);
  const ballSpeed = smash * clubSpeed;
  const carryAvg = lerp(232, 252, t);
  const carryStd = lerp(0.075, 0.02, t) * carryAvg; // cv shrinks as you improve
  const launch = lerp(10.5, 13, t);
  const spin = lerp(3200, 2450, t);
  const clubPath = lerp(-3, 1, t);
  const faceToPath = lerp(4, 0.5, t);
  const faceAngle = clubPath + faceToPath;

  const rows = [HEADER];
  for (let s = 0; s < JITTER.length; s++) {
    const carry = carryAvg + JITTER[s] * carryStd;
    const total = carry * 1.07;
    rows.push([
      'Driver',
      (ballSpeed + JITTER[s] * 0.8).toFixed(1),
      (clubSpeed + JITTER[s] * 0.5).toFixed(1),
      (launch + JITTER[s] * 0.3).toFixed(1),
      Math.round(spin + JITTER[s] * 40),
      Math.round(carry),
      Math.round(total),
      (clubPath + JITTER[s] * 0.4).toFixed(1),
      (faceAngle + JITTER[s] * 0.4).toFixed(1),
    ].join(','));
  }
  writeFileSync(join(OUT, `progress-${i + 1}.csv`), rows.join('\n') + '\n');
}
console.log(`wrote ${N} CSVs to ${OUT}`);
