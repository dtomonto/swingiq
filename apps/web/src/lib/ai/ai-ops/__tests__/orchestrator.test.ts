import { describe, it, expect } from '@jest/globals';
import { normalizeEvidence } from '../normalize';
import { runAnalysisPipeline, type AnalysisRequest, type OrchestratorDeps } from '../orchestrator';
import { loadAIConfig } from '../model-config';
import {
  NormalizedAnalysisEvidenceSchema,
  type CoachSynthesis,
  type MeasurementResult,
  type Observation,
  type VideoIntakeResult,
} from '../schemas';
import type {
  AIProviderRegistry,
  CoachProvider,
  MeasurementProvider,
  NarrativeProvider,
  VideoIntakeProvider,
} from '../types';

const NOW = () => '2026-01-01T00:00:00Z';

// ── builders ───────────────────────────────────────────────
function intake(overrides: Partial<VideoIntakeResult> = {}): VideoIntakeResult {
  return {
    schemaVersion: '1.0.0',
    provider: 'gemini',
    model: 'gemini-x',
    videoId: 'v1',
    sportDetected: 'golf',
    cameraAngle: 'face-on',
    inputQuality: 'good',
    bodyVisibility: 'full',
    movementType: 'full swing',
    phases: [],
    timestamps: [],
    observations: [
      obs({ claim: 'Out-to-in path through impact', confidence: 0.6, claimType: 'directly_observed' }),
    ],
    risks: [],
    uncertainties: [],
    confidence: 0.6,
    ...overrides,
  };
}

function obs(o: Partial<Observation> = {}): Observation {
  return {
    claim: 'claim',
    evidence: 'visible in frames',
    confidence: 0.6,
    claimType: 'directly_observed',
    sportRelevance: 'affects ball flight',
    ...o,
  };
}

function measurement(overrides: Partial<MeasurementResult> = {}): MeasurementResult {
  return {
    provider: 'mediapipe',
    modelOrMethod: 'mediapipe-pose-2d',
    landmarks: null,
    derivedMetrics: [
      {
        name: 'shoulder_turn_range',
        value: 84,
        unit: 'deg',
        source: 'mediapipe',
        method: 'on-device pose',
        confidence: 0.5,
        precision: 'estimated',
        limitations: '2D proxy',
      },
    ],
    frameMetrics: [],
    phaseMetrics: [],
    confidence: 0.5,
    warnings: ['Single-camera 2D pose proxies — directional, not lab-grade.'],
    sourceFrames: [],
    ...overrides,
  };
}

const VALID_COACH: CoachSynthesis = {
  summary: 's',
  quickRead: 'q',
  whatISee: 'w',
  primaryFault: 'out-to-in path',
  oneFix: 'fix',
  whyItMatters: 'why',
  practicePlan: 'plan',
  retestProtocol: 'retest',
  confidence: 0.6,
  evidenceUsed: ['Out-to-in path through impact'],
  safetyDisclaimer: 'Not medical advice.',
  limitations: ['single-camera estimate'],
};

// ── fake providers (conform to the interfaces, no network) ──
function fakeRegistry(opts: {
  intakeResult?: VideoIntakeResult | null;
  measureResult?: MeasurementResult | null;
  coachResult?: CoachSynthesis | null;
  narrativeResult?: string | null;
  coachThrows?: boolean;
  narrative?: NarrativeProvider | null;
} = {}): AIProviderRegistry {
  const t = (stage: string, provider: string) => ({
    stage: stage as never,
    provider: provider as never,
    model: null,
    promptVersion: null,
    startedAt: NOW(),
    completedAt: NOW(),
    latencyMs: 5,
    inputTokens: null,
    outputTokens: null,
    estimatedCost: 0.01,
    status: 'ok' as const,
    retryCount: 0,
    fallbackUsed: false,
  });

  const videoIntake: VideoIntakeProvider = {
    name: 'gemini',
    async intake() {
      return { result: opts.intakeResult ?? null, trace: t('video_intake', 'gemini') };
    },
  };
  const measure: MeasurementProvider = {
    name: 'mediapipe',
    async measure() {
      return { result: opts.measureResult ?? null, trace: t('measurement', 'mediapipe') };
    },
  };
  const coach: CoachProvider = {
    name: 'openai',
    async synthesize() {
      if (opts.coachThrows) throw new Error('coach exploded');
      return { result: opts.coachResult ?? null, trace: t('coach_synthesis', 'openai') };
    },
  };
  const narrative: NarrativeProvider = {
    name: 'anthropic',
    async narrate() {
      return { result: opts.narrativeResult ?? null, trace: t('premium_narrative', 'anthropic') };
    },
  };

  return {
    videoIntake,
    measurement: measure,
    coach,
    narrative: opts.narrative === undefined ? narrative : opts.narrative,
  };
}

function deps(registry: AIProviderRegistry): OrchestratorDeps {
  return { registry, config: loadAIConfig({}), now: NOW };
}

const REQ: AnalysisRequest = {
  jobId: 'job1',
  userId: 'u1',
  videoId: 'v1',
  videoRef: 'data:video/mp4;base64,AAAA',
  sport: 'golf',
  mode: 'standard',
};

