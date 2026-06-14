// ============================================================
// Tests for the cross-frame athlete tracker.
// ============================================================

import { trackPrimaryAthlete } from '../athlete-tracker';
import type { MultiPersonFrame, PoseLandmark } from '../pose-detection';

/** A square "person" of `size`, centred at (cx, cy), all landmarks visible. */
function person(cx: number, cy: number, size: number, vis = 0.9): PoseLandmark[] {
  const h = size / 2;
  return [
    { x: cx - h, y: cy - h, z: 0, visibility: vis },
    { x: cx + h, y: cy - h, z: 0, visibility: vis },
    { x: cx - h, y: cy + h, z: 0, visibility: vis },
    { x: cx + h, y: cy + h, z: 0, visibility: vis },
    { x: cx, y: cy, z: 0, visibility: vis },
  ];
}

const frame = (people: PoseLandmark[][], t: number): MultiPersonFrame => ({ timestampSeconds: t, people });

describe('trackPrimaryAthlete', () => {
  it('returns an empty result for no detections', () => {
    const r = trackPrimaryAthlete([frame([], 0), frame([], 0.1)]);
    expect(r.frames).toHaveLength(0);
    expect(r.trackCount).toBe(0);
    expect(r.multiplePeople).toBe(false);
    expect(r.primaryCoverage).toBe(0);
  });

  it('follows a single athlete across all frames', () => {
    const seq = [0, 1, 2, 3].map((i) => frame([person(0.5 + i * 0.01, 0.5, 0.5)], i * 0.1));
    const r = trackPrimaryAthlete(seq);
    expect(r.frames).toHaveLength(4);
    expect(r.trackCount).toBe(1);
    expect(r.multiplePeople).toBe(false);
    expect(r.primaryCoverage).toBe(1);
  });

  it('locks onto the athlete even when a bystander is briefly more central', () => {
    // Athlete: big, moving steadily left→right across the middle.
    // Bystander: small, lurking near centre for a couple of frames.
    const seq: MultiPersonFrame[] = [
      frame([person(0.3, 0.5, 0.5), person(0.5, 0.2, 0.12)], 0),
      frame([person(0.35, 0.5, 0.5), person(0.5, 0.2, 0.12)], 0.1),
      frame([person(0.4, 0.5, 0.5), person(0.5, 0.2, 0.12)], 0.2),
      frame([person(0.45, 0.5, 0.5), person(0.5, 0.2, 0.12)], 0.3),
    ];
    const r = trackPrimaryAthlete(seq);
    expect(r.trackCount).toBe(2);
    expect(r.multiplePeople).toBe(true);
    expect(r.frames).toHaveLength(4);
    // The chosen pose in each frame should be the BIG athlete (size ~0.5), not
    // the small bystander (size ~0.12).
    for (const f of r.frames) {
      const xs = f.landmarks.map((l) => l.x);
      const width = Math.max(...xs) - Math.min(...xs);
      expect(width).toBeGreaterThan(0.3);
    }
  });

  it('bridges a short occlusion (gap) without splitting the track', () => {
    // Athlete present, then missing for one frame, then back near the same spot.
    const seq: MultiPersonFrame[] = [
      frame([person(0.5, 0.5, 0.5)], 0),
      frame([person(0.51, 0.5, 0.5)], 0.1),
      frame([], 0.2), // occluded
      frame([person(0.52, 0.5, 0.5)], 0.3),
    ];
    const r = trackPrimaryAthlete(seq, { maxGap: 2 });
    expect(r.trackCount).toBe(1); // one identity, not two
    expect(r.frames).toHaveLength(3); // three frames had a pose
  });

  it('counts a far-apart second person as a separate track', () => {
    const seq = [0, 1, 2].map((i) =>
      frame([person(0.2, 0.5, 0.4), person(0.85, 0.5, 0.2)], i * 0.1),
    );
    const r = trackPrimaryAthlete(seq);
    expect(r.trackCount).toBe(2);
    expect(r.multiplePeople).toBe(true);
  });
});
