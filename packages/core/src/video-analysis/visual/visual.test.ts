// ============================================================
// SwingIQ — AI Visual Analysis unit tests
// Covers schema validation, sport prompt routing, the provider
// factory, and the strict "not configured" behavior.
// ============================================================

import {
  validateAIResult,
  extractJsonObject,
  attachMeta,
  AIVisualAnalysisResultSchema,
  VisualSportSchema,
  VISUAL_ANALYSIS_SCHEMA_VERSION,
  type AIVisualAnalysisResult,
} from './schema';
import { buildVisionPrompt, SUPPORTED_VISION_SPORTS } from './prompts';
import {
  getVisionProvider,
  dataUrlToFrame,
  DisabledVisionProvider,
  AnthropicVisionProvider,
  OpenAIVisionProvider,
  GoogleVisionProvider,
} from './provider';

// ──────────────────────────────────────────────────────────────
// Fixtures
// ──────────────────────────────────────────────────────────────

function validResult(): AIVisualAnalysisResult {
  return {
    summary: 'A right-handed golfer filmed down the line through a full swing.',
    whatWasClearlyVisible: [
      'Athletic setup posture at address',
      'Full shoulder turn at the top',
      'Balanced finish facing the target',
    ],
    strengths: [
      { strength: 'Balanced finish', evidenceFromVideo: 'Holds a stable finish in the last frames.' },
    ],
    videoQuality: {
      cameraAngle: { quality: 'good', note: 'Roughly down the line.' },
      lighting: { quality: 'good', note: 'Even daylight.' },
      bodyVisibility: { quality: 'excellent', note: 'Whole body in frame.' },
      swingVisibility: { quality: 'good', note: 'Full swing captured.' },
      contactVisible: false,
      fullMotionCaptured: true,
      nextCaptureRecommendation: 'Add a face-on angle next time.',
    },
    detectedPhases: [
      { phaseName: 'setup', observation: 'Neutral spine angle.', confidence: 'high' },
    ],
    topPriorities: [
      {
        issue: 'Early extension through impact',
        whyItMatters: 'It reduces consistency and power.',
        evidenceFromVideo: 'Hips move toward the ball in the mid-swing frames.',
        confidence: 'moderate',
        correctiveFocus: 'Maintain hip depth into the downswing.',
      },
    ],
    practicePlan: [
      {
        name: 'Wall drill',
        purpose: 'Train hips to stay back through impact.',
        repsOrDuration: '3 sets of 10',
        howToKnowCorrect: 'Your seat stays in contact with the wall.',
      },
    ],
    nextUpload: {
      cameraAngle: 'Face on',
      framing: 'Full body with a little headroom',
      lighting: 'Front-lit, avoid backlight',
      distance: 'About 10 feet away',
      sportNotes: 'Capture address through finish.',
    },
    overallConfidence: 0.62,
    visibilityQuality: 'good',
  };
}

// ──────────────────────────────────────────────────────────────
// Schema validation
// ──────────────────────────────────────────────────────────────

describe('validateAIResult', () => {
  test('accepts a well-formed result', () => {
    const res = validateAIResult(JSON.stringify(validResult()));
    expect(res.ok).toBe(true);
  });

  test('extracts JSON wrapped in markdown fences + prose', () => {
    const wrapped = 'Here is the analysis:\n```json\n' + JSON.stringify(validResult()) + '\n```\nThanks!';
    const res = validateAIResult(wrapped);
    expect(res.ok).toBe(true);
  });

  test('rejects non-JSON text (no fabricated analysis)', () => {
    const res = validateAIResult('The swing looks great, keep it up!');
    expect(res.ok).toBe(false);
  });

  test('rejects malformed JSON', () => {
    const res = validateAIResult('{ "summary": "x", ');
    expect(res.ok).toBe(false);
  });

  test('rejects a result missing required fields', () => {
    const bad = validResult() as Partial<AIVisualAnalysisResult>;
    delete bad.topPriorities;
    const res = validateAIResult(JSON.stringify(bad));
    expect(res.ok).toBe(false);
  });

  test('rejects an empty priorities array', () => {
    const bad = validResult();
    bad.topPriorities = [];
    const res = validateAIResult(JSON.stringify(bad));
    expect(res.ok).toBe(false);
  });

  test('defaults strengths to an empty array when omitted', () => {
    const noStrengths = validResult() as Partial<AIVisualAnalysisResult>;
    delete noStrengths.strengths;
    const res = validateAIResult(JSON.stringify(noStrengths));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.strengths).toEqual([]);
  });

  test('accepts evidence-backed strengths', () => {
    const withStrengths = validResult();
    withStrengths.strengths = [
      { strength: 'Balanced finish', evidenceFromVideo: 'Holds a stable finish in the final frames.' },
    ];
    const res = validateAIResult(JSON.stringify(withStrengths));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.strengths).toHaveLength(1);
  });
});

