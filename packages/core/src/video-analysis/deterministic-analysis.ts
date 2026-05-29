// ============================================================
// SwingIQ — Deterministic Video Analysis Engine
// Rule-based heuristic detection of visual swing issues.
// ⚠️  All detections are ESTIMATED — no ML model is running.
//     Confidence values are intentionally conservative (0.3–0.65).
// ============================================================

import type { CameraAngle, SkillLevel } from '../types';
import type {
  SwingVideoMetadata,
  SwingPhaseSegment,
  DetectedSwingIssue,
  SwingVideoAnalysis,
  EstimatedPoseLandmarks,
  VisualIssueId,
  VisualIssueSeverity,
} from './types';
import { getDrillsForIssue } from './drill-library';
import { SWING_PHASE_SEQUENCE, SWING_PHASE_DEFINITIONS } from './swing-phase-definitions';

// ──────────────────────────────────────────────────────────────
// Heuristic pose analysis helpers
// These are placeholder implementations that return estimated
// positions based on simple geometric assumptions.
// UPGRADE PATH: Replace these with real ML calls (MediaPipe/MoveNet).
// ──────────────────────────────────────────────────────────────

interface SimpleMetrics {
  /** Normalised horizontal displacement of estimated hip midpoint between address and top */
  hip_sway_index: number;           // 0 = no sway, 1 = full-width sway
  /** Whether head position dips below address level significantly */
  head_dip_detected: boolean;
  /** Estimated shaft angle relative to spine at top (degrees) */
  shaft_over_plane_degrees: number;
  /** Estimated forward hip thrust at impact vs address */
  hip_thrust_index: number;
  /** Whether lead arm fold detected post-impact */
  lead_arm_fold_early: boolean;
  /** Camera angle quality for issue detection */
  camera_suitable: boolean;
}

/**
 * Derive rough metrics from estimated landmarks at key frames.
 * This is a heuristic stub — values are plausible but not measured.
 * When real pose estimation is integrated, replace this function.
 */
function deriveMetricsFromLandmarks(
  landmarks: EstimatedPoseLandmarks | null,
  _phase: string,
  cameraAngle: CameraAngle | 'unknown',
): SimpleMetrics {
  // Heuristic defaults — cannot reliably detect without real pose data
  return {
    hip_sway_index: 0,
    head_dip_detected: false,
    shaft_over_plane_degrees: 0,
    hip_thrust_index: 0,
    lead_arm_fold_early: false,
    camera_suitable: cameraAngle === 'down_the_line' || cameraAngle === 'face_on',
  };
}

// ──────────────────────────────────────────────────────────────
// Issue detection rules
// ──────────────────────────────────────────────────────────────

interface IssueRule {
  id: VisualIssueId;
  label: string;
  severity: VisualIssueSeverity;
  description: string;
  likely_cause: string;
  visual_indicator: string;
  detectable_from: CameraAngle[];
  /** Called with heuristic metrics — return confidence 0-1, or 0 if not detected */
  detect: (metrics: SimpleMetrics) => number;
}

