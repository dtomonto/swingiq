// ============================================================
// SwingIQ — Tennis Analysis Engine
// Heuristic issue detection for tennis swing video.
// ⚠️ All detections are ESTIMATED — no ML model is running.
//    Confidence values are intentionally conservative (0.3–0.55).
// ============================================================

import type { SportAnalysisInput, SportDetectedIssue, SportSwingAnalysis } from '../types';
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

interface TennisIssueRule {
  id: Parameters<typeof Array.prototype.find>[0] extends infer T ? never : string;
  issueId: string;
  label: string;
  severity: 'critical' | 'notable' | 'minor' | 'watch';
  affectedPhases: string[];
  description: string;
  likelyCause: string;
  visualIndicator: string;
  detect: (m: TennisHeuristicMetrics) => number; // 0 = not detected, >0 = confidence
}

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
