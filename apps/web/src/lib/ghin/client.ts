// ============================================================
// GHIN — live Handicap Index lookup (SERVER-ONLY)
// ------------------------------------------------------------
// GHIN/USGA publishes no public developer API. This client speaks the
// de-facto endpoint the official GHIN mobile/web app uses. The real flow
// is two-step auth, mirrored from the community-maintained reverse
// engineering of the GHIN app (github.com/n8io/ghin):
//
//   1. Exchange GHIN's PUBLIC Firebase app config for a short-lived session
//      token (Google "firebase installations" endpoint).
//   2. POST that session token + the operator's GHIN account to
//      /golfer_login.json → a bearer token.
//   3. GET /golfers.json?golfer_id=… (Bearer auth) → the golfer record,
//      whose hi_value / hi_display is the official Handicap Index.
//
// Design guarantees:
//   • OFF by default — `isGhinConfigured()` must be true (GHIN_USER +
//     GHIN_PASSWORD set). Otherwise we return { configured: false } and the
//     UI keeps the golfer's self-reported value. No network call.
//   • Every value returned is parsed from the live response; on any failure
//     we return an honest error, never a fabricated index.
//
// The Firebase/Google identifiers below are PUBLIC client config from the GHIN
// app (not secrets). Hosts/ids are env-overridable so the owner can repoint
// them if GHIN rotates them, without a code change. The Firebase Google API
// key has no safe hardcoded default — it is supplied via GHIN_GOOGLE_API_KEY
// (required for live lookups); without it the session handshake fails with an
// honest error rather than shipping a key-shaped string in source.
// ============================================================

import 'server-only';
import { isGhinConfigured } from '@/lib/capabilities';
import { parseHandicapIndex } from './validate';

const DEFAULT_API_BASE = 'https://api2.ghin.com/api/v1';
const DEFAULT_FIREBASE_URL =
  'https://firebaseinstallations.googleapis.com/v1/projects/ghin-mobile-app/installations';
const SOURCE = 'GHINcom';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36';
// Public Firebase "web app" installation defaults for the GHIN project.
const FIREBASE_INSTALL_BODY = {
  appId: '1:884417644529:web:47fb315bc6c70242f72650',
  authVersion: 'FIS_v2',
  fid: 'fg6JfS0U01YmrelthLX9Iz',
  sdkVersion: 'w:0.5.7',
};
const TIMEOUT_MS = 8000;

export interface GhinLookupResult {
  /** Whether GHIN credentials are configured at all. */
  configured: boolean;
  /** Official Handicap Index (USGA "plus" handicaps are negative). */
  handicapIndex: number | null;
  /** Golfer's full name as held by GHIN, when available. */
  fullName: string | null;
  /** Club name on the GHIN record, when available. */
  club: string | null;
  /** ISO date string of the golfer's last handicap revision, when available. */
  revDate: string | null;
  /** Honest error message when the lookup could not complete. */
  error: string | null;
}

function apiBase(): string {
  const raw = process.env.GHIN_API_BASE?.trim();
  return raw && raw.length > 0 ? raw.replace(/\/$/, '') : DEFAULT_API_BASE;
}

async function fetchJson(url: string, init: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
      headers: { 'User-Agent': USER_AGENT, ...(init.headers ?? {}) },
    });
    if (!res.ok) {
      throw new Error(res.status === 401 || res.status === 403
        ? `GHIN authentication failed (${res.status}) — check GHIN_USER / GHIN_PASSWORD.`
        : `GHIN responded ${res.status}.`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Step 1 — exchange GHIN's public Firebase app config for a session token.
 * Returns the `authToken.token` the login call requires.
 */
async function getSessionToken(): Promise<string> {
  const url = process.env.GHIN_FIREBASE_URL?.trim() || DEFAULT_FIREBASE_URL;
  const apiKey = process.env.GHIN_GOOGLE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'GHIN_GOOGLE_API_KEY is not set — the live GHIN lookup needs the public Firebase API key from the GHIN app to start the session handshake.',
    );
  }
  const data = (await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(FIREBASE_INSTALL_BODY),
  })) as { authToken?: { token?: string } };

  const token = data?.authToken?.token;
  if (!token) throw new Error('GHIN session handshake returned no token.');
  return token;
}

/**
 * Step 2 — authenticate the configured GHIN account and return a bearer token.
 */
async function login(sessionToken: string): Promise<string> {
  const data = (await fetchJson(`${apiBase()}/golfer_login.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: sessionToken,
      user: {
        email_or_ghin: process.env.GHIN_USER!.trim(),
        password: process.env.GHIN_PASSWORD!.trim(),
      },
    }),
  })) as { golfer_user?: { golfer_user_token?: string } };

  const token = data?.golfer_user?.golfer_user_token;
  if (!token) throw new Error('GHIN login did not return a token — check credentials.');
  return token;
}

interface GhinGolfer {
  hi_value?: unknown;
  hi_display?: unknown;
  handicap_index?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  club_name?: unknown;
  rev_date?: unknown;
  status?: unknown;
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

/** First parseable Handicap Index across the fields GHIN may populate. */
function readIndex(g: GhinGolfer): number | null {
  for (const candidate of [g.hi_value, g.hi_display, g.handicap_index]) {
    const parsed = parseHandicapIndex(candidate as string | number | null);
    if (parsed !== null) return parsed;
  }
  return null;
}

/**
 * Look up a golfer's official Handicap Index by GHIN number.
 *
 * Returns { configured: false } when credentials are absent (keyless mode).
 * On a real failure, returns an honest `error` and a null index — it never
 * fabricates a value.
 */
export async function lookupHandicapIndex(ghinNumber: string): Promise<GhinLookupResult> {
  const empty: GhinLookupResult = {
    configured: false,
    handicapIndex: null,
    fullName: null,
    club: null,
    revDate: null,
    error: null,
  };

  if (!isGhinConfigured()) return empty;

  const digits = ghinNumber.replace(/\D/g, '');
  if (!/^\d{6,10}$/.test(digits)) {
    return { ...empty, configured: true, error: 'Enter a valid 6–10 digit GHIN number.' };
  }

  try {
    const sessionToken = await getSessionToken();
    const bearer = await login(sessionToken);

    const params = new URLSearchParams({
      source: SOURCE,
      from_ghin: 'true',
      per_page: '1',
      page: '1',
      sorting_criteria: 'full_name',
      order: 'asc',
      golfer_id: digits,
    });
    const data = (await fetchJson(`${apiBase()}/golfers.json?${params.toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${bearer}` },
    })) as { golfers?: GhinGolfer[] };

    const golfer = Array.isArray(data?.golfers) ? data.golfers[0] : undefined;
    if (!golfer) {
      return { ...empty, configured: true, error: `No GHIN record found for #${digits}.` };
    }

    const index = readIndex(golfer);
    if (index === null) {
      return { ...empty, configured: true, error: 'GHIN returned no usable Handicap Index for this golfer.' };
    }

    const name = [str(golfer.first_name), str(golfer.last_name)].filter(Boolean).join(' ');
    return {
      configured: true,
      handicapIndex: index,
      fullName: name || null,
      club: str(golfer.club_name),
      revDate: str(golfer.rev_date),
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === 'AbortError'
          ? 'GHIN timed out. Try again in a moment.'
          : err.message
        : 'GHIN lookup failed.';
    return { ...empty, configured: true, error: message };
  }
}
