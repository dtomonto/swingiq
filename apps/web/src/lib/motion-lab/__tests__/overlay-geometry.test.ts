import {
  frameIndexForTime,
  jointAngle2D,
  overlayJointAngles,
  balanceEstimate,
  balanceVerdict,
  stanceRead,
  leadSide,
  frameVisibility,
  LM,
} from '../overlay-geometry';
import type { MotionLandmark, MotionPoseFrame } from '../types';

// A 33-point frame with every landmark at (0.5, 0.5) and full visibility,
// then selectively overridden by the helper below.
function blankLandmarks(): MotionLandmark[] {
  return Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, v: 1 }));
}

function withPoints(overrides: Record<number, Partial<MotionLandmark>>): MotionLandmark[] {
  const lm = blankLandmarks();
  for (const [idx, p] of Object.entries(overrides)) {
    lm[Number(idx)] = { ...lm[Number(idx)], ...p };
  }
  return lm;
}

describe('frameIndexForTime', () => {
  const frames: MotionPoseFrame[] = [0, 100, 200, 300, 400].map((tMs) => ({ tMs, landmarks: [] }));

  it('returns -1 for an empty track', () => {
    expect(frameIndexForTime([], 50)).toBe(-1);
  });

  it('snaps to the nearest frame', () => {
    expect(frameIndexForTime(frames, 0)).toBe(0);
    expect(frameIndexForTime(frames, 140)).toBe(1); // closer to 100
    expect(frameIndexForTime(frames, 160)).toBe(2); // closer to 200
    expect(frameIndexForTime(frames, 1000)).toBe(4); // past end clamps to last
    expect(frameIndexForTime(frames, -50)).toBe(0); // before start clamps to first
  });

  it('breaks ties toward the earlier frame', () => {
    expect(frameIndexForTime(frames, 150)).toBe(1);
  });
});

describe('jointAngle2D', () => {
  it('measures a right angle', () => {
    const angle = jointAngle2D({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 });
    expect(angle).toBeCloseTo(90, 3);
  });

  it('measures a straight (180°) limb', () => {
    const angle = jointAngle2D({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 });
    expect(angle).toBeCloseTo(180, 3);
  });

  it('returns null on missing or degenerate points', () => {
    expect(jointAngle2D(undefined, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeNull();
    expect(jointAngle2D({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeNull();
  });
});

describe('overlayJointAngles', () => {
  it('returns labelled, confidence-tagged angles for a full frame', () => {
    const angles = overlayJointAngles(blankLandmarks(), 'left');
    expect(angles.length).toBeGreaterThan(0);
    for (const a of angles) {
      expect(a.confidence).toBeCloseTo(1, 3);
      expect(a.id).toBeTruthy();
      expect(a.label).toBeTruthy();
    }
  });

  it('lowers confidence when contributing joints are not visible', () => {
    const lm = withPoints({ [LM.leftKnee]: { v: 0 }, [LM.leftHip]: { v: 0 }, [LM.leftAnkle]: { v: 0 } });
    const angles = overlayJointAngles(lm, 'left');
    const knee = angles.find((a) => a.id === 'lead_knee');
    expect(knee?.confidence).toBeCloseTo(0, 3);
  });

  it('returns nothing for an incomplete frame', () => {
    expect(overlayJointAngles([{ x: 0, y: 0, z: 0, v: 1 }], 'left')).toEqual([]);
  });
});

describe('balanceEstimate', () => {
  it('centres the COM when the body is symmetric', () => {
    const bal = balanceEstimate(blankLandmarks());
    expect(bal).not.toBeNull();
    expect(bal!.com.x).toBeCloseTo(0.5, 3);
    expect(Math.abs(bal!.comOffset)).toBeLessThan(0.01);
    expect(balanceVerdict(bal!.comOffset)).toBe('stable');
  });

  it('detects a COM shifted past the base of support', () => {
    // Feet narrow and to the left; mass shifted right → reaching.
    const lm = withPoints({
      [LM.leftAnkle]: { x: 0.45 }, [LM.rightAnkle]: { x: 0.55 },
      [LM.leftHip]: { x: 0.7 }, [LM.rightHip]: { x: 0.75 },
      [LM.nose]: { x: 0.8 },
    });
    const bal = balanceEstimate(lm)!;
    expect(bal.comOffset).toBeGreaterThan(0.8);
    expect(balanceVerdict(bal.comOffset)).toBe('reaching');
  });

  it('returns null for an incomplete frame', () => {
    expect(balanceEstimate([])).toBeNull();
  });
});

describe('stanceRead', () => {
  it('labels an athletic stance', () => {
    const lm = withPoints({
      [LM.leftAnkle]: { x: 0.4 }, [LM.rightAnkle]: { x: 0.6 },
      [LM.leftHip]: { x: 0.45 }, [LM.rightHip]: { x: 0.55 },
    });
    const s = stanceRead(lm);
    expect(s.label).toBe('athletic');
    expect(s.widthRatio).toBeCloseTo(2, 1);
  });

  it('labels a narrow stance', () => {
    const lm = withPoints({
      [LM.leftAnkle]: { x: 0.49 }, [LM.rightAnkle]: { x: 0.51 },
      [LM.leftHip]: { x: 0.45 }, [LM.rightHip]: { x: 0.55 },
    });
    expect(stanceRead(lm).label).toBe('narrow');
  });
});

describe('leadSide & frameVisibility', () => {
  it('maps handedness to the lead side', () => {
    expect(leadSide('right')).toBe('left');
    expect(leadSide('left')).toBe('right');
    expect(leadSide('unknown')).toBe('left');
  });

  it('averages landmark visibility', () => {
    const frame: MotionPoseFrame = {
      tMs: 0,
      landmarks: [{ x: 0, y: 0, z: 0, v: 0.5 }, { x: 0, y: 0, z: 0, v: 1 }],
    };
    expect(frameVisibility(frame)).toBeCloseTo(0.75, 3);
    expect(frameVisibility(undefined)).toBe(0);
  });
});
