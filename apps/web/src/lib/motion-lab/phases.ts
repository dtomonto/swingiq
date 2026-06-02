// ============================================================
// SwingIQ — Motion Lab: Phase Detection
// ------------------------------------------------------------
// Segments the clip into the canonical phases for the motion by
// time-warping the phase template onto the REAL motion: the strike
// phase (impact/contact/release) is anchored to the detected peak
// hand-speed frame, and the remaining phases are distributed
// proportionally before and after it.
//
// Output windows are honest ESTIMATES (basis 'estimated'); confidence
// reflects how clear the motion peak and tracking were.
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

/** Piecewise-linear remap of a template fraction (0–1) onto frame space. */
function warp(frac: number, strikeFrac: number, peakFrac: number): number {
  if (frac <= strikeFrac) {
    const t = strikeFrac <= 0 ? 0 : frac / strikeFrac;
    return t * peakFrac;
  }
  const t = strikeFrac >= 1 ? 0 : (frac - strikeFrac) / (1 - strikeFrac);
  return peakFrac + t * (1 - peakFrac);
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
    return template.map((p, i) => ({
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
  const strikeFrac = template[strikeIdx].cumEnd - 0; // boundary at end of strike phase
  // Use the START of the strike phase as the anchor fraction for the peak.
  const strikeStartFrac = strikeIdx === 0 ? 0 : template[strikeIdx - 1].cumEnd;
  const anchorFrac = (strikeStartFrac + template[strikeIdx].cumEnd) / 2;

  const peakFrac = series ? series.peakFrame / lastFrame : 0.72;
  // Clear peak ⇒ higher confidence; if peak sits at the very edges, lower it.
  const peakClarity = series
    ? 1 - Math.min(1, Math.abs(peakFrac - 0.72) / 0.5)
    : 0.4;
  const baseConfidence = Math.round((0.4 + 0.6 * peakClarity) * track.trackingConfidence * 100) / 100;

  const boundaryFrame = (frac: number): number =>
    Math.round(warp(frac, anchorFrac, peakFrac) * lastFrame);

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
      confidence: i === strikeIdx ? Math.min(0.95, baseConfidence + 0.1) : baseConfidence,
      basis,
      interpretation: p.read,
    });
    prevEnd = endFrame + 1 > lastFrame ? lastFrame : endFrame;
  }

  return segments;
}

export { findStrikeIndex };
