'use client';

// ============================================================
// SwingVantage — Background analysis alerts
//
// The analyzer can take a little while, and it's easy to switch tabs and
// forget it's running. This hook makes a finished (or in-progress) analysis
// impossible to miss WITHOUT being pushy:
//   • While analyzing and the tab is backgrounded, the browser-tab title
//     shows "⏳ Analyzing…". When it's done, it flips to "✅ ready".
//   • If — and only if — the user has ALREADY granted notification
//     permission, a completion notification fires when the tab is hidden.
//     We never prompt for permission unsolicited.
// The original page title is always restored when the user returns.
// ============================================================

import { useEffect, useRef } from 'react';

interface Options {
  /** True while the analysis is running. */
  analyzing: boolean;
  /** True once the result is ready to view. */
  ready: boolean;
  readyTitle?: string;
  workingTitle?: string;
  notificationBody?: string;
}

export function useAnalysisAlerts({
  analyzing,
  ready,
  readyTitle = '✅ Swing analysis ready · SwingVantage',
  workingTitle = '⏳ Analyzing your swing… · SwingVantage',
  notificationBody = 'Your swing analysis is ready to view.',
}: Options) {
  const originalTitle = useRef<string | null>(null);
  const notified = useRef(false);

  // Capture the original document title once.
  useEffect(() => {
    if (typeof document !== 'undefined' && originalTitle.current === null) {
      originalTitle.current = document.title;
    }
  }, []);

  // Reset the "already notified" guard each time a new analysis begins.
  useEffect(() => {
    if (analyzing) notified.current = false;
  }, [analyzing]);

  // Reflect progress in the tab title while backgrounded; restore on return.
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const sync = () => {
      const base = originalTitle.current ?? document.title;
      if (!document.hidden) {
        document.title = base; // user is looking — keep it clean
      } else if (analyzing) {
        document.title = workingTitle;
      } else if (ready) {
        document.title = readyTitle;
      }
    };

    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, [analyzing, ready, workingTitle, readyTitle]);

  // Fire one completion notification — only if already permitted and hidden.
  useEffect(() => {
    if (!ready || notified.current) return;
    notified.current = true;
    if (
      typeof document !== 'undefined' &&
      document.hidden &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      try {
        const n = new Notification('SwingVantage', { body: notificationBody });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch {
        // Ignore — the tab-title ping already covers this case.
      }
    }
  }, [ready, notificationBody]);

  // Always restore the original title on unmount.
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined' && originalTitle.current !== null) {
        document.title = originalTitle.current;
      }
    };
  }, []);
}
