// ============================================================
// SwingVantage Admin — Setup & Next Steps: types
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   This is the data model behind the "Setup & Next Steps" hub
//   (/admin/setup) — the one place a non-technical owner can see every
//   manual thing they might need to do (add a key, run a database file,
//   verify DNS) laid out as beginner-friendly cards.
//
//   A SetupTask is one such thing. Each task knows how to check whether
//   it's already DONE (`detect`) so the hub stays honest and current
//   with zero manual ticking for anything we can observe (keys, env
//   vars, connected integrations). Things we genuinely can't observe
//   (a database file you pasted into Supabase, a DNS record) are
//   "mark when done" instead.
//
//   Tasks come from three places, all merged in registry.ts:
//     1. CATALOG (catalog.ts) — hand-written, beginner-worded essentials.
//     2. GENERATED (data/setup-registry.json) — auto-discovered database
//        schema files + any `Setup:` commit trailers, refreshed by
//        scripts/scan-setup.mjs (so FUTURE items appear on their own).
//     3. (future) anything else that emits SetupTask-shaped records.
// ============================================================

/** The live capabilities we can read server-side (mirrors capabilities.ts). */
export type CapabilityKey =
  | 'auth' | 'aiCoach' | 'aiVision' | 'ocr' | 'email' | 'billing' | 'ads';

/** How important a task is — drives ordering and the progress meter. */
export type SetupPriority = 'required' | 'recommended' | 'optional';

/** Buckets the hub groups tasks under (each gets a friendly heading). */
export type SetupCategory =
  | 'go-live'      // protect admin, connect accounts, point at your domain
  | 'data'         // database schema files to apply in Supabase
  | 'ai'           // AI coach / vision / OCR / spend guardrails
  | 'email'        // transactional + contact email
  | 'growth'       // analytics, ads, billing, search console
  | 'reliability'  // rate limiting, cron secrets
  | 'local-setup'  // one-time things on your own computer
  | 'deploy';      // how shipping works

/** A concrete thing the owner copies or opens to complete a step. */
export interface SetupInput {
  /**
   * env     → `value` is the VARIABLE NAME to add (e.g. SUPABASE_SERVICE_ROLE_KEY)
   * command → `value` is a terminal command to run (e.g. npm run hooks:install)
   * file    → `value` is a repo file path to open (e.g. apps/web/supabase-rls.sql)
   * url     → `value` is a link to open (e.g. the Supabase dashboard)
   * value   → `value` is a literal snippet to copy
   */
  kind: 'env' | 'command' | 'file' | 'url' | 'value';
  value: string;
  /** Friendly label (e.g. "Open your Supabase dashboard"). */
  label?: string;
  /** Example/placeholder for env vars — NEVER a real secret. */
  example?: string;
  /** Secret env vars get a "keep this private, server-side only" reminder. */
  secret?: boolean;
  /** Where to do/find it (e.g. "Supabase → Settings → API"). */
  where?: string;
}

/**
 * How the hub decides if a task is already satisfied.
 *  - capability: read a live server capability (real keys → real upgrade).
 *  - env:        true if ANY of these env vars is set to a real value.
 *  - derived:    a named boolean computed server-side (status.ts) for the
 *                few checks that need logic (e.g. "site URL is a real domain,
 *                not localhost").
 *  - manual:     can't be observed — the owner marks it done (persisted).
 *  - info:       reference card; never "to-do", never in the progress meter.
 */
export type SetupDetect =
  | { kind: 'capability'; cap: CapabilityKey }
  | { kind: 'env'; anyOf: string[] }
  | { kind: 'derived'; key: string }
  | { kind: 'manual' }
  | { kind: 'info' };

/** One beginner-friendly action item. */
export interface SetupTask {
  id: string;
  title: string;
  /** What it is + why it matters, in 1–3 plain sentences. */
  plainEnglish: string;
  category: SetupCategory;
  priority: SetupPriority;
  detect: SetupDetect;
  /** Numbered, do-this-then-that steps a beginner can follow. */
  steps: string[];
  /** The exact things to paste/open/run, each with a copy button in the UI. */
  inputs?: SetupInput[];
  /** A deeper-dive link (an admin page or a docs file). */
  learnMoreHref?: string;
  learnMoreLabel?: string;
  /** Where an auto-discovered task came from (schema file path, commit sha). */
  source?: string;
}

/** Resolved status for one task (computed from the live signal + acks). */
export type SetupStatus = 'done' | 'action-needed' | 'optional-todo' | 'reference';

export interface ResolvedTask extends SetupTask {
  status: SetupStatus;
  /**
   * True when `status` came from a real, live signal (a configured key,
   * a connected integration) rather than someone ticking a box. Lets the
   * UI say "detected automatically" vs "you marked this done".
   */
  autoDetected: boolean;
}

/**
 * The honest, secret-free snapshot the server hands the client so the
 * pure resolver can run anywhere. Contains ONLY booleans — never a value.
 */
export interface SetupSignal {
  /** Live capability summary (auth, aiVision, …). */
  caps: Record<CapabilityKey, boolean>;
  /** Presence (set to a real value?) for each env var the catalog references. */
  env: Record<string, boolean>;
  /** Named booleans for `derived` detections (computed in status.ts). */
  derived: Record<string, boolean>;
  generatedAt: string;
}

/** Roll-up numbers for the progress meter + headline. */
export interface SetupSummary {
  /** Essentials = required + recommended. */
  essentialsTotal: number;
  essentialsDone: number;
  optionalTotal: number;
  optionalDone: number;
  /** Required tasks still needing action (the "do these first" count). */
  requiredOutstanding: number;
}
