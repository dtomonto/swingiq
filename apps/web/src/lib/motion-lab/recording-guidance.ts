// ============================================================
// SwingVantage — Motion Lab: Recording Guidance
// ------------------------------------------------------------
// Sport-specific "how to film this" guidance + a shared angle-quality
// checklist, shown BEFORE upload so the user captures a clip the
// analysis can actually read. Pure data + selectors (no I/O, no React)
// so it is testable and reusable (capture step, empty states, docs).
//
// This complements the POST-analysis CameraQualityReport (lib/quality):
// guidance prevents bad clips; the quality gate explains them after.
// ============================================================

import type { SportId, MotionTypeId } from './types';

export interface SportRecordingGuide {
  sport: SportId;
  /** Short headline, e.g. "Filming tennis". */
  headline: string;
  /** One-line recommended-angle summary. */
  bestAngle: string;
  /** Ordered, sport-specific filming tips. */
  tips: string[];
  /** Optional extra note keyed by motion id (e.g. padel wall shots). */
  perMotion?: Partial<Record<MotionTypeId, string>>;
}

/** One item in the shared pre-analysis angle checklist. */
export interface AngleCheckItem {
  id: string;
  label: string;
  /** Why it matters — surfaced as a sub-line / tooltip. */
  why: string;
}

// ── Shared angle-quality checklist ────────────────────────────
// Mirrors the signals the post-analysis quality gate scores, phrased as
// pre-flight actions the user can confirm before filming/uploading.

export const ANGLE_CHECKLIST: AngleCheckItem[] = [
  { id: 'full_body', label: 'Full body in frame, head to feet', why: 'Hidden hips, knees, or feet drop the overlays that depend on them.' },
  { id: 'steady', label: 'Camera steady (tripod or propped up)', why: 'Handheld shake and zoom-follow blur the landmarks and skew the path.' },
  { id: 'light', label: 'Even light, uncluttered background', why: 'Low light and busy backgrounds cause missed and jittery joints.' },
  { id: 'one_player', label: 'Only the player in frame', why: 'Extra people in frame can capture the wrong body.' },
  { id: 'implement_visible', label: 'Racquet / paddle / club / bat visible', why: 'Needed to estimate the swing path and contact point.' },
  { id: 'whole_motion', label: 'The whole motion, including contact', why: 'Cutting off the prep or contact removes the phases we read.' },
  { id: 'high_fps', label: '60fps slow-motion if your phone supports it', why: 'Fast contact blurs at 30fps; 60fps sharpens the contact window.' },
];

// ── Sport-specific guides ─────────────────────────────────────

const GUIDES: Record<SportId, SportRecordingGuide> = {
  golf: {
    sport: 'golf',
    headline: 'Filming golf',
    bestAngle: 'Down-the-line (behind, along the target line) or face-on — full swing in view.',
    tips: [
      'Stand far enough back that the club never leaves the frame at the top or finish.',
      'Keep the whole body and the ball in view through impact.',
      'Use 60fps and a steady prop or tripod — driver speed blurs at 30fps.',
    ],
    perMotion: {
      putt: 'For putting, film face-on or from behind low to the ground so the stroke path is visible.',
    },
  },
  tennis: {
    sport: 'tennis',
    headline: 'Filming tennis',
    bestAngle: 'Behind or side-on for groundstrokes; capture the bounce and contact.',
    tips: [
      'Keep the full body and the racquet in frame the entire stroke.',
      'Try to capture the ball bounce through contact so timing is readable.',
      'Use 60fps if available and avoid shaky, zoomed-in follow footage.',
    ],
    perMotion: {
      serve: 'For serves, film from behind or the side and keep the toss and full extension in frame.',
      volley: 'For volleys, move closer but keep both hands, the paddle, and the contact point visible.',
    },
  },
  pickleball: {
    sport: 'pickleball',
    headline: 'Filming pickleball',
    bestAngle: 'Diagonal or side angle that shows the paddle, feet, and the kitchen line.',
    tips: [
      'Keep the full body, paddle, and (when relevant) the kitchen line in frame.',
      'Film dinks, resets, and volleys from a diagonal or side angle, not head-on.',
      'Record several reps in one clip so the analysis has more to read.',
    ],
    perMotion: {
      dink: 'For dinks, a side angle best shows whether contact is out in front and the paddle face is stable.',
      reset: 'For resets, capture the transition zone so the soft block and balance are visible.',
    },
  },
  padel: {
    sport: 'padel',
    headline: 'Filming padel',
    bestAngle: 'An angle that keeps the player, the contact point, and any wall rebound visible.',
    tips: [
      'Keep the player, wall interaction, and contact point in view.',
      'For overheads (bandeja / víbora / smash), keep the full body and the racquet in frame.',
      'Avoid clips where the glass or wall hides the body at contact.',
    ],
    perMotion: {
      groundstroke: 'For wall/glass shots, capture both the rebound off the wall and your contact.',
      bandeja: 'For the bandeja, film side-on so the controlled overhead and shoulder position read clearly.',
      vibora: 'For the víbora, side-on shows the side-spin overhead path best.',
    },
  },
  baseball: {
    sport: 'baseball',
    headline: 'Filming baseball',
    bestAngle: 'Side-on for hitting; open side / behind for throwing and pitching.',
    tips: [
      'Keep the full body and the bat or throwing arm in frame through release/contact.',
      'Film side-on for the swing; capture the stride and contact zone.',
      'Use 60fps — bat and arm speed blur at 30fps.',
    ],
  },
  softball_slow: {
    sport: 'softball_slow',
    headline: 'Filming slow-pitch softball',
    bestAngle: 'Side-on for hitting; open side for throwing.',
    tips: [
      'Keep the full body and bat in frame through the high-arc contact.',
      'Film side-on so the stride and contact point are visible.',
      'Use 60fps and a steady prop or tripod.',
    ],
  },
  softball_fast: {
    sport: 'softball_fast',
    headline: 'Filming fast-pitch softball',
    bestAngle: 'Side-on for hitting; open side for the windmill pitch.',
    tips: [
      'Keep the full body and bat (or full windmill arm circle) in frame.',
      'Film side-on so the stride and contact/release read clearly.',
      'Use 60fps — fast-pitch speed blurs at 30fps.',
    ],
  },
};

/** The recording guide for a sport (falls back to golf for unknown ids). */
export function getRecordingGuide(sport: SportId): SportRecordingGuide {
  return GUIDES[sport] ?? GUIDES.golf;
}

/**
 * The sport tips plus any motion-specific note, ready to render as a list.
 * The motion note (when present) is appended last so it reads as the
 * most-specific advice.
 */
export function recordingTipsFor(sport: SportId, motionType: MotionTypeId | null): string[] {
  const guide = getRecordingGuide(sport);
  const tips = [...guide.tips];
  const note = motionType ? guide.perMotion?.[motionType] : undefined;
  if (note) tips.push(note);
  return tips;
}
