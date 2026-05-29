// ============================================================
// SwingIQ — Fast Pitch Softball Analysis Engine
// Heuristic issue detection for fast pitch swing video.
// ⚠️ All detections are ESTIMATED — no ML model is running.
// ============================================================

import type { SportAnalysisInput, SportDetectedIssue, SportSwingAnalysis } from '../types';
import { FAST_PITCH_PHASE_SEQUENCE, FAST_PITCH_PHASE_DEFINITIONS } from './phases';
import { FAST_PITCH_DRILLS } from './drills';

interface FastPitchMetrics {
  duration_seconds: number;
  camera_suitable: boolean;
  appears_long_swing: boolean;  // fast pitch swing should be compact / quick
  appears_slow: boolean;
}

function deriveFastPitchMetrics(input: SportAnalysisInput): FastPitchMetrics {
  const { metadata } = input;
  return {
    duration_seconds: metadata.duration_seconds,
    camera_suitable:
      metadata.camera_angle === 'face_on' ||
      metadata.camera_angle === 'down_the_line' ||
      metadata.camera_angle === 'rear',
    appears_long_swing: metadata.duration_seconds > 1.5,
    appears_slow: metadata.duration_seconds > 5.0,
  };
}

const FAST_PITCH_ISSUE_RULES: Array<{
  issueId: string;
  label: string;
  severity: 'critical' | 'notable' | 'minor' | 'watch';
  affectedPhases: string[];
  description: string;
  likelyCause: string;
  visualIndicator: string;
  detect: (m: FastPitchMetrics) => number;
}> = [
  {
    issueId: 'hip_stall',
    label: 'Hip Stall — Arms Leading the Swing',
    severity: 'critical',
    affectedPhases: ['hip_fire', 'contact'],
    description:
      'Hips appear to stop rotating before the hands reach the contact zone. In fast pitch, hip rotation must be explosive — there is almost no time to generate power any other way.',
    likelyCause:
      'Arms-only swing habit, insufficient hip rotation training, or trying to "aim" the ball.',
    visualIndicator:
      'Hips squared to plate at contact without forward rotation. Belt buckle should face the pitcher.',
    detect: (m) => (m.camera_suitable ? 0.33 : 0),
  },
  {
    issueId: 'casting_hands',
    label: 'Casting — Bat Barrel Drops Away Early',
    severity: 'critical',
    affectedPhases: ['hip_fire'],
    description:
      'Bat barrel extends away from the body before hands reach the contact zone. This is especially damaging in fast pitch because the compact swing requires the hands to stay close through the zone.',
    likelyCause:
      'Trying to generate power by extending early, or lack of lag training specific to the fast pitch compact swing.',
    visualIndicator:
      'Barrel visible pointing away from the catcher before the hands approach the hitting zone.',
    detect: (m) => (m.camera_suitable ? 0.32 : 0),
  },
  {
    issueId: 'lunging_forward',
    label: 'Lunging — Stride Too Long or Forward',
    severity: 'notable',
    affectedPhases: ['rapid_stride', 'load'],
    description:
      'Stride length appears excessive or stride is forward rather than compact. Fast pitch demands a short, quick stride to preserve balance and reaction time.',
    likelyCause:
      'Baseball or slow-pitch stride habits transferred to fast pitch, or trying to reach the pitch.',
    visualIndicator:
      'Front leg heavily bent at stride landing with weight already forward.',
    detect: (m) => (m.appears_long_swing && m.camera_suitable ? 0.35 : 0),
  },
  {
    issueId: 'head_off_ball',
    label: 'Head Pulling Off the Rising Ball',
    severity: 'notable',
    affectedPhases: ['contact', 'extension'],
    description:
      'Head and eyes leave the ball before contact. The rising fast pitch is uniquely deceptive — the ball\'s upward trajectory near the plate tempts hitters to look up early.',
    likelyCause:
      'The optical illusion of the rising ball pulling the head up, or anticipating too early.',
    visualIndicator:
      'Head moving upward or rotating toward pull field before the bat reaches contact.',
    detect: (m) => (m.camera_suitable ? 0.30 : 0),
  },
  {
    issueId: 'early_shoulder_pull',
    label: 'Front Shoulder Opening Too Early',
    severity: 'notable',
    affectedPhases: ['rapid_stride', 'hip_fire'],
    description:
      'Front shoulder rotates open before hips fire, making the bat path go out-to-in. Particularly damaging in fast pitch where the outside pitch is a major weapon.',
    likelyCause:
      'Overly pull-oriented approach or lack of hip-shoulder separation training.',
    visualIndicator:
      'Front shoulder rotating toward the pitcher during or before the stride.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'arm_short_follow',
    label: 'Abbreviated Follow-Through',
    severity: 'minor',
    affectedPhases: ['follow_through'],
    description:
      'Swing decelerates before full follow-through, suggesting the body is stopping the swing at or before contact.',
    likelyCause:
      'Trying to place or aim the ball, or a compact swing habit taken too far.',
    visualIndicator:
      'Bat stops below front shoulder height rather than finishing over it.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
];

function estimateFastPitchPhaseSegments(
  duration: number,
): Array<{ phase: string; label: string; start_time: number; end_time: number; key_frame_time: number; is_estimated: boolean; sport_id: 'softball_fast' }> {
  return FAST_PITCH_PHASE_SEQUENCE.map((phase, idx) => {
    const def = FAST_PITCH_PHASE_DEFINITIONS[phase];
    const startPct = def.estimated_pct_of_swing;
    const nextPct =
      idx < FAST_PITCH_PHASE_SEQUENCE.length - 1
        ? FAST_PITCH_PHASE_DEFINITIONS[FAST_PITCH_PHASE_SEQUENCE[idx + 1]].estimated_pct_of_swing
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
      sport_id: 'softball_fast' as const,
    };
  });
}

export function runFastPitchAnalysis(input: SportAnalysisInput): SportSwingAnalysis {
  const metrics = deriveFastPitchMetrics(input);

  const detectedIssues: SportDetectedIssue[] = [];
  for (const rule of FAST_PITCH_ISSUE_RULES) {
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
        sport_id: 'softball_fast',
      });
    }
  }

  const severityOrder = { critical: 0, notable: 1, minor: 2, watch: 3 };
  detectedIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const primaryIssue = detectedIssues[0] ?? null;

  const drillRecommendations = FAST_PITCH_DRILLS.filter(
    (drill) =>
      drill.issue_id !== null &&
      detectedIssues.some((issue) => issue.id === drill.issue_id),
  ).slice(0, 5);

  const phaseSegments = estimateFastPitchPhaseSegments(input.metadata.duration_seconds);

  const baseScore = 65;
  const deduction = detectedIssues.reduce((acc, issue) => {
    const weights = { critical: 15, notable: 8, minor: 4, watch: 1 };
    return acc + weights[issue.severity];
  }, 0);
  const overallScore = Math.max(10, Math.min(100, baseScore - deduction));

  const now = new Date().toISOString();

  return {
    id: `softball_fast_analysis_${Date.now()}`,
    sport_id: 'softball_fast',
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