const ISSUE_RULES: IssueRule[] = [
  // NOTE: With heuristic-only pose estimation, all rules return low confidence
  // to prevent over-confident false positives. When ML is integrated, update
  // the detect() implementations to use real landmark data.
  {
    id: 'early_extension',
    label: 'Early Extension',
    severity: 'critical',
    description:
      'The hips thrust toward the ball through impact, causing the upper body to rise. This is one of the most common power leaks.',
    likely_cause:
      'Insufficient glute engagement, setup too tall, or arms not connected during downswing.',
    visual_indicator: 'Hips appear to push forward toward the ball in the impact zone.',
    detectable_from: ['down_the_line'],
    detect: (m) => (m.hip_thrust_index > 0.4 ? 0.45 : 0),
  },
  {
    id: 'sway_slide',
    label: 'Lateral Sway / Slide',
    severity: 'notable',
    description:
      'Excessive lateral movement of the hips and/or upper body — either away from the target (sway) or toward it (slide).',
    likely_cause:
      'Trying to shift weight by moving laterally rather than rotating around a fixed axis.',
    visual_indicator:
      'Head and/or hip midpoint moves noticeably left or right rather than turning in place.',
    detectable_from: ['face_on', 'down_the_line'],
    detect: (m) => (m.hip_sway_index > 0.35 ? 0.4 : 0),
  },
  {
    id: 'reverse_pivot',
    label: 'Reverse Pivot',
    severity: 'critical',
    description:
      'Weight moves toward the target on the backswing (and usually away from the target at impact) — the opposite of correct weight transfer.',
    likely_cause:
      'Misunderstanding of weight transfer; trying to "stay over the ball" incorrectly.',
    visual_indicator: 'Spine tilts toward the target at the top of the backswing.',
    detectable_from: ['face_on'],
    detect: (_m) => 0, // Requires real landmark spine tilt measurement
  },
  {
    id: 'casting',
    label: 'Casting / Early Release',
    severity: 'critical',
    description:
      'The wrist hinge is released from the top of the backswing rather than being maintained into the downswing, eliminating lag and power.',
    likely_cause: 'Using hands to initiate the downswing instead of the lower body.',
    visual_indicator:
      'Club head swings out in a wide arc from the top rather than "dropping" behind.',
    detectable_from: ['down_the_line'],
    detect: (_m) => 0, // Requires real wrist angle measurement
  },
  {
    id: 'chicken_winging',
    label: 'Chicken Wing (Lead Arm)',
    severity: 'notable',
    description:
      'The lead elbow bends and lifts (points outward) through and after impact instead of extending.',
    likely_cause:
      'Blocking the release, fear of hooking, or lack of training in proper follow-through extension.',
    visual_indicator:
      'Lead elbow points away from the body immediately after impact (rather than extending toward the target).',
    detectable_from: ['face_on', 'down_the_line'],
    detect: (m) => (m.lead_arm_fold_early ? 0.35 : 0),
  },
  {
    id: 'over_the_top',
    label: 'Over the Top',
    severity: 'critical',
    description:
      'The club attacks the ball from outside the target line — the most common cause of a slice or pull.',
    likely_cause:
      'Upper body initiates the downswing before the lower body; trail shoulder throws toward the target.',
    visual_indicator:
      'Club head visibly moves from outside the target line toward inside as it approaches the ball.',
    detectable_from: ['down_the_line'],
    detect: (_m) => 0, // Requires real club path measurement
  },
  {
    id: 'flying_elbow',
    label: 'Flying Trail Elbow',
    severity: 'notable',
    description:
      'The trail elbow flies away from the body at the top of the backswing, causing steep transitions.',
    likely_cause:
      'Over-rotation of the forearm, or trying to "get the club parallel" without adequate shoulder turn.',
    visual_indicator:
      'Trail elbow visibly separates high and away from the body at the top.',
    detectable_from: ['face_on'],
    detect: (_m) => 0, // Requires real elbow position measurement
  },
  {
    id: 'head_movement_excessive',
    label: 'Excessive Head Movement',
    severity: 'notable',
    description:
      'The head moves significantly during the swing — dipping, rising, or swaying — disrupting the swing arc.',
    likely_cause: 'Sway, loss of posture, or looking at where you want the ball to go.',
    visual_indicator: 'Head position clearly different between address and impact.',
    detectable_from: ['face_on', 'down_the_line'],
    detect: (m) => (m.head_dip_detected ? 0.35 : 0),
  },
  {
    id: 'loss_of_posture',
    label: 'Loss of Posture',
    severity: 'notable',
    description:
      'Spine angle changes significantly during the swing — typically rising or "standing up" through impact.',
    likely_cause:
      'Early extension, tension in the body, or trying to help the ball into the air.',
    visual_indicator:
      'Upper body appears to straighten or rise noticeably between address and impact.',
    detectable_from: ['down_the_line'],
    detect: (_m) => 0, // Requires real spine angle tracking
  },
];

// ──────────────────────────────────────────────────────────────
// Phase segmentation (heuristic timing)
// ──────────────────────────────────────────────────────────────

/**
 * Estimate swing phase timestamps from total video duration.
 * This is a rough heuristic — a real implementation would use
 * frame-by-frame pose estimation to find exact transition frames.
 */
