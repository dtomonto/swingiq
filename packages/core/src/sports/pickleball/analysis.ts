// ============================================================
// SwingVantage — Pickleball Analysis Engine
// Heuristic stroke-issue detection for pickleball video.
// ⚠️ All detections are ESTIMATED — no ML model is running.
//    Confidence values are intentionally conservative (0.28–0.4).
// ============================================================

import type { SportAnalysisInput, SportDetectedIssue, SportSwingAnalysis } from '../types';
import { PICKLEBALL_PHASE_SEQUENCE, PICKLEBALL_PHASE_DEFINITIONS } from './phases';
import { PICKLEBALL_DRILLS } from './drills';

// ──────────────────────────────────────────────────────────────
// Heuristic metrics derived from metadata (no pixel analysis)
// ──────────────────────────────────────────────────────────────

interface PickleballHeuristicMetrics {
  duration_seconds: number;
  camera_suitable: boolean;
  appears_long_backswing: boolean; // longer clips suggest groundstroke-style loops
  appears_rushed: boolean;         // very short clips suggest no split / late prep
}

function derivePickleballMetrics(input: SportAnalysisInput): PickleballHeuristicMetrics {
  const { metadata } = input;
  return {
    duration_seconds: metadata.duration_seconds,
    camera_suitable:
      metadata.camera_angle === 'face_on' ||
      metadata.camera_angle === 'down_the_line' ||
      metadata.camera_angle === 'rear',
    appears_long_backswing: metadata.duration_seconds > 2.5,
    appears_rushed: metadata.duration_seconds < 0.9,
  };
}

// ──────────────────────────────────────────────────────────────
// Issue detection rules (pickleball-specific)
// ──────────────────────────────────────────────────────────────

