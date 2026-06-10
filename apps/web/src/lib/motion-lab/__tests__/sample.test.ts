import { SAMPLE_SPECS, generateSamplePoseTrack, buildSampleSession, isSampleSession } from '../sample';

describe('generateSamplePoseTrack', () => {
  it('produces a well-formed, in-bounds, time-ordered track', () => {
    const track = generateSamplePoseTrack('groundstroke');
    expect(track.frames.length).toBe(28);
    let prev = -1;
    for (const f of track.frames) {
      expect(f.landmarks).toHaveLength(33);
      expect(f.tMs).toBeGreaterThan(prev);
      prev = f.tMs;
      for (const l of f.landmarks) {
        expect(l.x).toBeGreaterThanOrEqual(0);
        expect(l.x).toBeLessThanOrEqual(1);
        expect(l.y).toBeGreaterThanOrEqual(0);
        expect(l.y).toBeLessThanOrEqual(1);
        expect(l.v).toBeGreaterThan(0);
      }
    }
  });

  it('is deterministic', () => {
    const a = generateSamplePoseTrack('overhead');
    const b = generateSamplePoseTrack('overhead');
    expect(a).toEqual(b);
  });

  it('actually moves the hitting wrist (non-degenerate motion)', () => {
    const track = generateSamplePoseTrack('groundstroke');
    const first = track.frames[0].landmarks[16];
    const mid = track.frames[Math.floor(track.frames.length / 2)].landmarks[16];
    const dist = Math.hypot(mid.x - first.x, mid.y - first.y);
    expect(dist).toBeGreaterThan(0.05);
  });
});

describe('buildSampleSession (engine-derived, not hand-authored)', () => {
  it('produces a complete, labelled session for every sample spec', () => {
    for (const spec of SAMPLE_SPECS) {
      const s = buildSampleSession(spec);
      expect(s.id).toBe(`sample-${spec.id}`);
      expect(isSampleSession(s)).toBe(true);
      expect(s.capture.sport).toBe(spec.sport);
      expect(s.capture.motionType).toBe(spec.motion);
      // Engine outputs are present and in range.
      expect(s.phases.length).toBeGreaterThan(0);
      expect(s.metrics.length).toBeGreaterThan(0);
      expect(s.scoreboard.overall).toBeGreaterThanOrEqual(0);
      expect(s.scoreboard.overall).toBeLessThanOrEqual(100);
      expect(s.report.executiveSummary).toBeTruthy();
      expect(Array.isArray(s.report.topFixes)).toBe(true);
      expect(s.drills.immediate).toBeTruthy();
      expect(s.status).toBe('complete');
      // The pose track travels with it so the 3D viewer can replay.
      expect(s.poseTrack.frames.length).toBeGreaterThan(0);
    }
  });

  it('caches: repeated builds return the same object', () => {
    const a = buildSampleSession(SAMPLE_SPECS[0]);
    const b = buildSampleSession(SAMPLE_SPECS[0]);
    expect(a).toBe(b);
  });
});

describe('isSampleSession', () => {
  it('detects the sample id convention and tag', () => {
    expect(isSampleSession({ id: 'sample-x', tags: [] })).toBe(true);
    expect(isSampleSession({ id: 'abc', tags: ['Sample'] })).toBe(true);
    expect(isSampleSession({ id: 'abc', tags: ['other'] })).toBe(false);
    expect(isSampleSession({ id: 'abc', tags: undefined })).toBe(false);
  });
});
