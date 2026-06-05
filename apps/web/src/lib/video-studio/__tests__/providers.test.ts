import { mockProvider, buildVtt, buildPoster } from '../providers/mockProvider';
import { getProviderConfigs, resolveProvider, globalMaxCostCents } from '../providers/registry';
import { sampleBrief } from './_factories';

describe('mockProvider', () => {
  const brief = sampleBrief();

  it('is always configured and free', () => {
    expect(mockProvider.isConfigured()).toBe(true);
    expect(mockProvider.maxCostPerJobCents).toBe(0);
  });

  it('generates a placeholder asset with poster, captions, transcript', async () => {
    const result = await mockProvider.generateVideo(brief);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('completed');
    expect(result.estimatedCostCents).toBe(0);
    expect(result.asset?.isPlaceholder).toBe(true);
    expect(result.asset?.poster?.startsWith('data:image/svg+xml')).toBe(true);
    expect(result.asset?.captions.length).toBe(1);
    expect(result.asset?.transcript.length).toBeGreaterThan(0);
    expect(result.asset?.src).toBeUndefined();
  });

  it('supports the job-status lifecycle', async () => {
    const result = await mockProvider.generateVideo(brief);
    const status = await mockProvider.checkJobStatus(result.providerJobId);
    expect(status.status).toBe('completed');
    const parts = await mockProvider.retrieveAsset(result.providerJobId);
    expect(parts).not.toBeNull();
    expect(await mockProvider.cancelJob(result.providerJobId)).toBe(true);
    expect((await mockProvider.checkJobStatus(result.providerJobId)).status).toBe('failed');
  });

  it('builds valid WebVTT + an SVG poster', () => {
    const vtt = buildVtt(brief);
    expect(vtt.startsWith('WEBVTT')).toBe(true);
    expect(vtt).toContain('-->');
    expect(buildPoster(brief).startsWith('data:image/svg+xml')).toBe(true);
  });
});

describe('registry', () => {
  it('reports honest configured status from env', () => {
    const off = getProviderConfigs({});
    expect(off.find((p) => p.id === 'mock')?.configured).toBe(true);
    expect(off.find((p) => p.id === 'runway')?.configured).toBe(false);

    const on = getProviderConfigs({ RUNWAY_API_KEY: 'x' });
    expect(on.find((p) => p.id === 'runway')?.configured).toBe(true);
  });

  it('only marks implemented providers enabled', () => {
    const configs = getProviderConfigs({ RUNWAY_API_KEY: 'x' });
    expect(configs.find((p) => p.id === 'mock')?.enabled).toBe(true);
    expect(configs.find((p) => p.id === 'runway')?.enabled).toBe(false);
  });

  it('resolves to the mock when no real provider is implemented', () => {
    expect(resolveProvider({}).id).toBe('mock');
    expect(resolveProvider({ RUNWAY_API_KEY: 'x' }, 'runway').id).toBe('mock');
  });

  it('defaults the spend budget to $0 and parses overrides', () => {
    expect(globalMaxCostCents({})).toBe(0);
    expect(globalMaxCostCents({ VIDEO_STUDIO_MAX_COST_CENTS: '500' })).toBe(500);
    expect(globalMaxCostCents({ VIDEO_STUDIO_MAX_COST_CENTS: '-5' })).toBe(0);
  });
});
