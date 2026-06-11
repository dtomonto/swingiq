// ============================================================
// SwingVantage — Tennis Analysis Engine
// Heuristic issue detection for tennis swing video.
// ⚠️ All detections are ESTIMATED — no ML model is running.
//    Confidence values are intentionally conservative (0.3–0.55).
// ============================================================

import type { SportAnalysisInput, SportDetectedIssue, SportSwingAnalysis } from '../types';
import { applyPoseIssues } from '../pose-detection';
import { TENNIS_PHASE_SEQUENCE, TENNIS_PHASE_DEFINITIONS } from './phases';
import { TENNIS_DRILLS } from './drills';

// ──────────────────────────────────────────────────────────────
// Heuristic metrics derived from metadata (no pixel analysis)
// ──────────────────────────────────────────────────────────────

interface TennisHeuristicMetrics {
  duration_seconds: number;
  camera_suitable: boolean;      // side-on or front-on view best
  appears_short_swing: boolean;  // duration < 0.8s suggests abbreviated swing
  appears_slow: boolean;         // overall duration suggests slow-motion
}

function deriveTennisMetrics(input: SportAnalysisInput): TennisHeuristicMetrics {
  const { metadata } = input;
  return {
    duration_seconds: metadata.duration_seconds,
    camera_suitable:
      metadata.camera_angle === 'face_on' ||
      metadata.camera_angle === 'down_the_line' ||
      metadata.camera_angle === 'rear',
    appears_short_swing: metadata.duration_seconds < 1.2,
    appears_slow: metadata.duration_seconds > 4.0,
  };
}

// ──────────────────────────────────────────────────────────────
// Issue detection rules
// ──────────────────────────────────────────────────────────────


