// ============================================================
// SwingIQ — Motion Engine: pose adapter tests
// ------------------------------------------------------------
// The cloud adapter must be OFF by default, validate untrusted
// responses, and NEVER throw — degrading to an honest placeholder.
// ============================================================

import {
  cloudPoseProvider,
  moveNetPoseProvider,
  selectPoseProvider,
  listPoseProviders,
  mockPoseProvider,
} from '..';
import type { PoseEstimateInput } from '../engine';

const INPUT: PoseEstimateInput = {
  frames: [
    { timestampMs: 0, image: 'data:,' },
    { timestampMs: 33, image: 'data:,' },
  ],
  fps: 30,
  schema: 'generic',
};

const ENV_KEY = 'NEXT_PUBLIC_POSE_CLOUD_URL';
const originalFetch = global.fetch;

afterEach(() => {
  delete process.env[ENV_KEY];
  global.fetch = originalFetch;
});

describe('cloudPoseProvider', () => {
  it('is unavailable when no endpoint is configured (private default)', () => {
    delete process.env[ENV_KEY];
    expect(cloudPoseProvider.isAvailable()).toBe(false);
  });

  it('is available once an endpoint is configured', () => {
    process.env[ENV_KEY] = 'https://pose.example.com/infer';
    expect(cloudPoseProvider.isAvailable()).toBe(true);
  });

  it('returns a placeholder (never throws) when the endpoint is unset', async () => {
    delete process.env[ENV_KEY];
    const seq = await cloudPoseProvider.estimate(INPUT);
    expect(seq.basis).toBe('placeholder');
    expect(seq.frames).toHaveLength(0);
    expect(seq.frameCount).toBe(2);
  });

  it('parses a valid response and keeps basis estimated (single-camera)', async () => {
    process.env[ENV_KEY] = 'https://pose.example.com/infer';
    global.fetch = (async () => ({
      ok: true,
      json: async () => ({
        schema: 'movenet_17',
        confidence: 0.7,
        frames: [{ timestampMs: 0, landmarks: [{ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }] }],
      }),
    })) as unknown as typeof fetch;

    const seq = await cloudPoseProvider.estimate(INPUT);
    expect(seq.basis).toBe('estimated'); // a cloud pose is still an estimate, never "measured"
    expect(seq.schema).toBe('movenet_17');
    expect(seq.frames).toHaveLength(1);
    expect(seq.confidence).toBeCloseTo(0.7);
  });

  it('degrades to a placeholder on a non-ok response', async () => {
    process.env[ENV_KEY] = 'https://pose.example.com/infer';
    global.fetch = (async () => ({ ok: false, json: async () => ({}) })) as unknown as typeof fetch;
    const seq = await cloudPoseProvider.estimate(INPUT);
    expect(seq.basis).toBe('placeholder');
  });

  it('degrades to a placeholder when fetch throws', async () => {
    process.env[ENV_KEY] = 'https://pose.example.com/infer';
    global.fetch = (async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;
    const seq = await cloudPoseProvider.estimate(INPUT);
    expect(seq.basis).toBe('placeholder');
  });

  it('rejects a malformed response shape', async () => {
    process.env[ENV_KEY] = 'https://pose.example.com/infer';
    global.fetch = (async () => ({ ok: true, json: async () => ({ frames: 'not-an-array' }) })) as unknown as typeof fetch;
    const seq = await cloudPoseProvider.estimate(INPUT);
    expect(seq.basis).toBe('placeholder');
  });
});

describe('moveNetPoseProvider (placeholder)', () => {
  it('reports unavailable and returns a placeholder', async () => {
    expect(moveNetPoseProvider.isAvailable()).toBe(false);
    const seq = await moveNetPoseProvider.estimate(INPUT);
    expect(seq.basis).toBe('placeholder');
  });
});

describe('selectPoseProvider', () => {
  it('lists every known provider for the admin picker', () => {
    expect(listPoseProviders().map((p) => p.id)).toEqual(
      expect.arrayContaining(['ondevice', 'cloud', 'movenet', 'mock']),
    );
  });

  it('falls back to mock when nothing else can run (no browser, no cloud)', () => {
    delete process.env[ENV_KEY];
    // onDevice needs a browser; in jsdom-less node it is unavailable.
    expect(selectPoseProvider()).toBe(mockPoseProvider);
  });

  it('uses the cloud adapter when configured and forced', () => {
    process.env[ENV_KEY] = 'https://pose.example.com/infer';
    expect(selectPoseProvider('cloud').id).toBe('cloud');
  });
});