const PICKLEBALL_ISSUE_RULES: Array<{
  issueId: string;
  label: string;
  severity: 'critical' | 'notable' | 'minor' | 'watch';
  affectedPhases: string[];
  description: string;
  likelyCause: string;
  visualIndicator: string;
  detect: (m: PickleballHeuristicMetrics) => number;
}> = [
  {
    issueId: 'pb_long_backswing',
    label: 'Backswing Too Long',
    severity: 'notable',
    affectedPhases: ['compact_prep'],
    description:
      'Preparation appears to use a long, tennis-style take-back rather than the compact paddle stroke ' +
      'pickleball requires, which leads to late contact and pop-ups.',
    likelyCause:
      'Carrying a tennis or groundstroke habit into pickleball; trying to generate power with a big swing.',
    visualIndicator:
      'The paddle travels well behind the back hip before coming forward.',
    detect: (m) => (m.appears_long_backswing && m.camera_suitable ? 0.36 : m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'pb_popping_up_dinks',
    label: 'Dinks Popping Up',
    severity: 'notable',
    affectedPhases: ['contact', 'forward_swing'],
    description:
      'Dinks appear to leave the paddle high, sitting up in the attack zone for the opponent.',
    likelyCause:
      'Paddle face too open at contact, or lifting with the wrist instead of the legs.',
    visualIndicator:
      'Paddle face angled upward at contact; ball trajectory rises above net-and-shoulder height.',
    detect: (m) => (m.camera_suitable ? 0.3 : 0),
  },
  {
    issueId: 'pb_open_paddle_face',
    label: 'Unstable / Open Paddle Face',
    severity: 'minor',
    affectedPhases: ['contact'],
    description:
      'The paddle face appears to open or change angle through contact, reducing control over height and depth.',
    likelyCause:
      'Wristy contact, soft grip pressure at the wrong moment, or no set face angle before the ball.',
    visualIndicator:
      'Paddle face angle visibly changes from preparation to contact.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'pb_netting_third_drop',
    label: 'Third-Shot Drop Into the Net',
    severity: 'notable',
    affectedPhases: ['forward_swing', 'contact'],
    description:
      'The drop appears to lack the soft upward arc needed to clear the net and land in the kitchen.',
    likelyCause:
      'Decelerating into the ball, no leg lift, or contacting too far behind the body.',
    visualIndicator:
      'Flat paddle path with no leg drive; ball trajectory peaks past the net rather than before it.',
    detect: (m) => (m.camera_suitable ? 0.3 : 0),
  },
  {
    issueId: 'pb_no_split_step',
    label: 'Missing or Late Split Step',
    severity: 'notable',
    affectedPhases: ['split_step', 'ready_position'],
    description:
      'There is little sign of a timed split step, so the player appears flat-footed and late to the ball.',
    likelyCause:
      'Not reading opponent contact, or standing tall between shots instead of staying loaded.',
    visualIndicator:
      'Feet remain planted as the ball approaches rather than landing a small hop on opponent contact.',
    detect: (m) => (m.appears_rushed && m.camera_suitable ? 0.34 : m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'pb_late_volley',
    label: 'Late Volley Contact',
    severity: 'notable',
    affectedPhases: ['contact'],
    description:
      'Volleys appear to be met beside or behind the body rather than out in front, costing control in fast exchanges.',
    likelyCause:
      'Paddle starting low, reacting late, or winding up instead of meeting the ball early.',
    visualIndicator:
      'Contact point is even with or behind the lead shoulder during volley exchanges.',
    detect: (m) => (m.appears_rushed && m.camera_suitable ? 0.32 : 0),
  },
  {
    issueId: 'pb_driving_long',
    label: 'Drives Sailing Long',
    severity: 'minor',
    affectedPhases: ['contact', 'follow_through'],
    description:
      'Drives appear to leave flat with little topspin, suggesting balls would carry past the baseline.',
    likelyCause:
      'No low-to-high brush for topspin, contact behind the body, or an open face on the drive.',
    visualIndicator:
      'Level-to-upward flat paddle path with a high finish and no spin shape.',
    detect: (m) => (m.camera_suitable ? 0.28 : 0),
  },
  {
    issueId: 'pb_kitchen_footwork',
    label: 'Kitchen-Line Footwork',
    severity: 'watch',
    affectedPhases: ['recovery', 'split_step'],
    description:
      'Movement to and from the non-volley-zone line appears unstructured, leaving the player out of position.',
    likelyCause:
      'Advancing through the transition zone too fast, or not re-establishing the line after a shot.',
    visualIndicator:
      'Player drifts in the mid-court transition zone rather than holding a set position at the line.',
    detect: (m) => (m.camera_suitable ? 0.26 : 0),
  },
  {
    issueId: 'pb_poor_reset',
    label: 'Reset Floating / Too Firm',
    severity: 'minor',
    affectedPhases: ['contact'],
    description:
      'Balls taken under pace from the transition zone appear to rebound off firm hands rather than dying soft in the kitchen.',
    likelyCause:
      'Grip pressure too tight, or punching at the ball instead of absorbing pace.',
    visualIndicator:
      'Paddle stays rigid and the ball springs back deep instead of dropping short.',
    detect: (m) => (m.camera_suitable ? 0.26 : 0),
  },
];

// ──────────────────────────────────────────────────────────────
// Phase segment estimation (heuristic timing from duration)
// ──────────────────────────────────────────────────────────────

function estimatePickleballPhaseSegments(
  duration: number,
): Array<{ phase: string; label: string; start_time: number; end_time: number; key_frame_time: number; is_estimated: boolean; sport_id: 'pickleball' }> {
  return PICKLEBALL_PHASE_SEQUENCE.map((phase, idx) => {
    const def = PICKLEBALL_PHASE_DEFINITIONS[phase];
    const startPct = def.estimated_pct_of_swing;
    const nextPct =
      idx < PICKLEBALL_PHASE_SEQUENCE.length - 1
        ? PICKLEBALL_PHASE_DEFINITIONS[PICKLEBALL_PHASE_SEQUENCE[idx + 1]].estimated_pct_of_swing
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
      sport_id: 'pickleball' as const,
    };
  });
}

// ──────────────────────────────────────────────────────────────
// Main analysis function
// ──────────────────────────────────────────────────────────────

export function runPickleballAnalysis(input: SportAnalysisInput): SportSwingAnalysis {
  const metrics = derivePickleballMetrics(input);

  const detectedIssues: SportDetectedIssue[] = [];
  for (const rule of PICKLEBALL_ISSUE_RULES) {
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
        sport_id: 'pickleball',
      });
    }
  }

  const severityOrder = { critical: 0, notable: 1, minor: 2, watch: 3 };
  detectedIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const primaryIssue = detectedIssues[0] ?? null;

  const drillRecommendations = PICKLEBALL_DRILLS.filter(
    (drill) =>
      drill.issue_id !== null &&
      detectedIssues.some((issue) => issue.id === drill.issue_id),
  ).slice(0, 5);

  const phaseSegments = estimatePickleballPhaseSegments(input.metadata.duration_seconds);

  const baseScore = 65;
  const deduction = detectedIssues.reduce((acc, issue) => {
    const weights = { critical: 15, notable: 8, minor: 4, watch: 1 };
    return acc + weights[issue.severity];
  }, 0);
  const overallScore = Math.max(10, Math.min(100, baseScore - deduction));

  const now = new Date().toISOString();

  return {
    id: `pickleball_analysis_${Date.now()}`,
    sport_id: 'pickleball',
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