export function estimatePhaseSegments(
  durationSeconds: number,
): SwingPhaseSegment[] {
  // Estimate: assume the golfer swings somewhere in the middle third of the video
  const swingStart = durationSeconds * 0.25;
  const swingDuration = Math.min(2.5, durationSeconds * 0.5); // average golf swing ~1.5–2s

  return SWING_PHASE_SEQUENCE.map((phase, i) => {
    const def = SWING_PHASE_DEFINITIONS[phase];
    const prevPct = i === 0 ? 0 : SWING_PHASE_DEFINITIONS[SWING_PHASE_SEQUENCE[i - 1]].estimated_pct_of_swing;
    const startTime = swingStart + prevPct * swingDuration;
    const endTime = swingStart + def.estimated_pct_of_swing * swingDuration;
    const keyTime = (startTime + endTime) / 2;

    return {
      phase,
      label: def.label,
      start_time: Math.max(0, startTime),
      end_time: Math.min(durationSeconds, endTime),
      key_frame_time: Math.min(durationSeconds, keyTime),
      is_estimated: true,
    };
  });
}

// ──────────────────────────────────────────────────────────────
// Main analysis function
// ──────────────────────────────────────────────────────────────

export interface VideoAnalysisInput {
  video_id: string;
  user_id: string;
  session_id: string | null;
  metadata: SwingVideoMetadata;
  landmarks_by_frame: Map<number, EstimatedPoseLandmarks | null>;
  skill_level?: SkillLevel;
}

/** Severity ordering for sorting */
const SEVERITY_ORDER: Record<VisualIssueSeverity, number> = {
  critical: 0,
  notable: 1,
  minor: 2,
  watch: 3,
};

export function runVideoAnalysis(input: VideoAnalysisInput): SwingVideoAnalysis {
  const { video_id, user_id, session_id, metadata } = input;
  const { camera_angle, duration_seconds } = metadata;

  // Step 1: Estimate phase segments from duration
  const phase_segments = estimatePhaseSegments(duration_seconds);

  // Step 2: Derive summary metrics from landmarks (heuristic only)
  const impactLandmarks = input.landmarks_by_frame.get(
    Math.round(duration_seconds * 0.85 * 1000),
  ) ?? null;
  const metrics = deriveMetricsFromLandmarks(impactLandmarks, 'impact', camera_angle);

  // Step 3: Run issue detection rules
  const detected_issues: DetectedSwingIssue[] = [];

  for (const rule of ISSUE_RULES) {
    // Skip rules that require a camera angle we don't have
    if (
      camera_angle !== 'unknown' &&
      camera_angle !== 'multi_angle' &&
      !rule.detectable_from.includes(camera_angle)
    ) {
      continue;
    }

    const confidence = rule.detect(metrics);
    if (confidence > 0) {
      detected_issues.push({
        id: rule.id,
        label: rule.label,
        severity: rule.severity,
        affected_phases: [], // would be populated by real ML
        description: rule.description,
        likely_cause: rule.likely_cause,
        confidence,
        is_estimated: true,
        visual_indicator: rule.visual_indicator,
      });
    }
  }

  // Step 4: Sort by severity then confidence
  detected_issues.sort((a, b) => {
    const severityDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.confidence - a.confidence;
  });

  // Step 5: Build drill recommendations for top issues
  const topIssues = detected_issues.slice(0, 3);
  const drill_recommendations = topIssues.flatMap((issue) =>
    getDrillsForIssue(issue.id),
  ).slice(0, 6);

  // Step 6: Compute a conservative overall visual score
  // With no real ML, we return a neutral-to-cautious score
  const penaltyByIssue =
    detected_issues.reduce((acc, issue) => {
      const penalty = issue.severity === 'critical' ? 15 : issue.severity === 'notable' ? 8 : 3;
      return acc + penalty * issue.confidence;
    }, 0);
  const overall_visual_score = Math.max(30, Math.round(65 - penaltyByIssue));

  return {
    id: `va_${Date.now()}`,
    video_id,
    user_id,
    session_id,
    camera_angle,
    metadata,
    phase_segments,
    detected_issues,
    drill_recommendations,
    overall_visual_score,
    primary_issue: detected_issues[0] ?? null,
    ai_narrative: null,  // populated server-side only
    is_fully_estimated: true,
    analysis_version: '1.0.0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
