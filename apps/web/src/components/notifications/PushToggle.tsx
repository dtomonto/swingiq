'use client';

// PushToggle — a small, honest control to turn browser practice-reminder push
// on/off. Hides itself entirely when the deployment hasn't configured push
// (no VAPID key), so users never see a dead switch.

import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from './usePushNotifications';

export function PushToggle() {
  const { supported, configured, subscribed, busy, error, permission, subscribe, unsubscribe, sendTest } =
    usePushNotifications();

  // Keyless-first: render nothing until the owner ships a VAPID public key.
  if (!configured) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Bell className="h-4 w-4 text-primary" /> Practice reminder notifications
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Get a gentle nudge on this device when it&apos;s a good time to practice or retest. Private — you
            can turn it off anytime.
          </p>
        </div>
        {!supported ? (
          <span className="shrink-0 text-xs text-muted-foreground">Not supported here</span>
        ) : subscribed ? (
          <button
            type="button"
            onClick={unsubscribe}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellOff className="h-3.5 w-3.5" />} Turn off
          </button>
        ) : (
          <button
            type="button"
            onClick={subscribe}
            disabled={busy || permission === 'denied'}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />} Turn on
          </button>
        )}
      </div>
      {permission === 'denied' && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Notifications are blocked in your browser settings — allow them for this site to enable reminders.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
      {subscribed && (
        <button type="button" onClick={sendTest} className="mt-2 text-xs font-medium text-primary hover:underline">
          Send a test notification
        </button>
      )}
    </div>
  );
}
