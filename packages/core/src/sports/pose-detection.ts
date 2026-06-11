// ============================================================
// SwingVantage — Pose-derived fault detection (non-golf sports)
// ------------------------------------------------------------
// P3: the non-golf analyzers historically guessed faults from clip duration
// and camera angle only. This module detects faults from REAL pose geometry —
// the camera-agnostic proxies `lib/pose/pose-metrics.ts` already computes from
// the MediaPipe pose track (shoulder-line rotation range, spine-tilt range,
// head sway, hip sway). When a pose track is present, each analyzer merges
// these in and they SUPERSEDE the metadata guess for the same issue id.
//
// Honest by design:
//   - single-camera pose is 2D with reconstructed depth, so detections stay
//     `is_estimated: true` and `confidence` is conservative (≤ ~0.6);
//   - confidence is CALIBRATED to how far the measured value is past a
//     threshold (not a flat heuristic constant);
//   - descriptions cite the actual measured number and label it a proxy.
// ============================================================

import type {
  SportId,
  SportDetectedIssue,
  SportIssueId,
  SportIssueSeverity,
  SportPoseFeatures,
} from './types';

/** Below this many posed frames, motion descriptors aren't reliable enough. */
const MIN_FRAMES = 4;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Confidence when a HIGH value is the fault (e.g. sway): 0 at/below `lo`,
 *  ramps `cMin`→`cMax` between `lo` and `hi`. */
function highBad(value: number, lo: number, hi: number, cMin: number, cMax: number): number {
  if (value <= lo) return 0;
  const t = clamp((value - lo) / (hi - lo), 0, 1);
  return +(cMin + t * (cMax - cMin)).toFixed(2);
}

/** Confidence when a LOW value is the fault (e.g. limited rotation): 0 at/above
 *  `hi`, ramps `cMin`→`cMax` as it drops from `hi` toward `lo`. */
function lowBad(value: number, hi: number, lo: number, cMin: number, cMax: number): number {
  if (value >= hi) return 0;
  const t = clamp((hi - value) / (hi - lo), 0, 1);
  return +(cMin + t * (cMax - cMin)).toFixed(2);
}

const PROXY = '(estimated from single-camera pose — a motion proxy, not a lab measurement).';

interface PoseRule {
  issueId: SportIssueId;
  label: string;
  severity: SportIssueSeverity;
  affectedPhases: string[];
  likelyCause: string;
  visualIndicator: string;
  /** Returns confidence (>0) + the measured-value description, or null. */
  evaluate: (f: SportPoseFeatures) => { confidence: number; description: string } | null;
}

// ── Reusable geometric checks (same proxy → consistent thresholds) ──────────

const rotationLow = (issueId: SportIssueId, label: string, phases: string[], cause: string): PoseRule => ({
  issueId,
  label,
  severity: 'notable',
  affectedPhases: phases,
  likelyCause: cause,
  visualIndicator: 'Shoulders barely change angle through the swing — little visible coil/turn.',
  evaluate: (f) => {
    if (f.framesWithPose < MIN_FRAMES) return null;
    const confidence = lowBad(f.shoulderTurnRangeDeg, 30, 8, 0.3, 0.5);
    if (confidence <= 0) return null;
    return {
      confidence,
      description: `Shoulder-line rotation measured only ~${f.shoulderTurnRangeDeg}° across the swing — limited coil/turn ${PROXY}`,
    };
  },
});

const hipSwayHigh = (issueId: SportIssueId, label: string, phases: string[], cause: string): PoseRule => ({
  issueId,
  label,
  severity: 'notable',
  affectedPhases: phases,
  likelyCause: cause,
  visualIndicator: 'Hips slide horizontally during the swing rather than rotating around a stable center.',
  evaluate: (f) => {
    if (f.framesWithPose < MIN_FRAMES) return null;
    const confidence = highBad(f.hipSwayPct, 10, 30, 0.3, 0.58);
    if (confidence <= 0) return null;
    return {
      confidence,
      description: `Hips drifted ~${f.hipSwayPct}% of frame width horizontally during the swing — lateral sway instead of rotation ${PROXY}`,
    };
  },
});

const headSwayHigh = (issueId: SportIssueId, label: string, phases: string[], cause: string): PoseRule => ({
  issueId,
  label,
  severity: 'notable',
  affectedPhases: phases,
  likelyCause: cause,
  visualIndicator: 'Head drifts horizontally through contact rather than staying quiet and centered.',
  evaluate: (f) => {
    if (f.framesWithPose < MIN_FRAMES) return null;
    const confidence = highBad(f.headSwayPct, 8, 25, 0.3, 0.55);
    if (confidence <= 0) return null;
    return {
      confidence,
      description: `Head moved ~${f.headSwayPct}% of frame width horizontally through the swing — eyes/head not staying quiet ${PROXY}`,
    };
  },
});

