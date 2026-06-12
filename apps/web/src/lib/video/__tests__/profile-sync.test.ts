import { buildProfileVideoAnalysis } from '../profile-sync';
import type { AIVisualAnalysis, VisibilityQuality } from '@swingiq/core';

const qa = (quality: VisibilityQuality) => ({ quality, note: 'note' });

function makeAnalysis(over: Partial<AIVisualAnalysis> = {}): AIVisualAnalysis {
  return {
    summary: 's',
    whatWasClearlyVisible: ['x'],
    strengths: [],
    videoQuality: {
      cameraAngle: qa('good'),
      lighting: qa('good'),
      bodyVisibility: qa('good'),
      swingVisibility: qa('good'),
      contactVisible: true,
      fullMotionCaptured: true,
      nextCaptureRecommendation: 'Move the camera back.',
    },
    detectedPhases: [
      { phaseName: 'load', observation: 'o', confidence: 'high' },
      { phaseName: 'contact', observation: 'o', confidence: 'moderate' },
    ],
    topPriorities: [
      { issue: 'Late hip rotation', whyItMatters: 'w', evidenceFromVideo: 'e', confidence: 'high', correctiveFocus: 'c' },
      { issue: 'Early extension', whyItMatters: 'w', evidenceFromVideo: 'e', confidence: 'moderate', correctiveFocus: 'c' },
    ],
    practicePlan: [{ name: 'n', purpose: 'p', repsOrDuration: 'r', howToKnowCorrect: 'h' }],
    nextUpload: { cameraAngle: 'a', framing: 'f', lighting: 'l', distance: 'd', sportNotes: 's' },
    overallConfidence: 0.8,
    visibilityQuality: 'good',
    meta: {
      sport: 'tennis',
      frameCountAnalyzed: 8,
      provider: 'test',
      model: 'test',
      schemaVersion: '1',
      createdAt: '2026-06-07T00:00:00.000Z',
    },
    ...over,
  };
}

describe('buildProfileVideoAnalysis', () => {
  it('maps an analysis to honest profile metadata + retains the full analysis', () => {
    const analysis = makeAnalysis();
    const row = buildProfileVideoAnalysis({
      sport: 'tennis',
      fileName: 'backhand.mp4',
      declaredCameraAngle: 'side_on',
      analysis,
    });

    expect(row).toEqual({
      session_id: null,
      sport: 'tennis',
      file_name: 'backhand.mp4',
      overall_score: 0, // vision has no swing score — never fabricated
      camera_angle: 'side_on',
      phases_count: 2,
      issues_count: 2,
      primary_issue: 'Late hip rotation',
      analysis, // full analysis persisted on the profile (durable history)
    });
  });

  it('falls back to a sport-labelled name when the file name is blank', () => {
    const row = buildProfileVideoAnalysis({
      sport: 'baseball',
      fileName: '   ',
      analysis: makeAnalysis(),
    });
    expect(row.file_name).toBe('baseball swing');
    expect(row.camera_angle).toBe('');
  });

  it('tolerates an analysis with no detected phases', () => {
    const row = buildProfileVideoAnalysis({
      sport: 'golf',
      analysis: makeAnalysis({ detectedPhases: [] }),
    });
    expect(row.phases_count).toBe(0);
    expect(row.issues_count).toBe(2);
    expect(row.primary_issue).toBe('Late hip rotation');
  });
});
