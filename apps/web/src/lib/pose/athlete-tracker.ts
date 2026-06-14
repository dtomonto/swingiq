// ============================================================
// SwingVantage — Cross-frame Athlete Tracker (L3)
// ------------------------------------------------------------
// Per-frame "pick the biggest/most-central pose" can fragment the track:
// a bystander who is briefly larger or more central steals those frames.
// This maintains stable TRACK identities across frames (greedy centroid
// association, gap-tolerant for short occlusions), scores each track by its
// cumulative athlete-likeness, and returns the single best track's pose per
// frame — so the analysed motion belongs to ONE person from start to finish.
//
// Pure + deterministic (operates on already-detected landmarks) so it is
// unit-tested with synthetic multi-person sequences.
// ============================================================

import type { MultiPersonFrame, PoseFrame, PoseLandmark } from './pose-detection';
import { poseAthleteScore, poseCentroid } from './pose-detection';

export interface AthleteTrackResult {
  /** The primary athlete's pose, one entry per frame it was present. */
  frames: PoseFrame[];
  /** Distinct people tracked across the clip. */
  trackCount: number;
  /** 0–1 — share of pose-bearing frames the primary athlete appears in. */
  primaryCoverage: number;
  /** True when more than one distinct person was tracked. */
  multiplePeople: boolean;
}

export interface TrackerOptions {
  /** Max consecutive missed frames a track can survive (short occlusion). */
  maxGap?: number;
  /** Max centroid distance (normalized) to associate a detection to a track. */
  gate?: number;
}

interface Track {
  id: number;
  lastIdx: number;
  centroid: { x: number; y: number };
  score: number;
  byFrame: Map<number, PoseLandmark[]>;
}

interface Detection {
  lm: PoseLandmark[];
  centroid: { x: number; y: number };
  score: number;
}

/**
 * Track the primary athlete across a multi-person detection sequence.
 * Single-person clips collapse to one track (identical to per-frame selection);
 * multi-person clips lock onto the most athlete-like continuous track.
 */
export function trackPrimaryAthlete(
  seq: MultiPersonFrame[],
  options: TrackerOptions = {},
): AthleteTrackResult {
  const maxGap = options.maxGap ?? 2;
  const gate = options.gate ?? 0.25;
  const tracks: Track[] = [];
  let nextId = 0;

  for (let i = 0; i < seq.length; i++) {
    const detections: Detection[] = [];
    for (const lm of seq[i].people) {
      const centroid = poseCentroid(lm);
      if (centroid) detections.push({ lm, centroid, score: poseAthleteScore(lm) });
    }

    // Candidate (track, detection) pairs within the gate, for still-active tracks.
    const active = tracks.filter((t) => i - t.lastIdx <= maxGap + 1);
    const pairs: Array<{ t: Track; d: Detection; dist: number }> = [];
    for (const t of active) {
      for (const d of detections) {
        const dist = Math.hypot(d.centroid.x - t.centroid.x, d.centroid.y - t.centroid.y);
        if (dist <= gate) pairs.push({ t, d, dist });
      }
    }
    pairs.sort((a, b) => a.dist - b.dist);

    const usedTracks = new Set<number>();
    const usedDetections = new Set<Detection>();
    for (const { t, d } of pairs) {
      if (usedTracks.has(t.id) || usedDetections.has(d)) continue;
      usedTracks.add(t.id);
      usedDetections.add(d);
      t.lastIdx = i;
      t.centroid = d.centroid;
      t.score += d.score;
      t.byFrame.set(i, d.lm);
    }

    // Unmatched detections start new tracks.
    for (const d of detections) {
      if (usedDetections.has(d)) continue;
      tracks.push({ id: nextId++, lastIdx: i, centroid: d.centroid, score: d.score, byFrame: new Map([[i, d.lm]]) });
    }
  }

  // The primary athlete is the track with the highest cumulative athlete score.
  let primary: Track | undefined;
  for (const t of tracks) if (!primary || t.score > primary.score) primary = t;

  const frames: PoseFrame[] = [];
  if (primary) {
    for (let i = 0; i < seq.length; i++) {
      const lm = primary.byFrame.get(i);
      if (lm) frames.push({ timestampSeconds: seq[i].timestampSeconds, personCount: seq[i].people.length, landmarks: lm });
    }
  }

  const poseBearingFrames = seq.filter((f) => f.people.length > 0).length;
  return {
    frames,
    trackCount: tracks.length,
    primaryCoverage: poseBearingFrames > 0 ? frames.length / poseBearingFrames : 0,
    multiplePeople: tracks.length > 1,
  };
}
