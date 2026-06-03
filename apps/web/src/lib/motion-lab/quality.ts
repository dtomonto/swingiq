// ============================================================
// SwingIQ — Motion Lab: Camera-Quality Gate
// ------------------------------------------------------------
// A pre-/post-extraction quality assessment so the user knows how much
// to trust the analysis and how to capture better next time. Signals
// are derived honestly from the real pose track and clip metadata —
// where a signal can't be truly measured (e.g. motion blur), it's
// inferred from tracking reliability and clearly labeled.
// ============================================================

import type {
  MotionPoseTrack,
  CaptureContext,
  CameraQualityReport,
  CameraView,
  QualityCheckItem,
  QualityVerdict,
} from './types';

const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_HIP = 23;
const R_HIP = 24;
const L_ANKLE = 27;
const R_ANKLE = 28;
const NOSE = 0;

export interface QualitySourceInput {
  resolution: string;
  durationSeconds: number;
  attemptedFrames: number;
  swingWindowDetected: boolean;
  estimatedFps: number | null;
}

function parseRes(resolution: string): { w: number; h: number } {
  const m = /(\d+)\s*[x×]\s*(\d+)/.exec(resolution);
  if (!m) return { w: 0, h: 0 };
  return { w: Number(m[1]), h: Number(m[2]) };
}

function avgVis(track: MotionPoseTrack, idx: number): number {
  let s = 0;
  let n = 0;
  for (const f of track.frames) {
    const lm = f.landmarks[idx];
    if (lm) {
      s += lm.v;
      n++;
    }
  }
  return n ? s / n : 0;
}

function verdictFrom(score: number): QualityVerdict {
  return score >= 70 ? 'good' : score >= 45 ? 'fair' : 'poor';
}

function inferView(track: MotionPoseTrack, declared: CameraView): CameraView {
  if (declared !== 'unknown') return declared;
  if (track.frames.length === 0) return 'unknown';
  let sw = 0;
  let zs = 0;
  let n = 0;
  for (const f of track.frames) {
    const ls = f.landmarks[L_SHOULDER];
    const rs = f.landmarks[R_SHOULDER];
    if (ls && rs) {
      sw += Math.abs(rs.x - ls.x);
      zs += Math.abs(rs.z - ls.z);
      n++;
    }
  }
  if (n === 0) return 'unknown';
  sw /= n;
  zs /= n;
  const ratio = zs / (sw + 1e-4);
  return ratio > 0.8 ? 'down_the_line' : 'face_on';
}

