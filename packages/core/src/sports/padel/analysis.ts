// ============================================================
// SwingVantage — Padel Analysis Engine
// Heuristic stroke-issue detection for padel video.
// ⚠️ All detections are ESTIMATED — no ML model is running.
//    Confidence values are intentionally conservative (0.28–0.4).
// ============================================================

import type { SportAnalysisInput, SportDetectedIssue, SportSwingAnalysis } from '../types';
import { applyPoseIssues } from '../pose-detection';
import { PADEL_PHASE_SEQUENCE, PADEL_PHASE_DEFINITIONS } from './phases';
import { PADEL_DRILLS } from './drills';

// ──────────────────────────────────────────────────────────────
// Heuristic metrics derived from metadata (no pixel analysis)
// ──────────────────────────────────────────────────────────────

interface PadelHeuristicMetrics {
  duration_seconds: number;
  camera_suitable: boolean;
  appears_full_swing: boolean; // long clips suggest tennis-serve-style overheads
  appears_rushed: boolean;
}

function derivePadelMetrics(input: SportAnalysisInput): PadelHeuristicMetrics {
  const { metadata } = input;
  return {
    duration_seconds: metadata.duration_seconds,
    camera_suitable:
      metadata.camera_angle === 'face_on' ||
      metadata.camera_angle === 'down_the_line' ||
      metadata.camera_angle === 'rear',
    appears_full_swing: metadata.duration_seconds > 2.5,
    appears_rushed: metadata.duration_seconds < 0.9,
  };
}

// ──────────────────────────────────────────────────────────────
// Issue detection rules (padel-specific)
// ──────────────────────────────────────────────────────────────

