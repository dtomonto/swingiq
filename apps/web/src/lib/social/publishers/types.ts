// ============================================================
// SwingVantage — Blog-to-Social: publisher types
//
// A Publisher takes ONE approved post and pushes it to a channel. Every
// publisher is keyless-first: with no credentials it reports
// `not_configured` and changes nothing — never throws, never half-posts.
// SERVER-ONLY (reads secret tokens).
// ============================================================

import type { GeneratedPost, Platform } from '../types';

export type PublishOutcome =
  | 'published' // really sent
  | 'queued' // accepted by a relay (e.g. webhook → Zapier/Buffer)
  | 'not_configured' // no credentials / autopublish off
  | 'unsupported' // platform has no usable write API
  | 'error'; // tried and failed

export interface PublishResult {
  platform: Platform;
  outcome: PublishOutcome;
  url?: string; // permalink, when the API returns one
  id?: string; // remote post id
  detail?: string; // human-readable note (esp. for not_configured/error)
}

export interface Publisher {
  platform: Platform;
  /** True only when this publisher's credentials are present. */
  isConfigured(): boolean;
  /** Publish one post. Caller guarantees it's approved + autopublish is on. */
  publish(post: GeneratedPost): Promise<PublishResult>;
}

/** Small helper so publishers build consistent results. */
export function result(
  platform: Platform,
  outcome: PublishOutcome,
  extra: Partial<PublishResult> = {},
): PublishResult {
  return { platform, outcome, ...extra };
}
