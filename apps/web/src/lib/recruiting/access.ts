// ============================================================
// SwingVantage — Recruiting: server-side coach-view authorization
// ------------------------------------------------------------
// THE server chokepoint for releasing a public recruiting snapshot.
//
// Today, /player/[shareSlug] reads a LOCAL-ONLY snapshot from the
// publishing device and gates it client-side — safe, because the
// data never leaves that device. The moment snapshots are served
// from the cloud, a client-side gate is bypassable (the data would
// already be on the wire). This function is the guard to call
// BEFORE any snapshot leaves the server, so the secure path is in
// place ahead of cloud sync.
//
// Contract: the snapshot is returned ONLY when fully authorized.
// Every denial withholds it (snapshot: undefined). Pure + framework-
// free so it runs in a route handler, an edge function, or a test.
//
// NOTE: per-item visibility is already applied at PUBLISH time
// (buildCoachViewSnapshot only includes permitted items), so this
// layer enforces the remaining gates: revocation, expiry, password.
// ============================================================

import { isLinkActive, hashPassword, type CoachViewSnapshot } from './share';
import { safeEqual } from '@/lib/security/constant-time';
import type { ShareLink } from './types';

export type CoachViewDenial =
  | 'not_found'
  | 'revoked_or_expired'
  | 'password_required'
  | 'password_incorrect';

export interface CoachViewAccess {
  ok: boolean;
  denial?: CoachViewDenial;
  /** Present ONLY when ok === true. Withheld on every denial. */
  snapshot?: CoachViewSnapshot;
}

export interface AuthorizeCoachViewInput {
  /** The share link, when known (server lookup). Null/undefined → rely on snapshot. */
  link?: ShareLink | null;
  /** The stored snapshot for this slug, or null when none exists. */
  snapshot?: CoachViewSnapshot | null;
  /** Password the visitor supplied (for password-protected links). */
  providedPassword?: string | null;
  now?: number;
}

/**
 * Decide whether a coach-view snapshot may be released, enforcing revocation,
 * expiry, and password ON THE SERVER. Returns the snapshot only when every
 * gate passes; otherwise returns a denial reason and no data.
 */
export function authorizeCoachView(input: AuthorizeCoachViewInput): CoachViewAccess {
  const { link, snapshot, providedPassword, now = Date.now() } = input;

  if (!snapshot) return { ok: false, denial: 'not_found' };

  // Revocation / expiry (when we have the link to check).
  if (link && !isLinkActive(link, now)) {
    return { ok: false, denial: 'revoked_or_expired' };
  }

  // Password — verified server-side; data is withheld until it matches.
  // Compared in CONSTANT TIME (safeEqual) so the route handler does not leak,
  // via response timing, how much of the hash a guess got right.
  if (snapshot.passwordProtected) {
    if (!providedPassword) return { ok: false, denial: 'password_required' };
    if (!snapshot.passwordHash || !safeEqual(hashPassword(providedPassword), snapshot.passwordHash)) {
      return { ok: false, denial: 'password_incorrect' };
    }
  }

  return { ok: true, snapshot };
}

/**
 * Reference shape for the future cloud-sync route. Wire it as:
 *
 *   const link = await getShareLinkBySlug(slug);
 *   const snapshot = await getPublishedSnapshot(slug);
 *   const access = authorizeCoachView({ link, snapshot, providedPassword });
 *   if (!access.ok) return NextResponse.json({ denial: access.denial }, { status });
 *   return NextResponse.json({ snapshot: access.snapshot });
 *
 * Never return `snapshot` (or its raw fields) on a denial.
 */
export const COACH_VIEW_DENIAL_STATUS: Record<CoachViewDenial, number> = {
  not_found: 404,
  revoked_or_expired: 410, // Gone
  password_required: 401,
  password_incorrect: 401,
};
