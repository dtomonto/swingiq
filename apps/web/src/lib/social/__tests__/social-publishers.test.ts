import { isAutopublishEnabled, channelPublishMode, publishPost } from '../publishers';
import { webhookPayload } from '../publishers/webhook';
import { redditTitleAndBody } from '../publishers/reddit';
import { linkedinPublisher } from '../publishers/linkedin';
import type { GeneratedPost } from '../types';

const post: GeneratedPost = {
  platform: 'linkedin',
  variationType: 'primary',
  text: 'Face angle drives the slice.\n\nFull breakdown: https://swingvantage.com/blog/x?utm_source=linkedin',
  charCount: 90,
  utmUrl: 'https://swingvantage.com/blog/x?utm_source=linkedin',
  hashtags: ['#golf', '#SwingVantage'],
  hookType: 'data',
  ctaType: 'see_breakdown',
  rationale: 'r',
  qualityScore: 88,
  warnings: [],
};

const ENV = process.env;
afterEach(() => {
  delete process.env.SOCIAL_AUTOPUBLISH;
  delete process.env.SOCIAL_PUBLISH_WEBHOOK_URL;
  delete process.env.LINKEDIN_ACCESS_TOKEN;
  delete process.env.LINKEDIN_AUTHOR_URN;
});
afterAll(() => {
  process.env = ENV;
});

describe('autopublish kill-switch', () => {
  it('is off by default and refuses to publish', async () => {
    expect(isAutopublishEnabled()).toBe(false);
    const r = await publishPost(post);
    expect(r.outcome).toBe('not_configured');
    expect(r.detail).toMatch(/off/i);
  });

  it('on but with no publisher configured → not_configured', async () => {
    process.env.SOCIAL_AUTOPUBLISH = 'on';
    const r = await publishPost(post);
    expect(r.outcome).toBe('not_configured');
    expect(r.detail).toMatch(/no publisher/i);
  });
});

describe('routing', () => {
  it('reports none / webhook / direct correctly', () => {
    expect(channelPublishMode('linkedin')).toBe('none');
    process.env.SOCIAL_PUBLISH_WEBHOOK_URL = 'https://hooks.example.com/x';
    expect(channelPublishMode('linkedin')).toBe('webhook');
    process.env.LINKEDIN_ACCESS_TOKEN = 't';
    process.env.LINKEDIN_AUTHOR_URN = 'urn:li:person:1';
    expect(channelPublishMode('linkedin')).toBe('direct'); // direct wins over webhook
  });

  it('publisher isConfigured reflects its env', () => {
    expect(linkedinPublisher.isConfigured()).toBe(false);
    process.env.LINKEDIN_ACCESS_TOKEN = 't';
    process.env.LINKEDIN_AUTHOR_URN = 'urn:li:person:1';
    expect(linkedinPublisher.isConfigured()).toBe(true);
  });
});

describe('pure helpers', () => {
  it('webhookPayload carries the essentials', () => {
    const p = webhookPayload(post);
    expect(p).toMatchObject({ platform: 'linkedin', variation: 'primary', link: post.utmUrl });
    expect(p.hashtags).toEqual(post.hashtags);
  });

  it('redditTitleAndBody pulls a title from the first line', () => {
    const { title, body } = redditTitleAndBody('A real question about slices\n\nMore detail here.');
    expect(title).toBe('A real question about slices');
    expect(body).toContain('More detail here.');
  });
});