export function assessQuality(
  track: MotionPoseTrack,
  source: QualitySourceInput,
  capture: CaptureContext,
): CameraQualityReport {
  const posed = track.frames.length;
  const attempted = Math.max(posed, source.attemptedFrames);
  const subjectVisiblePct = attempted > 0 ? Math.round((posed / attempted) * 100) : 0;

  const ankleVis = (avgVis(track, L_ANKLE) + avgVis(track, R_ANKLE)) / 2;
  const headVis = avgVis(track, NOSE);
  const hipVis = (avgVis(track, L_HIP) + avgVis(track, R_HIP)) / 2;
  const fullBodyVisible = ankleVis > 0.45 && hipVis > 0.5;

  const { w, h } = parseRes(source.resolution);
  const minEdge = Math.min(w, h);

  const items: QualityCheckItem[] = [];
  const recommendations: string[] = [];

  // 1. Subject detected
  const detScore = subjectVisiblePct;
  items.push({
    id: 'subject',
    label: 'Subject detected',
    status: verdictFrom(detScore),
    detail: `A body pose was found in ${subjectVisiblePct}% of sampled frames.`,
  });
  if (detScore < 70) recommendations.push('Make the athlete larger in the frame and keep them fully inside it the whole time.');

  // 2. Full body visible
  items.push({
    id: 'fullbody',
    label: 'Full body in frame',
    status: fullBodyVisible ? 'good' : ankleVis > 0.25 ? 'fair' : 'poor',
    detail: fullBodyVisible
      ? 'Head-to-feet appear visible across the motion.'
      : 'Feet/legs were not reliably visible — leg and balance metrics will be lower confidence.',
  });
  if (!fullBodyVisible) recommendations.push('Frame head-to-feet — step back or tilt the camera so the feet stay in view.');

  // 3. Tracking reliability (proxy for lighting + motion blur + occlusion)
  const trackScore = Math.round(track.trackingConfidence * 100);
  items.push({
    id: 'tracking',
    label: 'Tracking reliability',
    status: verdictFrom(trackScore),
    detail: `Average landmark confidence was ${trackScore}/100 (also reflects lighting, blur, and occlusion).`,
  });
  if (trackScore < 55) {
    recommendations.push('Film in brighter, even light and avoid busy backgrounds to reduce blur and occlusion.');
  }

  // 4. Resolution
  const resScore = minEdge >= 720 ? 90 : minEdge >= 480 ? 65 : minEdge > 0 ? 40 : 0;
  items.push({
    id: 'resolution',
    label: 'Resolution',
    status: verdictFrom(resScore),
    detail: minEdge > 0 ? `Source video is ${source.resolution}.` : 'Resolution could not be read.',
  });
  if (resScore < 65 && minEdge > 0) recommendations.push('Record at 720p or higher for sharper landmark tracking.');

  // 5. Frame rate
  const fps = source.estimatedFps;
  const fpsScore = fps == null ? 55 : fps >= 60 ? 90 : fps >= 30 ? 70 : 40;
  items.push({
    id: 'fps',
    label: 'Frame rate',
    status: fps == null ? 'fair' : verdictFrom(fpsScore),
    detail: fps == null ? 'Frame rate unknown (not reported by the file).' : `About ${Math.round(fps)} fps.`,
  });
  if (fps != null && fps < 30) recommendations.push('Use 60 fps slow-motion if your phone supports it — fast motions blur at low frame rates.');

  // 6. Motion window detected
  items.push({
    id: 'window',
    label: 'Motion captured',
    status: source.swingWindowDetected ? 'good' : 'fair',
    detail: source.swingWindowDetected
      ? 'A clear burst of motion (the actual rep) was detected and prioritised.'
      : 'No single clear motion burst was found — trim the clip to just the rep for a sharper analysis.',
  });
  if (!source.swingWindowDetected) recommendations.push('Trim the clip so it’s mostly the rep itself, not long idle setup.');

  // 7. Camera view
  const estimatedView = inferView(track, capture.view);
  items.push({
    id: 'view',
    label: 'Camera angle',
    status: capture.view === 'unknown' ? 'fair' : 'good',
    detail:
      capture.view === 'unknown'
        ? `View not specified — looks like ${estimatedView.replace(/_/g, ' ')} from the pose.`
        : `Declared ${capture.view.replace(/_/g, ' ')}.`,
  });
  if (capture.view === 'unknown') recommendations.push('Tell us the camera angle (face-on or down-the-line) for better rotation reads.');

  // Weighted overall
  const score = Math.round(
    detScore * 0.25 +
      (fullBodyVisible ? 85 : ankleVis > 0.25 ? 55 : 30) * 0.2 +
      trackScore * 0.25 +
      resScore * 0.12 +
      fpsScore * 0.08 +
      (source.swingWindowDetected ? 85 : 55) * 0.1,
  );

  return {
    score,
    verdict: verdictFrom(score),
    analyzable: posed >= 3,
    subjectVisiblePct,
    fullBodyVisible,
    estimatedFps: fps,
    resolution: source.resolution,
    estimatedView,
    items,
    recommendations:
      recommendations.length > 0
        ? recommendations
        : ['Capture looks good — no changes needed. Re-film from the same spot next time for clean comparisons.'],
  };
}
