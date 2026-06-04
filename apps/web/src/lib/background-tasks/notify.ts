'use client';

// ============================================================
// SwingIQ — Background-task notifications
// ------------------------------------------------------------
// Thin wrapper over the browser Notification API used to alert the
// user when a long-running upload / analysis finishes WHILE they have
// moved on (switched tabs or apps). It reuses the same honest
// permission helpers as the practice reminders — nothing here pretends
// background push works when the tab is fully closed.
//
// In-app (tab visible) completion is always surfaced by the in-app
// task toasts; this OS-level notification is only fired when the tab
// is hidden, so a user who walked away still gets pulled back.
// ============================================================

import {
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notifications/practice-reminders';

export { getNotificationPermission, requestNotificationPermission };

/**
 * Show an OS notification for a finished background task. Returns false
 * if notifications are unsupported or permission has not been granted.
 * Safe to call unconditionally — it no-ops rather than throwing.
 */
export function showBackgroundTaskNotification(
  title: string,
  body: string,
  tag = 'swingiq-task',
): boolean {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    Notification.permission !== 'granted'
  ) {
    return false;
  }
  try {
    new Notification(title, { body, tag, icon: '/icon-192.png' });
    return true;
  } catch {
    return false;
  }
}

/** True when the document is currently hidden (user switched tab/app). */
export function isDocumentHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}
