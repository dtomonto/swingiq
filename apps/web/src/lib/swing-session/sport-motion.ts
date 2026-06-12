// ============================================================
// SwingVantage — Swing Session: sport → motion mapping
// ------------------------------------------------------------
// Pure helpers that turn a video analyzer's (sport + metadata) into a
// Motion Lab CaptureContext, so a single uploaded swing can drive the
// on-device 3D pose pipeline without the user re-picking a motion type.
//
// Kept dependency-light + pure so it's unit-testable without touching
// MediaPipe or the DOM.
// ============================================================

import type { SportId, SwingVideoMetadata } from '@swingiq/core';
import { getSport, type CameraView, type CaptureContext, type MotionTypeId } from '@/lib/motion-lab';

/**
 * The sensible default motion to analyse per sport when the user only gave us
 * a video (no explicit motion-type choice). These are the most common, most
 * "swing-like" motions — the ones a 3D avatar is most useful for.
 */
const DEFAULT_MOTION: Partial<Record<SportId, MotionTypeId>> = {
  golf: 'iron',
  tennis: 'forehand',
  pickleball: 'drive',
  padel: 'groundstroke',
  baseball: 'hitting',
  softball_slow: 'hitting',
  softball_fast: 'hitting',
};

/**
 * Resolve a valid motion-type id for a sport. Falls back to the sport's first
 * registered motion if the preferred default isn't available — so this never
 * returns an id the taxonomy doesn't know.
 */
export function defaultMotionFor(sport: SportId): MotionTypeId {
  const preferred = DEFAULT_MOTION[sport];
  const config = getSport(sport);
  if (preferred && config.motions.some((m) => m.id === preferred)) return preferred;
  return config.motions[0].id;
}

const KNOWN_VIEWS: readonly CameraView[] = ['face_on', 'down_the_line', 'side', 'rear', 'unknown'];

/** Map a video analyzer camera angle to a Motion Lab CameraView (safe fallback). */
export function cameraViewFor(angle: string | null | undefined): CameraView {
  return KNOWN_VIEWS.includes(angle as CameraView) ? (angle as CameraView) : 'unknown';
}

/** Build the Motion Lab CaptureContext for a video the analyzer just received. */
export function captureContextForVideo(
  sport: SportId,
  metadata: Pick<SwingVideoMetadata, 'camera_angle'>,
): CaptureContext {
  return {
    sport,
    motionType: defaultMotionFor(sport),
    view: cameraViewFor(metadata.camera_angle),
    handedness: 'unknown',
  };
}
