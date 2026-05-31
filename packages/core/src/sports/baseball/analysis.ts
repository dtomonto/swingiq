// ============================================================
// SwingIQ — Baseball Analysis Engine
// Heuristic issue detection for baseball swing video.
// ⚠️ All detections are ESTIMATED — no ML model is running.
//    Confidence values intentionally conservative (0.30–0.55).
// ============================================================

import type { SportAnalysisInput, SportDetectedIssue, SportSwingAnalysis } from '../types';
import { BASEBALL_PHASE_SEQUENCE, BASEBALL_PHASE_DEFINITIONS } from './phases';
import { BASEBALL_DRILLS } from './drills';

interface BaseballHeuristicMetrics {
  duration_seconds: number;
  camera_suitable: boolean;
  appears_long_stride: boolean; // >1s before contact = possible lunge
  appears_slow: boolean;
}

function deriveBaseballMetrics(input: SportAnalysisInput): BaseballHeuristicMetrics {
  const { metadata } = input;
  return {
    duration_seconds: metadata.duration_seconds,
    camera_suitable:
      metadata.camera_angle === 'face_on' ||
      metadata.camera_angle === 'down_the_line' ||
      metadata.camera_angle === 'rear',
    appears_long_stride: metadata.duration_seconds > 1.5,
    appears_slow: metadata.duration_seconds > 5.0,
  };
}

