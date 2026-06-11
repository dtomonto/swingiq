// ============================================================
// SignalRadar OS — webhook payload parsing + ingest merge (PURE)
// ------------------------------------------------------------
// Pure helpers shared by the webhook route (server) and the client:
//  • parseWebhookPayload — defensively coerce an untrusted POST body into
//    a RawSignalInput (or null), clamping lengths so a hostile caller
//    can't blow up storage. Never throws.
//  • mergeIngested — fold server-ingested signals into the operator's
//    local set, de-duplicated by fingerprint (local always wins, so
//    triaged/adopted state is never clobbered by the durable feed).
// ============================================================

import type { RawSignalInput, Signal, SignalSourceType } from './types';

const MAX_TEXT = 5000;
const MAX_TITLE = 300;
const MAX_URL = 2000;
const MAX_NAME = 200;

const ALLOWED_SOURCE_TYPES: SignalSourceType[] = [
  'webhook', 'social', 'blog_news', 'reddit', 'youtube', 'search', 'rss',
  'google_alerts', 'backlink', 'competitor', 'ai_answer_engine', 'support', 'manual',
];

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

/**
 * Coerce an untrusted webhook body into a RawSignalInput, or null when it
 * carries no usable text. Defensive: clamps every field, whitelists the
 * source type, never throws.
 */
export function parseWebhookPayload(body: unknown): RawSignalInput | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;

  const text = str(b.text ?? b.content ?? b.message ?? b.body ?? b.snippet, MAX_TEXT);
  const title = str(b.title ?? b.headline ?? b.subject, MAX_TITLE);
  if (!text && !title) return null;

  const rawType = str(b.sourceType ?? b.source_type, 40) as SignalSourceType;
  const sourceType: SignalSourceType = ALLOWED_SOURCE_TYPES.includes(rawType) ? rawType : 'webhook';

  return {
    sourceType,
    collectionMethod: 'webhook',
    sourceName: str(b.sourceName ?? b.source ?? b.site, MAX_NAME) || undefined,
    sourceUrl: str(b.url ?? b.sourceUrl ?? b.link, MAX_URL) || undefined,
    title: title || undefined,
    text: text || title,
    authorName: str(b.author ?? b.authorName ?? b.username, MAX_NAME) || undefined,
    authorUrl: str(b.authorUrl, MAX_URL) || undefined,
    publishedAt: str(b.publishedAt ?? b.published_at ?? b.date, 40) || undefined,
  };
}

/**
 * Merge durable server-ingested signals into the operator's local set,
 * de-duplicated by fingerprint. Local entries win (so adoption/triage is
 * preserved); ingested-only entries are flagged `ingested` for the UI.
 */
export function mergeIngested(local: Signal[], ingested: Signal[]): Signal[] {
  const localFingerprints = new Set(local.map((s) => s.fingerprint));
  const extras = ingested
    .filter((s) => !localFingerprints.has(s.fingerprint))
    .map((s) => ({ ...s, ingested: true as const }));
  return [...local, ...extras];
}