describe('extractJsonObject', () => {
  test('returns null when no object is present', () => {
    expect(extractJsonObject('no json here')).toBeNull();
  });

  test('handles braces inside strings', () => {
    const obj = extractJsonObject('prefix {"a":"}{","b":1} suffix');
    expect(obj).toBe('{"a":"}{","b":1}');
  });
});

describe('attachMeta', () => {
  test('adds provenance with default schema version', () => {
    const result = AIVisualAnalysisResultSchema.parse(validResult());
    const withMeta = attachMeta(result, {
      sport: 'golf',
      frameCountAnalyzed: 12,
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
    });
    expect(withMeta.meta.schemaVersion).toBe(VISUAL_ANALYSIS_SCHEMA_VERSION);
    expect(withMeta.meta.frameCountAnalyzed).toBe(12);
    expect(typeof withMeta.meta.createdAt).toBe('string');
  });
});

// ──────────────────────────────────────────────────────────────
// Sport prompt routing
// ──────────────────────────────────────────────────────────────

describe('buildVisionPrompt', () => {
  test('supports all five sports', () => {
    expect(SUPPORTED_VISION_SPORTS.sort()).toEqual(
      ['baseball', 'golf', 'softball_fast', 'softball_slow', 'tennis'],
    );
  });

  test('routes per sport with distinct, sport-specific prompts', () => {
    const golf = buildVisionPrompt({ sport: 'golf', metadata: { frameCount: 12 } });
    const tennis = buildVisionPrompt({ sport: 'tennis', metadata: { frameCount: 12 } });
    expect(golf.system).toContain('golf swing');
    expect(tennis.system).toContain('tennis stroke');
    expect(golf.system).not.toEqual(tennis.system);
  });

  test('user text reflects frame count and forbids fabrication in system rules', () => {
    const p = buildVisionPrompt({ sport: 'baseball', metadata: { frameCount: 16 } });
    expect(p.userText).toContain('16');
    expect(p.system.toLowerCase()).toContain('do not invent');
  });

  test('requests evidence-backed strengths without inventing praise', () => {
    const p = buildVisionPrompt({ sport: 'golf', metadata: { frameCount: 12 } });
    expect(p.system).toContain('strengths');
    expect(p.system.toLowerCase()).toContain('never invent praise');
  });

  test('includes previous priorities for context without assuming improvement', () => {
    const p = buildVisionPrompt({
      sport: 'golf',
      metadata: { frameCount: 12 },
      previous: { priorities: ['early extension'] },
    });
    expect(p.userText).toContain('early extension');
    expect(p.userText.toLowerCase()).toContain('do not assume improvement');
  });
});

// ──────────────────────────────────────────────────────────────
// Provider factory + disabled behavior
// ──────────────────────────────────────────────────────────────

