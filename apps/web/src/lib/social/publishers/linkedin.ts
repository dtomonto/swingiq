// ============================================================
// SwingVantage — LinkedIn publisher (direct API, credential-gated)
//
// Posts via the LinkedIn UGC API. Dormant until both env vars are set:
//   LINKEDIN_ACCESS_TOKEN   (OAuth token with w_member_social)
//   LINKEDIN_AUTHOR_URN     (urn:li:person:… or urn:li:organization:…)
// SERVER-ONLY.
// ============================================================

import type { GeneratedPost } from '../types';
import { type Publisher, type PublishResult, result } from './types';

function bodyText(post: GeneratedPost): string {
  const tags = post.hashtags.length ? `\n\n${post.hashtags.join(' ')}` : '';
  return `${post.text}${tags}`;
}

export const linkedinPublisher: Publisher = {
  platform: 'linkedin',
  isConfigured() {
    return Boolean(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_AUTHOR_URN);
  },
  async publish(post: GeneratedPost): Promise<PublishResult> {
    const token = process.env.LINKEDIN_ACCESS_TOKEN;
    const author = process.env.LINKEDIN_AUTHOR_URN;
    if (!token || !author) {
      return result('linkedin', 'not_configured', {
        detail: 'Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_AUTHOR_URN.',
      });
    }
    try {
      const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          author,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: bodyText(post) },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
        }),
      });
      if (!res.ok) {
        return result('linkedin', 'error', { detail: `LinkedIn API ${res.status}.` });
      }
      const id = res.headers.get('x-restli-id') ?? undefined;
      return result('linkedin', 'published', {
        id,
        url: id ? `https://www.linkedin.com/feed/update/${id}` : undefined,
      });
    } catch (e) {
      return result('linkedin', 'error', { detail: e instanceof Error ? e.message : 'LinkedIn call failed.' });
    }
  },
};
