// ============================================================
// SwingVantage — Design V2 feature flag
//
// The redesign (token axes + new component variants + restyled
// surfaces) mounts behind this flag until the Phase 8 GA flip, so
// every phase is additive and reversible: flag OFF restores the
// shipped UI exactly.
//
// Precedence (highest first):
//   1. Per-request cookie override  `sv_design_v2=1|0` (cohort testing
//      and the staged 10% → 50% → 100% rollout drive this).
//   2. Build/runtime env            `NEXT_PUBLIC_DESIGN_V2=1`.
//   3. Default OFF.
//
// Pure + dependency-free so it runs on the server (cookie string),
// the client (document.cookie), and in tests. Mirrors the keyless,
// off-until-enabled pattern used across the app (see capabilities.ts).
// ============================================================

export const DESIGN_V2_COOKIE = 'sv_design_v2';

const TRUE = new Set(['1', 'true', 'on', 'yes']);
const FALSE = new Set(['0', 'false', 'off', 'no']);

/** Interpret an env/cookie token; `null` when unset or unrecognized. */
function parseFlag(value: string | null | undefined): boolean | null {
  if (value == null) return null;
  const v = value.trim().toLowerCase();
  if (TRUE.has(v)) return true;
  if (FALSE.has(v)) return false;
  return null;
}

/** Is the redesign enabled from the environment alone (no cookie override)? */
export function designV2EnabledFromEnv(): boolean {
  return parseFlag(process.env.NEXT_PUBLIC_DESIGN_V2) === true;
}

/**
 * Resolve the Design V2 flag. A recognized cookie value WINS over the env
 * (so an operator/cohort can opt a browser in or out regardless of the
 * deploy-wide default); otherwise the env decides; otherwise OFF.
 *
 * @param cookieValue the raw value of the `sv_design_v2` cookie, if any.
 */
export function designV2Enabled(cookieValue?: string | null): boolean {
  const override = parseFlag(cookieValue);
  if (override != null) return override;
  return designV2EnabledFromEnv();
}

/** Read the `sv_design_v2` cookie from a raw Cookie header / document.cookie. */
export function readDesignV2Cookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === DESIGN_V2_COOKIE) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

/**
 * Client-side resolution: reads the cookie off `document.cookie`, falling back
 * to the env default during SSR / when `document` is unavailable.
 */
export function designV2EnabledClient(): boolean {
  if (typeof document === 'undefined') return designV2EnabledFromEnv();
  return designV2Enabled(readDesignV2Cookie(document.cookie));
}
