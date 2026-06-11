// ============================================================
// SignalRadar OS — scheduled feed collection (SERVER-ONLY)
// ------------------------------------------------------------
// Keyless, ToS-safe automated collection: fetch operator/deploy-configured
// RSS/Atom feeds (a blog /feed, reddit.com/r/x/search.rss, a YouTube
// channel feed, …), parse them with the existing pure parser, classify +
// score, and persist NEW signals to the durable store (dedup by
// fingerprint). No API keys required. A no-op when the durable store
// (Supabase) is absent — automated collection needs somewhere to land,
// and we say so honestly rather than fetch-and-drop. Never throws.
// ============================================================

import 'server-only';

import { parseRssFeed } from './importers';
import { processRawInputs } from './engine';
import { DEFAULT_CONFIG, DEFAULT_COMPETITORS } from './config';
import { ingestSignal, isSignalIngestEnabled, listIngestedSignals } from './ingest.server';
import { isSafeFeedUrl } from './feed-url';
import { domainOf } from './normalize';
import type { Signal, RawSignalInput } from './types';

export interface FeedCollectionResult {
  /** True when a durable store exists; false → nothing was persisted. */
  enabled: boolean;
  feeds: number;
  fetched: number;
  parsed: number;
  added: number;
  skipped: number;
  errors: { url: string; error: string }[];
}

const FETCH_TIMEOUT_MS = 10_000;
const MAX_BODY = 1_000_000; // 1 MB cap per feed

async function fetchFeed(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'user-agent': 'SwingVantage SignalRadar/1.0 (+https://swingvantage.com)' },
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, MAX_BODY);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch + ingest a list of feeds. Pure orchestration around the (impure)
 * fetch + store; everything classification-related is deterministic.
 */
export async function runFeedCollection(feeds: string[], now: string): Promise<FeedCollectionResult> {
  const result: FeedCollectionResult = {
    enabled: isSignalIngestEnabled(),
    feeds: feeds.length,
    fetched: 0,
    parsed: 0,
    added: 0,
    skipped: 0,
    errors: [],
  };
  if (!result.enabled) return result; // honest: nowhere durable to persist

  const safe = feeds.filter(isSafeFeedUrl);
  // Dedup against what's already stored (and across feeds within this run).
  const known = new Set((await listIngestedSignals(1000)).map((s) => s.fingerprint));

  for (const url of safe) {
    const xml = await fetchFeed(url);
    if (xml == null) {
      result.errors.push({ url, error: 'fetch failed' });
      continue;
    }
    result.fetched++;

    const inputs: RawSignalInput[] = parseRssFeed(xml).map((i) => ({
      ...i,
      sourceType: 'rss',
      collectionMethod: 'adapter',
      sourceName: i.sourceName || domainOf(url) || 'Feed',
    }));
    result.parsed += inputs.length;

    const { signals } = processRawInputs(inputs, DEFAULT_CONFIG, DEFAULT_COMPETITORS, {
      now,
      makeId: () => 'feed',
      knownFingerprints: known,
    });

    for (const s of signals) {
      const signal: Signal = { ...s, id: `sr_${s.fingerprint}`, ingested: true };
      const ok = await ingestSignal(signal);
      if (ok) {
        known.add(signal.fingerprint);
        result.added++;
      } else {
        result.skipped++;
      }
    }
  }

  return result;
}
