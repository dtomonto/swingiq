import { assessVisualUncertainty, formatUncertaintyReasons } from '../visual-uncertainty';
import type { AIVisualAnalysis, VisibilityQuality } from '@swingiq/core';

const qa = (quality: VisibilityQuality) => ({ quality, note: 'note' });

interface Over {
  overallConfidence?: number;
  visibilityQuality?: VisibilityQuality;
  cameraAngle?: VisibilityQuality;
  lighting?: VisibilityQuality;
  bodyVisibility?: VisibilityQuality;
  swingVisibility?: VisibilityQuality;
  contactVisible?: boolean;
  fullMotionCaptured?: boolean;
  nextCaptureRecommendation?: string;
}

function makeAnalysis(over: Over = {}): AIVisualAnalysis {
  return {
    summary: 's',
    whatWasClearlyVisible: ['x'],
    strengths: [],
    videoQuality: {
      cameraAngle: qa(over.cameraAngle ?? 'good'),
      lighting: qa(over.lighting ?? 'good'),
      bodyVisibility: qa(over.bodyVisibility ?? 'good'),
      swingVisibility: qa(over.swingVisibility ?? 'good'),
      contactVisible: over.contactVisible ?? true,
      fullMotionCaptured: over.fullMotionCaptured ?? true,
      nextCaptureRecommendation: over.nextCaptureRecommendation ?? 'Move the camera back.',
    },
    detectedPhases: [],
    topPriorities: [
      { issue: 'i', whyItMatters: 'w', evidenceFromVideo: 'e', confidence: 'moderate', correctiveFocus: 'c' },
    ],
    practicePlan: [{ name: 'n', purpose: 'p', repsOrDuration: 'r', howToKnowCorrect: 'h' }],
    nextUpload: { cameraAngle: 'a', framing: 'f', lighting: 'l', distance: 'd', sportNotes: 's' },
    overallConfidence: over.overallConfidence ?? 0.8,
    visibilityQuality: over.visibilityQuality ?? 'good',
    meta: {
      sport: 'golf',
      frameCountAnalyzed: 8,
      provider: 'test',
      model: 'test',
      schemaVersion: '1',
      createdAt: '2026-06-07T00:00:00.000Z',
    },
  };
}

describe('assessVisualUncertainty', () => {
  it('stays quiet on a strong, clear read', () => {
    const u = assessVisualUncertainty(makeAnalysis({ overallConfidence: 0.85, visibilityQuality: 'good' }));
    expect(u.show).toBe(false);
    expect(u.reasons).toHaveLength(0);
  });

  it('does NOT cry wolf when overall is strong despite one limited aspect', () => {
    // A single weak aspect but high overall confidence + good overall visibility
    // should not trigger the prominent banner (the detail section still shows it).
    const u = assessVisualUncertainty(
      makeAnalysis({ overallConfidence: 0.82, visibilityQuality: 'good', bodyVisibility: 'limited' }),
    );
    expect(u.show).toBe(false);
    // …but the reason is still captured for when something else does trigger it.
    expect(u.reasons).toContain("your full body wasn't clearly in frame");
  });

  it('triggers when overall confidence is below 50%', () => {
    const u = assessVisualUncertainty(makeAnalysis({ overallConfidence: 0.4 }));
    expect(u.show).toBe(true);
    expect(u.confidencePct).toBe(40);
  });

  it('triggers when overall visibility is limited or poor', () => {
    expect(assessVisualUncertainty(makeAnalysis({ visibilityQuality: 'limited' })).show).toBe(true);
    expect(assessVisualUncertainty(makeAnalysis({ visibilityQuality: 'poor' })).show).toBe(true);
  });

  it('names the specific limitations (the plan\'s "lower body not visible" case)', () => {
    const u = assessVisualUncertainty(
      makeAnalysis({ visibilityQuality: 'poor', bodyVisibility: 'poor', contactVisible: false }),
    );
    expect(u.show).toBe(true);
    expect(u.reasons).toContain("your full body wasn't clearly in frame");
    expect(u.reasons).toContain("the moment of contact wasn't clearly visible");
  });

  it('uses the model recommendation, falling back when it is blank', () => {
    expect(
      assessVisualUncertainty(makeAnalysis({ visibilityQuality: 'poor', nextCaptureRecommendation: 'Step back 6 feet.' }))
        .recommendation,
    ).toBe('Step back 6 feet.');
    expect(
      assessVisualUncertainty(makeAnalysis({ visibilityQuality: 'poor', nextCaptureRecommendation: '   ' }))
        .recommendation,
    ).toMatch(/down the line/i);
  });

  it('rounds confidence to a whole percentage', () => {
    expect(assessVisualUncertainty(makeAnalysis({ overallConfidence: 0.456 })).confidencePct).toBe(46);
  });
});

describe('formatUncertaintyReasons', () => {
  it('returns empty string for no reasons', () => {
    expect(formatUncertaintyReasons([])).toBe('');
  });
  it('returns a single reason as-is', () => {
    expect(formatUncertaintyReasons(['a'])).toBe('a');
  });
  it('joins the first two reasons with "and" and ignores the rest', () => {
    expect(formatUncertaintyReasons(['a', 'b', 'c'])).toBe('a and b');
  });
});
