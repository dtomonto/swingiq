// ============================================================
// SwingIQ — Slow Pitch Softball Analysis Engine
// Heuristic issue detection for slow pitch swing video.
// ⚠️ All detections are ESTIMATED — no ML model is running.
// ============================================================

import type { SportAnalysisInput, SportDetectedIssue, SportSwingAnalysis } from '../types';
import { SLOW_PITCH_PHASE_SEQUENCE, SLOW_PITCH_PHASE_DEFINITIONS } from './phases';
import { SLOW_PITCH_DRILLS } from './drills';

interface SlowPitchMetrics {
  duration_seconds: number;
  camera_suitable: boolean;
  appears_short_swing: boolean;
}

function deriveSlowPitchMetrics(input: SportAnalysisInput): SlowPitchMetrics {
  const { metadata } = input;
  return {
    duration_seconds: metadata.duration_seconds,
    camera_suitable:
      metadata.camera_angle === 'face_on' ||
      metadata.camera_angle === 'down_the_line' ||
      metadata.camera_angle === 'rear',
    appears_short_swing: metadata.duration_seconds < 1.0,
  };
}

const SLOW_PITCH_ISSUE_RULES: Array<{
  issueId: string;
  label: string;
  severity: 'critical' | 'notable' | 'minor' | 'watch';
  affectedPhases: string[];
  description: string;
  likelyCause: string;
  visualIndicator: string;
  detect: (m: SlowPitchMetrics) => number;
}> = [
  {
    issueId: 'no_hip_drive_soft',
    label: 'Arms-Only Swing — No Hip Drive',
    severity: 'critical',
    affectedPhases: ['hip_fire', 'contact_arc'],
    description:
      'The swing appears to rely primarily on arm strength rather than hip rotation, which is the primary power source in the slow pitch swing.',
    likelyCause:
      'Habit from recreational play without coaching, or misunderstanding that slow pitch requires "just arms."',
    visualIndicator:
      'Hips remain relatively squared to the plate at contact — minimal rotation visible.',
    detect: (m) => (m.camera_suitable ? 0.33 : 0),
  },
  {
    issueId: 'dropping_back_shoulder',
    label: 'Back Shoulder Dropping at Contact',
    severity: 'notable',
    affectedPhases: ['contact_arc', 'extension'],
    description:
      'Back shoulder drops excessively below level, causing an extreme uppercut that results in pop-ups rather than line drives.',
    likelyCause:
      'Trying to "get under" the high arc pitch — too much uppercut beyond matching the ball\'s descent angle.',
    visualIndicator:
      'Back shoulder clearly lower than front shoulder at contact, creating a steep upward bat angle.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'lunging_forward',
    label: 'Lunging — Early Weight Transfer',
    severity: 'notable',
    affectedPhases: ['stride', 'load'],
    description:
      'Weight shifts forward onto the front foot before the ball enters the hitting zone. Slow pitch arc requires patience — lunging commits the swing to a pitch trajectory that hasn\'t finished arriving.',
    likelyCause:
      'Impatience, slow pitch beginners often lunge at the high arc anticipating where it will land.',
    visualIndicator:
      'Front leg appears nearly straight at stride landing — weight forward too early.',
    detect: (m) => (m.camera_suitable ? 0.32 : 0),
  },
  {
    issueId: 'arm_short_follow',
    label: 'Short Follow-Through',
    severity: 'minor',
    affectedPhases: ['follow_through'],
    description:
      'The swing decelerates before reaching a full finish, indicating the swing is stopping at or before contact.',
    likelyCause:
      'Trying to aim or place the ball rather than swinging through it.',
    visualIndicator:
      'Bat stops roughly at shoulder height rather than finishing high over the front shoulder.',
    detect: (m) => (m.appears_short_swing && m.camera_suitable ? 0.35 : 0),
  },
  {
    issueId: 'early_shoulder_pull',
    label: 'Front Shoulder Opening Early',
    severity: 'minor',
    affectedPhases: ['hip_fire', 'stride'],
    description:
      'Front shoulder rotates open before hips fire, causing the bat to travel on an out-to-in path and limiting power.',
    likelyCause:
      'Trying to pull everything for power, impatience, or no hip-shoulder separation training.',
    visualIndicator:
      'Front shoulder rotating toward the pitcher before or during stride.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },

  // ── Additional expanded issues ────────────────────────────────

  {
    issueId: 'sp_poor_stance_setup',
    label: 'Poor Stance Setup',
    severity: 'watch',
    affectedPhases: ['load'],
    description:
      'Stance at the plate appears unbalanced or improperly aligned — feet too narrow, too wide, or weight unevenly distributed before the pitch arc arrives.',
    likelyCause:
      'No deliberate pre-swing routine, casual recreational approach, or copying stance without understanding the mechanics.',
    visualIndicator:
      'Feet visibly uneven, stance very open or closed, or excessive forward lean at address.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'sp_poor_pitch_tracking',
    label: 'Poor Arc Pitch Tracking',
    severity: 'notable',
    affectedPhases: ['load', 'stride'],
    description:
      'The hitter does not appear to be tracking the high arc of the pitch from release, making timing adjustments reactive rather than planned.',
    likelyCause:
      'Habit of swinging at a ball trajectory rather than tracking the arc peak and descent, or looking away from the ball during early flight.',
    visualIndicator:
      'Head position does not appear to follow the ball through the peak of the arc.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'sp_mistimed_load_arc',
    label: 'Load Timed Wrong for Arc Pitch',
    severity: 'notable',
    affectedPhases: ['load'],
    description:
      'The weight-transfer load initiates before the ball reaches its peak arc — too early for the slow pitch delivery timing window.',
    likelyCause:
      'Habit from fast pitch or baseball, or misunderstanding that the slow pitch arc requires a later load trigger than a flat trajectory pitch.',
    visualIndicator:
      'Weight appears already shifted and loaded while the ball is still ascending.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'sp_poor_stride_timing',
    label: 'Poor Stride Timing',
    severity: 'notable',
    affectedPhases: ['stride'],
    description:
      'Stride initiates too early or too late relative to the arc pitch descent, disrupting the timing chain.',
    likelyCause:
      'Inconsistent arc pitch recognition, poor load-stride coordination, or missing a deliberate timing trigger cue.',
    visualIndicator:
      'Stride foot lands before the pitch begins to descend, or not until the ball is nearly at the plate.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'sp_over_striding',
    label: 'Over-Striding',
    severity: 'notable',
    affectedPhases: ['stride'],
    description:
      'Stride length is excessive — weight shifts too far forward, compromising rotational power and balance.',
    likelyCause:
      'Eagerness to swing, trying to reach the pitch, or poor stride constraint training.',
    visualIndicator:
      'Front foot lands far beyond shoulder width — front knee heavily bent or nearly locked.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'sp_poor_weight_transfer',
    label: 'Poor Weight Transfer',
    severity: 'notable',
    affectedPhases: ['stride', 'hip_fire'],
    description:
      'Weight does not shift smoothly from back to front during the swing — stays too far back or shifts too abruptly.',
    likelyCause:
      'No awareness of the weight-shift sequence, overly static approach, or excessive "stay back" instruction.',
    visualIndicator:
      'Weight appears stuck on back leg through contact, or collapses forward in a lurch.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'sp_lunging_ball',
    label: 'Lunging at the Ball',
    severity: 'notable',
    affectedPhases: ['stride', 'load'],
    description:
      'Upper body and head lurch forward toward the plate during the swing, leaving the weight over the front foot too early and before the pitch descends into the hitting zone.',
    likelyCause:
      'Impatience with the arc delivery, or thinking forward momentum creates power.',
    visualIndicator:
      'Head and chest visibly forward of the front foot at stride landing.',
    detect: (m) => (m.appears_short_swing && m.camera_suitable ? 0.33 : 0),
  },
  {
    issueId: 'sp_poor_hip_rotation',
    label: 'Insufficient Hip Rotation',
    severity: 'critical',
    affectedPhases: ['hip_fire', 'contact_arc'],
    description:
      'Hips do not rotate fully through contact — swing relies primarily on arm strength, limiting power generation.',
    likelyCause:
      'Recreational swing habit developed without coaching, or belief that slow pitch only requires arm power.',
    visualIndicator:
      'Belt buckle does not reach toward the pitcher at contact — hips remain partially closed.',
    detect: (m) => (m.camera_suitable ? 0.33 : 0),
  },
  {
    issueId: 'sp_long_looping_swing',
    label: 'Long Looping Swing Path',
    severity: 'notable',
    affectedPhases: ['hip_fire', 'contact_arc'],
    description:
      'Bat takes a long looping arc to the ball rather than a direct path through the zone, reducing bat speed and making contact zone timing narrow.',
    likelyCause:
      'No inside-the-ball training, arm-dominant swing without hip drive, or compensating for a drop-and-extend habit.',
    visualIndicator:
      'Bat head drops below the hands before approaching the contact zone.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'sp_too_steep_contact',
    label: 'Too Steep at Contact — Groundball Pattern',
    severity: 'minor',
    affectedPhases: ['contact_arc'],
    description:
      'Bat enters the contact zone on a steep downward angle, producing excessive groundballs from a pitch that descends steeply and requires a slight upward contact angle.',
    likelyCause:
      '"Hit down" coaching cue applied incorrectly to the slow pitch arc, or early shoulder drop creating a steep path.',
    visualIndicator:
      'Bat clearly angled downward at contact — ball driven into the ground.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'sp_too_uppercut',
    label: 'Excessive Uppercut — Pop-Up Pattern',
    severity: 'notable',
    affectedPhases: ['contact_arc'],
    description:
      'Swing angle is too steep upward at contact, causing excessive pop-ups rather than line drives on the arc pitch.',
    likelyCause:
      'Trying to "get under" the arc pitch by dropping the back shoulder too much, or over-correcting a flat swing.',
    visualIndicator:
      'Back shoulder visibly lower than front shoulder at contact, bat angled steeply upward.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'sp_poor_bat_path_zone',
    label: 'Inconsistent Bat Path Through Zone',
    severity: 'minor',
    affectedPhases: ['contact_arc', 'extension'],
    description:
      'Bat path varies through the contact zone — sometimes flat, sometimes steep — producing inconsistent contact across different pitch arcs.',
    likelyCause:
      'No ingrained swing template for the arc pitch, arm-only swing adjustments, or variable hip timing.',
    visualIndicator:
      'Bat angle at contact varies across swings in the same session.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'sp_pulling_off_early',
    label: 'Pulling Off the Ball Early',
    severity: 'notable',
    affectedPhases: ['contact_arc', 'extension'],
    description:
      'Front shoulder and head rotate toward the pull field before contact is complete, dragging the bat off the ideal path.',
    likelyCause:
      'Pull-conscious mentality, attempting to pull the high arc for extra bases, or poor hip-shoulder separation habit.',
    visualIndicator:
      'Front shoulder rotating toward the dugout before follow-through begins.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'sp_poor_opposite_field',
    label: 'Poor Opposite-Field Bat Control',
    severity: 'watch',
    affectedPhases: ['contact_arc', 'extension'],
    description:
      'Hitter lacks the ability to drive the arc pitch to the opposite field — all contact is pulled or going to center regardless of pitch location.',
    likelyCause:
      'One-dimensional approach (pull everything), or no opposite-field specific training for the arc pitch.',
    visualIndicator:
      'All balls going to the pull field regardless of pitch location on the plate.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'sp_poor_finish_balance',
    label: 'Poor Finish Balance',
    severity: 'minor',
    affectedPhases: ['follow_through'],
    description:
      'At the end of the swing, the hitter is off-balance — falling forward, sideways, or back — indicating balance was compromised during the swing.',
    likelyCause:
      'Lunging, over-rotation, or poor weight transfer causing the finish position to be unstable.',
    visualIndicator:
      'Hitter steps or stumbles at the end of the swing to regain balance.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'sp_poor_pitch_arc_timing',
    label: 'Arc Timing Breakdown',
    severity: 'critical',
    affectedPhases: ['load', 'stride', 'hip_fire'],
    description:
      'The entire timing chain is out of sync with the arc pitch delivery — load, stride, and hip fire are not coordinated to the arc\'s descent.',
    likelyCause:
      'No arc-specific timing training, pitchers with different arc heights confusing the hitter, or fast-pitch timing habits carried over.',
    visualIndicator:
      'Swing timing is clearly either very early or very late relative to the pitch entering the zone.',
    detect: (m) => (m.camera_suitable ? 0.35 : 0),
  },
];

function estimateSlowPitchPhaseSegments(
  duration: number,
): Array<{ phase: string; label: string; start_time: number; end_time: number; key_frame_time: number; is_estimated: boolean; sport_id: 'softball_slow' }> {
  return SLOW_PITCH_PHASE_SEQUENCE.map((phase, idx) => {
    const def = SLOW_PITCH_PHASE_DEFINITIONS[phase];
    const startPct = def.estimated_pct_of_swing;
    const nextPct =
      idx < SLOW_PITCH_PHASE_SEQUENCE.length - 1
        ? SLOW_PITCH_PHASE_DEFINITIONS[SLOW_PITCH_PHASE_SEQUENCE[idx + 1]].estimated_pct_of_swing
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
      sport_id: 'softball_slow' as const,
    };
  });
}

