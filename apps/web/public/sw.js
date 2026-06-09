/*
 * SwingVantage service worker — deliberately conservative.
 *
 * Goals: faster repeat loads of immutable build assets on phones / slow
 * networks, and a graceful offline page instead of the browser error page.
 *
 * Safety rules (why this can't serve someone the wrong/stale page):
 *   • Navigations are NETWORK-FIRST and are never cached. When the network
 *     fails we fall back to a static /offline page — never a cached, possibly
 *     auth-gated app document.
 *   • Only same-origin, content-hashed/immutable static assets
 *     (/_next/static + fonts/images) are cached (cache-first).
 *   • /api/* and all cross-origin requests are passed straight through and
 *     never touched.
 *   • Versioned caches + skipWaiting/clients.claim so a new worker takes over
 *     promptly and a bad worker is replaced on the next visit.
 *
 * Registered in production only (see ServiceWorkerRegistrar) to avoid
 * conflicting with the Next.js dev HMR pipeline.
 */

const VERSION = 'v1';
const PRECACHE = `sv-precache-${VERSION}`;
const RUNTIME = `sv-runtime-${VERSION}`;
const OFFLINE_URL = '/offline';
const PRECACHE_URLS = [OFFLINE_URL, '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== PRECACHE && key !== RUNTIME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isImmutableAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    /\.(?:js|css|woff2?|png|jpe?g|svg|gif|webp|ico)$/i.test(pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never touch cross-origin
  if (url.pathname.startsWith('/api/')) return; // never cache APIs

  // Navigations: network-first, offline page as the only fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(OFFLINE_URL, { ignoreSearch: true })
          .then((cached) => cached || Response.error()),
      ),
    );
    return;
  }

  // Immutable build assets: cache-first, then populate the runtime cache.
  if (isImmutableAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((response) => {
              if (response.ok && response.type === 'basic') {
                const copy = response.clone();
                caches.open(RUNTIME).then((cache) => cache.put(request, copy));
              }
              return response;
            })
            .catch(() => cached),
      ),
    );
    return;
  }

  // Everything else: straight to the network (browser default).
});

/*
 * Web Push — practice-reminder / re-engagement notifications.
 * Payload (JSON) is sent by lib/notifications/web-push.ts:
 *   { title, body, url?, tag? }
 * Clicking focuses an existing tab or opens the target URL.
 */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'SwingVantage', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'SwingVantage';
  const options = {
    body: data.body || '',
    tag: data.tag || 'swingvantage',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/dashboard' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
