import { analyzeBlogPost } from '../analyze';
import { scorePost } from '../quality';
import { socialUtmUrl } from '../utm';
import { BLOG_POSTS } from '@/data/blog-posts';

const slicePost = BLOG_POSTS.find((p) => p.slug === 'how-to-fix-a-golf-slice')!;
const analysis = analyzeBlogPost(slicePost);

describe('analyzeBlogPost', () => {
  it('grounds the analysis in the post', () => {
    expect(analysis.url).toContain('/blog/how-to-fix-a-golf-slice');
    expect(analysis.keywords.join(' ')).toMatch(/slice|club path|face angle/i);
    expect(analysis.keyTakeaways.length).toBeGreaterThan(0);
  });

  it('pulls a stat-bearing strongest insight', () => {
    // The post says face angle is ~75–85% of start direction.
    expect(analysis.strongestInsight).toMatch(/\d/);
  });

  it('classifies a "how to fix" post as awareness / problem_solution', () => {
    expect(analysis.funnelStage).toBe('awareness');
    expect(analysis.primaryAngle).toBe('problem_solution');
  });

  it('recommends sensible platforms', () => {
    expect(analysis.recommendedPlatforms).toContain('linkedin');
    expect(analysis.recommendedPlatforms).toContain('x');
  });
});

describe('scorePost', () => {
  it('rewards a specific, linked, well-hooked LinkedIn post', () => {
    const utm = socialUtmUrl(slicePost.slug, 'linkedin', 'primary');
    const text =
      `Most golfers fight a slice for years without knowing the real cause.\n\n` +
      `It isn't your grip — face angle accounts for ~75% of where the ball starts. ` +
      `Close the gap between face and path and the slice softens into a fade.\n\n` +
      `Full breakdown + 3 drills: ${utm}`;
    const { score, warnings } = scorePost(
      { platform: 'linkedin', variationType: 'primary', text, hashtags: ['#golf'], utmUrl: utm },
      analysis,
    );
    expect(score).toBeGreaterThanOrEqual(80);
    expect(warnings).toHaveLength(0);
  });

  it('flags generic, link-less filler', () => {
    const { score, warnings } = scorePost(
      {
        platform: 'linkedin',
        variationType: 'primary',
        text: 'In today’s fast-paced world, dive into our game-changer guide.',
        hashtags: [],
        utmUrl: '',
      },
      analysis,
    );
    expect(score).toBeLessThan(55);
    expect(warnings.join(' ')).toMatch(/link/i);
    expect(warnings.join(' ')).toMatch(/generic|filler/i);
  });

  it('warns when an Instagram caption pastes a raw URL', () => {
    const utm = socialUtmUrl(slicePost.slug, 'instagram', 'primary');
    const { warnings } = scorePost(
      { platform: 'instagram', variationType: 'primary', text: `Fix your slice → ${utm}`, hashtags: ['#golf'], utmUrl: utm },
      analysis,
    );
    expect(warnings.join(' ')).toMatch(/link in bio|clickable/i);
  });

  it('flags an over-limit X post', () => {
    const utm = socialUtmUrl(slicePost.slug, 'x', 'primary');
    const longText = 'word '.repeat(70) + utm; // ~350+ chars
    const { warnings } = scorePost(
      { platform: 'x', variationType: 'primary', text: longText, hashtags: [], utmUrl: utm },
      analysis,
    );
    expect(warnings.join(' ')).toMatch(/limit/i);
  });
});
