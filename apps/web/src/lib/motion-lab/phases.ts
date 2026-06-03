// ============================================================
// SwingIQ — Motion Lab: Phase Detection
// ------------------------------------------------------------
// Segments the clip into the canonical phases for the motion by
// time-warping the phase template onto the REAL motion using up to TWO
// detected anchors:
//   • the TOP of the backswing (lead-hand reversal), and
//   • the STRIKE (peak hand-speed: impact/contact/release).
// The template is warped piecewise-linearly through whichever anchors
// were found, so backswing and downswing windows track the athlete's
// actual timing instead of a fixed guess. With only the strike anchor
// (no clear top) it degrades to the previous single-anchor behaviour.
//
// Output windows are honest ESTIMATES (basis 'estimated'); confidence
// reflects how clear the anchors and tracking were.
// ============================================================

import type {
  MotionPoseTrack,
  CaptureContext,
  MotionPhaseSegment,
  MotionBasis,
} from './types';
import { getPhaseTemplate, type PhaseTemplate } from './taxonomy';
import type { MotionSeries } from './biomechanics';

const STRIKE_PRIORITY = ['impact', 'contact', 'release'];
// Phases that begin the downswing/forward move — the boundary just before one
// of these is the "top of the backswing".
const DOWNSWING_ONSET = ['transition', 'downswing', 'acceleration', 'accel', 'launch', 'drop', 'prep'];

function findStrikeIndex(template: PhaseTemplate[]): number {
  for (const key of STRIKE_PRIORITY) {
    const i = template.findIndex((p) => p.key === key);
    if (i >= 0) return i;
  }
  // fallback: phase whose window centre is nearest 0.72 of the motion
  let best = 0;
  let bestDist = Infinity;
  template.forEach((p, i) => {
    const start = i === 0 ? 0 : template[i - 1].cumEnd;
    const centre = (start + p.cumEnd) / 2;
    const d = Math.abs(centre - 0.72);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

/** Template fraction of the top-of-backswing boundary (start of the downswing). */
function findTopFraction(template: PhaseTemplate[], strikeIdx: number): number | null {
  for (let i = 1; i < strikeIdx; i++) {
    if (DOWNSWING_ONSET.includes(template[i].key)) {
      return template[i - 1].cumEnd; // boundary just before the forward move
    }
  }
  return null;
}

interface Anchor {
  /** Template fraction (0–1). */
  t: number;
  /** Normalized frame position (0–1). */
  f: number;
}

/** Piecewise-linear remap of a template fraction onto normalized frame space. */
function warpThrough(frac: number, anchors: Anchor[]): number {
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1];
    const b = anchors[i];
    if (frac <= b.t) {
      const span = b.t - a.t;
      const u = span <= 0 ? 0 : (frac - a.t) / span;
      return a.f + u * (b.f - a.f);
    }
  }
  return anchors[anchors.length - 1].f;
}

export function detectPhases(
  track: MotionPoseTrack,
  capture: CaptureContext,
  series: MotionSeries | null,
): MotionPhaseSegment[] {
  const template = getPhaseTemplate(capture.sport, capture.motionType);
  const n = track.frames.length;
  const basis: MotionBasis = 'estimated';

  if (n < 2) {
    return template.map((p) => ({
      key: p.key,
      label: p.label,
      shortLabel: p.short,
      startFrame: 0,
      endFrame: 0,
      startMs: 0,
      endMs: 0,
      keyFrame: 0,
      confidence: 0,
      basis: 'placeholder',
      interpretation: p.read,
    }));
  }

  const lastFrame = n - 1;
  const tMs = (i: number) => track.frames[Math.max(0, Math.min(lastFrame, i))]?.tMs ?? 0;

  const strikeIdx = findStrikeIndex(template);
  // Anchor fraction for the strike = centre of the strike phase.
  const strikeStartFrac = strikeIdx === 0 ? 0 : template[strikeIdx - 1].cumEnd;
  const strikeFrac = (strikeStartFrac + template[strikeIdx].cumEnd) / 2;

  const peakFrac = series ? series.peakFrame / lastFrame : 0.72;

  // Second anchor: the detected top-of-backswing, if both the motion and the
  // template expose one and it sits before the strike.
  const topTemplateFrac = findTopFraction(template, strikeIdx);
  const topFrame = series?.topFrame ?? -1;
  const hasTop =
    topTemplateFrac != null &&
    topFrame > 0 &&
    topFrame < series!.peakFrame &&
    topTemplateFrac < strikeFrac;

  const anchors: Anchor[] = [{ t: 0, f: 0 }];
  if (hasTop) anchors.push({ t: topTemplateFrac!, f: topFrame / lastFrame });
  anchors.push({ t: strikeFrac, f: peakFrac });
  anchors.push({ t: 1, f: 1 });

  // Clear, well-separated anchors ⇒ higher confidence.
  const peakClarity = series ? 1 - Math.min(1, Math.abs(peakFrac - 0.72) / 0.5) : 0.4;
  const anchorBonus = hasTop ? 0.12 : 0;
  const baseConfidence =
    Math.round((0.4 + 0.6 * peakClarity + anchorBonus) * track.trackingConfidence * 100) / 100;

  const boundaryFrame = (frac: number): number =>
    Math.round(warpThrough(frac, anchors) * lastFrame);

  const segments: MotionPhaseSegment[] = [];
  let prevEnd = 0;
  for (let i = 0; i < template.length; i++) {
    const p = template[i];
    const startFrame = i === 0 ? 0 : prevEnd;
    const endFrame = i === template.length - 1 ? lastFrame : Math.max(startFrame, boundaryFrame(p.cumEnd));
    const keyFrame =
      i === strikeIdx && series
        ? series.peakFrame
        : Math.round((startFrame + endFrame) / 2);

    segments.push({
      key: p.key,
      label: p.label,
      shortLabel: p.short,
      startFrame,
      endFrame,
      startMs: tMs(startFrame),
      endMs: tMs(endFrame),
      keyFrame,
      confidence: i === strikeIdx ? Math.min(0.96, baseConfidence + 0.1) : Math.min(0.95, baseConfidence),
      basis,
      interpretation: p.read,
    });
    prevEnd = endFrame + 1 > lastFrame ? lastFrame : endFrame;
  }

  return segments;
}

export { findStrikeIndex, findTopFraction };