const TENNIS_ISSUE_RULES: Array<{
  issueId: string;
  label: string;
  severity: 'critical' | 'notable' | 'minor' | 'watch';
  affectedPhases: string[];
  description: string;
  likelyCause: string;
  visualIndicator: string;
  detect: (m: TennisHeuristicMetrics) => number;
}> = [
  {
    issueId: 'follow_through_short',
    label: 'Abbreviated Follow-Through',
    severity: 'notable',
    affectedPhases: ['follow_through'],
    description:
      'The swing appears to decelerate before or at contact rather than continuing through to a full finish.',
    likelyCause:
      'Trying to "aim" or steer the ball with the arm rather than letting the swing flow naturally.',
    visualIndicator:
      'Racket stops roughly at shoulder height or lower rather than continuing over the non-dominant shoulder.',
    detect: (m) => (m.appears_short_swing && m.camera_suitable ? 0.35 : 0),
  },
  {
    issueId: 'late_contact',
    label: 'Late Contact Point',
    severity: 'notable',
    affectedPhases: ['contact_zone'],
    description:
      'Ball contact appears to be occurring beside or behind the front hip rather than in front of the body.',
    likelyCause:
      'Late unit turn preparation, slow racket loop timing, or insufficient movement to the ball.',
    visualIndicator:
      'Hitting arm appears to be beside or behind the hip/shoulder line at contact.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'head_pull_tennis',
    label: 'Head Pulling Off Ball',
    severity: 'notable',
    affectedPhases: ['contact_zone', 'follow_through'],
    description:
      'Head and eyes appear to move away from the contact zone before ball contact is complete.',
    likelyCause:
      'Anticipating the result too early, or shoulder rotation pulling the head along with it.',
    visualIndicator:
      'Head rotates toward the target before or during contact rather than staying down through the strike.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'wrist_rollover',
    label: 'Premature Wrist Rollover',
    severity: 'minor',
    affectedPhases: ['contact_zone'],
    description:
      'Wrist appears to rotate over (pronate) too early — before or at contact — reducing topspin efficiency and directional control.',
    likelyCause:
      'Trying to generate spin with wrist action rather than low-to-high swing path.',
    visualIndicator:
      'Racket face tilts downward (rolls over) near or before contact.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'loop_timing_off',
    label: 'Backswing Timing Disrupted',
    severity: 'minor',
    affectedPhases: ['backswing', 'loading'],
    description:
      'Backswing preparation appears rushed or late, causing the swing to begin without full racket-loop completion.',
    likelyCause:
      'Late unit turn, insufficient split-step timing, or trying to generate power with the arm rather than the body rotation.',
    visualIndicator:
      'Racket appears to be still traveling backward as the body begins forward swing.',
    detect: (m) => (m.duration_seconds < 1.0 && m.camera_suitable ? 0.32 : 0),
  },

  // ── Additional expanded issues ────────────────────────────────

  {
    issueId: 'poor_split_step',
    label: 'Late Split Step Timing',
    severity: 'notable',
    affectedPhases: ['ready_position'],
    description:
      'The split step appears delayed or absent, meaning the player is not loaded and ready when the opponent contacts the ball.',
    likelyCause:
      'Habit of watching the ball too late, not reading opponent contact cues, or poor footwork training.',
    visualIndicator:
      'Player appears flat-footed or still moving into position when preparation phase should begin.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'weak_unit_turn',
    label: 'Insufficient Shoulder Rotation',
    severity: 'notable',
    affectedPhases: ['unit_turn', 'backswing'],
    description:
      'Shoulder rotation appears minimal — the torso does not turn sufficiently to coil energy for the forward swing.',
    likelyCause:
      'Arm-only swing habit, tightness in the torso, or not understanding the role of the unit turn in generating power.',
    visualIndicator:
      'Shoulders appear nearly parallel to the net at the top of the backswing rather than perpendicular.',
    detect: (m) => (m.appears_short_swing && m.camera_suitable ? 0.33 : 0),
  },
  {
    issueId: 'poor_loading',
    label: 'Poor Weight Transfer and Loading',
    severity: 'notable',
    affectedPhases: ['loading'],
    description:
      'Weight does not transfer onto the back foot during the loading phase, reducing the elastic energy available for the forward swing.',
    likelyCause:
      'Stance too wide, habit of hitting from a static position, or open-stance reliance without compensating hip coil.',
    visualIndicator:
      'Body appears upright and centered with no visible rear-leg loading before the swing initiates.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'off_balance_contact',
    label: 'Balance Issues at Contact',
    severity: 'notable',
    affectedPhases: ['contact_zone'],
    description:
      'The player appears off-balance at the moment of contact, compromising power transfer and directional control.',
    likelyCause:
      'Reaching for the ball without moving the feet, over-rotation, or poor footwork to the ball.',
    visualIndicator:
      'Weight is clearly falling to one side or forward at the moment of contact.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'poor_racquet_path',
    label: 'Inconsistent Racquet Path',
    severity: 'minor',
    affectedPhases: ['backswing', 'contact_zone'],
    description:
      'Racquet appears to travel on a different arc each swing rather than a repeatable low-to-high path.',
    likelyCause:
      'No defined swing pattern, wrist-driven swing, or inconsistent loop mechanics.',
    visualIndicator:
      'Racquet head position varies noticeably between swings in a rally or drill sequence.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'excessive_wrist',
    label: 'Excessive Wrist Manipulation',
    severity: 'minor',
    affectedPhases: ['contact_zone', 'follow_through'],
    description:
      'Wrist appears to be actively twisting or "flipping" through the contact zone rather than being passive and controlled.',
    likelyCause:
      'Trying to generate spin or pace with the wrist rather than allowing the swing arc to do the work.',
    visualIndicator:
      'Wrist angle changes rapidly just before or at contact — flipping or snapping motion visible.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'inconsistent_swing_plane',
    label: 'Inconsistent Swing Plane',
    severity: 'minor',
    affectedPhases: ['backswing', 'contact_zone'],
    description:
      'The swing plane varies between shots — sometimes flat, sometimes steep — making contact point unpredictable.',
    likelyCause:
      'No ingrained swing template, arm-dominant mechanics, or fatigue affecting technique.',
    visualIndicator:
      'Racquet angle at loading varies significantly across multiple shots.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'poor_extension',
    label: 'Short Extension Through Contact',
    severity: 'notable',
    affectedPhases: ['contact_zone'],
    description:
      'The hitting arm pulls back too early after contact rather than extending fully through the ball.',
    likelyCause:
      'Defensive hitting habit, fear of over-rotation, or trying to steer the ball with the arm.',
    visualIndicator:
      'Elbow bends and retracts at or immediately after contact rather than extending toward the target.',
    detect: (m) => (m.appears_short_swing && m.camera_suitable ? 0.33 : 0),
  },
  {
    issueId: 'short_follow_through',
    label: 'Short Follow-Through',
    severity: 'minor',
    affectedPhases: ['follow_through'],
    description:
      'The follow-through ends prematurely, suggesting the swing was decelerated before or at contact.',
    likelyCause:
      'Trying to aim the ball or control placement by decelerating, or fatigue reducing full swing commitment.',
    visualIndicator:
      'Racquet finishes below non-dominant shoulder level rather than fully wrapping over it.',
    detect: (m) => (m.appears_short_swing && m.camera_suitable ? 0.32 : 0),
  },
  {
    issueId: 'poor_recovery',
    label: 'Poor Recovery Position',
    severity: 'watch',
    affectedPhases: ['follow_through'],
    description:
      'After the shot, the player does not recover quickly toward the ready position, leaving them out of position for the next shot.',
    likelyCause:
      'Watching the result of the shot too long, no split-step habit on opponent contact, or balance issues in the finish.',
    visualIndicator:
      'Player remains in follow-through position well after contact rather than stepping back to center.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'over_rotation',
    label: 'Over-Rotation on Follow-Through',
    severity: 'minor',
    affectedPhases: ['follow_through'],
    description:
      'Body rotation continues excessively past the contact point, causing loss of balance and erratic ball direction.',
    likelyCause:
      'Too aggressive hip rotation relative to arm swing, or no sense of "posting" on the front leg.',
    visualIndicator:
      'Hips spin past the target line and body falls off-balance toward the non-dominant side.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'poor_footwork',
    label: 'Poor Footwork and Spacing',
    severity: 'notable',
    affectedPhases: ['ready_position', 'unit_turn'],
    description:
      'Footwork appears inefficient — either too many steps, too few, or poor spacing to the ball at contact.',
    likelyCause:
      'Not reading ball trajectory early enough, no structured footwork pattern, or split-step timing issues.',
    visualIndicator:
      'Feet appear scrambled or stuck — contact is made from a poor position relative to the bounce.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'falling_away',
    label: 'Falling Away From the Shot',
    severity: 'notable',
    affectedPhases: ['contact_zone', 'follow_through'],
    description:
      'Body weight moves backward or sideways away from the contact zone rather than into the ball at contact.',
    likelyCause:
      'Fear of the ball, lateral balance issues, or incorrect weight transfer direction during loading.',
    visualIndicator:
      'Torso or hips visibly moving away from the net or backwards during the swing.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'serve_toss_inconsistency',
    label: 'Serve Toss Inconsistency',
    severity: 'notable',
    affectedPhases: ['unit_turn'],
    description:
      'Ball toss varies in height, forward placement, or direction, causing the swing to compensate on each serve.',
    likelyCause:
      'Tossing arm not trained separately, premature shoulder rotation pulling the toss off-target, or wind compensation habits.',
    visualIndicator:
      'Toss ball position changes noticeably across serves — sometimes too far forward, back, or to the side.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'serve_trophy_breakdown',
    label: 'Serve Trophy Position Breakdown',
    severity: 'notable',
    affectedPhases: ['loading'],
    description:
      'The trophy position before ball toss and weight transfer appears collapsed — either rushed or mechanically incomplete.',
    likelyCause:
      'No ingrained serve ritual, rushing the motion, or lack of proper serve technique instruction.',
    visualIndicator:
      'Arm does not reach the "trophy" position before the forward motion begins — truncated coil.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'late_preparation',
    label: 'Late Preparation',
    severity: 'notable',
    affectedPhases: ['unit_turn', 'backswing'],
    description:
      'Racquet preparation (unit turn and backswing) is initiated too late, forcing the player to rush the forward swing.',
    likelyCause:
      'Late split step, watching the ball too long before reacting, or not identifying ball direction early enough.',
    visualIndicator:
      'Racquet still in neutral position when the ball is within halfway of the court.',
    detect: (m) => (m.duration_seconds < 1.2 && m.camera_suitable ? 0.35 : 0),
  },
];

