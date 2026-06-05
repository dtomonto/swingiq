import { runGenerationJob, assembleAsset } from '../jobs';
import { mockProvider } from '../providers/mockProvider';
import type { VideoProvider, ProviderGenerateResult } from '../providers';
import { sampleBrief } from './_factories';

const brief = sampleBrief();

/** A provider stub for exercising failure / cost paths. */
function stub(over: Partial<VideoProvider> = {}): VideoProvider {
  return {
    id: 'stub',
    label: 'Stub',
    capabilities: ['video'],
    maxCostPerJobCents: 0,
    isConfigured: () => true,
    generateVideo: async (): Promise<ProviderGenerateResult> => ({ ok: true, providerJobId: 'x', status: 'completed', estimatedCostCents: 0, asset: { captions: [], transcript: 't', durationSec: 10, isPlaceholder: true, poster: 'p' } }),
    generateVoiceover: async () => ({ ok: true, durationSec: 10 }),
    generateCaptions: () => ({ src: 's', vtt: 'WEBVTT' }),
    generateThumbnail: () => ({ poster: 'p', thumbnail: 't' }),
    composeVideo: async (p) => p,
    checkJobStatus: async () => ({ status: 'completed', progress: 100 }),
    retrieveAsset: async () => null,
    cancelJob: async () => true,
    ...over,
  };
}

describe('runGenerationJob', () => {
  it('completes via the mock provider and produces a draft asset', async () => {
    const { job, asset } = await runGenerationJob({ brief, opportunityId: brief.opportunityId, provider: mockProvider });
    expect(job.status).toBe('completed');
    expect(asset).toBeDefined();
    expect(asset?.published).toBe(false);
    expect(asset?.lifecycle).toBe('experimental');
    expect(job.history.some((h) => h.status === 'completed')).toBe(true);
  });

  it('refuses to run when cost exceeds the budget (no spend)', async () => {
    const pricey = stub({ maxCostPerJobCents: 1000 });
    const { job, asset } = await runGenerationJob({
      brief,
      opportunityId: brief.opportunityId,
      provider: pricey,
      env: { VIDEO_STUDIO_MAX_COST_CENTS: '0' },
    });
    expect(job.status).toBe('failed');
    expect(job.error).toMatch(/budget/i);
    expect(asset).toBeUndefined();
  });

  it('retries then fails on a throwing provider', async () => {
    const flaky = stub({
      generateVideo: async () => {
        throw new Error('provider down');
      },
    });
    const { job, asset } = await runGenerationJob({
      brief,
      opportunityId: brief.opportunityId,
      provider: flaky,
      maxAttempts: 2,
    });
    expect(job.status).toBe('failed');
    expect(job.attempts).toBe(2);
    expect(job.history.some((h) => h.status === 'retry')).toBe(true);
    expect(asset).toBeUndefined();
  });
});

describe('assembleAsset', () => {
  it('maps provider parts onto a draft asset', () => {
    const asset = assembleAsset(
      brief,
      'opp_1',
      'mock',
      'job_1',
      { captions: [], transcript: 'hi', durationSec: 42, isPlaceholder: true, poster: 'p' },
      new Date('2026-06-05T00:00:00Z'),
    );
    expect(asset.briefId).toBe(brief.id);
    expect(asset.durationSec).toBe(42);
    expect(asset.published).toBe(false);
    expect(asset.aspectRatio).toBe(brief.aspectRatio);
  });
});
