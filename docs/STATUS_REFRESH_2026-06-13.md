# Status refresh — 2026-06-13

_A point-in-time reconciliation of the planning/audit docs against the actual
code. Several audits were written 2–4 weeks before the work they describe
shipped, so they still list completed items as "open." This doc is the current
source of truth; where it disagrees with an older audit, trust this._

How to read it: each line cites the file that implements (or gates) the item, so
claims are checkable rather than asserted.

---

## Corrections — items older audits call OPEN that are actually DONE

| Item | Status | Evidence |
|------|--------|----------|
| Home hero CTA → guided `/start` (not the cold `/dashboard`) | ✅ Done | `apps/web/src/components/marketing/LocalizedHome.tsx:117` (and final CTA `:424`). The only `/dashboard` link is a correctly-labelled "Go to dashboard" on `/how-it-works`. |
| OG image + app icons + manifest | ✅ Done | `apps/web/src/app/layout.tsx:50–90` wires `openGraph` (1200×630), `twitter`, `icons`, `manifest`; assets in `apps/web/public/` (`og-default.png`, `icon-192.png`, `icon-512.png`, `apple-icon.png`). |
| Env/secret schema validation (fail-fast capable) | ✅ Done | `apps/web/src/lib/config/env.ts` (zod schema + `assertEnv`), invoked at boot in `apps/web/src/instrumentation.ts:37`. Strict throwing is opt-in via `STRICT_ENV` (keyless-first). |
| E2E critical-journey gate runs in CI (required) | ✅ Done | `.github/workflows/test.yml` runs Playwright + Jest; "E2E journeys (Playwright)" is a **required** check (blocked merges on PRs #72/#82/#90). |
| Visual-regression baselines regenerated on CI image | ✅ Done | `.github/workflows/update-visual-baselines.yml` (+ runbook `docs/REGENERATING_VISUAL_BASELINES.md`). |
| Accounts + cross-device cloud sync | ✅ Code-complete (awaits config) | `apps/web/src/lib/db/*` (sync engine, 3-way merge), `apps/web/supabase-relational-schema.sql` (14 tables + RLS + cascade). Activation = Supabase project + env vars; see §"Owner-config". |
| First-login merge hardening (no data loss) | ✅ Done | `apps/web/src/lib/db/sign-in-merge.ts` + integration test `__tests__/signInMerge.test.ts`; retry backoff/cap, corrupt-base guard, cascade-delete verification (PR #90). |
| Account + cascading delete (GDPR erasure) | ✅ Done | `apps/web/src/app/api/user/delete/route.ts` (+ residual-row verification). |
| RLS CI gate + Dependabot + security gates | ✅ Done | `scripts/check-rls.mjs` in `.github/workflows/security-audit.yml`; `.github/dependabot.yml`; Gitleaks / CodeQL / Custom Security Checks run on every PR. |
| `master` branch protection (required checks gate merges) | ✅ Done | Confirmed in practice — merges block until required checks pass (see `CLAUDE.md` §2). |
| Analytics abstraction + event taxonomy | ✅ Built, keyless-off | `apps/web/src/lib/analytics.ts` (`isAnalyticsEnabled = Boolean(GA_ID)`); fires only once a provider key is set. |
| Email infrastructure | ✅ Built, keyless-off | `apps/web/src/lib/capabilities.ts:140` (`isEmailConfigured`, Resend); `apps/web/src/app/api/email-capture/route.ts`. |
| Observability (Sentry) seam | ✅ Wired (awaits DSN) | `apps/web/src/instrumentation.ts` + observability report module; owner pastes `SENTRY_DSN`. |

---

## Genuinely open — Owner-config only (no code)

These are environment/secret or GitHub-setting steps; the code is ready.

1. **Activate accounts + sync** — create a Supabase project + `swing-videos` bucket; run `apps/web/supabase-relational-schema.sql` then `supabase-user-documents.sql` (once); set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
2. **Turn on analytics** — set `NEXT_PUBLIC_POSTHOG_KEY` (or `NEXT_PUBLIC_GA_ID`); verify events fire via `/admin/setup`.
3. **Turn on error monitoring** — set `SENTRY_DSN`; add an external uptime monitor.
4. **Back the AI/rate-limit caps fleet-wide** — set `UPSTASH_REDIS_REST_URL` + token so per-IP caps hold across instances.
5. **Confirm the remaining GitHub switches** — secret-scanning / Dependabot alerts / private vulnerability reporting (branch protection itself is already on).

---

## Genuinely open — Engineering

| Item | Size | Notes |
|------|------|-------|
| Outbound retention reminders (retest-due / streak-at-risk) | M | The missing "heartbeat." Keyless-first scaffold in progress this session. |
| Global AI daily budget kill-switch (audit F-14) | M | Fleet-wide spend cap (needs Upstash) before ad traffic. |
| Nonce-based CSP (audit F-6) | M | Guide exists (`docs/security/F6-nonce-csp.md`); drop `'unsafe-inline'`. |
| Server-side recruiting password gate (audit F-3) | M | Required before cloud-sync recruiting profiles go live. |
| Earn-moment celebration (toast/confetti on badge/PR/streak) | S | Framework exists (`fixFraming`, `WelcomeBackCard`); the in-moment cue is missing. |
| Accessibility polish (skip-to-content, breadcrumbs + schema) | S–M | Contrast tests already gate CI; a11y lint rules still at `warn`. |

---

## Which older docs are stale (and how much)

- `docs/ROADMAP.md`, `docs/PRODUCT_ROADMAP.md`, `docs/master-plan-status.md` — **accurate** (kept current).
- `docs/master-audit-report.md` — **~85%**; findings like F-01 (OG/icons) are shipped.
- `docs/swingiq-behavioral-ux-retention-audit-2026-06.md` — **audit accurate, recommendations mostly addressed**; the "home CTA → dashboard" flaw is fixed.
- `docs/AUTOMATION_OPPORTUNITY_AUDIT_2026-06.md` — **assessment accurate**; A1 (E2E in CI) and A4 (Jest/a11y in CI) are now shipped.
