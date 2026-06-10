#!/usr/bin/env node
// ============================================================
// ConnectorOS — IndexNow submitter (keyless-safe CLI)
// ------------------------------------------------------------
// Submits changed/high-value URLs to IndexNow (Bing/Yandex/…).
// Usage:
//   INDEXNOW_KEY=... NEXT_PUBLIC_SITE_URL=https://swingvantage.com \
//     node scripts/seo-indexnow.mjs [url ...]
//
// With no INDEXNOW_KEY set, this no-ops cleanly (exit 0) — safe to wire
// into CI/post-publish without breaking keyless setups. With no URL args,
// it submits the site root + sitemap.xml as a sensible default.
// Docs: docs/connector-os/seo-indexing.md
// ============================================================

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const key = (process.env.INDEXNOW_KEY || '').trim();
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

function placeholder(v) {
  return !v || v === 'none' || v.startsWith('your-') || v.startsWith('change-me');
}

if (placeholder(key)) {
  console.log('[indexnow] INDEXNOW_KEY not set — skipping (keyless no-op).');
  process.exit(0);
}

let host;
try {
  host = new URL(siteUrl).host;
} catch {
  console.error('[indexnow] Invalid NEXT_PUBLIC_SITE_URL:', siteUrl);
  process.exit(1);
}

const args = process.argv.slice(2);
const candidates = args.length > 0 ? args : [`${siteUrl}/`, `${siteUrl}/sitemap.xml`];

// Keep only absolute same-host URLs, deduped.
const seen = new Set();
const urlList = [];
for (const u of candidates) {
  try {
    const parsed = new URL(u);
    if (parsed.host !== host) {
      console.warn('[indexnow] Skipping foreign-host URL:', u);
      continue;
    }
    if (!seen.has(parsed.href)) {
      seen.add(parsed.href);
      urlList.push(parsed.href);
    }
  } catch {
    console.warn('[indexnow] Skipping malformed URL:', u);
  }
}

if (urlList.length === 0) {
  console.error('[indexnow] No valid same-host URLs to submit.');
  process.exit(1);
}

const keyLocation = (process.env.INDEXNOW_KEY_LOCATION || `${siteUrl}/${key}.txt`).trim();

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation, urlList }),
});

console.log(`[indexnow] Submitted ${urlList.length} URL(s) → HTTP ${res.status}`);
for (const u of urlList) console.log('  •', u);
process.exit(res.ok ? 0 : 1);
