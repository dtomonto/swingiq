// ============================================================
// SwingVantage — Reddit publisher (API, credential-gated)
//
// Submits a self (text) post. Dormant until set:
//   REDDIT_ACCESS_TOKEN   (OAuth token with submit scope)
//   REDDIT_SUBREDDIT      (target subreddit, no "r/")
// Reddit is community-sensitive: only post the discussion-framed Reddit
// variation, respect each subreddit's self-promotion rules, and disclose
// affiliation. SERVER-ONLY.
// ============================================================

import type { GeneratedPost } from '../types';
import { type Publisher, type PublishResult, result } from './types';

const UA = 'web:swingvantage-social:v1 (by /u/swingvantage)';

/** Pure: split the post into a Reddit title + body. Exported for tests. */
export function redditTitleAndBody(text: string): { title: string; body: string } {
  const firstLine = text.split('\n').map((l) => l.trim()).find(Boolean) ?? text.trim();
  const title = firstLine.slice(0, 300);
  return { title, body: text.trim() };
}

export const redditPublisher: Publisher = {
  platform: 'reddit',
  isConfigured() {
    return Boolean(process.env.REDDIT_ACCESS_TOKEN && process.env.REDDIT_SUBREDDIT);
  },
  async publish(post: GeneratedPost): Promise<PublishResult> {
    const token = process.env.REDDIT_ACCESS_TOKEN;
    const sr = process.env.REDDIT_SUBREDDIT;
    if (!token || !sr) {
      return result('reddit', 'not_configured', { detail: 'Set REDDIT_ACCESS_TOKEN and REDDIT_SUBREDDIT.' });
    }
    try {
      const { title, body } = redditTitleAndBody(post.text);
      const form = new URLSearchParams({ sr, kind: 'self', title, text: body, api_type: 'json' });
      const res = await fetch('https://oauth.reddit.com/api/submit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': UA,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form,
      });
      if (!res.ok) return result('reddit', 'error', { detail: `Reddit API ${res.status}.` });
      const data = (await res.json()) as { json?: { data?: { url?: string }; errors?: unknown[] } };
      if (data.json?.errors?.length) {
        return result('reddit', 'error', { detail: 'Reddit rejected the submission (check subreddit rules).' });
      }
      return result('reddit', 'published', { url: data.json?.data?.url });
    } catch (e) {
      return result('reddit', 'error', { detail: e instanceof Error ? e.message : 'Reddit call failed.' });
    }
  },
};
