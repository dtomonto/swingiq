// ============================================================
// SwingVantage — Facebook Page publisher (Graph API, credential-gated)
//
// Posts to a Page feed. Dormant until both are set:
//   FACEBOOK_PAGE_ID
//   FACEBOOK_PAGE_TOKEN   (long-lived Page access token)
// SERVER-ONLY.
// ============================================================

import type { GeneratedPost } from '../types';
import { type Publisher, type PublishResult, result } from './types';

export const facebookPublisher: Publisher = {
  platform: 'facebook',
  isConfigured() {
    return Boolean(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_TOKEN);
  },
  async publish(post: GeneratedPost): Promise<PublishResult> {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const token = process.env.FACEBOOK_PAGE_TOKEN;
    if (!pageId || !token) {
      return result('facebook', 'not_configured', { detail: 'Set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_TOKEN.' });
    }
    try {
      const body = new URLSearchParams({ message: post.text, access_token: token });
      if (post.utmUrl) body.set('link', post.utmUrl);
      const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) return result('facebook', 'error', { detail: `Graph API ${res.status}.` });
      const data = (await res.json()) as { id?: string };
      return result('facebook', 'published', { id: data.id, url: data.id ? `https://facebook.com/${data.id}` : undefined });
    } catch (e) {
      return result('facebook', 'error', { detail: e instanceof Error ? e.message : 'Facebook call failed.' });
    }
  },
};
