import { extractJson, coerceResult } from '../ai';

describe('extractJson', () => {
  it('pulls JSON out of prose / markdown fences', () => {
    const raw = 'Sure! Here you go:\n```json\n{"posts":[]}\n```\nHope that helps.';
    expect(extractJson(raw)).toEqual({ posts: [] });
  });

  it('returns null on junk', () => {
    expect(extractJson('not json at all')).toBeNull();
  });
});

describe('coerceResult', () => {
  it('keeps valid posts and drops malformed ones', () => {
    const parsed = {
      posts: [
        { platform: 'linkedin', variation: 'primary', text: 'Good post', hook_type: 'data', cta_type: 'see_breakdown', rationale: 'why' },
        { platform: 'x', variation: 'primary' }, // no text → dropped
        { text: 'orphan' }, // no platform/variation → dropped
      ],
      creative: { videoAngle: '15s demo' },
    };
    const result = coerceResult(parsed)!;
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]).toMatchObject({ platform: 'linkedin', variation: 'primary', hookType: 'data' });
    expect(result.creative?.videoAngle).toBe('15s demo');
  });

  it('returns null when there are no usable posts', () => {
    expect(coerceResult({ posts: [] })).toBeNull();
    expect(coerceResult({})).toBeNull();
    expect(coerceResult('nope')).toBeNull();
  });
});
