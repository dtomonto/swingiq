// ============================================================
// Web push — server send (SERVER-ONLY, capability-gated)
// ------------------------------------------------------------
// Sends encrypted Web Push notifications via VAPID. Keyless-first: with no
// VAPID keys set it's a no-op that reports `configured: false` (never pretends
// to send). With keys it delivers to every stored subscription for a user and
// prunes dead ones (404/410). NEVER import from a client component.
//
// Owner setup (one-time):
//   1. npx web-push generate-vapid-keys
//   2. set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@…),
//      and NEXT_PUBLIC_VAPID_PUBLIC_KEY (= the public key, for the browser).
//   3. apply supabase-push-subscriptions.sql.
// ============================================================

import webpush from 'web-push';
import { listPushSubscriptions, deletePushSubscription } from './push-subscriptions';

type Env = Record<string, string | undefined>;

export interface WebPushConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface PushSendResult {
  configured: boolean;
  sent: number;
  failed: number;
  reason?: string;
}

/** Resolve VAPID config from env, or null when not fully configured. */
export function getWebPushConfig(env: Env = process.env): WebPushConfig | null {
  const publicKey = env.VAPID_PUBLIC_KEY || env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  const subject = env.VAPID_SUBJECT || 'mailto:noreply@swingvantage.com';
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

/** Whether web push is ready to send (keys present). */
export function isPushConfigured(env: Env = process.env): boolean {
  return getWebPushConfig(env) !== null;
}

/**
 * Send a push to all of a user's subscriptions. Honest no-op (configured:false)
 * when VAPID isn't set. Prunes subscriptions the browser has dropped.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<PushSendResult> {
  const config = getWebPushConfig();
  if (!config) return { configured: false, sent: 0, failed: 0, reason: 'VAPID keys not set' };

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);

  const subs = await listPushSubscriptions(userId);
  if (subs.length === 0) return { configured: true, sent: 0, failed: 0, reason: 'no subscriptions' };

  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        sent += 1;
      } catch (err) {
        failed += 1;
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await deletePushSubscription(s.endpoint); // gone
      }
    }),
  );
  return { configured: true, sent, failed };
}
