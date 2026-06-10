import { getRecordingGuide, recordingTipsFor, ANGLE_CHECKLIST } from '../recording-guidance';
import { MOTION_SPORTS } from '../taxonomy';

describe('recording guidance', () => {
  it('has a complete guide for every taxonomy sport', () => {
    for (const sport of MOTION_SPORTS) {
      const guide = getRecordingGuide(sport.id);
      expect(guide.sport).toBe(sport.id);
      expect(guide.headline).toBeTruthy();
      expect(guide.bestAngle).toBeTruthy();
      expect(guide.tips.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('falls back to golf for an unknown sport', () => {
    // @ts-expect-error — intentionally invalid id to exercise the fallback.
    expect(getRecordingGuide('quidditch').sport).toBe('golf');
  });

  it('appends a motion-specific note when one exists', () => {
    const base = getRecordingGuide('tennis').tips.length;
    const withServe = recordingTipsFor('tennis', 'serve');
    expect(withServe.length).toBe(base + 1);
    expect(withServe[withServe.length - 1]).toMatch(/serve/i);
  });

  it('returns just the base tips when no motion note applies', () => {
    const base = getRecordingGuide('tennis').tips.length;
    expect(recordingTipsFor('tennis', 'forehand').length).toBe(base);
    expect(recordingTipsFor('tennis', null).length).toBe(base);
  });

  it('ships a non-trivial shared angle checklist with reasons', () => {
    expect(ANGLE_CHECKLIST.length).toBeGreaterThanOrEqual(5);
    for (const item of ANGLE_CHECKLIST) {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.why).toBeTruthy();
    }
  });
});
