# F6 — Nonce-based CSP (drop `script-src 'unsafe-inline'`)

_Sprint 4 of the growth program. **Turnkey implementation — apply + validate on a
preview, then enable in prod.** Not auto-shipped: a wrong nonce setup white-screens
every page, and that can only be validated with a production build in a real
browser (dev mode is invalid here — React uses `eval` in dev, which the strict prod
CSP forbids). `next.config.mjs` + `middleware.ts` are CODEOWNERS-protected._

## Why this is the last hardening

`script-src 'self' 'unsafe-inline'` (next.config.mjs) lets any injected inline
`<script>` execute — it materially weakens XSS defense. A per-request **nonce**
replaces `'unsafe-inline'`: only scripts carrying the exact nonce run. The app has
**exactly one** inline script to wire (`THEME_BOOTSTRAP`, `app/layout.tsx:86`);
Next's own framework scripts pick up the nonce automatically in the App Router.

## Design: env-gated, default-inert

Gate everything behind `CSP_NONCE === '1'`. **Unset (default) → byte-identical to
today** (zero prod risk). Set it only on a preview deploy to validate, then in prod.

### 1. `apps/web/src/middleware.ts` — generate the nonce + set the CSP

Add near the top of `middleware()` (before the public-path early return so headers
apply to every HTML response). Use the Web Crypto API (Edge runtime):

```ts
const NONCE_ON = process.env.CSP_NONCE === '1';

function buildNonceCsp(nonce: string): string {
  return [
    "default-src 'self'",
    // 'strict-dynamic' lets Next's nonce'd loader pull in its chunk scripts;
    // drop 'unsafe-inline' (ignored by browsers that honor the nonce anyway).
    // 'wasm-unsafe-eval' MUST stay — the on-device MediaPipe pose engine needs
    // it for WebAssembly.instantiate, or the video overlays report "no body
    // pose detected". (strict-dynamic ignores host allowlists for scripts, so
    // the MediaPipe loader is trusted via the nonce chain; only the runtime
    // FETCHES below need explicit hosts.)
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval' https://vercel.live`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
    "media-src 'self' blob: https://*.supabase.co https://*.supabase.in",
    // connect-src must keep the MediaPipe pose assets (WASM runtime on jsdelivr,
    // model .task on Google Cloud Storage) or on-device pose silently fails.
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live https://cdn.jsdelivr.net https://storage.googleapis.com",
    "worker-src 'self' blob:",
    "object-src 'none'", "base-uri 'self'", "form-action 'self'",
    "frame-ancestors 'none'", "upgrade-insecure-requests",
  ].join('; ');
}
```

In `middleware()`, when `NONCE_ON` and the request is an HTML navigation, generate a
nonce and attach it to BOTH a request header (so the layout can read it) and the
response CSP header:

```ts
let nonce: string | undefined;
if (NONCE_ON) {
  nonce = crypto.randomUUID().replace(/-/g, ''); // base64 also fine
}

// ...where you build the NextResponse (the function already creates `response`
// for the Supabase branch; create one early for the public branch too):
const requestHeaders = new Headers(request.headers);
if (nonce) requestHeaders.set('x-nonce', nonce);
const res = NextResponse.next({ request: { headers: requestHeaders } });
if (nonce) res.headers.set('Content-Security-Policy', buildNonceCsp(nonce));
return res; // use this `res` in every return path
```

> Keep the existing public-path/auth logic; only thread the nonce + CSP onto the
> `NextResponse` you already return. The `matcher` already excludes static assets.

### 2. `apps/web/next.config.mjs` — don't double-set the CSP

When the nonce is on, the middleware owns the script CSP. Make the static CSP header
conditional so you never emit two conflicting policies:

```js
const NONCE_ON = process.env.CSP_NONCE === '1';
// ...in the headers() CSP entry:
key: 'Content-Security-Policy',
value: NONCE_ON
  ? "default-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
  : [ /* …the CURRENT policy, unchanged… */ ].join('; '),
```

(When `NONCE_ON`, the middleware sets the full per-request policy; the static one
becomes a harmless minimal fallback for non-HTML responses. When off, the current
policy is emitted exactly as today.)

### 3. `apps/web/src/app/layout.tsx` — nonce the one inline script

```ts
import { headers } from 'next/headers';
// ...inside the async layout component:
const nonce = (await headers()).get('x-nonce') ?? undefined;
// line 86:
<script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
```

When `nonce` is `undefined` (CSP_NONCE off) the attribute is omitted and the script
runs under the existing `'unsafe-inline'` policy — i.e., unchanged.

## Validate on a preview (the part I cannot do here)

1. Deploy a preview with `CSP_NONCE=1`. **Use a production build** (`next build`),
   not `next dev` (dev requires `eval`, which this CSP blocks — a false failure).
2. Open the **public homepage `/`** (it's not auth-gated) with DevTools console open.
3. Confirm: **no `Content-Security-Policy` violation errors**, the theme bootstrap
   applies (no light/dark flash), the page is interactive, and `view-source` shows
   `nonce="…"` on the bootstrap script + Next's scripts.
4. Repeat on `/pricing`, `/blog`, a sport hub, and one logged-in app route.
5. If clean, set `CSP_NONCE=1` in production. If anything breaks, unset it — the app
   instantly reverts to today's policy (the gate is inert when off).

## Rollback

Single env var: unset `CSP_NONCE` (or set ≠ `1`). No code revert needed — the
default path is unchanged.
