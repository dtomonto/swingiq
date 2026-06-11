// ============================================================
// SignalRadar OS — feed URL safety (PURE)
// ------------------------------------------------------------
// The scheduled poller fetches operator/deploy-configured feed URLs
// server-side, so we guard against SSRF even though the URLs are
// admin-controlled (defense-in-depth): HTTPS only, and no loopback /
// private / link-local hosts. Never throws.
// ============================================================

const PRIVATE_V4 = [
  /^127\./, /^10\./, /^192\.168\./, /^169\.254\./, /^0\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
];

/** True when a URL is safe to fetch as a feed (https + public host). */
export function isSafeFeedUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return false;
  }
  if (u.protocol !== 'https:') return false;
  const host = u.hostname.toLowerCase();
  if (!host) return false;
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return false;
  if (host === '::1' || host === '[::1]') return false;
  if (PRIVATE_V4.some((re) => re.test(host))) return false;
  return true;
}

/** Parse a comma/newline-separated feed list, keeping only safe URLs. */
export function parseFeedList(raw: string | undefined | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[\n,]/)) {
    const url = part.trim();
    if (url && isSafeFeedUrl(url) && !seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}
