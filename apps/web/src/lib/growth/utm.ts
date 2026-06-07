// ============================================================
// GrowthOS — UTM builder (§27)
// ------------------------------------------------------------
// Pure helpers to construct + parse UTM-tagged URLs. No side effects,
// safe on server or client.
// ============================================================

export interface UTMParams {
  baseUrl: string;
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

const UTM_KEYS: Array<[keyof UTMParams, string]> = [
  ['source', 'utm_source'],
  ['medium', 'utm_medium'],
  ['campaign', 'utm_campaign'],
  ['term', 'utm_term'],
  ['content', 'utm_content'],
];

/** Normalise a UTM value: lowercase, spaces -> hyphens, strip junk. */
export function normalizeUtmValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_\-.]/g, '');
}

/**
 * Build a UTM-tagged URL. Preserves any existing query/hash on the base URL
 * and overrides UTM params. Returns the original string if the base can't be
 * parsed (so the UI degrades gracefully rather than throwing).
 */
export function buildUtmUrl(params: UTMParams): string {
  const { baseUrl } = params;
  if (!baseUrl) return '';

  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    // Allow protocol-less input like "swingiq.app/pricing".
    try {
      url = new URL(`https://${baseUrl}`);
    } catch {
      return baseUrl;
    }
  }

  for (const [key, param] of UTM_KEYS) {
    const raw = params[key];
    if (raw && String(raw).trim()) {
      url.searchParams.set(param, normalizeUtmValue(String(raw)));
    }
  }
  return url.toString();
}

/** Pull UTM params back out of a URL (for attribution capture). */
export function parseUtmUrl(rawUrl: string): Partial<Record<string, string>> {
  try {
    const url = new URL(rawUrl);
    const out: Record<string, string> = {};
    for (const [, param] of UTM_KEYS) {
      const v = url.searchParams.get(param);
      if (v) out[param] = v;
    }
    return out;
  } catch {
    return {};
  }
}

/** Common preset source/medium pairs to speed up the builder UI. */
export const UTM_PRESETS: Array<{ label: string; source: string; medium: string }> = [
  { label: 'Google Ads', source: 'google', medium: 'cpc' },
  { label: 'Meta Ads', source: 'facebook', medium: 'paid-social' },
  { label: 'Organic email', source: 'newsletter', medium: 'email' },
  { label: 'LinkedIn organic', source: 'linkedin', medium: 'social' },
  { label: 'YouTube', source: 'youtube', medium: 'video' },
  { label: 'Reddit organic', source: 'reddit', medium: 'social' },
  { label: 'Affiliate', source: 'partner', medium: 'affiliate' },
  { label: 'Referral', source: 'referral', medium: 'referral' },
];
