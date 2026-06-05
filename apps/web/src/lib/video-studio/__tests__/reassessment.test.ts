import { reassess } from '../reassessment';
import { sampleAsset, sampleScore } from './_factories';

describe('reassess', () => {
  it('prioritizes adding captions when missing', () => {
    const r = reassess({ asset: sampleAsset({ captions: [] }), score: sampleScore() });
    expect(r.primaryAction).toBe('add_captions');
  });

  it('recommends replacing placeholder footage and flags human review', () => {
    const r = reassess({ asset: sampleAsset({ isPlaceholder: true }), score: sampleScore() });
    expect(r.recommendations.some((x) => x.action === 'replace')).toBe(true);
    expect(r.requiresHuman).toBe(true);
  });

  it('keeps a healthy, fresh, accessible video', () => {
    const r = reassess({ asset: sampleAsset(), score: sampleScore() });
    expect(r.primaryAction).toBe('keep');
    expect(r.requiresHuman).toBe(false);
  });

  it('does not flag low engagement before there is enough data', () => {
    const weak = sampleScore({ engagement: 10, education: 10, conversionContribution: 5, recommendationPriority: 90 });
    const r = reassess({ asset: sampleAsset(), score: weak, hasEnoughData: false });
    expect(r.recommendations.some((x) => x.action === 'new_thumbnail')).toBe(false);
    expect(r.primaryAction).toBe('keep');
  });

  it('flags low engagement once there is enough data', () => {
    const weak = sampleScore({ engagement: 20, education: 20 });
    const r = reassess({ asset: sampleAsset(), score: weak, hasEnoughData: true });
    expect(r.recommendations.some((x) => x.action === 'new_thumbnail' || x.action === 'improve_script')).toBe(true);
  });

  it('recommends retiring deprecated videos', () => {
    const r = reassess({ asset: sampleAsset({ lifecycle: 'deprecated' }), score: sampleScore() });
    expect(r.recommendations.some((x) => x.action === 'retire')).toBe(true);
  });
});
