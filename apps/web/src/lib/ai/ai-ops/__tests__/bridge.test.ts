import { describe, it, expect } from '@jest/globals';
import {
  visionAnalysisToIntakeResult,
  visionAnalysisToCoachSynthesis,
  createBridgedIntakeProvider,
} from '../bridge';
import { runAnalysisPipeline } from '../orchestrator';
import { loadAIConfig } from '../model-config';
import {
  VideoIntakeResultSchema,
  CoachSynthesisSchema,
  type CoachSynthesis,
} from '../schemas';
import type { AIVisualAnalysis } from '@swingiq/core';
import type { AIProviderRegistry, CoachProvider } from '../types';

const NOW = () => '2026-01-01T00:00:00Z';

function visionAnalysis(overrides: Partial<AIVisualAnalysis> = {}): AIVisualAnalysis {
  return {
    summary: 'A repeatable swing with an over-the-top move into impact.',
    whatWasClearlyVisible: ['Setup posture', 'Backswing top', 'Impact region'],
    strengths: [{ strength: 'Stable head', evidenceFromVideo: 'Head stays centered through transition' }],
    videoQuality: {
      cameraAngle: { quality: 'good', note: 'face-on' },
      lighting: { quality: 'good', note: 'even' },
      bodyVisibility: { quality: 'good', note: 'full body in frame' },
      swingVisibility: { quality: 'good', note: 'full swing visible' },
      contactVisible: true,
      fullMotionCaptured: true,
      nextCaptureRecommendation: 'Add a down-the-line angle next time.',
    },
    detectedPhases: [
      { phaseName: 'Backswing', observation: 'Full shoulder turn', confidence: 'high' },
      { phaseName: 'Downswing', observation: 'Steep shaft', confidence: 'moderate' },
    ],
    topPriorities: [
      {
        issue: 'Over-the-top downswing',
        whyItMatters: 'Causes out-to-in path and slices.',
        evidenceFromVideo: 'Club moves outside the hands at the start of the downswing.',
        confidence: 'high',
        correctiveFocus: 'Feel the club drop to the inside on transition.',
      },
    ],
    practicePlan: [
      { name: 'Pump drill', purpose: 'Groove an inside path', repsOrDuration: '3x10', howToKnowCorrect: 'Shaft shallows' },
    ],
    nextUpload: {
      cameraAngle: 'down-the-line',
      framing: 'full body',
      lighting: 'bright',
      distance: '8 feet',
      sportNotes: 'Keep the club visible at the top.',
    },
    overallConfidence: 0.72,
    visibilityQuality: 'good',
    meta: {
      sport: 'golf',
      frameCountAnalyzed: 12,
      provider: 'google',
      model: 'gemini-x',
      schemaVersion: '1.0.0',
      createdAt: '2026-01-01T00:00:00Z',
    },
    ...overrides,
  };
}

describe('visionAnalysisToIntakeResult', () => {
  it('produces schema-valid intake evidence from the frame-vision result', () => {
    const r = visionAnalysisToIntakeResult(visionAnalysis(), 'v1');
    expect(VideoIntakeResultSchema.safeParse(r).success).toBe(true);
    expect(r.provider).toBe('gemini'); // 'google' label → gemini enum
    expect(r.videoId).toBe('v1');
    expect(r.confidence).toBe(0.72);
    // priority + strength + visible elements all surface as observations
    const claims = r.observations.map((o) => o.claim);
    expect(claims).toContain('Over-the-top downswing');
    expect(claims.some((c) => c.startsWith('Strength:'))).toBe(true);
    // vision observations are directly observed (the model saw them)
    expect(r.observations.every((o) => o.claimType === 'directly_observed')).toBe(true);
  });

  it('honestly downgrades bodyVisibility and records uncertainties when visibility is poor', () => {
    const poor = visionAnalysis({
      visibilityQuality: 'poor',
      videoQuality: {
        ...visionAnalysis().videoQuality,
        bodyVisibility: { quality: 'poor', note: 'legs cut off' },
        contactVisible: false,
        fullMotionCaptured: false,
      },
    });
    const r = visionAnalysisToIntakeResult(poor, 'v2');
    expect(r.bodyVisibility).toBe('poor');
    expect(r.inputQuality).toBe('poor');
    expect(r.uncertainties.join(' ')).toContain('Contact');
  });
});

describe('visionAnalysisToCoachSynthesis (deterministic baseline)', () => {
  it('maps the vision result into a schema-valid one-fix/one-plan/one-retest contract', () => {
    const coach = visionAnalysisToCoachSynthesis(visionAnalysis());
    expect(CoachSynthesisSchema.safeParse(coach).success).toBe(true);
    expect(coach.primaryFault).toBe('Over-the-top downswing');
    expect(coach.oneFix).toContain('drop to the inside');
    expect(coach.practicePlan).toContain('Pump drill');
    expect(coach.retestProtocol).toContain('down-the-line');
    expect(coach.evidenceUsed.length).toBeGreaterThan(0);
    expect(coach.safetyDisclaimer).toMatch(/not medical/i);
  });
});

describe('bridged intake drives runAnalysisPipeline (privacy-preserving path)', () => {
  const VALID_COACH: CoachSynthesis = {
    summary: 's', quickRead: 'q', whatISee: 'w', primaryFault: 'over the top', oneFix: 'drop inside',
    whyItMatters: 'path', practicePlan: 'pump', retestProtocol: 'dtl', confidence: 0.72,
    evidenceUsed: ['Club moves outside the hands'], safetyDisclaimer: 'Not medical advice.', limitations: [],
  };

  it('feeds frame-vision evidence through normalize → coach to a completed report', async () => {
    const coach: CoachProvider = {
      name: 'openai',
      async synthesize() {
        return { result: VALID_COACH, trace: { stage: 'coach_synthesis', provider: 'openai', model: null, promptVersion: null, startedAt: NOW(), completedAt: NOW(), latencyMs: 1, inputTokens: null, outputTokens: null, estimatedCost: null, status: 'ok', retryCount: 0, fallbackUsed: false } };
      },
    };
    const registry: AIProviderRegistry = {
      // High vision confidence so the single-stage (vision-only) blend clears the
      // 0.65 review bar; a borderline read would honestly land in needs_review.
      videoIntake: createBridgedIntakeProvider(visionAnalysis({ overallConfidence: 0.85 }), { now: NOW }),
      measurement: null, // pose optional — vision evidence alone is enough here
      coach,
      narrative: null,
    };
    const out = await runAnalysisPipeline(
      { jobId: 'j1', userId: 'u1', videoId: 'v1', videoRef: 'bridged', sport: 'golf', mode: 'standard' },
      { registry, config: loadAIConfig({}), now: NOW },
    );
    expect(out.coach).not.toBeNull();
    expect(out.job.status).toBe('completed');
    // evidence carries the bridged vision observations forward
    expect(out.evidence.evidenceClaims.some((c) => c.source === 'video_intake')).toBe(true);
    expect(out.traces.find((t) => t.stage === 'video_intake')?.provider).toBe('gemini');
  });
});
