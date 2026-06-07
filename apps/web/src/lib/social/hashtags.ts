// ============================================================
// SwingVantage — Blog-to-Social: hashtag engine
//
// Deterministic, platform-aware hashtags. No stuffing: each platform
// gets a count inside its native range (platforms.ts), drawn from the
// post's own keywords/sport/category plus one branded tag, deduped and
// formatted consistently. Used directly in keyless mode AND to sanitize
// whatever the AI proposes.
// ============================================================

import type { BlogAnalysis, Platform } from './types';
import { getPlatformRule } from './platforms';

const BRAND_TAG = '#SwingVantage';

/** Sport → a couple of reliable, non-spammy niche tags. */
const SPORT_TAGS: Record<string, string[]> = {
  golf: ['#golf', '#golftips', '#golfswing'],
  tennis: ['#tennis', '#tennistips'],
  pickleball: ['#pickleball', '#pickleballtips'],
  padel: ['#padel', '#padeltips'],
  baseball: ['#baseball', '#hitting'],
  softball: ['#softball', '#fastpitch'],
  all: ['#sports', '#training'],
};

/** Turn an arbitrary phrase into a single camel-ish hashtag, or null if unusable. */
export function toHashtag(phrase: string): string | null {
  const cleaned = phrase
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (cleaned.length === 0) return null;
  // Single short word → lowercase; multi-word → CamelCase for readability.
  const tag =
    cleaned.length === 1
      ? cleaned[0].toLowerCase()
      : cleaned.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
  if (tag.length < 2 || tag.length > 30) return null;
  return `#${tag}`;
}

function dedupe(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const key = t.toLowerCase();
    if (!t || seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

/**
 * Build a clean hashtag list for one platform, respecting its [min,max] range.
 * Order of preference: sport tags → post keywords/tags → brand tag.
 */
export function buildHashtags(analysis: BlogAnalysis, platform: Platform): string[] {
  const [min, max] = getPlatformRule(platform).hashtagRange;
  void min; // min is advisory; we never pad with junk to reach it.
  if (max === 0) return []; // e.g. Reddit

  const candidates: string[] = [];

  // 1) Pre-curated tags from analysis (already hash-like or plain phrases).
  for (const t of analysis.recommendedHashtags ?? []) {
    const tag = t.startsWith('#') ? t : toHashtag(t);
    if (tag) candidates.push(tag);
  }
  // 2) Keywords as fallback fuel.
  for (const kw of analysis.keywords ?? []) {
    const tag = toHashtag(kw);
    if (tag) candidates.push(tag);
  }

  let pool = dedupe(candidates);

  // Branded tag: include when there's room and the platform isn't ultra-minimal.
  const wantsBrand = max >= 2;
  if (wantsBrand) pool = dedupe([...pool, BRAND_TAG]);

  // Trim to max; if below min, we simply return what we honestly have
  // (never pad with junk just to hit a number).
  return pool.slice(0, max);
}

/** Sport-aware seed tags, exposed for the analyzer to pre-populate recommendations. */
export function sportHashtags(sport: string): string[] {
  return SPORT_TAGS[sport] ?? SPORT_TAGS.all;
}
