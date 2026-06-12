import { describe, it, expect } from '@jest/globals';
import { loadAIConfig } from '../../model-config';
import { createGeminiVideoIntakeProvider, buildVideoPart, type GeminiRawResult } from '../gemini-intake';
import { testGeminiProvider } from '../gemini-test';
import { VideoIntakeResultSchema } from '../../schemas';
import type { VideoIntakeInput } from '../../types';

const CONFIG = loadAIConfig({ GEMINI_VIDEO_FAST_MODEL: 'gemini-2.5-flash', GEMINI_VIDEO_DEEP_MODEL: 'gemini-2.5-pro' });

const VALID_INTAKE = {
  schemaVersion: '1.0.0',
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  videoId: 'v1',
  sportDetected: 'golf',
  cameraAngle: 'down-the-line',
  inputQuality: 'good',
  bodyVisibility: 'full',
  movementType: 'full swing',
  confidence: 0.7,
  observations: [
    { claim: 'Out-to-in path', evidence: 'club crosses the line at 0:01', confidence: 0.6, claimType: 'inferred', sportRelevance: 'causes a slice' },
  ],
};

const INPUT: VideoIntakeInput = {
  videoId: 'v1',
  videoRef: 'data:video/mp4;base64,AAAAAA==',
  sizeMb: 3,
  declaredSport: 'golf',
  mode: 'standard',
};

describe('buildVideoPart', () => {
  it('routes small data URLs to inline', () => {
    const part = buildVideoPart(INPUT, 20);
    expect(part).toEqual({ inlineData: { mimeType: 'video/mp4', data: 'AAAAAA==' } });
  });
  it('routes a files/ handle to fileData', () => {
    const part = buildVideoPart({ ...INPUT, videoRef: 'files/abc123' }, 20);
    expect(part).toMatchObject({ fileData: { fileUri: 'files/abc123' } });
  });
  it('returns null for an oversized inline clip', () => {
    expect(buildVideoPart({ ...INPUT, sizeMb: 50 }, 20)).toBeNull();
  });
});

describe('Gemini video-intake provider', () => {
  it('returns a schema-valid VideoIntakeResult on success', async () => {
    const provider = createGeminiVideoIntakeProvider({
      config: CONFIG,
      apiKey: 'test-key',
      generate: async () => ({ text: JSON.stringify(VALID_INTAKE) }),
      now: () => '2026-01-01T00:00:00Z',
    });
    const { result, trace } = await provider.intake(INPUT);
    expect(result).not.toBeNull();
    expect(VideoIntakeResultSchema.safeParse(result).success).toBe(true);
    expect(trace.status).toBe('ok');
    expect(trace.provider).toBe('gemini');
  });

  it('repairs an invalid first response (one retry, text-only)', async () => {
    let call = 0;
    const provider = createGeminiVideoIntakeProvider({
      config: CONFIG,
      apiKey: 'test-key',
      generate: async (): Promise<GeminiRawResult> => {
        call += 1;
        return call === 1 ? { text: '{ broken json' } : { text: JSON.stringify(VALID_INTAKE) };
      },
    });
    const { result, trace } = await provider.intake(INPUT);
    expect(result).not.toBeNull();
    expect(trace.retryCount).toBe(1);
    expect(call).toBe(2);
  });

  it('is disabled (null + skipped) with no API key — never fabricates', async () => {
    const provider = createGeminiVideoIntakeProvider({ config: CONFIG, apiKey: undefined });
    const { result, trace } = await provider.intake(INPUT);
    expect(result).toBeNull();
    expect(trace.status).toBe('skipped');
    expect(trace.errorCode).toBe('no_provider');
  });

  it('reports a missing video ref instead of calling the model', async () => {
    let called = false;
    const provider = createGeminiVideoIntakeProvider({
      config: CONFIG,
      apiKey: 'test-key',
      generate: async () => { called = true; return { text: '{}' }; },
    });
    const { result, trace } = await provider.intake({ ...INPUT, videoRef: '' });
    expect(result).toBeNull();
    expect(trace.errorCode).toBe('no_video_ref');
    expect(called).toBe(false);
  });
});

describe('testGeminiProvider (discovery)', () => {
  const listOk = async () => ({
    status: 200,
    json: {
      models: [
        { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-2.5-pro', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] },
      ],
    },
  });

  it('confirms a valid key + available model', async () => {
    const r = await testGeminiProvider('k', 'gemini-2.5-flash', listOk);
    expect(r.keyValid).toBe(true);
    expect(r.modelAvailable).toBe(true);
    expect(r.ok).toBe(true);
    expect(r.availableModels).toEqual(['gemini-2.5-flash', 'gemini-2.5-pro']); // embeddings filtered out
  });

  it('flags a model the account does not have', async () => {
    const r = await testGeminiProvider('k', 'gemini-1.5-flash', listOk);
    expect(r.keyValid).toBe(true);
    expect(r.modelAvailable).toBe(false);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not available/i);
  });

  it('reports an invalid key without throwing', async () => {
    const r = await testGeminiProvider('bad', 'gemini-2.5-flash', async () => ({ status: 400, json: { error: { message: 'API key not valid' } } }));
    expect(r.keyValid).toBe(false);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/rejected the key/i);
  });

  it('honest result when no key is present', async () => {
    const r = await testGeminiProvider(undefined, 'gemini-2.5-flash');
    expect(r.keyPresent).toBe(false);
    expect(r.ok).toBe(false);
  });
});
