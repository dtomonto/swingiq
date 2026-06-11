// ============================================================
// SignalRadar OS — adapter registry (PURE)
// ------------------------------------------------------------
// One typed registry of every signal source. Adding a source later is a
// registry entry, not a rewrite (audit-first house rule). Keyless-first:
// the manual + import adapters produce REAL signals with no keys; the
// automated adapters are scaffolded (mode: 'automated') and stay OFF
// until credentials exist — they never pretend to collect (house rule #2).
//
// The server resolver (adapters.server.ts) reads env to decide each
// adapter's live state — booleans only, never secret values.
// ============================================================

import type { AdapterDef, AdapterStatus, AdapterConfigState } from './types';

export const ADAPTERS: readonly AdapterDef[] = [
  {
    id: 'manual',
    name: 'Manual signal',
    sourceType: 'manual',
    mode: 'manual',
    blurb: 'Type or paste a single mention, quote, URL, email or screenshot description.',
    envVars: [],
    keyless: true,
    setupInstructions: 'No setup. Use “Add signal” in the inbox — it’s classified + scored like any other signal.',
    dedupeStrategy: 'URL when present, else normalized title + text hash.',
  },
  {
    id: 'google_alerts',
    name: 'Google Alerts import',
    sourceType: 'google_alerts',
    mode: 'import',
    blurb: 'Paste a Google Alerts digest; each result becomes a signal.',
    envVars: [],
    keyless: true,
    setupInstructions:
      'Create Google Alerts for "SwingVantage", "swing analysis app", competitor names, etc. When the digest email arrives, paste its body into Import → Google Alerts.',
    dedupeStrategy: 'Result URL per alert block.',
  },
  {
    id: 'rss',
    name: 'RSS / Atom import',
    sourceType: 'rss',
    mode: 'import',
    blurb: 'Paste an RSS/Atom feed body (blog, news, subreddit .rss, YouTube channel feed).',
    envVars: [],
    keyless: true,
    setupInstructions:
      'Open any feed URL (e.g. reddit.com/r/golf/search.rss?q=swing+analysis or a blog /feed), copy the XML, and paste into Import → RSS. No scraping, fully ToS-safe.',
    dedupeStrategy: '<item>/<entry> link, else title hash.',
  },
  {
    id: 'csv',
    name: 'CSV import',
    sourceType: 'csv',
    mode: 'import',
    blurb: 'Bulk-import a spreadsheet export of mentions (url, title, text, source, author, date).',
    envVars: [],
    keyless: true,
    setupInstructions: 'Export mentions to CSV with any of: url/link, title, text/snippet, source, author, published. Paste into Import → CSV.',
    dedupeStrategy: 'Row URL, else title + text hash.',
  },
  {
    id: 'ai_answer_engine',
    name: 'AI answer-engine audit',
    sourceType: 'ai_answer_engine',
    mode: 'manual',
    blurb: 'Record whether SwingVantage appears in ChatGPT / Perplexity / AI Overview answers.',
    envVars: [],
    keyless: true,
    setupInstructions: 'Use the AI Visibility tab: run a test prompt in your AI tool of choice and record the result. Manual + auditable by design.',
    dedupeStrategy: 'Query + platform.',
  },
  {
    id: 'webhook',
    name: 'Inbound webhook',
    sourceType: 'webhook',
    mode: 'automated',
    blurb: 'Live endpoint: accept signals POSTed by Zapier/Make/your own automations.',
    envVars: ['SIGNALRADAR_WEBHOOK_SECRET'],
    keyless: false,
    setupInstructions: 'Set SIGNALRADAR_WEBHOOK_SECRET, then POST mentions to /api/signal-radar/webhook with header x-signalradar-secret (JSON: {text, title?, url?, sourceType?, author?}). Each is classified, scored and stored when Supabase is configured; the route 404s while the secret is unset.',
    dedupeStrategy: 'Fingerprint (URL, else title+text) — idempotent upsert.',
  },
  {
    id: 'reddit',
    name: 'Reddit search',
    sourceType: 'reddit',
    mode: 'automated',
    blurb: 'Scheduled search of public subreddits for demand + brand terms (compliant API).',
    envVars: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'],
    keyless: false,
    setupInstructions: 'Register a Reddit script app, set REDDIT_CLIENT_ID/SECRET. Until then, use the RSS import (reddit search .rss is keyless).',
    dedupeStrategy: 'Reddit permalink.',
  },
  {
    id: 'youtube',
    name: 'YouTube search',
    sourceType: 'youtube',
    mode: 'automated',
    blurb: 'Scheduled YouTube Data API search for relevant videos + comment metadata.',
    envVars: ['YOUTUBE_API_KEY'],
    keyless: false,
    setupInstructions: 'Create a YouTube Data API key, set YOUTUBE_API_KEY. Until then, use the RSS import (channel feeds are keyless).',
    dedupeStrategy: 'Video id.',
  },
  {
    id: 'search_console',
    name: 'Search Console queries',
    sourceType: 'search_console',
    mode: 'automated',
    blurb: 'Derive demand signals from the real queries bringing users to SwingVantage.',
    envVars: ['GOOGLE_SEARCH_CONSOLE_KEY'],
    keyless: false,
    setupInstructions: 'Connect Google Search Console (service-account key in GOOGLE_SEARCH_CONSOLE_KEY) to surface question-shaped queries as content opportunities.',
    dedupeStrategy: 'Query string + page.',
  },
  {
    id: 'backlink',
    name: 'Backlink discovery',
    sourceType: 'backlink',
    mode: 'automated',
    blurb: 'Find sites mentioning/ linking SwingVantage or competitors (via a backlink API).',
    envVars: ['AHREFS_API_KEY', 'SEMRUSH_API_KEY', 'DATAFORSEO_LOGIN'],
    keyless: false,
    setupInstructions: 'Reuses GrowthOS link-intelligence credentials when present. Until then, log backlink opportunities manually.',
    dedupeStrategy: 'Referring domain + target URL.',
  },
  {
    id: 'analytics',
    name: 'Analytics-derived',
    sourceType: 'analytics',
    mode: 'automated',
    blurb: 'Turn product analytics events (e.g. confusion/funnel drop-offs) into product signals.',
    envVars: ['NEXT_PUBLIC_POSTHOG_KEY'],
    keyless: false,
    setupInstructions: 'When PostHog is connected, repeated drop-off / rage-click events can be ingested as product-feedback signals.',
    dedupeStrategy: 'Event fingerprint.',
  },
] as const;