// ── Per-sport pose rule sets (issue ids match each analyzer's catalog) ──────

const POSE_RULES: Partial<Record<SportId, PoseRule[]>> = {
  tennis: [
    rotationLow('weak_unit_turn', 'Insufficient Shoulder Rotation', ['unit_turn', 'backswing'],
      'Arm-only swing habit or limited torso turn — coil is what powers the forward swing.'),
    hipSwayHigh('falling_away', 'Falling Away From the Shot', ['contact_zone', 'follow_through'],
      'Weight moving away from the ball instead of into it — lateral balance breaks down.'),
    headSwayHigh('head_pull_tennis', 'Head Pulling Off Ball', ['contact_zone', 'follow_through'],
      'Anticipating the result early, or shoulder rotation pulling the head along with it.'),
  ],
  baseball: [
    rotationLow('poor_hip_shoulder_separation', 'Poor Hip-Shoulder Separation', ['load', 'launch'],
      'Hips and shoulders turning together — losing the stretch that drives bat speed.'),
    hipSwayHigh('drifting_swaying', 'Drifting / Swaying', ['load', 'stride'],
      'Center of mass sliding toward the pitcher instead of staying loaded and rotating.'),
    headSwayHigh('head_off_ball', 'Head Coming Off the Ball', ['launch', 'contact'],
      'Pulling out early, so the eyes leave the contact zone before the swing finishes.'),
  ],
  softball_slow: [
    rotationLow('sp_poor_hip_rotation', 'Limited Hip / Shoulder Rotation', ['load', 'launch'],
      'Swinging with the arms instead of rotating the body to drive the ball.'),
    hipSwayHigh('sp_poor_finish_balance', 'Off-Balance Through the Swing', ['stride', 'finish'],
      'Lateral drift instead of rotating around a stable center — balance lost at finish.'),
  ],
  softball_fast: [
    rotationLow('fp_poor_separation', 'Poor Hip-Shoulder Separation', ['load', 'launch'],
      'Hips and shoulders rotating together rather than sequencing for bat speed.'),
    hipSwayHigh('fp_drifting_swaying', 'Drifting / Swaying', ['load', 'stride'],
      'Center of mass sliding forward rather than staying back and rotating.'),
  ],
  pickleball: [
    hipSwayHigh('pb_off_balance_contact', 'Off-Balance at Contact', ['contact', 'reset'],
      'Reaching or lunging at the ball so the body is moving sideways through contact.'),
  ],
  padel: [
    hipSwayHigh('pd_off_balance_contact', 'Off-Balance at Contact', ['contact', 'recovery'],
      'Body drifting laterally through the shot instead of a stable, balanced base.'),
  ],
};

/**
 * Detect faults from real pose geometry for a non-golf sport. Returns
 * conservative, calibrated, pose-grounded issues (detection_basis: 'pose').
 */
export function detectPoseIssues(sport: SportId, pose: SportPoseFeatures): SportDetectedIssue[] {
  const rules = POSE_RULES[sport] ?? [];
  const issues: SportDetectedIssue[] = [];
  for (const rule of rules) {
    const hit = rule.evaluate(pose);
    if (!hit) continue;
    issues.push({
      id: rule.issueId,
      label: rule.label,
      severity: rule.severity,
      affected_phases: rule.affectedPhases,
      description: hit.description,
      likely_cause: rule.likelyCause,
      confidence: hit.confidence,
      is_estimated: true,
      detection_basis: 'pose',
      visual_indicator: rule.visualIndicator,
      sport_id: sport,
    });
  }
  return issues;
}

/**
 * Merge pose-derived issues into a list of metadata detections IN PLACE: a
 * pose detection SUPERSEDES the metadata guess for the same issue id (real
 * geometry beats a duration/camera heuristic); otherwise it is appended.
 */
export function applyPoseIssues(
  into: SportDetectedIssue[],
  sport: SportId,
  pose: SportPoseFeatures | undefined,
): void {
  if (!pose) return;
  for (const poseIssue of detectPoseIssues(sport, pose)) {
    const idx = into.findIndex((x) => x.id === poseIssue.id);
    if (idx >= 0) into[idx] = poseIssue;
    else into.push(poseIssue);
  }
}
