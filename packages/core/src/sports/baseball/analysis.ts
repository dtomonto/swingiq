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
