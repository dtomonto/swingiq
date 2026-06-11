// SignalRadar OS — feed URL safety tests (pure, SSRF guard).

import { isSafeFeedUrl, parseFeedList } from '../feed-url';
import { DEFAULT_CONFIG } from '../config';

describe('isSafeFeedUrl', () => {
  it('accepts public https feeds', () => {
    expect(isSafeFeedUrl('https://example.com/feed')).toBe(true);
    expect(isSafeFeedUrl('https://www.reddit.com/r/golf/search.rss?q=swing')).toBe(true);
  });

  it('rejects non-https', () => {
    expect(isSafeFeedUrl('http://example.com/feed')).toBe(false);
    expect(isSafeFeedUrl('ftp://example.com/feed')).toBe(false);
    expect(isSafeFeedUrl('file:///etc/passwd')).toBe(false);
  });

  it('rejects loopback / private / link-local hosts (SSRF guard)', () => {
    expect(isSafeFeedUrl('https://localhost/feed')).toBe(false);
    expect(isSafeFeedUrl('https://127.0.0.1/feed')).toBe(false);
    expect(isSafeFeedUrl('https://10.0.0.5/feed')).toBe(false);
    expect(isSafeFeedUrl('https://192.168.1.1/feed')).toBe(false);
    expect(isSafeFeedUrl('https://169.254.169.254/latest/meta-data')).toBe(false); // cloud metadata
    expect(isSafeFeedUrl('https://172.16.0.1/feed')).toBe(false);
    expect(isSafeFeedUrl('https://api.internal/feed')).toBe(false);
  });

  it('rejects garbage', () => {
    expect(isSafeFeedUrl('not a url')).toBe(false);
    expect(isSafeFeedUrl('')).toBe(false);
  });
});

describe('parseFeedList', () => {
  it('keeps only safe, de-duplicated feeds from a comma/newline list', () => {
    const list = parseFeedList('https://a.com/feed, http://b.com/feed\nhttps://a.com/feed\nhttps://10.0.0.1/x');
    expect(list).toEqual(['https://a.com/feed']);
  });

  it('returns [] for empty input', () => {
    expect(parseFeedList(undefined)).toEqual([]);
    expect(parseFeedList('')).toEqual([]);
  });
});

describe('config default', () => {
  it('ships with no feed sources (off until configured)', () => {
    expect(DEFAULT_CONFIG.feedSources).toEqual([]);
  });
});
