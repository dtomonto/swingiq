// ============================================================
// SwingVantage — Dispatch: delivery adapters
// ------------------------------------------------------------
// Concrete implementations of the DispatchAdapters seam:
//   • email → POSTs to /api/agents/dispatch/send (server sends via Resend)
//   • push  → local notification (honest: only while the app is open)
//   • in_app → caller-provided callback (e.g. a toast / store write)
//
// Pass the result of `buildDispatchAdapters` to `executeDispatch`. Nothing
// here sends on its own — delivery happens only when executeDispatch runs on
// a decision whose gates (consent, caps, quiet hours) already passed.
// ============================================================

import { showPracticeReminder } from '@/lib/notifications/practice-reminders';
import type { DispatchAdapters, DispatchMessage } from './types';

/** Local push (browser Notification). No-op without permission. */
export const webPushAdapter: Required<Pick<DispatchAdapters, 'sendPush'>> = {
  sendPush: (msg: DispatchMessage) => {
    showPracticeReminder({
      title: msg.title || msg.subject || 'SwingVantage',
      body: msg.body,
      tag: 'swingvantage-reengage',
    });
  },
};

/** Email via the server route. Returns once the request is accepted. */
export function createEmailAdapter(
  recipientEmail: string,
  endpoint = '/api/agents/dispatch/send',
): Required<Pick<DispatchAdapters, 'sendEmail'>> {
  return {
    sendEmail: async (msg: DispatchMessage) => {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: msg.subject,
          title: msg.title,
          body: msg.body,
          preheader: msg.preheader,
          cta: msg.cta,
        }),
      });
    },
  };
}

export interface BuildAdaptersOptions {
  /** Recipient address — required to enable the email channel. */
  recipientEmail?: string | null;
  /** Enable local push delivery. */
  push?: boolean;
  /** Handler for in-app delivery (e.g. show a toast / write a card to state). */
  onInApp?: (msg: DispatchMessage) => void;
  /** Override the email endpoint (tests). */
  emailEndpoint?: string;
}

/**
 * Assemble a DispatchAdapters bundle from what's available. Channels with no
 * backing capability are simply omitted, so executeDispatch becomes an honest
 * no-op for them rather than faking delivery.
 */
export function buildDispatchAdapters(opts: BuildAdaptersOptions = {}): DispatchAdapters {
  const adapters: DispatchAdapters = {};
  if (opts.recipientEmail) {
    adapters.sendEmail = createEmailAdapter(opts.recipientEmail, opts.emailEndpoint).sendEmail;
  }
  if (opts.push) adapters.sendPush = webPushAdapter.sendPush;
  if (opts.onInApp) adapters.showInApp = opts.onInApp;
  return adapters;
}
