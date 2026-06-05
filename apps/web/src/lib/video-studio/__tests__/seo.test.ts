import { videoObjectSchema, isoDuration } from '../seo';
import { sampleAsset } from './_factories';

describe('isoDuration', () => {
  it('formats seconds as ISO-8601', () => {
    expect(isoDuration(90)).toBe('PT1M30S');
    expect(isoDuration(0)).toBe('PT0M0S');
    expect(isoDuration(125)).toBe('PT2M5S');
  });
});

describe('videoObjectSchema', () => {
  it('emits a VideoObject with no fabricated contentUrl for a placeholder', () => {
    const schema = videoObjectSchema({ asset: sampleAsset({ isPlaceholder: true, src: undefined, mp4Src: undefined }), path: '/video' });
    expect(schema['@type']).toBe('VideoObject');
    expect(schema.contentUrl).toBeUndefined();
    expect(schema.thumbnailUrl).toBeDefined();
    expect(schema.duration).toBe('PT1M0S');
  });

  it('includes contentUrl when real footage exists', () => {
    const schema = videoObjectSchema({ asset: sampleAsset({ mp4Src: 'https://cdn/x.mp4', isPlaceholder: false }), path: '/video' });
    expect(schema.contentUrl).toBe('https://cdn/x.mp4');
  });
});
