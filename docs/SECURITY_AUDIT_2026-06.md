# SwingVantage Security Audit Report

> **In Plain English (start here).** I went through SwingVantage like an attacker
> and like an acquirer's security team would. The short version: **your security
> baseline is genuinely strong for a pre-revenue product** — real Row-Level
> Security on every user table, constant-time secret checks, a distributed rate
> limiter that never fails open, no committed secrets, 0 vulnerable dependencies,
> and a privacy-respecting "frames-only, nothing-stored" video pipeline. I found
> **no Critical issues and no way for one user to read another user's data.**
>
> The most important real-world weakness was that every abuse/cost limit keyed on
> an IP address that a determined attacker could fake — which would let a bot army
> run up your AI bill. **I fixed that** (and four other things) directly in the
> code, with tests. The remaining work is mostly "before you turn on ads / take
> investment" hardening, not emergencies.
>
> Overall readiness: **7.5 / 10** — safe to keep growing, with a short must-do list
> before aggressive ad-driven traffic.

Audit date: 2026-06-06 · Scope: `apps/web` (Next.js 16 App Router), `packages/core`,
Supabase schema, deployment config · Method: full source review + dependency audit
+ secret scan. No destructive or third-party testing was performed.

---

## Update — 2026-06-09: post-audit remediation shipped

Since this report, the following deferred items have been **shipped to
origin/master** (this banner keeps the register below from going stale):

- **F4 — admin defense-in-depth** ✅ — the 6 service-role admin data adapters
  (`lib/admin/data/*`) now re-assert `requireAdmin()` before any cross-user read.
- **F12 — research cron gating** ✅ — `/api/research/run` allow-listed in
  middleware (self-protected by `CRON_SECRET`).
- **F13 — checkout binding** ✅ — `billing/checkout` now binds
  `client_reference_id = user.id` and requires sign-in once Stripe is live.
- **F15 — shared-device privacy** ✅ — device-local data is wiped on cloud
  sign-out (data-loss-safe) + a complete "Clear this device" action.
- **F6 — nonce CSP** — turnkey, env-gated implementation written up in
  `docs/security/F6-nonce-csp.md` (apply + validate on a preview; not yet live).
- **DevSecOps** ✅ — branch protection on `master` (required CI checks), the
  Security-Audit ESLint job fixed, and the conflicting advanced CodeQL workflow
  removed (GitHub default CodeQL setup still scans).

Still deferred on purpose: **F3** (server-side recruiting auth — before cloud
sharing ships) and the nonce-CSP go-live (**F6**, owner-validated on preview).
The register and checklists below predate these fixes; treat this banner as the
current source of truth.

---

## 1. Executive Summary

SwingVantage is a local-first, multi-sport AI performance app on Next.js 16 +
Supabase, deployed on Vercel. Most user data lives in the browser (Zustand +
localStorage) and is **optionally** mirrored to Supabase relational tables when a
user signs in. This architecture is the single most important fact about the
threat model: **the server holds very little user data, and what it does hold is
protected by Row-Level Security.**

**Overall posture: strong baseline, a few scaling-stage gaps.** The team has
clearly invested in security already (there is a `lib/security/` module, a
constant-time comparator, a fail-closed middleware, a distributed rate limiter,
and a documented `.env.example`).

### Top 5 risks (pre-fix)

1. **AI cost-exhaustion via IP spoofing** *(High — FIXED in this pass).* Every
   rate limit keyed on the spoofable leftmost `X-Forwarded-For`, so a bot could
   mint a fresh bucket per request and hammer the paid AI routes.
2. **Stored-XSS sink in JSON-LD** *(Medium — FIXED).* Two structured-data blocks
   serialized AI/admin-generated text with raw `JSON.stringify`, allowing a
   `</script>` breakout on public pages.
3. **Client-side-only password gate on public recruiting profiles** *(Medium —
   design fix required before cloud sync).* The full profile + password hash are
   delivered to the browser and checked in JS.
4. **Admin read-pages depend on the layout guard alone** *(Medium).* Service-role
   data adapters don't independently re-assert `requireAdmin`; Next.js runs page
   server code concurrently with the layout.
5. **No global AI spend ceiling** *(Informational→Medium at scale).* Per-IP caps
   exist, but there is no fleet-wide daily budget kill-switch.

### Immediate action required

- **Done in this pass:** trusted client-IP resolution, JSON-LD escaping,
  middleware fail-closed hardening, constant-time CRON check, CSP `base-uri` /
  `form-action`. Deploy with `x-real-ip` available (default on Vercel) and set
  `UPSTASH_REDIS_REST_URL/TOKEN` so the cap holds fleet-wide.