export function getAdapter(id: string): AdapterDef | undefined {
  return ADAPTERS.find((a) => a.id === id);
}

/** Adapter ids that produce real signals with no credentials (live today). */
export const KEYLESS_ADAPTER_IDS = ADAPTERS.filter((a) => a.keyless).map((a) => a.id);

/** Per-adapter run metadata an operator may have recorded (e.g. last import). */
export interface AdapterRuntime {
  lastRunAt?: string;
  lastResultCount?: number;
  lastError?: string;
}

function envHas(env: Record<string, string | undefined>, key: string): boolean {
  const v = env[key];
  if (typeof v !== 'string') return false;
  const t = v.trim();
  return t !== '' && t !== 'none' && !t.startsWith('your-') && !t.startsWith('change-me');
}

function resolveState(
  def: AdapterDef,
  hasCredentials: boolean,
  runtime?: AdapterRuntime,
): AdapterConfigState {
  if (runtime?.lastError) return 'failing';
  if (def.mode === 'manual' || def.mode === 'import') return 'manual_only';
  // Automated adapters are scaffolded; collection isn't wired yet, so we are
  // honest: configured-but-disabled when keys exist, placeholder otherwise.
  return hasCredentials ? 'configured_disabled' : 'placeholder';
}

/**
 * Resolve every adapter's live state from an env map. PURE + injectable
 * (env defaults to {}). Returns booleans only — NEVER secret values.
 */
export function resolveAdapterStatuses(
  env: Record<string, string | undefined> = {},
  runtimes: Record<string, AdapterRuntime> = {},
): AdapterStatus[] {
  return ADAPTERS.map((def) => {
    const hasCredentials = def.envVars.length > 0 && def.envVars.some((k) => envHas(env, k));
    const runtime = runtimes[def.id];
    return {
      id: def.id,
      name: def.name,
      sourceType: def.sourceType,
      blurb: def.blurb,
      envVars: def.envVars,
      keyless: def.keyless,
      setupInstructions: def.setupInstructions,
      dedupeStrategy: def.dedupeStrategy,
      state: resolveState(def, hasCredentials, runtime),
      hasCredentials,
      lastRunAt: runtime?.lastRunAt,
      lastResultCount: runtime?.lastResultCount,
      lastError: runtime?.lastError,
    };
  });
}

export interface AdapterHealthSummary {
  total: number;
  live: number; // keyless adapters available today
  scaffolded: number; // automated, not yet collecting
  failing: number;
}

export function summarizeAdapters(statuses: AdapterStatus[]): AdapterHealthSummary {
  return {
    total: statuses.length,
    live: statuses.filter((s) => s.state === 'manual_only' || s.state === 'active' || s.state === 'healthy').length,
    scaffolded: statuses.filter((s) => s.state === 'placeholder' || s.state === 'configured_disabled').length,
    failing: statuses.filter((s) => s.state === 'failing').length,
  };
}
