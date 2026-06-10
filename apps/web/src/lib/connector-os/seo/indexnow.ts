// ============================================================
// ConnectorOS — IndexNow submission (keyless-first)
// ------------------------------------------------------------
// Instantly notifies IndexNow-participating engines (Bing, Yandex, …)
// when URLs are created or updated, instead of waiting for a crawl.
//
// SERVER-ONLY (reads INDEXNOW_KEY). Keyless-safe: with no key set,
// submit() no-ops and returns { submitted: false, reason: 'no-key' } —
// nothing is sent. Mirrors the keyless-first posture of lib/capabilities.
// See docs/connector-os/seo-indexing.md.
// ============================================================

import { isConfigured } from '@/lib/capabilities';
import { SITE_URL } from '@/config/site';

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

export interface IndexNowResult {
  submitted: boolean;
  /** Why it did not submit, when submitted is false. */
  reason?: 'no-key' | 'no-urls' | 'bad-host' | 'request-failed';
  /** HTTP status from the IndexNow endpoint, when a request was made. */
  status?: number;
  /** The URLs that were accepted for submission. */
  urls?: string[];
}

type Env = Record<string, string | undefined>;

/** The hostname IndexNow keys are scoped to (derived from the site URL). */
function siteHost(): string {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return '';
  }
}

/** The public key-file URL IndexNow fetches to verify ownership. */
export function keyFileLocation(env: Env = process.env): string | null {
  const key = env.INDEXNOW_KEY;
  if (!isConfigured(key)) return null;
  const override = env.INDEXNOW_KEY_LOCATION;
  if (isConfigured(override)) return override!.trim();
  const base = SITE_URL.replace(/\/$/, '');
  return `${base}/${key!.trim()}.txt`;
}

/** Whether IndexNow is configured (a real key is set). */
export function isIndexNowConfigured(env: Env = process.env): boolean {
  return isConfigured(env.INDEXNOW_KEY);
}

/** Keep only absolute http(s) URLs that live on the configured site host. */
function sameHostUrls(urls: string[]): string[] {
  const host = siteHost();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    try {
      const parsed = new URL(u);
      if (parsed.host !== host) continue;
      if (seen.has(parsed.href)) continue;
      seen.add(parsed.href);
      out.push(parsed.href);
    } catch {
      /* skip malformed URL */
    }
  }
  return out;
}

/**
 * Submit one or more changed URLs to IndexNow. SERVER-ONLY.
 * No-ops safely when unconfigured or when no valid same-host URLs are given.
 *
 * @param fetchImpl injectable fetch (tests); defaults to global fetch.
 */
export async function submitUrls(
  urls: string[],
  env: Env = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<IndexNowResult> {
  const key = env.INDEXNOW_KEY;
  if (!isConfigured(key)) return { submitted: false, reason: 'no-key' };

  const host = siteHost();
  if (!host) return { submitted: false, reason: 'bad-host' };

  const valid = sameHostUrls(urls);
  if (valid.length === 0) return { submitted: false, reason: 'no-urls' };

  const keyLocation = keyFileLocation(env) ?? undefined;
  const body = {
    host,
    key: key!.trim(),
    keyLocation,
    urlList: valid,
  };

  try {
    const res = await fetchImpl(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    // IndexNow returns 200/202 on success.
    return {
      submitted: res.ok,
      reason: res.ok ? undefined : 'request-failed',
      status: res.status,
      urls: valid,
    };
  } catch {
    return { submitted: false, reason: 'request-failed', urls: valid };
  }
}