- **Before ads:** youth-safe / non-personalized ad config + consent; a global AI
  daily budget counter; bot mitigation (Turnstile) on the unauthenticated AI
  routes.

### Readiness ratings

| Audience | Rating | Blockers |
|---|---|---|
| Keep growing organically | **8/10** | none blocking |
| Investor technical diligence | **7/10** | server-side recruiting auth, admin defense-in-depth, audit logging, SDLC scanners |
| Enterprise / SOC 2 screening | **5/10** | tamper-evident audit logs, formal access reviews, DPA/retention, pen-test |
| Acquisition-grade diligence | **6/10** | the above + documented incident response + data-deletion SLAs |

---

## 2. Application Attack Surface Map

**Framework / hosting:** Next.js 16 (App Router, RSC + route handlers) on Vercel;
Turborepo monorepo. **Auth:** Supabase Auth (SSR cookies). **Data:** Supabase
Postgres with RLS; browser localStorage is the working copy. **Storage:** Supabase
Storage (CSP allows `*.supabase.co`), but swing **videos never leave the browser**
— only extracted frames are POSTed for analysis and are not persisted.
**AI:** OpenAI / Anthropic / Google, server-side keys only. **Payments:** Stripe
(webhook-driven entitlements). **Email:** Resend/ConvertKit/Mailchimp (optional).
**Analytics/Ads:** Plausible/GA/PostHog + AdSense, all opt-in via `NEXT_PUBLIC_*`.

| Surface | Examples | Trust boundary |
|---|---|---|
| Public pages | `/`, marketing, `/blog`, `/learn`, `/sample-report`, sport hubs | none (anonymous) |
| Public forms (API) | `/api/contact`, `/api/email-capture` | anonymous + per-IP rate limit |
| Public AI (API) | `/api/ai-coach`, `/api/video-vision-analysis`, `/api/video-analysis`, `/api/import/ocr` | anonymous + per-IP rate limit (**cost surface**) |
| Public share | `/player/[shareSlug]` (recruiting, noindex) | **client-side** localStorage + JS password gate |
| Authenticated app | `/dashboard`, `/sessions`, `/training`, `/video`, `/profile`, `/settings`, … | middleware session check + RLS |
| User data API | `/api/user/export`, `/api/user/import/restore`, `/api/user/import/preview` | session + RLS (`auth.uid() = user_id`) |
| Billing API | `/api/billing/checkout|portal|status|webhook` | session (portal/status), Stripe signature (webhook) |
| Admin UI + API | `/admin/*`, `/api/admin/users/[id]`, GrowthOS, Video Studio, Social, Research | `ADMIN_SECRET` header **or** `ADMIN_EMAILS` allowlist, + RBAC; service-role DB |
| Cron | `/api/research/run`, `/api/social/run-scheduled` | `CRON_SECRET` bearer (constant-time) |
| Crawler files | `/sitemap.xml`, `/robots.txt`, `/llms.txt` | public, curated static content |

---

## 3. Severity Dashboard

| Severity | Count | Description |
|---|---:|---|
| Critical | 0 | No auth bypass, cross-user data access, secret leakage, or RCE found |
| High | 1 | AI cost-exhaustion via IP-spoofable rate limiting **(fixed)** |
| Medium | 6 | XSS sink (fixed), client-side recruiting auth, admin defense-in-depth, fail-open misconfig (fixed), CSP `unsafe-inline`, weak prompt-injection filter |
| Low | 6 | CRON timing (fixed), super-admin default, header polish, cron path gating, checkout binding, email CTA href |
| Informational | 5 | Global AI budget, localStorage exposure, youth/consent policy, SDLC scanners, server-side audit log |

---

## 4. Findings Register

### Finding 1: AI cost-exhaustion & abuse via spoofable client IP — **FIXED**
- **Severity:** High
- **Affected area:** All rate-limited API routes (abuse / AI-spend control)
- **Affected files/routes:** 23 handlers (`ai-coach`, `video-vision-analysis`,
  `video-analysis`, `import/ocr`, `growth/ai`, `agents/*`, `billing/*`,
  `social/*`, `recruiting/summary`, `athletic-journey/narrative`,
  `email-capture`, `contact`) + `lib/video-studio/server/guards.ts`.
- **Business risk:** A free, ad-supported product is a bot magnet. The per-IP
  limit is the **only** thing capping spend on the paid vision/LLM routes. Bypass
  = unbounded API bill + degraded service + skewed analytics.
