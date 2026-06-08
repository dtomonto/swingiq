// ============================================================
// SwingVantage — SwingLab 2.0: WebGL walk math (Phase 4 v2)
// ------------------------------------------------------------
// PURE geometry helpers for the true-WebGL first-person walk. Kept
// free of any `three` import so it stays trivially unit-testable and
// the same numbers can drive a fallback or a future re-build.
//
// The lab is a floor-plan "facility": each station's percentage
// placement (labLayout.ts) maps to a world floor position, and the
// kiosk screens face the entrance (+z) so a visitor reading them is
// always looking square-on. The first-person camera stands a fixed
// distance in front of a kiosk at eye height — walking Next/Prev
// tweens the camera between these poses, travelling across the floor.
// ============================================================

import type { StationAccent } from '@/content/swinglab';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Half-extent (world units) the station footprint is spread across. */
export const LAB_FLOOR_HALF = 9;
/** Camera/standing eye height. */
export const EYE_HEIGHT = 1.55;
/** Vertical centre of a kiosk screen. */
export const PANEL_HEIGHT = 1.4;
/** How far in front of a kiosk the camera stands. */
export const VIEW_DISTANCE = 3.4;

/**
 * Map a floor-plan placement (percent left/top, 0–100, centre = 50)
 * to a world floor position. `left` → x, `top` → z, y is always 0.
 */
export function stationToWorld(p: { left: number; top: number }): Vec3 {
  return {
    x: ((p.left - 50) / 50) * LAB_FLOOR_HALF,
    y: 0,
    z: ((p.top - 50) / 50) * LAB_FLOOR_HALF,
  };
}

export interface CameraPose {
  /** Where the camera stands. */
  eye: Vec3;
  /** The point it looks at (the centre of the kiosk screen). */
  target: Vec3;
}

/**
 * First-person pose for standing in front of a station. Kiosks face the
 * entrance (+z), so the viewing spot is `VIEW_DISTANCE` in +z, at eye
 * height, looking back at the screen centre.
 */
export function viewingPose(pos: Vec3): CameraPose {
  return {
    eye: { x: pos.x, y: EYE_HEIGHT, z: pos.z + VIEW_DISTANCE },
    target: { x: pos.x, y: PANEL_HEIGHT, z: pos.z },
  };
}

/**
 * The "suggested journey" as world-space floor points, for drawing a
 * glowing path on the 3D floor (mirrors the Map view's journey line).
 * Skips any id missing from the layout; `y` lifts it just off the floor.
 */
export function journeyWorldPath(
  ids: string[],
  layout: Record<string, { left: number; top: number }>,
  y = 0.06,
): Vec3[] {
  const out: Vec3[] = [];
  for (const id of ids) {
    const place = layout[id];
    if (!place) continue;
    const w = stationToWorld(place);
    out.push({ x: w.x, y, z: w.z });
  }
  return out;
}

/**
 * Vivid accent hex per station accent, matching the Tailwind `-400`
 * shades used elsewhere in the lab so the 3D world stays on-brand.
 */
export const ACCENT_HEX: Record<StationAccent, number> = {
  emerald: 0x34d399,
  cyan: 0x22d3ee,
  violet: 0xa78bfa,
  sky: 0x38bdf8,
  amber: 0xfbbf24,
  rose: 0xfb7185,
  teal: 0x2dd4bf,
  indigo: 0x818cf8,
  lime: 0xa3e635,
  orange: 0xfb923c,
};

/** A numeric color (0xRRGGBB) as a `#rrggbb` CSS string. */
export function hexToCss(hex: number): string {
  return `#${(hex & 0xffffff).toString(16).padStart(6, '0')}`;
}

/** Smooth in/out easing for camera travel between stations. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Clamp helper. */
export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}
