// ============================================================
// SwingVantage — publisher registry + orchestrator (SERVER-ONLY)
//
// Routing for one approved post:
//   1. master kill-switch off (default) → do nothing
//   2. a direct publisher for the channel is configured → use it
//   3. else the universal webhook is configured → relay through it
//   4. else → not_configured
//
// Everything is keyless-first and never throws.
// ============================================================

import type { GeneratedPost, Platform } from '../types';
import { type Publisher, type PublishResult, result } from './types';
import { webhookConfigured, publishViaWebhook } from './webhook';
import { linkedinPublisher } from './linkedin';
import { xPublisher } from './x';
import { facebookPublisher } from './facebook';
import { redditPublisher } from './reddit';

const DIRECT: Partial<Record<Platform, Publisher>> = {
  linkedin: linkedinPublisher,
  x: xPublisher,
  facebook: facebookPublisher,
  reddit: redditPublisher,
};

/** Master kill-switch. Off unless SOCIAL_AUTOPUBLISH=on. */
export function isAutopublishEnabled(): boolean {
  return process.env.SOCIAL_AUTOPUBLISH === 'on';
}

/** How a channel would publish right now — drives the UI. */
export function channelPublishMode(platform: Platform): 'direct' | 'webhook' | 'none' {
  if (DIRECT[platform]?.isConfigured()) return 'direct';
  if (webhookConfigured()) return 'webhook';
  return 'none';
}

export function anyPublisherConfigured(): boolean {
  return webhookConfigured() || Object.values(DIRECT).some((p) => p?.isConfigured());
}

/** Publish ONE post. Caller must ensure the post is approved. */
export async function publishPost(post: GeneratedPost): Promise<PublishResult> {
  if (!isAutopublishEnabled()) {
    return result(post.platform, 'not_configured', {
      detail: 'Auto-publish is off. Set SOCIAL_AUTOPUBLISH=on to enable.',
    });
  }
  const direct = DIRECT[post.platform];
  if (direct?.isConfigured()) return direct.publish(post);
  if (webhookConfigured()) return publishViaWebhook(post);
  return result(post.platform, 'not_configured', {
    detail: `No publisher configured for ${post.platform} (add a direct credential or SOCIAL_PUBLISH_WEBHOOK_URL).`,
  });
}

export { DIRECT as DIRECT_PUBLISHERS };
