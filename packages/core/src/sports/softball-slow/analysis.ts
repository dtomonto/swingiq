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