// ============================================================
describe('normalizeEvidence', () => {
  it('merges intake observations + measurement metrics into honest evidence claims', () => {
    const e = normalizeEvidence({ videoIntake: intake(), measurements: measurement() });
    expect(NormalizedAnalysisEvidenceSchema.safeParse(e).success).toBe(true);
    const sources = e.evidenceClaims.map((c) => c.source);
    expect(sources).toContain('video_intake');
    expect(sources).toContain('measurement');
    // estimated proxy must be 'inferred', NEVER 'measured'
    const metricClaim = e.evidenceClaims.find((c) => c.source === 'measurement');
    expect(metricClaim?.supportLevel).toBe('inferred');
  });

  it('rejects below-floor claims instead of passing them to the coach', () => {
    const weak = intake({ observations: [obs({ claim: 'maybe early extension', confidence: 0.05, claimType: 'uncertain' })] });
    const e = normalizeEvidence({ videoIntake: weak, measurements: null });
    expect(e.evidenceClaims).toHaveLength(0);
    expect(e.unsupportedClaimsRejected.join(' ')).toContain('early extension');
  });

  it('flags a conflict when the body is not visible yet measurements exist', () => {
    const e = normalizeEvidence({
      videoIntake: intake({ bodyVisibility: 'none', observations: [] }),
      measurements: measurement(),
    });
    expect(e.conflicts.length).toBeGreaterThan(0);
    // confidence is penalised, never above the contributing inputs
    expect(e.confidenceScore).toBeLessThan(0.5);
  });

  it('records missing stages as limitations and bottoms out confidence with no evidence', () => {
    const e = normalizeEvidence({ videoIntake: null, measurements: null });
    expect(e.evidenceClaims).toHaveLength(0);
    expect(e.confidenceScore).toBeLessThanOrEqual(0.1);
    expect(e.analysisLimitations.join(' ')).toContain('No video-understanding stage');
    expect(e.analysisLimitations.join(' ')).toContain('No measurement stage');
  });
});

// ============================================================
describe('runAnalysisPipeline', () => {
  it('happy path: high-confidence intake + measure + coach → completed with traces for each stage', async () => {
    // Confidence must clear the 0.65 human-review bar to read as "completed".
    const reg = fakeRegistry({
      intakeResult: intake({ confidence: 0.85 }),
      measureResult: measurement({ confidence: 0.75 }),
      coachResult: VALID_COACH,
    });
    const out = await runAnalysisPipeline(REQ, deps(reg));
    expect(out.coach).not.toBeNull();
    expect(out.job.status).toBe('completed');
    expect(out.job.confidenceScore).not.toBeNull();
    const stages = out.traces.map((t) => t.stage);
    expect(stages).toEqual(expect.arrayContaining(['video_intake', 'measurement', 'coach_synthesis']));
    expect(out.job.costEstimate).toBeGreaterThan(0); // rolled up from traces
  });

  it('keyless: every stage null → failed, never throws', async () => {
    const reg = fakeRegistry({ intakeResult: null, measureResult: null, coachResult: null });
    const out = await runAnalysisPipeline(REQ, deps(reg));
    expect(out.coach).toBeNull();
    expect(out.job.status).toBe('failed');
    expect(out.job.failureReason).toBeTruthy();
    expect(out.job.confidenceScore).toBeNull();
  });

  it('skips the coach (no_evidence) when nothing cleared the floor', async () => {
    const reg = fakeRegistry({
      intakeResult: intake({ observations: [obs({ confidence: 0.01, claimType: 'uncertain' })] }),
      measureResult: null,
      coachResult: VALID_COACH, // would succeed, but must not be called
    });
    const out = await runAnalysisPipeline(REQ, deps(reg));
    expect(out.coach).toBeNull();
    const coachTrace = out.traces.find((t) => t.stage === 'coach_synthesis');
    expect(coachTrace?.status).toBe('skipped');
    expect(coachTrace?.errorCode).toBe('no_evidence');
    expect(out.job.status).toBe('failed');
  });

  it('low blended confidence but a coach report → needs_review', async () => {
    const reg = fakeRegistry({
      // poor visibility drives confidence under the 0.65 review threshold
      intakeResult: intake({ bodyVisibility: 'poor', inputQuality: 'poor', confidence: 0.4 }),
      measureResult: null,
      coachResult: VALID_COACH,
    });
    const out = await runAnalysisPipeline(REQ, deps(reg));
    expect(out.coach).not.toBeNull();
    expect(out.job.status).toBe('needs_review');
  });

  it('premium narrative runs only in premium mode and never blocks the job', async () => {
    const reg = fakeRegistry({
      intakeResult: intake(),
      measureResult: measurement(),
      coachResult: VALID_COACH,
      narrativeResult: 'polished long-form report',
    });
    const std = await runAnalysisPipeline({ ...REQ, mode: 'standard' }, deps(reg));
    expect(std.narrative).toBeNull();
    expect(std.traces.some((t) => t.stage === 'premium_narrative')).toBe(false);

    const prem = await runAnalysisPipeline({ ...REQ, mode: 'premium' }, deps(reg));
    expect(prem.narrative).toBe('polished long-form report');
    expect(prem.traces.some((t) => t.stage === 'premium_narrative')).toBe(true);
  });

  it('a provider that throws is caught as an error trace, not a crash', async () => {
    const reg = fakeRegistry({ intakeResult: intake(), measureResult: measurement(), coachThrows: true });
    const out = await runAnalysisPipeline(REQ, deps(reg));
    expect(out.coach).toBeNull();
    const coachTrace = out.traces.find((t) => t.stage === 'coach_synthesis');
    expect(coachTrace?.status).toBe('error');
    expect(coachTrace?.errorCode).toBe('stage_threw');
    expect(out.job.status).toBe('failed');
  });
});
