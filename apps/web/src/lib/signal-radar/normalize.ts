// ============================================================
// SignalRadar OS — normalization + fingerprinting (PURE)
// ------------------------------------------------------------
// Turns loosely-structured input (manual entry, pasted alerts/feeds,
// CSV rows) into the one canonical NormalizedSignal shape, and derives
// the deterministic fingerprint used for dedup + clustering. No network.
// ============================================================

import type { NormalizedSignal, RawSignalInput } from './types';
import { normalizeText } from './classify';

const URL_RE = /https?:\/\/[^\s<>")]+/gi;
const TAG_RE = /<[^>]+>/g;

export function extractUrls(text: string): string[] {
  const found = text.match(URL_RE) ?? [];
  return Array.from(new Set(found.map((u) => u.replace(/[.,)]+$/, ''))));
}

export function domainOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host || undefined;
  } catch {
    const m = url.match(/^[a-z]+:\/\/(?:www\.)?([^/]+)/i);
    return m?.[1];
  }
}

/** Strip HTML, collapse whitespace — the human-readable clean text. */
export function cleanTextOf(raw: string): string {
  return raw
    .replace(TAG_RE, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Small, stable string hash (djb2 → base36). Deterministic across runs. */
export function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

/**
 * The dedup/cluster fingerprint. Prefers the canonical source URL; falls
 * back to a normalized title + the first chunk of clean text.
 */
export function fingerprintOf(parts: { sourceUrl?: string; title?: string; cleanText: string }): string {
  if (parts.sourceUrl) {
    const u = parts.sourceUrl.split('#')[0].split('?')[0].replace(/\/$/, '');
    return `u:${hashString(normalizeText(u))}`;
  }
  const basis = normalizeText(`${parts.title ?? ''} ${parts.cleanText}`).slice(0, 160);
  return `t:${hashString(basis)}`;
}

/** Normalize a single raw input into the canonical shape. */
export function normalizeSignal(
  input: RawSignalInput,
  opts: { id: string; now: string },
): NormalizedSignal {
  const cleanText = cleanTextOf(input.text);
  const inlineUrls = extractUrls(input.text);
  const sourceUrl = input.sourceUrl || inlineUrls[0];
  const linkedUrls = Array.from(new Set([...inlineUrls, ...(input.sourceUrl ? [input.sourceUrl] : [])]));
  const discoveredAt = input.discoveredAt || opts.now;

  return {
    id: opts.id,
    sourceAdapterId: input.collectionMethod === 'manual' ? 'manual' : input.sourceType,
    sourceType: input.sourceType,
    sourceName: input.sourceName || domainOf(sourceUrl) || input.sourceType,
    collectionMethod: input.collectionMethod,
    sourceUrl,
    sourceDomain: domainOf(sourceUrl),
    title: input.title?.trim() || undefined,
    rawText: input.text,
    cleanText,
    authorName: input.authorName?.trim() || undefined,
    authorUrl: input.authorUrl?.trim() || undefined,
    publishedAt: input.publishedAt || undefined,
    discoveredAt,
    linkedUrls,
  };
}