// ──────────────────────────────────────────────────────────────
// Phase segment estimation (heuristic timing from duration)
// ──────────────────────────────────────────────────────────────

function estimateTennisPhaseSegments(
  duration: number,
): Array<{ phase: string; label: string; start_time: number; end_time: number; key_frame_time: number; is_estimated: boolean; sport_id: 'tennis' }> {
  return TENNIS_PHASE_SEQUENCE.map((phase, idx) => {
    const def = TENNIS_PHASE_DEFINITIONS[phase];
    const startPct = def.estimated_pct_of_swing;
    const nextPct =
      idx < TENNIS_PHASE_SEQUENCE.length - 1
        ? TENNIS_PHASE_DEFINITIONS[TENNIS_PHASE_SEQUENCE[idx + 1]].estimated_pct_of_swing
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
      sport_id: 'tennis' as const,
    };
  });
}

// ──────────────────────────────────────────────────────────────
// Main analysis function
// ──────────────────────────────────────────────────────────────

export function runTennisAnalysis(input: SportAnalysisInput): SportSwingAnalysis {
  const metrics = deriveTennisMetrics(input);

  // Detect issues
  const detectedIssues: SportDetectedIssue[] = [];
  for (const rule of TENNIS_ISSUE_RULES) {
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
        sport_id: 'tennis',
      });
    }
  }

  // Sort by severity
  // P3: pose-derived detections — supersede the metadata guess for the same id.
  applyPoseIssues(detectedIssues, 'tennis', input.pose);

  const severityOrder = { critical: 0, notable: 1, minor: 2, watch: 3 };
  detectedIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const primaryIssue = detectedIssues[0] ?? null;

  // Get drills for detected issues
  const drillRecommendations = TENNIS_DRILLS.filter(
    (drill) =>
      drill.issue_id !== null &&
      detectedIssues.some((issue) => issue.id === drill.issue_id),
  ).slice(0, 5);

  // Phase segments
  const phaseSegments = estimateTennisPhaseSegments(input.metadata.duration_seconds);

  // Score (0-100, conservative — heuristic)
  const baseScore = 65;
  const deduction =
    detectedIssues.reduce((acc, issue) => {
      const weights = { critical: 15, notable: 8, minor: 4, watch: 1 };
      return acc + weights[issue.severity];
    }, 0);
  const overallScore = Math.max(10, Math.min(100, baseScore - deduction));

  const now = new Date().toISOString();

  return {
    id: `tennis_analysis_${Date.now()}`,
    sport_id: 'tennis',
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
