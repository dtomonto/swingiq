import { generateSocialFallback } from '../generate';
import { getPlatformRule } from '../platforms';
import { BANNED_PHRASES } from '../quality';
import { DEFAULT_OPTIONS } from '../types';
import { BLOG_POSTS } from '@/data/blog-posts';

const slicePost = BLOG_POSTS.find((p) => p.slug === 'how-to-fix-a-golf-slice')!;
const result = generateSocialFallback(slicePost, DEFAULT_OPTIONS);

describe('generateSocialFallback', () => {
  it('returns a complete, keyless generation', () => {
    expect(result.source).toBe('fallback');
    expect(result.posts.length).toBeGreaterThan(0);
    expect(result.creative.quoteCard).toContain('SwingVantage');
    expect(result.schedule.cadence.length).toBeGreaterThan(0);
    expect(result.schedule.bestPlatform).toBeTruthy();
  });

  it('produces the full variation set for each selected platform', () => {
    const expected = DEFAULT_OPTIONS.platforms.reduce(
      (n, p) => n + getPlatformRule(p).variationTypes.length,
      0,
    );
    expect(result.posts.length).toBe(expected);
  });

  it('respects every platform character ceiling', () => {
    for (const post of result.posts) {
      expect(post.text.length).toBeLessThanOrEqual(getPlatformRule(post.platform).maxChars);
      expect(post.qualityScore).toBeGreaterThanOrEqual(1);
      expect(post.qualityScore).toBeLessThanOrEqual(100);
    }
  });

  it('keeps X within 280 incl. link, and includes the link', () => {
    for (const post of result.posts.filter((p) => p.platform === 'x')) {
      expect(post.text.length).toBeLessThanOrEqual(280);
      expect(post.text).toContain('https://swingvantage.com');
    }
  });

  it('never pastes a raw URL into an Instagram caption (link in bio)', () => {
    for (const post of result.posts.filter((p) => p.platform === 'instagram')) {
      expect(/https?:\/\//.test(post.text)).toBe(false);
      expect(post.utmUrl).toContain('utm_source=instagram'); // still tracked separately
    }
  });

  it('writes copy free of banned filler phrases', () => {
    for (const post of result.posts) {
      const lower = post.text.toLowerCase();
      for (const phrase of BANNED_PHRASES) {
        expect(lower.includes(phrase.toLowerCase())).toBe(false);
      }
    }
  });
});
