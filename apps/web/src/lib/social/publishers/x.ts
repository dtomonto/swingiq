// ============================================================
// SwingVantage — X / Twitter publisher (direct API, credential-gated)
//
// Posts via X API v2 (POST /2/tweets) using a user-context OAuth 2.0
// bearer token. Dormant until X_ACCESS_TOKEN is set.
// NOTE: X's write API requires a PAID plan — this stays off until you
// have one. SERVER-ONLY.
// ============================================================

import type { GeneratedPost } from '../types';
import { type Publisher, type PublishResult, result } from './types';

export const xPublisher: Publisher = {
  platform: 'x',
  isConfigured() {
    return Boolean(process.env.X_ACCESS_TOKEN);
  },
  async publish(post: GeneratedPost): Promise<PublishResult> {
    const token = process.env.X_ACCESS_TOKEN;
    if (!token) {
      return result('x', 'not_configured', { detail: 'Set X_ACCESS_TOKEN (paid X API plan required).' });
    }
    try {
      const res = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        // post.text already fits 280 incl. the link (enforced by the engine).
        body: JSON.stringify({ text: post.text }),
      });
      if (!res.ok) return result('x', 'error', { detail: `X API ${res.status}.` });
      const data = (await res.json()) as { data?: { id?: string } };
      const id = data.data?.id;
      return result('x', 'published', { id, url: id ? `https://x.com/i/web/status/${id}` : undefined });
    } catch (e) {
      return result('x', 'error', { detail: e instanceof Error ? e.message : 'X call failed.' });
    }
  },
};