export function runSlowPitchAnalysis(input: SportAnalysisInput): SportSwingAnalysis {
  const metrics = deriveSlowPitchMetrics(input);

  const detectedIssues: SportDetectedIssue[] = [];
  for (const rule of SLOW_PITCH_ISSUE_RULES) {
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
        sport_id: 'softball_slow',
      });
    }
  }

  const severityOrder = { critical: 0, notable: 1, minor: 2, watch: 3 };
  detectedIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const primaryIssue = detectedIssues[0] ?? null;

  const drillRecommendations = SLOW_PITCH_DRILLS.filter(
    (drill) =>
      drill.issue_id !== null &&
      detectedIssues.some((issue) => issue.id === drill.issue_id),
  ).slice(0, 5);

  const phaseSegments = estimateSlowPitchPhaseSegments(input.metadata.duration_seconds);

  const baseScore = 65;
  const deduction = detectedIssues.reduce((acc, issue) => {
    const weights = { critical: 15, notable: 8, minor: 4, watch: 1 };
    return acc + weights[issue.severity];
  }, 0);
  const overallScore = Math.max(10, Math.min(100, baseScore - deduction));

  const now = new Date().toISOString();

  return {
    id: `softball_slow_analysis_${Date.now()}`,
    sport_id: 'softball_slow',
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
