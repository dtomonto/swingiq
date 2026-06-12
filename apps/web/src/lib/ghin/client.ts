// ============================================================
// GHIN — live Handicap Index lookup (SERVER-ONLY)
// ------------------------------------------------------------
// GHIN/USGA publishes no public developer API. The de-facto endpoint
// (the one the official GHIN mobile app uses) authenticates with a GHIN
// account and returns a short-lived bearer token, which then authorizes a
// golfer search. We implement that flow defensively:
//
//   • OFF by default — `isGhinConfigured()` must be true (GHIN_USER +
//     GHIN_PASSWORD set). Otherwise we return { configured: false } and the
//     UI falls back to honest manual entry. No network call, no fabrication.
//   • Every value returned is parsed from the live response; on any failure
//     we return an honest error, never a made-up index.
//
// Endpoints are overridable via GHIN_API_BASE so the owner can repoint them
// if GHIN changes paths without a code change.
// ============================================================

import 'server-only';
import { isGhinConfigured } from '@/lib/capabilities';
import { parseHandicapIndex } from './validate';

const DEFAULT_BASE = 'https://api2.ghin.com/api/v1';
const REQUEST_SOURCE = 'GHINcom';
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
  /** ISO timestamp of this successful lookup. */
  revDate: string | null;
  /** Honest error message when the lookup could not complete. */
  error: string | null;
}

function base(): string {
  const raw = process.env.GHIN_API_BASE?.trim();
  return raw && raw.length > 0 ? raw.replace(/\/$/, '') : DEFAULT_BASE;
}

async function fetchJson(url: string, init: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`GHIN responded ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Authenticate with the configured GHIN account and return a bearer token. */
async function login(): Promise<string> {
  const body = {
    token: 'nonce',
    source: REQUEST_SOURCE,
    user: {
      email_or_ghin: process.env.GHIN_USER!.trim(),
      password: process.env.GHIN_PASSWORD!.trim(),
      remember_me: true,
    },
  };
  const data = (await fetchJson(`${base()}/golfer_login.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })) as { golfer_user?: { golfer_user_token?: string } };

  const token = data?.golfer_user?.golfer_user_token;
  if (!token) throw new Error('GHIN login did not return a token');
  return token;
}

interface GhinGolfer {
  hi_value?: unknown;
  handicap_index?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  club_name?: unknown;
  rev_date?: unknown;
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
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
    const token = await login();
    const data = (await fetchJson(
      `${base()}/golfers/search.json?golfer_id=${encodeURIComponent(digits)}&per_page=1&page=1`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
    )) as { golfers?: GhinGolfer[] };

    const golfer = Array.isArray(data?.golfers) ? data.golfers[0] : undefined;
    if (!golfer) {
      return { ...empty, configured: true, error: `No GHIN record found for #${digits}.` };
    }

    const index = parseHandicapIndex(
      (golfer.hi_value ?? golfer.handicap_index) as string | number | null,
    );
    if (index === null) {
      return { ...empty, configured: true, error: 'GHIN returned no usable Handicap Index.' };
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
    const message = err instanceof Error ? err.message : 'GHIN lookup failed';
    return { ...empty, configured: true, error: message };
  }
}
