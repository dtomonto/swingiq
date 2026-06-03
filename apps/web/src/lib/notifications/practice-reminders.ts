'use client';

// ============================================================
// SwingIQ — Practice Reminders (local notifications)
// ------------------------------------------------------------
// Uses the browser Notification API to show LOCAL practice reminders
// while the app is open. This is honest about its limits: true
// scheduled push (firing when the app/tab is closed) requires a service
// worker + a push service (VAPID keys or a provider). See
// docs/INTEGRATIONS_SETUP.md. Nothing here pretends background push works.
// ============================================================

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

/** What background scheduled push additionally needs — surfaced honestly in the UI. */
export const SERVER_PUSH_NOTE =
  'Reminders that fire when SwingIQ is closed need a service worker plus a push service ' +
  '(VAPID keys or a provider). Until that is set up, reminders only show while the app is open.';

function supported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!supported()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/** Ask the user for notification permission. Safe to call repeatedly. */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!supported()) return 'unsupported';
  if (Notification.permission !== 'default') {
    return Notification.permission as NotificationPermissionState;
  }
  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch {
    return 'denied';
  }
}

export interface PracticeReminderOptions {
  title?: string;
  body: string;
  /** Optional tag so repeated reminders replace rather than stack. */
  tag?: string;
}

/**
 * Show a local practice reminder now (app must be open). Returns false if
 * notifications are unsupported or permission has not been granted.
 */
export function showPracticeReminder(opts: PracticeReminderOptions): boolean {
  if (!supported() || Notification.permission !== 'granted') return false;
  try {
    new Notification(opts.title ?? 'SwingIQ practice reminder', {
      body: opts.body,
      tag: opts.tag ?? 'swingiq-practice',
      icon: '/icon-192.png',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Schedule a one-off in-session reminder after `delayMs`. This only fires
 * while the page stays open. Returns a cancel function.
 */
export function scheduleInSessionReminder(
  opts: PracticeReminderOptions,
  delayMs: number,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handle = window.setTimeout(() => showPracticeReminder(opts), Math.max(0, delayMs));
  return () => window.clearTimeout(handle);
}