const BASEBALL_ISSUE_RULES: Array<{
  issueId: string;
  label: string;
  severity: 'critical' | 'notable' | 'minor' | 'watch';
  affectedPhases: string[];
  description: string;
  likelyCause: string;
  visualIndicator: string;
  detect: (m: BaseballHeuristicMetrics) => number;
}> = [
  {
    issueId: 'casting_hands',
    label: 'Casting — Bat Barrel Drops Early',
    severity: 'critical',
    affectedPhases: ['bat_lag', 'hip_rotation'],
    description:
      'The bat barrel drops away from the body early in the downswing rather than maintaining lag behind the hands. This is one of the most common and costly hitting flaws.',
    likelyCause:
      'Pushing with the back arm, early top-hand dominance, or trying to generate power with the arms instead of the hips.',
    visualIndicator:
      'The barrel of the bat points away from the catcher before hands reach the contact zone.',
    detect: (m) => (m.camera_suitable ? 0.35 : 0),
  },
  {
    issueId: 'hip_stall',
    label: 'Hip Rotation Stalling',
    severity: 'critical',
    affectedPhases: ['hip_rotation', 'contact'],
    description:
      'The hips appear to stop rotating before the hands reach the contact zone, limiting the transfer of rotational power.',
    likelyCause:
      'Arms-only swing habit, improper weight transfer, or lack of hip mobility and rotation training.',
    visualIndicator:
      'Hips appear forward but squared up at contact — stopped rotation. Belt buckle should be facing the pitcher at contact.',
    detect: (m) => (m.camera_suitable ? 0.32 : 0),
  },
  {
    issueId: 'lunging_forward',
    label: 'Lunging — Weight Shifts Forward Too Early',
    severity: 'notable',
    affectedPhases: ['stride', 'load'],
    description:
      'Weight shifts forward onto the front foot during the stride, before hip rotation begins. This causes hitters to be early on inside pitches and weak on anything away.',
    likelyCause:
      'Fear of being late, aggressive stride, poor load mechanics, or improper "stay back" training.',
    visualIndicator:
      'Front leg appears significantly bent at knee at load/stride — weight already shifted forward.',
    detect: (m) => (m.appears_long_stride && m.camera_suitable ? 0.35 : 0),
  },
  {
    issueId: 'early_shoulder_pull',
    label: 'Front Shoulder Opening Early',
    severity: 'notable',
    affectedPhases: ['stride', 'hip_rotation'],
    description:
      'The front shoulder rotates open simultaneously with or before the hips fire. This causes the bat to travel on an out-to-in path — a common cause of weak pull-side hits and struggles with outside pitches.',
    likelyCause:
      'Trying to see the ball with both eyes, over-rotation habit, or improper hip-shoulder separation training.',
    visualIndicator:
      'Front shoulder visible rotating outward toward the pitcher during the stride phase.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'head_off_ball',
    label: 'Head Pulling Off the Ball',
    severity: 'notable',
    affectedPhases: ['contact', 'extension'],
    description:
      'The head and eyes drift upward or toward the pull field before or at contact, leading to miss-hits and inconsistent contact quality.',
    likelyCause:
      'Anticipating the result, front shoulder pull, or not training eyes-on-contact habits.',
    visualIndicator:
      'Head rotates or lifts before the follow-through begins.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'chopping_swing',
    label: 'Chopping Down at the Ball',
    severity: 'minor',
    affectedPhases: ['bat_lag', 'contact'],
    description:
      'Swing path appears to be going steeply downward rather than matching the descent angle of the pitch.',
    likelyCause:
      'Old-school "hit down on the ball" coaching cue, early extension without rotation, or arm-dominant swing.',
    visualIndicator:
      'Bat path clearly travels downward — contact results in groundballs even on mistake pitches.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },

  // ── Additional expanded issues ────────────────────────────────

  {
    issueId: 'poor_stance_setup',
    label: 'Poor Stance Setup',
    severity: 'watch',
    affectedPhases: ['load'],
    description:
      'Stance width, foot alignment, or body posture at setup appears suboptimal — too wide, too narrow, or weight poorly distributed before the pitch.',
    likelyCause:
      'No deliberate stance routine, copying a stance without understanding the purpose, or compensating for previous technique issues.',
    visualIndicator:
      'Feet noticeably uneven, stance very narrow or excessively wide, or significant forward lean at address.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'late_load',
    label: 'Late Loading',
    severity: 'notable',
    affectedPhases: ['load'],
    description:
      'Weight transfer onto the back leg begins too late, shortening the available time for hip rotation and power generation.',
    likelyCause:
      'Reactive rather than anticipatory load, or inexperience reading pitcher timing.',
    visualIndicator:
      'Back leg load begins just before or simultaneous with the stride rather than early in the pitch cycle.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'early_load',
    label: 'Early Loading',
    severity: 'minor',
    affectedPhases: ['load'],
    description:
      'Weight transfers to the back leg too early relative to pitch delivery, causing the hitter to "leak" forward during the wait period.',
    likelyCause:
      'Nervousness, over-eager loading, or timing adjustment for fast pitching gone too far.',
    visualIndicator:
      'Back leg heavily loaded before the pitcher reaches the release point, followed by a drift forward.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'poor_stride_direction',
    label: 'Poor Stride Direction',
    severity: 'notable',
    affectedPhases: ['stride'],
    description:
      'Stride foot lands open (toward pull field) or closed (toward opposite field) rather than directly toward the pitcher.',
    likelyCause:
      'Habit, compensating for shoulder-open tendency, or pulling off the ball mentally before the pitch arrives.',
    visualIndicator:
      'Front foot toe points noticeably left or right at stride landing rather than toward the mound.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'over_striding',
    label: 'Over-Striding',
    severity: 'notable',
    affectedPhases: ['stride'],
    description:
      'Stride length is excessive — front foot lands too far forward, causing the hitter to shift weight prematurely and lose rotational power.',
    likelyCause:
      'Trying to get closer to the pitch, aggressive approach, or poor stride-length training.',
    visualIndicator:
      'Stride foot lands more than 6 inches beyond the hitter\'s normal shoulder-width, front leg very bent at landing.',
    detect: (m) => (m.appears_long_stride && m.camera_suitable ? 0.35 : 0),
  },
  {
    issueId: 'under_striding',
    label: 'Under-Striding',
    severity: 'minor',
    affectedPhases: ['stride'],
    description:
      'Stride is minimal or absent, resulting in a static, power-limited swing.',
    likelyCause:
      'Fear of over-striding causing over-correction, or a training cue taken too literally.',
    visualIndicator:
      'Little to no foot movement at stride — batter appears to swing without shifting weight at all.',
    detect: (m) => (!m.appears_long_stride && m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'poor_hip_shoulder_separation',
    label: 'Poor Hip-Shoulder Separation',
    severity: 'critical',
    affectedPhases: ['hip_rotation', 'bat_lag'],
    description:
      'Hips and shoulders appear to rotate simultaneously rather than hips firing first, eliminating the "X-factor" stretch that generates maximum bat speed.',
    likelyCause:
      'Arms-only swing habit, no understanding of kinetic chain, or improper hip-rotation coaching.',
    visualIndicator:
      'Hips and shoulders face the pitcher at the same moment — no lag between hip rotation and shoulder turn.',
    detect: (m) => (m.camera_suitable ? 0.33 : 0),
  },
  {
    issueId: 'drifting_swaying',
    label: 'Drifting / Swaying During Load',
    severity: 'notable',
    affectedPhases: ['load', 'stride'],
    description:
      'Body sways backward excessively during the load, causing the weight to drift past the back foot and making it difficult to shift forward efficiently.',
    likelyCause:
      'Trying to "stay back" too aggressively, improper weight loading cue, or poor balance training.',
    visualIndicator:
      'Head moves visibly backward beyond the back foot — back knee bows outward under excessive weight.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'collapsing_back_side',
    label: 'Collapsing Back Side',
    severity: 'notable',
    affectedPhases: ['hip_rotation', 'contact'],
    description:
      'The back hip and leg collapse inward rather than driving forward and through, reducing rotational power at contact.',
    likelyCause:
      'Weak hip musculature, lunging habit causing early front-side dominance, or no hip "drive through" training.',
    visualIndicator:
      'Back knee buckles or drops toward the plate at contact rather than driving through.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'long_swing_path',
    label: 'Long Swing Path',
    severity: 'notable',
    affectedPhases: ['bat_lag', 'hip_rotation'],
    description:
      'Bat takes a long, wide arc to reach the contact zone rather than a direct inside path, reducing bat speed and reaction time to inside pitches.',
    likelyCause:
      'Casting hands away from the body, early barrel extension, or no "hands inside the ball" training.',
    visualIndicator:
      'Bat barrel visible looping wide before approaching the contact zone.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'steep_bat_path',
    label: 'Steep (Chopping) Bat Path',
    severity: 'minor',
    affectedPhases: ['bat_lag', 'contact'],
    description:
      'Bat travels on a steep downward angle, creating a high groundball rate and reducing the hitter\'s margin of error in the vertical zone.',
    likelyCause:
      '"Hit down on the ball" cue, early top-hand dominance, or disconnected swing from the hip rotation.',
    visualIndicator:
      'Bat clearly traveling downward at an angle steeper than the pitch descent.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'flat_bat_path',
    label: 'Flat Bat Path',
    severity: 'minor',
    affectedPhases: ['bat_lag', 'contact'],
    description:
      'Bat travels on an overly flat (horizontal) path rather than matching the pitch descent angle, resulting in pop-ups on pitches above the zone.',
    likelyCause:
      'Over-correcting a downswing, trying to hit for power by swinging "up," or hip-drop creating shoulder tilt.',
    visualIndicator:
      'Bat travels nearly parallel to the ground with little upward trajectory through the zone.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'weak_bat_acceleration',
    label: 'Weak Bat Acceleration',
    severity: 'notable',
    affectedPhases: ['hip_rotation', 'contact', 'extension'],
    description:
      'Bat speed appears to peak early or remain slow through the contact zone, suggesting the kinetic chain is not fully transferring energy to the barrel.',
    likelyCause:
      'Arms-only swing, poor hip rotation timing, or grip too tight causing deceleration through contact.',
    visualIndicator:
      'Swing appears to "push" the ball rather than drive it — contact lacks crispness.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'contact_too_forward',
    label: 'Contact Point Too Far Forward',
    severity: 'notable',
    affectedPhases: ['contact'],
    description:
      'Contact occurs too far in front of the body, causing the bat to be out of the power zone and resulting in weak pull-side contact or foul balls.',
    likelyCause:
      'Trying to pull every pitch, timing too early, or reacting to an anticipated fastball on an off-speed.',
    visualIndicator:
      'Hands extended nearly straight at contact — bat nearly fully extended before reaching the plate.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'pull_off_early',
    label: 'Pulling Off the Ball Early',
    severity: 'notable',
    affectedPhases: ['contact', 'extension'],
    description:
      'Head, front shoulder, and/or hips rotate toward the pull field before or during contact, causing the bat to drag across the zone.',
    likelyCause:
      'Pull-conscious approach, front-shoulder habit, or a visual cue to "see" where the ball is going too early.',
    visualIndicator:
      'Front shoulder and head visible rotating toward the pull side before follow-through is complete.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
];

function estimateBaseballPhaseSegments(
  duration: number,
): Array<{ phase: string; label: string; start_time: number; end_time: number; key_frame_time: number; is_estimated: boolean; sport_id: 'baseball' }> {
  return BASEBALL_PHASE_SEQUENCE.map((phase, idx) => {
    const def = BASEBALL_PHASE_DEFINITIONS[phase];
    const startPct = def.estimated_pct_of_swing;
    const nextPct =
      idx < BASEBALL_PHASE_SEQUENCE.length - 1
        ? BASEBALL_PHASE_DEFINITIONS[BASEBALL_PHASE_SEQUENCE[idx + 1]].estimated_pct_of_swing
        : 1.0;
    const start = +(startPct * duration).toFixed(3);
    const end = +(nextPct * duration).toFixed(3);
    return {
      phase,
      label: def.label,
      start_time: start,
      end_time: Math.min(end, duration),
      key_frame_time: +((start + end) / 2).toFixed(3),
      is_estimated: true,
      sport_id: 'baseball' as const,
    };
  });
}

export function runBaseballAnalysis(input: SportAnalysisInput): SportSwingAnalysis {
  const metrics = deriveBaseballMetrics(input);

  const detectedIssues: SportDetectedIssue[] = [];
  for (const rule of BASEBALL_ISSUE_RULES) {
    const confidence = rule.detect(metrics);
    if (confidence > 0) {
      detectedIssues.push({
        id: rule.issueId as SportDetectedIssue['id'],
        label: rule.label,
        severity: rule.severity,
        affected_phases: rule.affectedPhases,
        description: rule.description,
        likely_cause: rule.likelyCause,
        confidence,
        is_estimated: true,
        visual_indicator: rule.visualIndicator,
        sport_id: 'baseball',
      });
    }
  }

  const severityOrder = { critical: 0, notable: 1, minor: 2, watch: 3 };
  detectedIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const primaryIssue = detectedIssues[0] ?? null;

  const drillRecommendations = BASEBALL_DRILLS.filter(
    (drill) =>
      drill.issue_id !== null &&
      detectedIssues.some((issue) => issue.id === drill.issue_id),
  ).slice(0, 5);

  const phaseSegments = estimateBaseballPhaseSegments(input.metadata.duration_seconds);

  const baseScore = 65;
  const deduction = detectedIssues.reduce((acc, issue) => {
    const weights = { critical: 15, notable: 8, minor: 4, watch: 1 };
    return acc + weights[issue.severity];
  }, 0);
  const overallScore = Math.max(10, Math.min(100, baseScore - deduction));

  const now = new Date().toISOString();

  return {
    id: `baseball_analysis_${Date.now()}`,
    sport_id: 'baseball',
    video_id: '',
    user_id: input.user_id,
    session_id: null,
    camera_angle: input.metadata.camera_angle,
    metadata: input.metadata,
    phase_segments: phaseSegments,
    detected_issues: detectedIssues,
    drill_recommendations: drillRecommendations,
    overall_visual_score: overallScore,
    primary_issue: primaryIssue,
    ai_narrative: null,
    is_fully_estimated: true,
    analysis_version: '1.0.0',
    created_at: now,
    updated_at: now,
  };
}
