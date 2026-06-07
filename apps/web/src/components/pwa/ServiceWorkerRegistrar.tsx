'use client';

import { useEffect } from 'react';

/**
 * Registers the SwingVantage service worker (public/sw.js) in production only.
 *
 * Why production-only: a service worker fighting the Next.js dev HMR pipeline
 * causes confusing stale-cache behaviour during local iteration. The worker is
 * deliberately conservative (network-first navigations + an offline fallback,
 * cache-first for immutable build assets); see public/sw.js.
 *
 * Renders nothing and is a safe no-op when the browser lacks SW support.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration failures are non-fatal — the app works fine without it.
      });
    };

    // Register after load so the worker never competes with first paint.
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}
