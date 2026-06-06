import { buildUtmUrl, slugifyUtm, socialUtmUrl, blogUrl, SITE_ORIGIN } from '../utm';
import { ALL_PLATFORMS, DEFAULT_PLATFORMS, getPlatformRule, PLATFORM_RULES } from '../platforms';
import { buildHashtags, toHashtag } from '../hashtags';
import type { BlogAnalysis } from '../types';

const analysis: BlogAnalysis = {
  slug: 'how-to-fix-a-golf-slice',
  title: 'How to Fix a Golf Slice',
  url: blogUrl('how-to-fix-a-golf-slice'),
  metaDescription: 'Fix your slice.',
  summary: 'Causes and fixes for a slice.',
  primaryTopic: 'golf slice',
  targetAudience: 'beginners',
  searchIntent: 'how to fix a golf slice',
  keyTakeaways: ['face angle drives start direction'],
  strongestInsight: 'Face angle is ~75% of start direction.',
  emotionalAngle: 'frustration of a weak slice',
  practicalBenefit: 'straighter, longer drives',
  keywords: ['golf slice', 'club path', 'face angle', 'swing fix'],
  recommendedHashtags: ['#golf', 'golf slice'],
  contentCategory: 'Swing Fixes',
  funnelStage: 'awareness',
  primaryAngle: 'problem_solution',
  timeliness: 'evergreen',
  recommendedPlatforms: ['linkedin', 'x'],
};

describe('utm', () => {
  it('slugifies values safely', () => {
    expect(slugifyUtm('Blog Distribution!')).toBe('blog_distribution');
    expect(slugifyUtm('  X / Twitter ')).toBe('x_twitter');
  });

  it('appends utm params without dropping existing query', () => {
    const url = buildUtmUrl('https://swingvantage.com/blog/x?ref=1', {
      source: 'linkedin',
      medium: 'social',
      campaign: 'blog_distribution',
      content: 'linkedin_primary',
    });
    expect(url).toContain('ref=1');
    expect(url).toContain('utm_source=linkedin');
    expect(url).toContain('utm_medium=social');
    expect(url).toContain('utm_content=linkedin_primary');
  });

  it('builds canonical blog urls', () => {
    expect(blogUrl('my-post')).toBe(`${SITE_ORIGIN}/blog/my-post`);
  });

  it('produces a UNIQUE content tag per platform + variation', () => {
    const a = socialUtmUrl('my-post', 'linkedin', 'primary');
    const b = socialUtmUrl('my-post', 'x', 'thread_starter');
    expect(a).toContain('utm_source=linkedin');
    expect(a).toContain('utm_content=linkedin_primary');
    expect(b).toContain('utm_source=x');
    expect(b).toContain('utm_content=x_thread_starter');
    expect(a).not.toBe(b);
  });
});

describe('platforms', () => {
  it('covers all nine channels', () => {
    expect(ALL_PLATFORMS).toHaveLength(9);
    expect(ALL_PLATFORMS).toContain('linkedin');
    expect(ALL_PLATFORMS).toContain('reddit');
  });

  it('defaults to a safe non-empty subset', () => {
    expect(DEFAULT_PLATFORMS.length).toBeGreaterThan(0);
    expect(DEFAULT_PLATFORMS.every((p) => PLATFORM_RULES[p].defaultEnabled)).toBe(true);
  });

  it('enforces X 280 char ceiling', () => {
    expect(getPlatformRule('x').maxChars).toBe(280);
  });
});

describe('hashtags', () => {
  it('formats phrases into clean tags', () => {
    expect(toHashtag('golf slice')).toBe('#GolfSlice');
    expect(toHashtag('golf')).toBe('#golf');
    expect(toHashtag('   ')).toBeNull();
  });

  it('respects each platform max and never returns junk', () => {
    for (const p of ALL_PLATFORMS) {
      const [, max] = getPlatformRule(p).hashtagRange;
      const tags = buildHashtags(analysis, p);
      expect(tags.length).toBeLessThanOrEqual(max);
      expect(tags.every((t) => t.startsWith('#'))).toBe(true);
    }
  });

  it('returns no hashtags for reddit', () => {
    expect(buildHashtags(analysis, 'reddit')).toEqual([]);
  });

  it('includes the branded tag when there is room', () => {
    expect(buildHashtags(analysis, 'instagram')).toContain('#SwingVantage');
  });
});
