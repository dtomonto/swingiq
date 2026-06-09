// ============================================================
// Re-engagement delivery (SERVER-ONLY) — push + email, honest-off per channel
// ------------------------------------------------------------
// The single place that turns a re-engagement nudge (practice reminder, retest
// due, comeback, "finish your fix" — from lib/reengage) into an actual delivery
// across every CONFIGURED channel:
//   • Web push   — via lib/notifications/web-push (needs VAPID + a subscription)
//   • Email      — via the existing Resend sender (needs RESEND_API_KEY)
// Each channel reports honestly whether it sent or no-op'd; neither is faked.
//
// Triggering is the owner's choice (a cron, an admin action, or an in-app event)
// — this module is the delivery primitive those triggers call.
// ============================================================

import { sendPushToUser, type PushSendResult } from './web-push';
import { sendDispatchEmail, type SendResult } from '@/lib/agents/dispatch/send-email';

export interface NudgeDelivery {
  /** Account to deliver to (push targets their stored subscriptions). */
  userId: string;
  /** Recipient email — when present and Resend is configured, an email sends. */
  email?: string | null;
  subject: string;
  title: string;
  body: string;
  /** Where the CTA / notification click lands. */
  url?: string;
  cta?: { label: string; href: string };
  /** Notification grouping tag (collapses repeats on the device). */
  tag?: string;
}

export interface DeliveryResult {
  push: PushSendResult;
  email: SendResult;
}

/** Deliver one nudge across all configured channels. Never throws. */
export async function deliverNudge(n: NudgeDelivery): Promise<DeliveryResult> {
  const push = await sendPushToUser(n.userId, {
    title: n.title,
    body: n.body,
    url: n.url ?? n.cta?.href,
    tag: n.tag ?? 'reengage',
  }).catch((): PushSendResult => ({ configured: false, sent: 0, failed: 0, reason: 'error' }));

  const email: SendResult = n.email
    ? await sendDispatchEmail({
        to: n.email,
        subject: n.subject,
        title: n.title,
        body: n.body,
        cta: n.cta,
      }).catch(() => ({ sent: false, dryRun: false, provider: 'none' as const }))
    : { sent: false, dryRun: true, provider: 'none' };

  return { push, email };
}
