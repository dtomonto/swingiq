// ============================================================
// SwingIQ — Canvas Overlay Generator
// Converts EstimatedPoseLandmarks into drawable overlay data.
// All overlays include the "Estimated" badge.
// ============================================================

import type { EstimatedPoseLandmarks, SwingOverlayData, OverlayLine, NormalizedPoint } from '@swingiq/core';

// ──────────────────────────────────────────────────────────────
// Color tokens (match Tailwind golf palette)
// ──────────────────────────────────────────────────────────────

const COLORS = {
  skeleton:      'rgba(34, 197, 94, 0.8)',   // golf-fairway green
  joint:         'rgba(255, 255, 255, 0.9)', // white
  plane:         'rgba(251, 191, 36, 0.7)',   // amber/gold
  shaft:         'rgba(96, 165, 250, 0.85)',  // sky blue
  warning:       'rgba(248, 113, 113, 0.8)', // red
  label_bg:      'rgba(0, 0, 0, 0.65)',
  label_text:    '#ffffff',
  estimated_bg:  'rgba(202, 138, 4, 0.85)',  // golf-gold
};

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function line(
  from: NormalizedPoint | null,
  to: NormalizedPoint | null,
  color: string,
  width = 2,
  dashed = false,
): OverlayLine | null {
  if (!from || !to) return null;
  return { from: { x: from.x, y: from.y }, to: { x: to.x, y: to.y }, color, width, dashed };
}

// ──────────────────────────────────────────────────────────────
// Main overlay generator
// ──────────────────────────────────────────────────────────────

export function generateOverlay(
  landmarks: EstimatedPoseLandmarks | null,
  currentTime: number,
): SwingOverlayData {
  if (!landmarks) {
    return {
      timestamp: currentTime,
      landmarks: null,
      lines: [],
      arcs: [],
      labels: [],
      swing_plane_line: null,
      shaft_angle_line: null,
      estimated_badge_visible: false,
    };
  }

  const {
    head,
    left_shoulder, right_shoulder,
    left_hip, right_hip,
    left_knee, right_knee,
    left_ankle, right_ankle,
    left_wrist, right_wrist,
    club_shaft_tip, club_grip,
  } = landmarks;

  // ── Skeleton lines ───────────────────────────────────────────
  const skeletonLines: (OverlayLine | null)[] = [
    // Torso
    line(left_shoulder, right_shoulder, COLORS.skeleton, 2),
    line(left_hip, right_hip, COLORS.skeleton, 2),
    line(left_shoulder, left_hip, COLORS.skeleton, 2),
    line(right_shoulder, right_hip, COLORS.skeleton, 2),
    // Left leg
    line(left_hip, left_knee, COLORS.skeleton, 2),
    line(left_knee, left_ankle, COLORS.skeleton, 2),
    // Right leg
    line(right_hip, right_knee, COLORS.skeleton, 2),
    line(right_knee, right_ankle, COLORS.skeleton, 2),
    // Arms to wrists
    line(left_shoulder, left_wrist, COLORS.skeleton, 1.5),
    line(right_shoulder, right_wrist, COLORS.skeleton, 1.5),
    // Head to shoulders
    line(head, left_shoulder, COLORS.skeleton, 1.5),
    line(head, right_shoulder, COLORS.skeleton, 1.5),
  ];

  // ── Club shaft line ──────────────────────────────────────────
  const shaftLine = line(club_grip, club_shaft_tip, COLORS.shaft, 3);

  // ── Swing plane line (estimated from hip-shoulder geometry) ──
  const swingPlaneLine: OverlayLine | null = (() => {
    if (!left_hip || !right_shoulder) return null;
    // Draw a dashed line suggesting the approximate swing plane
    return {
      from: { x: right_shoulder.x, y: right_shoulder.y },
      to:   { x: left_hip.x + 0.12, y: left_hip.y + 0.15 },
      color: COLORS.plane,
      width: 1.5,
      dashed: true,
    };
  })();

  // ── Labels ───────────────────────────────────────────────────
  const labels = [];

  // "Estimated" badge — always shown when landmarks are displayed
  labels.push({
    position: { x: 0.01, y: 0.97 },
    text: '⚠ Estimated body position',
    color: COLORS.label_text,
    fontSize: 11,
    background: COLORS.estimated_bg,
  });

  // Phase label near the head
  if (head) {
    labels.push({
      position: { x: head.x + 0.06, y: head.y - 0.03 },
      text: 'Head',
      color: COLORS.label_text,
      fontSize: 10,
      background: COLORS.label_bg,
    });
  }

  return {
    timestamp: currentTime,
    landmarks,
    lines: skeletonLines.filter((l): l is OverlayLine => l !== null),
    arcs: [],
    labels,
    swing_plane_line: swingPlaneLine,
    shaft_angle_line: shaftLine,
    estimated_badge_visible: true,
  };
}