- **Technical risk:** Every route derived the IP as
  `req.headers.get('x-forwarded-for')?.split(',')[0]`. On Vercel the proxy
  *appends* the real IP, so the **leftmost** value is attacker-supplied. Sending
  `X-Forwarded-For: <random>` yields a brand-new rate-limit bucket on every
  request → the limit never trips.
- **Evidence:** `apps/web/src/app/api/ai-coach/route.ts:26` (pre-fix) and 22
  identical sites.
- **Exploit scenario:** `for i in $(seq 1 100000); do curl -H "X-Forwarded-For: $RANDOM.$RANDOM.1.1" https://swingvantage.com/api/video-vision-analysis -d @frames.json; done` → each request is a different bucket → 100k vision calls.
- **Fix (implemented):** New `lib/security/client-ip.ts` resolves the IP from
  `x-real-ip` (Vercel-set, not client-forgeable), then the **rightmost**
  `x-forwarded-for` hop, then `'unknown'`. All 23 sites + the video-studio guard
  now call it. A spoofed prefix now resolves to the same bucket.
- **Verification test:** `lib/security/__tests__/client-ip.test.ts` asserts the
  rotating-prefix-same-bucket property. ✅ passing.
- **Priority:** Now · **Effort:** done (S).
- **Residual risk:** Off-Vercel hosts without `x-real-ip` fall back to the
  rightmost XFF; pair with a global budget (Finding 14) and bot mitigation.

### Finding 2: Stored-XSS sink in JSON-LD structured data — **FIXED**
- **Severity:** Medium
- **Affected files:** `components/video-studio/VideoObjectSchema.tsx:26`,
  `app/(marketing)/dev-updates/page.tsx:88`.
- **Business risk:** Script execution on public, crawlable pages → session/PII
  theft, defacement, SEO poisoning, loss of trust.
- **Technical risk:** Both injected `dangerouslySetInnerHTML={{__html: JSON.stringify(graph)}}`.
  `JSON.stringify` does **not** escape `</script>`, `<`, `>`, `&`, or U+2028/9.
  `VideoObjectSchema` renders **AI-generated** video titles/descriptions, so a
  generated title containing `</script><script>…` breaks out of the tag. The
  canonical `components/seo/JsonLd.tsx` already escaped correctly — these two
  bypassed it.
- **Evidence:** the two call sites used raw `JSON.stringify`; `JsonLd.tsx` had a
  private escaping serializer that was not reused.
- **Fix (implemented):** Extracted the escaper to a shared
  `lib/seo/serialize-json-ld.ts` (single source of truth) and routed all three
  emitters through it. Output stays valid JSON; crawlers parse it identically.
- **Verification test:** `lib/seo/__tests__/serialize-json-ld.test.ts` asserts a
  `</script>` payload yields no literal `<` and round-trips. ✅ passing.
- **Priority:** Now · **Effort:** done (S).

