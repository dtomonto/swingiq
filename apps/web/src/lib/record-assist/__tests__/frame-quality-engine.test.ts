import { evaluateFrameQuality } from '../engines/frame-quality-engine';
import { getPreset } from '../engines/sport-preset-engine';
import { LM } from '../engines/landmarks';
import { makeFrame, makeLandmarks, makePose, shiftX, scaleY } from './fixtures';

const golfIron = getPreset('golf', 'iron');

describe('FrameQualityEngine', () => {
  it('detects a well-framed full body', () => {
    const q = evaluateFrameQuality(makeFrame(), golfIron);
    expect(q.personDetected).toBe(true);
    expect(q.fullBodyVisible).toBe(true);
    expect(q.headVisible).toBe('visible');
    expect(q.feetVisible).toBe('visible');
    expect(q.centering).toBe('centered');
    expect(q.distance).toBe('good');
    expect(q.boundingBox).not.toBeNull();
  });

  it('reports no person when pose is null', () => {
    const q = evaluateFrameQuality(makeFrame({ pose: null }), golfIron);
    expect(q.personDetected).toBe(false);
    expect(q.boundingBox).toBeNull();
    expect(q.fullBodyVisible).toBe(false);
    expect(q.centering).toBe('unknown');
    expect(q.distance).toBe('unknown');
  });

  it('flags multiple people', () => {
    const q = evaluateFrameQuality(makeFrame({ pose: makePose(makeLandmarks(), 2) }), golfIron);
    expect(q.personCount).toBe(2);
  });

  it('detects too close (body fills the frame)', () => {
    const lm = scaleY(makeLandmarks(), 2.2); // stretch beyond frame
    const q = evaluateFrameQuality(makeFrame({ pose: makePose(lm) }), golfIron);
    expect(q.distance).toBe('too_close');
  });

  it('detects too far (body is small)', () => {
    const lm = scaleY(makeLandmarks(), 0.4);
    const q = evaluateFrameQuality(makeFrame({ pose: makePose(lm) }), golfIron);
    expect(q.distance).toBe('too_far');
  });

  it('detects off-center left', () => {
    const lm = shiftX(makeLandmarks(), -0.25);
    const q = evaluateFrameQuality(makeFrame({ pose: makePose(lm) }), golfIron);
    expect(q.centering).toBe('left');
  });

  it('detects off-center right', () => {
    const lm = shiftX(makeLandmarks(), 0.25);
    const q = evaluateFrameQuality(makeFrame({ pose: makePose(lm) }), golfIron);
    expect(q.centering).toBe('right');
  });

  it('flags head cut off when head landmarks are not visible', () => {
    const lm = makeLandmarks({
      [LM.NOSE]: { visibility: 0.1 },
      [LM.LEFT_EAR]: { visibility: 0.1 },
      [LM.RIGHT_EAR]: { visibility: 0.1 },
    });
    const q = evaluateFrameQuality(makeFrame({ pose: makePose(lm) }), golfIron);
    expect(q.headVisible).toBe('cut_off');
    expect(q.fullBodyVisible).toBe(false);
  });

  it('flags feet cut off when foot landmarks leave the frame', () => {
    const lm = makeLandmarks({
      [LM.LEFT_ANKLE]: { y: 1.05 }, [LM.RIGHT_ANKLE]: { y: 1.05 },
      [LM.LEFT_HEEL]: { y: 1.06 }, [LM.RIGHT_HEEL]: { y: 1.06 },
      [LM.LEFT_FOOT_INDEX]: { y: 1.08 }, [LM.RIGHT_FOOT_INDEX]: { y: 1.08 },
    });
    const q = evaluateFrameQuality(makeFrame({ pose: makePose(lm) }), golfIron);
    expect(q.feetVisible).toBe('partial');
    expect(q.fullBodyVisible).toBe(false);
  });

  it('warns on low light', () => {
    const q = evaluateFrameQuality(makeFrame({ luma: 0.1 }), golfIron);
    expect(q.lighting).toBe('low');
  });

  it('warns on busy background', () => {
    const q = evaluateFrameQuality(makeFrame({ contrast: 0.5 }), golfIron);
    expect(q.background).toBe('busy');
  });

  it('warns on shaky camera', () => {
    const q = evaluateFrameQuality(makeFrame({ motion: 0.8 }), golfIron);
    expect(q.stability).toBe('shaky');
  });

  it('returns unknown lighting/background/stability when pixels unavailable', () => {
    const q = evaluateFrameQuality(
      makeFrame({ luma: undefined, contrast: undefined, motion: undefined }),
      golfIron,
    );
    expect(q.lighting).toBe('unknown');
    expect(q.background).toBe('unknown');
    expect(q.stability).toBe('unknown');
  });

  it('detects orientation mismatch against the preset', () => {
    // golf iron recommends landscape; the default fixture is portrait.
    const q = evaluateFrameQuality(makeFrame({ orientation: 'portrait' }), golfIron);
    expect(q.orientationMatch).toBe(false);
    const q2 = evaluateFrameQuality(makeFrame({ orientation: 'landscape' }), golfIron);
    expect(q2.orientationMatch).toBe(true);
  });

  it('raises implement risk when a wrist is near the frame edge', () => {
    const lm = makeLandmarks({ [LM.RIGHT_WRIST]: { x: 0.97 } });
    const q = evaluateFrameQuality(makeFrame({ pose: makePose(lm) }), golfIron);
    expect(q.implementRisk).toBe('high');
  });
});
