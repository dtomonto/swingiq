// ============================================================
// SwingVantage — universal webhook publisher
//
// The pragmatic, works-today path: POST the approved post to a webhook
// you control (Zapier / Make / n8n / Buffer), which does the actual
// posting. No per-platform OAuth needed. Mirrors the app's existing
// "generic webhook" email-capture pattern. SERVER-ONLY.
// ============================================================

import type { GeneratedPost, Platform } from '../types';
import { type PublishResult, result } from './types';

const WEBHOOK_ENV = 'SOCIAL_PUBLISH_WEBHOOK_URL';

export function webhookConfigured(): boolean {
  return Boolean(process.env[WEBHOOK_ENV]?.trim());
}

/** Pure: the JSON payload sent to the relay. Exported for tests. */
export function webhookPayload(post: GeneratedPost) {
  return {
    platform: post.platform,
    variation: post.variationType,
    text: post.text,
    hashtags: post.hashtags,
    link: post.utmUrl,
    quality_score: post.qualityScore,
  };
}

export async function publishViaWebhook(post: GeneratedPost): Promise<PublishResult> {
  const url = process.env[WEBHOOK_ENV]?.trim();
  if (!url) {
    return result(post.platform, 'not_configured', { detail: `Set ${WEBHOOK_ENV} to enable webhook publishing.` });
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload(post)),
    });
    if (!res.ok) {
      return result(post.platform, 'error', { detail: `Webhook returned ${res.status}.` });
    }
    return result(post.platform, 'queued', { detail: 'Handed to your webhook relay.' });
  } catch (e) {
    return result(post.platform, 'error', { detail: e instanceof Error ? e.message : 'Webhook call failed.' });
  }
}

/** Platforms the webhook can relay (all of them — your relay decides what it supports). */
export const WEBHOOK_PLATFORMS: Platform[] = [
  'linkedin', 'x', 'facebook', 'instagram', 'threads', 'tiktok', 'youtube_community', 'pinterest', 'reddit',
];