### Finding 3: Client-side-only password gate on public recruiting profiles
- **Severity:** Medium (low real-world risk **today**, high once cloud sync ships)
- **Affected file:** `app/player/[shareSlug]/page.tsx`.
- **Business risk:** "Password-protected" recruiting profiles (which may include
  **minors'** names, locations, video) are not actually protected by the password
  if the data is ever served before the gate.
- **Technical risk:** The page reads the **full** published snapshot (including
  `passwordHash` and all "permission-filtered" content) into the browser, then
  checks `hashPassword(pwInput) === snapshot.passwordHash` in JS. Anyone who can
  read the delivered payload bypasses the prompt. Today the snapshot lives only in
  the **creating device's** localStorage (cross-device shows "not available
  here"), so exposure is currently limited — but the design must change before
  cross-device cloud sharing is enabled.
- **Evidence:** `page.tsx:96–108` (gate) reads `readPublishedSnapshot(slug)` from
  localStorage at `:53`.
- **Recommended fix:** When cloud sharing lands, store snapshots server-side; a
  route must (a) verify the password **server-side** (per-link salted hash, rate
  limited, constant-time) and only then return the permission-filtered subset;
  (b) enforce expiry/revocation server-side; (c) never ship `passwordHash` or
  hidden fields to the client. Keep the link `noindex`.
- **Priority:** Before enabling cross-device recruiting sync · **Effort:** M.

### Finding 4: Admin read-pages rely on the layout guard; data adapters don't re-assert authz
- **Severity:** Medium (mitigated)
- **Affected files:** `app/admin/layout.tsx`, `lib/admin/data/users.ts`,
  `lib/admin/data/{athletes,analyses,metrics}.ts`.
- **Business risk:** The admin layout is the primary gate for viewing **all
  users'** data (service-role, RLS-bypassing). In the Next.js App Router, a page's
  server component executes **concurrently** with its layout, so a layout
  `redirect()` is not a hard data-fetch boundary.
- **Technical risk:** The service-role adapters trust their caller. Today this is
  safe because (a) the unauthorized response is replaced by the redirect so data
  never reaches the client, and (b) all **mutations** go through API routes that
  call `requireAdmin()` (`api/admin/users/[id]/route.ts:21`). But relying on
  layout-only authz for service-role reads is a known footgun.
- **Recommended fix:** Re-assert `requireAdmin()` inside each admin data adapter
  entry point (or each admin page), returning an empty/unauthorized result when
  the context isn't an admin. Centralizes authz at the data boundary.
- **Priority:** 30 days · **Effort:** M.

### Finding 5: Middleware fail-open when both Supabase vars are unset in production — **FIXED**
- **Severity:** Medium (defense-in-depth)
- **Affected file:** `src/middleware.ts`.
- **Risk:** The app intentionally runs account-less when **neither** Supabase var
  is set (local-first). But if a production deploy that *should* have accounts
  lost both vars, route protection silently disappeared. (Blast radius is limited
  because there is no server-side user data without Supabase — but auth silently
  stops being enforced.)
- **Fix (implemented):** In production, "both unset" now **fails closed** (redirect
  to `/login`) **unless** the operator explicitly sets `ALLOW_ANONYMOUS_APP=1`.
  Dev still passes through. The production site (which has Supabase configured) is
  unaffected.
- **Verification:** logic mirrors the existing "exactly one var set" branch.
- **Priority:** done · **Effort:** S.

### Finding 6: CSP allows `'unsafe-inline'` for scripts
- **Severity:** Medium
- **Affected file:** `next.config.mjs` (`script-src 'self' 'unsafe-inline' …`).
- **Risk:** `'unsafe-inline'` materially weakens the CSP's XSS protection — an
  injected inline `<script>` would execute. Required today by the inline
  theme-bootstrap (`app/layout.tsx:90`, a trusted static constant) and some
  libraries.
- **Recommended fix:** Migrate to a **nonce-based** CSP (generate a per-request
  nonce in middleware, attach it to the bootstrap script and Next's scripts, drop
  `'unsafe-inline'`). This is the single biggest remaining header hardening.
  Added in this pass: `base-uri 'self'` and `form-action 'self'` (Finding 11).
- **Priority:** 90 days · **Effort:** M.

### Finding 7: Prompt-injection filter is a weak denylist
- **Severity:** Medium (blast radius low)
- **Affected file:** `lib/ai-coach-prompts.ts` (`validateUserQuestion`).
- **Risk:** Blocks literal strings like `ignore previous`, `jailbreak`. Trivially
  bypassed (`disregard the above`, other languages, encodings). User text is
  appended after the context block.
- **Mitigant (already strong):** The AI receives only **pre-computed stats** — no
  secrets, no tools, no other users' data — so a successful injection only makes
  the model produce off-topic/unsafe text **for that one user**. There is no data
  exfiltration path.
- **Recommended fix:** Keep the denylist as a coarse filter, but rely on the
  structural defense (typed context, no tools, output validators like
  `validateNarrative`/`validateSummaryBody`) and add an output safety check on
  medical/guarantee claims. Don't over-invest given low blast radius.
- **Priority:** 90 days · **Effort:** S–M.

### Finding 8: `CRON_SECRET` compared with `===` (timing) — **FIXED**
- **Severity:** Low
- **Affected file:** `app/api/social/run-scheduled/route.ts`.
- **Risk:** `authorization === 'Bearer ' + secret` is not constant-time, unlike
  the rest of the codebase (`api/research/run` uses `safeEqual`).
- **Fix (implemented):** now uses `safeEqual(...)`.
- **Priority:** done · **Effort:** S.

### Finding 9: Any allowlisted admin defaults to Super Admin
- **Severity:** Low
- **Affected file:** `lib/admin/rbac.ts` (`resolveRoleForEmail` fallback).
- **Risk:** An email in `ADMIN_EMAILS` is Super Admin unless `ADMIN_ROLES` narrows
  it — fine for a solo founder, violates least-privilege as the team grows.
- **Fix:** When you add non-founder admins, set `ADMIN_ROLES=email:role,…` and
  consider defaulting unknown admins to a lower role.
- **Priority:** Before adding staff admins · **Effort:** S.

### Finding 10: Header polish (HSTS preload, COEP, Permissions-Policy)
- **Severity:** Low
- **Affected file:** `next.config.mjs`.
- **Risk/Fix:** Add `preload` to HSTS (and submit to the preload list once
  confident); consider `Cross-Origin-Embedder-Policy`; broaden `Permissions-Policy`
  to explicitly deny `usb`, `serial`, `bluetooth`, `interest-cohort`. Note camera
  is currently `()` (denied) even though in-app recording uses it — verify the
  recorder still works or scope camera to `self`.
- **Priority:** 90 days · **Effort:** S.

### Finding 11: CSP missing `base-uri` / `form-action` — **FIXED**
- **Severity:** Low
- **Fix (implemented):** Added `base-uri 'self'` (blocks `<base>` re-rooting) and
  `form-action 'self'` (blocks off-site form posts) to the CSP.
- **Priority:** done · **Effort:** S.

### Finding 12: `research/run` cron path not allow-listed in middleware
- **Severity:** Low (reliability / fail-closed, not a vuln)
- **Affected files:** `vercel.json` registers the cron; `middleware.ts`
  allow-lists `/api/social/run-scheduled` but **not** `/api/research/run`.
- **Risk:** With Supabase configured, the middleware redirects the session-less
  Vercel Cron request to `/login`, so the research cron likely never executes the
  workflow. This fails **closed** (safe) but is a latent functionality bug.
- **Fix:** If the cron is intended, add `/api/research/run` to `PUBLIC_PREFIXES`
  (it self-protects with `CRON_SECRET` via `safeEqual`). Otherwise remove the
  cron entry.
- **Priority:** 30 days · **Effort:** S.

### Finding 13: `billing/checkout` not bound to the authenticated user
- **Severity:** Low (correctness/abuse)
- **Affected file:** `app/api/billing/checkout/route.ts`.
- **Risk:** The route creates a checkout session from a `tier` with no
  authenticated-user binding visible at the call site; entitlement attribution
  relies on `client_reference_id`/metadata being set in `createCheckoutSession`.
  Anonymous callers can create sessions (rate-limited).
- **Fix:** Require an authenticated user and pass `client_reference_id = user.id`
  when creating the session, so the webhook attributes the subscription
  deterministically. Verify `createCheckoutSession` sets it.
- **Priority:** Before paid launch · **Effort:** S.

### Finding 14: No global AI spend ceiling
- **Severity:** Informational → Medium at scale
- **Risk:** Per-IP caps slow a single abuser; a distributed botnet (many real IPs)
  can still accumulate cost. Today mitigated only by the provider's prepaid
  balance (auto-recharge off, per project notes).
- **Fix:** Add a fleet-wide daily/however budget counter in Upstash
  (`INCR ai:spend:YYYY-MM-DD`) checked before each paid model call; when exceeded,
  serve the deterministic/keyless fallback and alert. Cheap insurance.
- **Priority:** Before ads / growth spike · **Effort:** M.

### Finding 15: localStorage holds most user data (shared-device exposure)
- **Severity:** Informational
- **Risk:** On a shared/public computer, the next person can read another user's
  swing data, notes, and recruiting snapshots from `localStorage`
  (`swingiq-store`).
- **Fix:** Wipe app localStorage on sign-out; offer a one-tap "clear this device";
  document in the privacy policy that device-local data persists until cleared.
- **Priority:** 30–90 days · **Effort:** S.

---

## 5. Critical and High-Risk Remediation Plan

| Priority | Finding | Risk | Fix | Owner | Effort | Timeline |
|---:|---|---|---|---|---|---|
| 1 | F1 IP spoof | AI cost blowout | Trusted client-IP helper (**done**) + set Upstash | Eng | S | **Now (done)** |
| 2 | F2 JSON-LD XSS | Stored XSS | Shared escaper (**done**) | Eng | S | **Now (done)** |
| 3 | F14 Global AI budget | Distributed cost abuse | Daily budget kill-switch in Upstash | Eng | M | 7 days |
| 4 | F3 Recruiting auth | Minor-data exposure | Server-side password/expiry before cloud sync | Eng | M | Before sync ships |
| 5 | F4 Admin authz | All-user data read | Re-assert `requireAdmin` in adapters | Eng | M | 30 days |
| 6 | F6 CSP nonce | XSS depth | Nonce-based CSP, drop `unsafe-inline` | Eng | M | 90 days |
| 7 | F12 cron gating | Broken research cron | Allow-list path or remove cron | Eng | S | 30 days |
| 8 | F13 checkout binding | Mis-attributed billing | Bind `client_reference_id=user.id` | Eng | S | Before paid launch |

Done this pass (no further action): F5 (middleware fail-closed), F8 (constant-time
CRON), F11 (`base-uri`/`form-action`).

---

## 6. Secure Architecture Recommendations

- **Auth:** Keep Supabase SSR + `getUser()` (validates the JWT, not just the
  cookie). Add optional TOTP MFA for `ADMIN_EMAILS` accounts. Wipe local store on
  sign-out.
- **API:** Standardize a per-route guard order: `clientIp` → `checkRateLimit` →
  authz → zod-validate → handler. Consider a thin `withGuards()` wrapper so new
  routes can't forget a step.
- **Database:** RLS is correct and is your crown jewel — keep the `owner_all`
  (`auth.uid() = user_id`) pattern on every new table, and keep admin tables
  RLS-on/no-policy (service-role only). Add a CI check that every new `public.`
  table has RLS enabled.
- **Storage:** Keep "frames-only, never store raw video." If you ever store
  uploads, use per-user prefixes + RLS storage policies + short-lived signed URLs
  (see §8).
- **AI pipeline:** Typed context only (already done), output validators (already
  present for journey/recruiting), a global budget cap (F14), and bot mitigation
  on unauthenticated AI routes.
- **Admin:** Defense-in-depth authz at the data layer (F4), tamper-evident
  server-side audit log, RBAC least-privilege defaults (F9), MFA.
- **Monitoring:** Add error monitoring (Sentry) + a rate-limit-trip / budget-cap
  alert + an admin-action audit stream.
- **Ads/analytics:** Non-personalized/contextual only (youth safety), consent
  banner for GA/PostHog (Plausible is cookieless), and keep ad scripts within a
  tightened CSP.
- **SEO/content:** Continue generating public pages from **curated, reviewed**
  data (the sitemap is a static allow-list today — good). Never render a public
  page directly from a user search/upload/report.

---

## 7. AI Security Threat Model

| Threat | Exposure in SwingVantage | Control today | Recommended |
|---|---|---|---|
| Prompt injection | User question / notes appended to prompt | Denylist + typed context, **no tools/secrets/cross-user data** | Output validators on all AI routes; treat model output as untrusted (already rendered as text, not HTML) |
| Cross-user leakage | Prompts carry only the caller's pre-computed stats | First-name-only, per-request context | Keep; never add other users' data to a prompt |
| Unsafe advice (medical/guarantees) | Coaching, journey, recruiting copy | System-prompt rules + disclaimers + claim denylist in re-word routes | Add an automated post-generation claim check; keep disclaimers |
| Cost-exhaustion | Public vision/LLM/OCR routes | Per-IP limit (**now spoof-resistant**) | Global daily budget (F14) + Turnstile on anon AI routes |
| Untrusted media input | Base64 frames/images to providers | Size caps, frame caps, not persisted | Validate MIME against an allowlist before forwarding |
| Public-content poisoning | Video Studio AI titles → JSON-LD / pages | **Now escaped** (F2); draft-first review | Keep human review before publish |
| Admin AI tools | GrowthOS/Studio call paid models | Admin-gated (`isAdminUser`/secret) + rate limited | Keep; add budget accounting per admin action |
| Model-instruction leakage | System prompts | Server-side only; low value | Acceptable |

---

## 8. File Upload Security Design (target state)

Today: **strongest possible posture for video** — raw video stays in the browser;
only downscaled frames/images are POSTed, size/frame-capped, and never stored.
Keep that. If/when you persist media, adopt:

1. **Validation at the boundary:** allowlist MIME **and** extension; verify magic
   bytes server-side; enforce size + (for video) duration caps; reject on mismatch.
2. **Storage:** private Supabase bucket, object keys namespaced by `user_id`
   (`{user_id}/{uuid}.mp4`) so keys are unguessable and RLS storage policies scope
   access to the owner.
3. **Access:** short-lived **signed URLs** only (minutes), never public URLs;
   regenerate per view; no directory listing.
4. **Processing:** transcode/analyze out-of-band; treat filenames/EXIF as
   untrusted; **strip EXIF/GPS** on ingest (important for youth-athlete location
   privacy).
5. **Malware:** scan on upload (ClamAV or a provider) before any rendering.
6. **Ownership:** every read/delete checks `auth.uid() = owner`.
7. **Lifecycle:** user-initiated delete cascades to storage; documented retention.

---

## 9. Data Privacy & Compliance Gap Analysis

- **PII collected:** email + name (Supabase Auth), self-entered profile (handicap,
  injuries `injury_notes`, goals), sessions/shots, video-analysis summaries,
  recruiting profiles (potentially **minors**, locations, video).
- **Privacy policy:** Must reflect the **hybrid** model (local-first + cloud sync),
  what the AI providers receive (frames/stats, first name), analytics/ads, and
  retention. Per project standard, never claim "local-only" where cloud sync
  exists.
- **Youth athletes (key risk):** Parents/coaches/minors are explicit personas.
  Before ads or wider launch: a youth-data stance (COPPA/GDPR-K), **parental
  consent** for under-13, non-personalized ads, and EXIF stripping + a consent
  checkbox for uploaded video that may show minors/locations.
- **Video consent:** Add explicit consent text at upload (who's in the video,
  where it may appear). Keep "frames not stored" claim — it's true and a selling
  point.
- **AI/health disclaimers:** Already present (`AI_COACHING_DISCLAIMER`,
  `MEDICAL_REDIRECT_NOTE`) — keep them; ensure they render on every AI surface.
- **Deletion/export:** Server export exists (`/api/user/export`, RLS-scoped) and is
  good. Add a **self-serve account+data deletion** (auth user + casc>ading rows +
  storage + local wipe) and document an SLA.
- **Cookie consent:** Plausible is cookieless (no banner needed); GA/PostHog need a
  consent banner in the EU.

---

## 10. Security Headers & Browser Hardening

Current headers are **above average** (set globally in `next.config.mjs`): HSTS,
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
`Permissions-Policy`, COOP, CORP, a real CSP, and `no-store` on `/api/*`.

Recommended production CSP (after nonce migration, F6):

```
default-src 'self';
script-src 'self' 'nonce-<per-request>' https://vercel.live;   # drop 'unsafe-inline'
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in;
media-src 'self' blob: https://*.supabase.co https://*.supabase.in;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live;
worker-src 'self' blob;
object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
upgrade-insecure-requests;
```

Plus: HSTS `+ preload`; cookies are managed by Supabase SSR (HttpOnly/Secure/
SameSite=Lax) — keep that. No permissive CORS exists (good; APIs are same-origin).

---

## 11. Dependency & Supply-Chain Findings

- **`npm audit`: 0 vulnerabilities** (prod and full tree) at audit time. ✅
- **Lockfile present**, pinned via `package-lock.json`; deliberate `overrides`
  for `minimatch`/`postcss` (build-time ReDoS/XSS) are documented in
  `package.json`. ✅
- **No committed secrets** (only `.env.example` is tracked; secret scan found only
  a truncated placeholder in a setup doc). ✅
- **No command-injection / eval / `child_process`** in the web app. ✅
- **Gaps:** no automated Dependabot/Renovate, no CI secret scanner (gitleaks),
  `security:secrets` is a manual echo. Add these (see §12).

---

## 12. DevSecOps Roadmap

- **Secret scanning:** add gitleaks as a pre-commit hook + CI job (the script stub
  already references it).
- **Dependency scanning:** enable Dependabot/Renovate; keep `npm audit` in the
  `ci` script (already wired) and fail CI on High+.
- **SAST:** add `eslint-plugin-security` + CodeQL on PRs.
- **DAST:** periodic ZAP baseline scan against a preview deploy.
- **CI gates:** require type-check + lint + tests + `security:all` green (the
  monorepo already has `npm run ci`); **fix the 2 pre-existing type errors**
  (`PublicFooter.tsx`, `lib/db/three-way-merge.ts`) so the build/type-gate is
  green again.
- **Branch protection:** require PR review + green checks on `master`; restrict who
  can change `next.config.mjs`, `middleware.ts`, `supabase-*.sql`.
- **CODEOWNERS** on `lib/security/*`, `middleware.ts`, `lib/admin/*`, SQL schemas.
- **Release checklist + incident response runbook** (see §13).

---

## 13. Production Security Checklist

**Must fix before more users**
- [x] Trusted client-IP for rate limits (F1) — done
- [x] JSON-LD escaping (F2) — done
- [ ] Set `UPSTASH_REDIS_REST_URL/TOKEN` so the AI cost cap holds fleet-wide
- [ ] Confirm `ADMIN_SECRET` + `ADMIN_EMAILS` set in prod (admin fails closed)

**Must fix before paid users**
- [ ] Bind checkout to `user.id` (F13); verify webhook attribution end-to-end
- [ ] Self-serve data deletion + local wipe on sign-out (F15)

**Must fix before ads**
- [ ] Global AI daily budget kill-switch (F14)
- [ ] Bot mitigation (Cloudflare Turnstile) on anonymous AI routes
- [ ] Youth-safe / non-personalized ad config + consent; EXIF stripping + video
      consent copy

**Must fix before enterprise partners**
- [ ] Admin defense-in-depth authz (F4) + MFA + tamper-evident audit log
- [ ] Nonce-based CSP (F6)

**Must fix before investor / acquisition diligence**
- [ ] Server-side recruiting auth before cloud sync (F3)
- [ ] SDLC scanners + branch protection + CODEOWNERS (§12)
- [ ] Documented retention/deletion, incident-response runbook, pen-test report
- [ ] Green type-check/build (resolve the 2 pre-existing errors)

---

## 14. Code Changes Made (this pass)

| File(s) | Change | Why |
|---|---|---|
| `lib/security/client-ip.ts` (new) | Trusted IP resolver (`x-real-ip` → rightmost XFF → `unknown`) | Stop IP-spoof rate-limit/cost bypass (F1) |
| 21 API route handlers + `lib/video-studio/server/guards.ts` | Use `clientIp(req)` instead of leftmost `x-forwarded-for` | Apply F1 everywhere |
| `lib/seo/serialize-json-ld.ts` (new) | Shared JSON-LD escaper (`<>&`, U+2028/9) | Single safe serializer |
| `components/seo/JsonLd.tsx`, `components/video-studio/VideoObjectSchema.tsx`, `app/(marketing)/dev-updates/page.tsx` | Route JSON-LD through the shared escaper | Close XSS sink (F2) |
| `src/middleware.ts` | Fail closed in prod when both Supabase vars unset (opt-in `ALLOW_ANONYMOUS_APP`) | Remove silent fail-open (F5) |
| `app/api/social/run-scheduled/route.ts` | `safeEqual` for the CRON bearer | Constant-time (F8) |
| `next.config.mjs` | Add `base-uri 'self'` + `form-action 'self'` to CSP | Header hardening (F11) |
| `lib/security/__tests__/client-ip.test.ts`, `lib/seo/__tests__/serialize-json-ld.test.ts` (new) | Unit tests | Prove F1/F2 fixes |

**Verification:** `tsc --noEmit` clean for all changed files; `eslint` clean;
`jest` = **875 passed, 9 new tests pass**. One unrelated pre-existing failure
(`lib/admin/__tests__/foundation.test.ts`, admin-nav "built" flag drift) and two
pre-existing type errors (`PublicFooter.tsx`, `three-way-merge.ts`) come from
concurrent in-flight work, **not** from these changes.

**Follow-up / residual:** F3, F4, F6, F12, F13, F14 remain (see §5). The IP fix is
tuned for Vercel (`x-real-ip`); confirm that header is present in production.

---

## 15. Remaining Unknowns (could not verify from source)

- Production env values: whether `ADMIN_SECRET`, `ADMIN_EMAILS`, `CRON_SECRET`,
  `UPSTASH_*`, `STRIPE_*` are actually set in Vercel.
- Supabase dashboard: confirmation that RLS is enabled on the **live** tables (SQL
  is correct; runtime state unverified here), service-role key scope, storage
  bucket policies, and whether RLS schemas beyond the relational one were applied.
- Vercel project: preview-deploy protection, branch protection on GitHub, build
  logs, who holds deploy permissions, WAF/DDoS settings.
- DNS/email: SPF/DKIM/DMARC for swingvantage.com; the private forwarding target.
- Stripe: live webhook signing secret + price IDs; whether checkout sets
  `client_reference_id`.
- Whether `x-real-ip` is present on the production edge (expected on Vercel).

---

## 16. Final Recommendation

**Is SwingVantage safe to scale? Yes — with the short list below.** There is no
Critical issue, no cross-user data exposure, and the data layer (RLS) and secrets
hygiene are genuinely good. The architecture (local-first, frames-only video,
server-side keys) is privacy-forward and reduces the server's attack surface.

**Fix first (this week):**
1. Ship the implemented fixes and **set Upstash** so the now-spoof-resistant rate
   limit holds fleet-wide.
2. Add a **global AI daily budget** kill-switch (F14).
3. Confirm prod admin/cron secrets are set.

**Minimum baseline before aggressive SEO/ad-driven traffic:** Upstash-backed
limits + global budget + bot mitigation on anonymous AI routes + youth-safe ad
config and video/EXIF consent. These protect your wallet and your youngest users —
the two things ad-driven growth most endangers.

**Path to investor-ready:** server-side recruiting auth (before cloud sync),
admin defense-in-depth + MFA + tamper-evident audit log, nonce CSP, SDLC scanners
+ branch protection, self-serve deletion, and a green build. None are large;
together they move you from "strong indie security" to "passes diligence."
