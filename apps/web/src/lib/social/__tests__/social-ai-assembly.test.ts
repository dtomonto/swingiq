import { assembleFromAi } from '../generate';
import { analyzeBlogPost } from '../analyze';
import { getPlatformRule } from '../platforms';
import { DEFAULT_OPTIONS } from '../types';
import type { AiResult } from '../ai';
import { BLOG_POSTS } from '@/data/blog-posts';

const post = BLOG_POSTS.find((p) => p.slug === 'how-to-fix-a-golf-slice')!;
const analysis = analyzeBlogPost(post);

// Simulate a partial, imperfect AI response: one good LinkedIn post using the
// {{LINK}} token, one wildly over-limit X post — everything else omitted.
const ai: AiResult = {
  posts: [
    {
      platform: 'linkedin',
      variation: 'primary',
      text: 'Face angle, not your grip, is why the ball slices.\n\nClose the gap to the path and it straightens. {{LINK}}',
      hook_type: 'data',
      cta_type: 'see_breakdown',
      rationale: 'Leads with the counter-intuitive cause.',
    } as never,
    {
      platform: 'x',
      variation: 'primary',
      text: 'word '.repeat(120) + '{{LINK}}',
    } as never,
  ],
  creative: { videoAngle: 'Demo the gate drill in 15s.' },
};

const { posts, creative } = assembleFromAi(post, analysis, DEFAULT_OPTIONS, ai);

describe('assembleFromAi (guardrails over AI output)', () => {
  it('substitutes the tracked link for the {{LINK}} token', () => {
    const li = posts.find((p) => p.platform === 'linkedin' && p.variationType === 'primary')!;
    expect(li.text).not.toContain('{{LINK}}');
    expect(li.text).toContain('utm_source=linkedin');
    expect(li.text).toContain('utm_content=linkedin_primary');
  });

  it('hard-caps an over-limit AI post to the platform ceiling', () => {
    const x = posts.find((p) => p.platform === 'x' && p.variationType === 'primary')!;
    expect(x.text.length).toBeLessThanOrEqual(getPlatformRule('x').maxChars);
  });

  it('gap-fills every platform/variation the AI skipped', () => {
    const expected = DEFAULT_OPTIONS.platforms.reduce(
      (n, p) => n + getPlatformRule(p).variationTypes.length,
      0,
    );
    expect(posts.length).toBe(expected);
  });

  it('always applies our clean hashtags + a real quality score', () => {
    for (const p of posts) {
      expect(p.hashtags.length).toBeLessThanOrEqual(getPlatformRule(p.platform).hashtagRange[1]);
      expect(p.qualityScore).toBeGreaterThanOrEqual(1);
    }
  });

  it('merges AI creative over the deterministic base', () => {
    expect(creative.videoAngle).toBe('Demo the gate drill in 15s.');
    expect(creative.quoteCard).toContain('SwingVantage'); // base field preserved
  });
});
