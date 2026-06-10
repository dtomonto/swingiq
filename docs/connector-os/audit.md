# ConnectorOS — Repository Audit (Phase 0)

> Date: 2026-06-09 · Branch: `agent/connector-os` · Author: ConnectorOS pass
>
> **Headline finding:** SwingVantage is a mature, keyless-first Next.js 16 monorepo
> where **~85% of the requested "ConnectorOS" stack already exists** in some form.
> The correct move is *connective tissue + a handful of genuine gaps*, NOT
> re-installing tools that are already wired. This file is the gate required by
> the ConnectorOS brief before any implementation.

---

## 1. Framework & app architecture

| Aspect | Finding |
| --- | --- |
| Stack | **Next.js 16** (App Router, React 19.2, React Compiler ON), TypeScript 6, Turbopack |
| Monorepo | npm workspaces + **Turborepo** (`apps/web`, `packages/core`, `server`) |
| Routing | App Router under `apps/web/src/app` — marketing `(marketing)`, app `(app)` (auth-gated), `admin/*`, `api/*` |
| Server logic | Route Handlers under `app/api/*` + Server Components/Actions |
| Hosting | **Vercel** assumed (Vercel Cron in `vercel.json`, `@vercel/analytics` + `@vercel/speed-insights` already deps) |
| Auth/DB | **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`) — *keyless-first*: local device profile when unconfigured. No Prisma/Drizzle/Clerk/Auth.js. |
| State | Zustand + TanStack Query |

## 2. Current packages & tooling — what already exists

| Layer | Already present | Location |
| --- | --- | --- |
| **Analytics abstraction** | ✅ One canonical `track()` over GA4 / Plausible / PostHog / Clarity, typed events from `@swingiq/core` | `apps/web/src/lib/analytics.ts` |
| **Consent** | ✅ Opt-in consent registry (`clarity`/`ga4`/`posthog`), umbrella accept/decline, SSR-safe, `useSyncExternalStore`-ready | `apps/web/src/lib/consent.ts` |
| **PostHog "Analytics OS"** | ✅ Full admin control center (queries, dashboard, feature-flag mgmt, SQL) | `apps/web/src/lib/posthog/*`, `/admin/analytics` |
| **Clarity OS** | ✅ Data Export API metrics, deep links, budget/cache | `/admin/clarity` |
| **Error monitoring** | ✅ **Sentry-ready** provider-agnostic reporter + native instrumentation hooks + `isObservabilityConfigured()`; no SDK installed yet | `lib/observability/report.ts`, `instrumentation*.ts`, `docs/OBSERVABILITY.md` |
| **Vercel Analytics / Speed Insights** | ✅ Deps installed | `package.json` |
| **SEO** | ✅ JSON-LD helpers, metadata helpers, curated self-maintaining sitemap (i18n/hreflang), site-sections, GSC verification env, `/admin/seo` | `lib/seo/*`, `app/sitemap.ts` |
| **Video / pose** | ✅ MediaPipe Tasks-Vision installed, Motion Lab on-device pose (optional cloud via `NEXT_PUBLIC_POSE_CLOUD_URL`), upload limits env | `package.json`, `.env.example` |
| **Security/privacy** | ✅ securityOS, RLS checks, in-memory + Upstash rate limiting, admin auth (`ADMIN_SECRET`/`ADMIN_EMAILS`), AI spend cap, CSP/HSTS | `/admin/security-os`, `scripts/check-rls.mjs`, `.env.example` |
| **QA** | ✅ Playwright configured (`playwright.config.ts`), Jest (2200+ tests), axe in CI test workflow, `/admin/qa` checklist | `apps/web/playwright.config.ts` |
| **CI** | ✅ 3 workflows: `test.yml`, `growth-ci.yml`, `security-audit.yml` + Dependabot | `.github/workflows/*` |
| **Admin** | ✅ Single-source nav with **Integrations**, **System Health**, **Setup & Next Steps**, **Feature Flags**, **AI Usage** | `lib/admin/nav.ts` |
| **Capabilities** | ✅ Keyless-first capability detection (`isConfigured`, per-provider checks, `getServerCapabilities`) | `lib/capabilities.ts` |

## 3. Current design system

- **Tailwind v4** (`@tailwindcss/postcss`), CSS variables + theme tokens, `class-variance-authority`, Radix UI primitives (shadcn-style), `lucide-react` icons.
- Sport theming + multiple admin "OS" command-center patterns (consistent card/score/recommendation idiom).
- **No Storybook**, **no Chromatic**, **no Tokens Studio** export — design tokens live in CSS/Tailwind only.

## 4. Current user journeys (verified present)

Homepage → sport selection → free tool → swing/video upload + on-device pose → AI/keyless analysis → report → drills/practice plans → optional account (Supabase) → export/delete + consent controls → theme switching → gated `/admin`.

## 5. SEO / AEO / GEO

Present: sitemap (curated, i18n, lastmod), JSON-LD battery, metadata helpers, GSC verification env, `/admin/seo`, SearchIntelligenceOS, milestones authority pages, duplicate-content + sitemap-coverage honesty gates.
**Missing:** robots is **not** a `robots.ts` route (verify static/header handling), **IndexNow**, **Bing Webmaster verification**.

## 6. Security / privacy posture

Strong: secrets server-only, keyless-first, admin fail-closed in prod, RLS, rate limiting + AI budget cap, consent opt-in, youth-safety language, export/delete flows, CSP/HSTS, gitleaks/npm-audit/CodeQL in CI.
**Gaps:** no bot-protection on public forms (**Cloudflare Turnstile**), no formal per-connector "configured/missing" registry surfaced as one truth.

---

## What is MISSING (the genuine gaps ConnectorOS should fill)

1. **Connective documentation** — the stack above is excellent but *undocumented as a system*. → `docs/connector-os/*`.
2. **One typed connector-status registry** — status is recomputed ad-hoc in Setup/Integrations/System-Health. → `lib/connector-os/feature-flags/{flags,connector-status}.ts` as single source of truth, consumable by all three.
3. **IndexNow** submission utility + script.
4. **Bing Webmaster verification** meta support (mirror GSC).
5. **Sentry** — code-side is *ready*; needs SDK + init wiring (deferred, account required).
6. **Cloudflare Turnstile** — reusable component + server verify (scaffold; keys required).
7. **Storybook / Chromatic / Tokens Studio** — design-system hardening (scaffold + docs; optional).
8. **Mux / Cloudinary** — production video infra (scaffold + flags; accounts required).

## What must NOT be duplicated

- ❌ Analytics `track()` — extend `lib/analytics.ts`, do not add a second tracker.
- ❌ Consent — reuse `lib/consent.ts` registry.
- ❌ Error reporting — wire Sentry into the existing `reportError` sink; do **not** add a parallel path.
- ❌ Capability detection — extend `lib/capabilities.ts`; the connector registry *reads* it.
- ❌ SEO metadata/JSON-LD/sitemap — extend `lib/seo/*`.
- ❌ A new admin "status" page that re-does Integrations/System-Health — ConnectorOS surfaces a *unified read* and links out.

## Immediate risk areas

- **Concurrent agents** share this checkout — all work here is in an isolated worktree with path-scoped commits (per `CLAUDE.md`).
- **MEMORY.md oversized** (>24KB) — unrelated but flagged.
- Do not let any monetization/ads scaffold leak into the report/analysis experience (youth-safety, trust).

## Recommended implementation order

1. ✅ This audit (gate).
2. ConnectorOS docs suite (`architecture`, `env-vars`, `event-taxonomy`, `seo-indexing`, `privacy-and-data-retention`, `implementation-roadmap`).
3. `connector-status` + `flags` registry (pure, reads capabilities/consent/env) + tests.
4. IndexNow + Bing verification (real gaps, no new deps) + tests + scripts.
5. Admin **ConnectorOS / System Health** read surface wired into existing nav.
6. Scaffold-only (docs + flags + env, NOT installed): Sentry init, Turnstile, Mux, Cloudinary, Storybook/Chromatic, Tokens Studio.

## "Do NOT install yet" list (premature / needs account or would add bloat)

- Sentry SDK (`@sentry/nextjs`) — wire only when DSN exists; reporter already abstracts it.
- `@cloudflare/turnstile` / widget — scaffold only until site/secret keys exist.
- Storybook, Chromatic — heavy; scaffold + docs first, install when design-system work is funded.
- Mux SDK, Cloudinary SDK — accounts + cost; scaffold server utils + flags only.
- Tokens Studio — Figma-side; document conventions, no repo install.
- AdSense / Stripe live / beehiiv / Rewardful — already flag-gated & waitlisted; do not activate.
- **Avoid-list (do not add):** Segment, Mixpanel, Amplitude, Hotjar, LogRocket, Jira, AWS MediaConvert/Rekognition-heavy, Impact.com, paid Ahrefs/Semrush workflows, second session-replay tool. PostHog is product-analytics truth; Clarity is the only replay tool.

## Known issues / follow-up

- Sentry, Turnstile, Mux, Cloudinary, Storybook remain **scaffold-only** by design (require external accounts/keys). Activation steps are in `env-vars.md` + `implementation-roadmap.md`.
- `robots` handling should be confirmed (no `robots.ts` route found) — tracked in `seo-indexing.md`.
</invoke>