const PADEL_ISSUE_RULES: Array<{
  issueId: string;
  label: string;
  severity: 'critical' | 'notable' | 'minor' | 'watch';
  affectedPhases: string[];
  description: string;
  likelyCause: string;
  visualIndicator: string;
  detect: (m: PadelHeuristicMetrics) => number;
}> = [
  {
    issueId: 'pd_overhit_smash',
    label: 'Overhitting the Smash',
    severity: 'notable',
    affectedPhases: ['contact', 'preparation'],
    description:
      'Overheads appear to be swung as flat smashes when a controlled bandeja or víbora would hold the net.',
    likelyCause:
      'Trying to end points with power; a tennis-serve habit on the overhead.',
    visualIndicator:
      'Full over-the-shoulder swing on deep or awkward lobs rather than a compact, controlled overhead.',
    detect: (m) => (m.appears_full_swing && m.camera_suitable ? 0.36 : m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'pd_weak_bandeja',
    label: 'Weak / Sitting Bandeja',
    severity: 'notable',
    affectedPhases: ['contact'],
    description:
      'The bandeja appears to lack depth and slice control, sitting up for an easy counter.',
    likelyCause:
      'Square stance, contact behind the body, or no slice brush on the overhead.',
    visualIndicator:
      'Flat, short overhead with a high finish rather than a low, controlled finish toward the target.',
    detect: (m) => (m.camera_suitable ? 0.3 : 0),
  },
  {
    issueId: 'pd_poor_wall_read',
    label: 'Poor Wall / Glass Read',
    severity: 'notable',
    affectedPhases: ['wall_read'],
    description:
      'Balls off the back or side glass appear to be played jammed in the corner rather than with space and balance.',
    likelyCause:
      'Not turning to track the ball into the wall, or crowding the rebound instead of giving it room.',
    visualIndicator:
      'Player is close to the glass at contact with a cramped, hurried swing.',
    detect: (m) => (m.camera_suitable ? 0.3 : 0),
  },
  {
    issueId: 'pd_late_after_wall',
    label: 'Late Contact After the Glass',
    severity: 'notable',
    affectedPhases: ['preparation', 'contact'],
    description:
      'Preparation after the wall read appears late, so contact off the glass is rushed or behind the body.',
    likelyCause:
      'Turning late, or moving the arm before the feet after reading the rebound.',
    visualIndicator:
      'Paddle is still preparing as the ball comes off the glass; contact is jammed or late.',
    detect: (m) => (m.appears_rushed && m.camera_suitable ? 0.34 : m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'pd_poor_lob_depth',
    label: 'Shallow Lob Depth',
    severity: 'minor',
    affectedPhases: ['contact', 'follow_through'],
    description:
      'Lobs appear short, leaving an attackable ball for the net team instead of pushing them back.',
    likelyCause:
      'Short follow-through, no leg lift, or trying to be too precise and under-hitting.',
    visualIndicator:
      'Lob trajectory peaks early and lands mid-court rather than near the back glass.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'pd_volley_error',
    label: 'Unstable Volley',
    severity: 'minor',
    affectedPhases: ['contact'],
    description:
      'Volleys appear to float or lack placement, suggesting an unstable face or too much swing.',
    likelyCause:
      'Open face, winding up instead of blocking, or contact behind the body.',
    visualIndicator:
      'Paddle face opens through contact with a long, loose volley motion.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'pd_no_split_step',
    label: 'Missing or Late Split Step',
    severity: 'notable',
    affectedPhases: ['split_step', 'ready_position'],
    description:
      'Little sign of a timed split step, so the player is slow to chase lobs or react to fast balls.',
    likelyCause:
      'Standing tall between shots; not reading opponent contact.',
    visualIndicator:
      'Feet planted as the ball approaches rather than a small loaded hop on opponent contact.',
    detect: (m) => (m.appears_rushed && m.camera_suitable ? 0.32 : 0),
  },
  {
    issueId: 'pd_bad_court_position',
    label: 'Caught in Mid-Court',
    severity: 'watch',
    affectedPhases: ['recovery', 'ready_position'],
    description:
      'Positioning appears stuck in the transition zone rather than committed to the net or the back.',
    likelyCause:
      'Indecision after an attacking or defensive shot; not moving with the partner.',
    visualIndicator:
      'Player lingers in the middle of the court instead of holding the net line or defending deep.',
    detect: (m) => (m.camera_suitable ? 0.26 : 0),
  },
];

// ──────────────────────────────────────────────────────────────
// Phase segment estimation (heuristic timing from duration)
// ──────────────────────────────────────────────────────────────

function estimatePadelPhaseSegments(
  duration: number,
): Array<{ phase: string; label: string; start_time: number; end_time: number; key_frame_time: number; is_estimated: boolean; sport_id: 'padel' }> {
  return PADEL_PHASE_SEQUENCE.map((phase, idx) => {
    const def = PADEL_PHASE_DEFINITIONS[phase];
    const startPct = def.estimated_pct_of_swing;
    const nextPct =
      idx < PADEL_PHASE_SEQUENCE.length - 1
        ? PADEL_PHASE_DEFINITIONS[PADEL_PHASE_SEQUENCE[idx + 1]].estimated_pct_of_swing
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
      sport_id: 'padel' as const,
    };
  });
}

// ──────────────────────────────────────────────────────────────
// Main analysis function
// ──────────────────────────────────────────────────────────────

export function runPadelAnalysis(input: SportAnalysisInput): SportSwingAnalysis {
  const metrics = derivePadelMetrics(input);

  const detectedIssues: SportDetectedIssue[] = [];
  for (const rule of PADEL_ISSUE_RULES) {
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
        sport_id: 'padel',
      });
    }
  }

  // P3: pose-derived detections — supersede the metadata guess for the same id.
  applyPoseIssues(detectedIssues, 'padel', input.pose);

  const severityOrder = { critical: 0, notable: 1, minor: 2, watch: 3 };
  detectedIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const primaryIssue = detectedIssues[0] ?? null;

  const drillRecommendations = PADEL_DRILLS.filter(
    (drill) =>
      drill.issue_id !== null &&
      detectedIssues.some((issue) => issue.id === drill.issue_id),
  ).slice(0, 5);

  const phaseSegments = estimatePadelPhaseSegments(input.metadata.duration_seconds);

  const baseScore = 65;
  const deduction = detectedIssues.reduce((acc, issue) => {
    const weights = { critical: 15, notable: 8, minor: 4, watch: 1 };
    return acc + weights[issue.severity];
  }, 0);
  const overallScore = Math.max(10, Math.min(100, baseScore - deduction));

  const now = new Date().toISOString();

  return {
    id: `padel_analysis_${Date.now()}`,
    sport_id: 'padel',
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