describe('getVisionProvider', () => {
  test('returns the disabled provider when nothing is configured', () => {
    const provider = getVisionProvider({});
    expect(provider.isConfigured()).toBe(false);
    expect(provider.id).toBe('disabled');
  });

  test('selects Anthropic when configured', () => {
    const provider = getVisionProvider({
      AI_VISION_PROVIDER: 'anthropic',
      ANTHROPIC_API_KEY: 'sk-test',
    });
    expect(provider).toBeInstanceOf(AnthropicVisionProvider);
    expect(provider.isConfigured()).toBe(true);
  });

  test('falls back to AI_PROVIDER and selects OpenAI', () => {
    const provider = getVisionProvider({ AI_PROVIDER: 'openai', OPENAI_API_KEY: 'sk-test' });
    expect(provider).toBeInstanceOf(OpenAIVisionProvider);
    expect(provider.isConfigured()).toBe(true);
  });

  test('selects Google Gemini when configured', () => {
    const provider = getVisionProvider({
      AI_VISION_PROVIDER: 'google',
      GOOGLE_AI_API_KEY: 'key',
    });
    expect(provider).toBeInstanceOf(GoogleVisionProvider);
  });

  test('is disabled when a provider is selected but its key is missing', () => {
    const provider = getVisionProvider({ AI_VISION_PROVIDER: 'anthropic' });
    expect(provider.isConfigured()).toBe(false);
    expect(provider.id).toBe('disabled');
  });

  test('applies AI_VISION_MODEL override', () => {
    const provider = getVisionProvider({
      AI_VISION_PROVIDER: 'anthropic',
      ANTHROPIC_API_KEY: 'sk-test',
      AI_VISION_MODEL: 'claude-opus-4-8',
    });
    expect(provider.model).toBe('claude-opus-4-8');
  });
});

describe('DisabledVisionProvider', () => {
  test('never produces analysis — returns not-configured', async () => {
    const provider = new DisabledVisionProvider();
    const outcome = await provider.analyze();
    expect(outcome.configured).toBe(false);
  });
});

describe('auto self-correction retry', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  // Mock OpenAI's chat-completions response, returning each content in turn.
  function mockOpenAISequence(contents: string[]): () => number {
    let calls = 0;
    global.fetch = (async () => {
      const content = contents[Math.min(calls, contents.length - 1)];
      calls++;
      return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
        status: 200,
      });
    }) as unknown as typeof fetch;
    return () => calls;
  }

  const req = {
    sport: 'golf' as const,
    frames: [{ base64: 'AAAA', mediaType: 'image/jpeg' }],
    metadata: {},
  };

  test('repairs a malformed first response on a second text-only call', async () => {
    const calls = mockOpenAISequence(['not json at all', JSON.stringify(validResult())]);
    const outcome = await new OpenAIVisionProvider('sk-test').analyze(req);
    expect(calls()).toBe(2);
    expect(outcome).toMatchObject({ configured: true, ok: true });
  });

  test('returns a clean error (no fabrication) when the repair also fails', async () => {
    const calls = mockOpenAISequence(['nope', 'still not json']);
    const outcome = await new OpenAIVisionProvider('sk-test').analyze(req);
    expect(calls()).toBe(2);
    expect(outcome).toMatchObject({ configured: true, ok: false });
  });

  test('succeeds without a retry when the first response is valid', async () => {
    const calls = mockOpenAISequence([JSON.stringify(validResult())]);
    const outcome = await new OpenAIVisionProvider('sk-test').analyze(req);
    expect(calls()).toBe(1);
    expect(outcome).toMatchObject({ configured: true, ok: true });
  });

  test('does not retry on an HTTP error', async () => {
    let calls = 0;
    global.fetch = (async () => {
      calls++;
      return new Response('{}', { status: 500 });
    }) as unknown as typeof fetch;
    const outcome = await new OpenAIVisionProvider('sk-test').analyze(req);
    expect(calls).toBe(1);
    expect(outcome).toMatchObject({ configured: true, ok: false });
  });
});

describe('dataUrlToFrame', () => {
  test('parses a valid data URL', () => {
    const frame = dataUrlToFrame('data:image/jpeg;base64,AAAA');
    expect(frame).toEqual({ mediaType: 'image/jpeg', base64: 'AAAA' });
  });

  test('returns null for a non-data URL', () => {
    expect(dataUrlToFrame('https://example.com/x.jpg')).toBeNull();
  });
});

describe('VisualSportSchema', () => {
  test('accepts supported sports and rejects others', () => {
    expect(VisualSportSchema.safeParse('golf').success).toBe(true);
    expect(VisualSportSchema.safeParse('softball_slow').success).toBe(true);
    expect(VisualSportSchema.safeParse('cricket').success).toBe(false);
  });
});
