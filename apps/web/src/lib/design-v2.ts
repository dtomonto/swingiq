// ============================================================
// SwingVantage — Design V2 feature flag
//
// The redesign (token axes + new component variants + restyled
// surfaces) shipped behind this flag, phase by phase. As of the Phase 8
// GA flip it is the DEFAULT experience; the flag is kept as a reversible
// rollback switch (set the env or a cookie to `0`).
//
// Precedence (highest first):
//   1. Per-request cookie override  `sv_design_v2=1|0` (per-browser opt-in/out).
//   2. Build/runtime env            `NEXT_PUBLIC_DESIGN_V2=0` to roll back.
//   3. Default ON (GA).
//
// Pure + dependency-free so it runs on the server (cookie string),
// the client (document.cookie), and in tests.
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

/**
 * Is the redesign enabled from the environment alone (no cookie override)?
 *
 * GA (Phase 8): the redesign is now the DEFAULT experience — ON unless
 * explicitly disabled. `NEXT_PUBLIC_DESIGN_V2=0` (or `false`/`off`/`no`) is the
 * deploy-wide rollback switch; unset or any truthy value keeps it ON.
 */
export function designV2EnabledFromEnv(): boolean {
  return parseFlag(process.env.NEXT_PUBLIC_DESIGN_V2) !== false;
}

/**
 * Resolve the Design V2 flag. A recognized cookie value WINS over the env (so a
 * browser can opt out — `sv_design_v2=0` — or back in regardless of the deploy
 * default); otherwise the env decides; the env default is now ON (GA).
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
