# Admin Dashboard & AI Tools — Audit

**Date:** 2026-06-08
**Scope:** `apps/web` admin surface (`/admin/*`), admin libraries (`lib/admin/*`),
admin APIs (`/api/admin/*`), auth/RBAC, and the supporting data layer.
**Author:** Architecture audit (Claude Code)

---

## TL;DR

SwingVantage is **not** a greenfield admin build. It already ships a large, well-architected
internal operating system — **~90 admin pages** across a single-source-of-truth navigation
model, a 10-role RBAC layer, a server-side route guard, and a consistent component kit
(`PageHeader`, `SectionCard`, `MetricStat`, `AlertCard`, `StatusBadge`, `HelpPanel`).

The right move is therefore **improve and fill gaps, not rebuild**. This audit maps the 25
canonically-requested admin sections against what exists, then identifies the genuine gaps and
ranks them.

**Headline findings**

- **Admin route protection is solid** (not weak/missing): `app/admin/layout.tsx` blocks every
  `/admin/*` route unless the request carries the `ADMIN_SECRET` header **or** the logged-in
  user's email is allowlisted (`ADMIN_EMAILS`). API routes re-assert via `requireAdmin()` +
  RBAC `contextCan()`. Dev-without-secret is intentionally open for local iteration only.
- **~19 of the 25 requested sections already exist** in some form.
- **6 genuine gaps**: Admin Copilot, Drill Library, Practice Plan Management, Data Quality
  dashboard, Testing/QA admin, and a dedicated Theme/Accessibility admin.
- **Highest-value gap to build first: the Admin Copilot** (Phase 6 of the brief) — it is the
  single biggest lever for a non-technical founder and it composes existing data sources
  rather than inventing new ones.

---

## 1. Current admin capabilities (what exists today)

### Architecture
- **Navigation model:** `apps/web/src/lib/admin/nav.ts` — every section declared once
  (`NAV_ITEMS`), grouped (`NAV_GROUPS`), permission-gated, with `built`/`external` flags and a
  global-search keyword index. Adding a section is a one-line change.
- **RBAC:** `apps/web/src/lib/admin/rbac.ts` — 21 permissions, 10 roles
  (super_admin → read_only), least-privilege. `lib/admin/context.ts` exposes
  `requireAdmin()` + `contextCan()` for server routes/actions.
- **Guard:** `apps/web/src/app/admin/layout.tsx` — server component; redirects non-admins to
  `/dashboard` (no 403 to avoid confirming the route exists). Wraps everything in `AdminShell`.
- **Component kit:** `apps/web/src/components/admin/*` — `PageHeader`, `SectionCard`,
  `MetricStat`, `AlertCard`, `StatusBadge`, `HelpPanel`, `RecentActivity`, etc. Dark theme,
  amber accent, honest empty states.
- **Honest data layer:** `lib/admin/data/metrics.ts` + `data/system.ts` read real cross-user
  counts via the service-role client and degrade to "Local mode" prompts when not connected —
  no invented numbers.

### Requested section → current state

| # | Requested section | Status | Where |
|---|---|---|---|
| 1 | Admin Home / Command Center | ✅ Exists | `/admin` (`app/admin/page.tsx`) |
| 2 | User Management | ✅ Exists | `/admin/users`, `/admin/users/[id]`, `/admin/athletes` |
| 3 | AI Swing Analysis Management | ✅ Exists | `/admin/ai-analyses`, `/admin/ai-analyses/[id]` |
| 4 | Sport Systems Management | ✅ Exists | `/admin/sports`, `/admin/sports/[sport]` |
| 5 | Drill Library Management | ⚠️ **Gap** | only via per-sport config; no dedicated library |
| 6 | Practice Plan Management | ⚠️ **Gap** | no dedicated admin surface |
| 7 | Coaching Intelligence / Coach Mix | ✅ Exists | `/admin/coach-mix` |
| 8 | CentralIntelligenceOS | ✅ Exists | `/admin/central-intelligence` |
| 9 | GrowthOS | ✅ Exists (extensive) | `/admin/growth/*` (~25 subpages) |
| 10 | Content / Education Library | ✅ Exists | `/admin/content`, `/admin/academy/*`, `/admin/feature-education` |
| 11 | Feature Development | ✅ Exists | `/admin/development`, `/admin/feature-education` |
| 12 | AI Agents Admin | 🟡 Partial | `/admin/growth-agents`, `/admin/insights` (no unified agent registry) |
| 13 | Admin Copilot | ⚠️ **Gap** | none |
| 14 | Uploads / Media | ✅ Exists | `/admin/uploads` |
| 15 | Analytics & Product Intelligence | ✅ Exists | `/admin/analytics` (Analytics OS / PostHog), `/api/admin/analytics-os` |
| 16 | Feedback & Support | ✅ Exists | `/admin/feedback`, `/admin/support` |
| 17 | Security / Privacy / Compliance | ✅ Exists | `/admin/security`, `/admin/audit-log`, `/admin/legal`, `/admin/growth/privacy` |
| 18 | System Health / DevOps | ✅ Exists | `/admin/system-health`, `/admin/integrations` |
| 19 | Feature Flags & Experiments | ✅ Exists | `/admin/feature-flags`, `/admin/growth/experiments` |
| 20 | Notification / Messaging | ✅ Exists | `/admin/notifications`, `/admin/reengage` |
| 21 | Revenue / Monetization | ✅ Exists | `/admin/monetization`, `/admin/ads` |
| 22 | Data Quality | ⚠️ **Gap** | no dedicated dashboard |
| 23 | Documentation / Manuals | 🟡 Partial | covered by `/admin/feature-education` (no standalone doc-status board) |
| 24 | Testing / QA | ⚠️ **Gap** | no admin surface |
| 25 | Theme / Accessibility | ⚠️ **Gap** | a11y handled in code; no admin audit surface |

Also present beyond the 25: **Action Center** (`/admin/approvals`), **Audit Reports**
(`/admin/audits`), **Setup & Next Steps** (`/admin/setup`), **Admin Academy**
(`/admin/learning`), **Staff Academy LMS** (`/admin/academy`), **Research**
(`/admin/research`), **Link Intelligence** (`/admin/growth/link-intelligence`).

---

## 2. Missing admin capabilities (the genuine gaps)

1. **Admin Copilot** — no founder-facing assistant that summarizes the dashboard, recommends
   the next best action, and explains issues in plain English.
2. **Drill Library Management** — drills are configured per-sport; there is no consolidated
   cross-sport drill table with status/usage/quality.
3. **Practice Plan Management** — no admin surface for plan templates.
4. **Data Quality Dashboard** — no single place to see missing fields, orphaned pages, broken
   internal links, stale content, mistagged sports.
5. **Testing / QA Admin** — no in-app QA checklist / test-scenario board.
6. **Theme / Accessibility Admin** — contrast/WCAG auditing lives in code/CI, not surfaced for
   the operator.
7. **(Partial) Unified AI Agent registry** — growth agents exist, but there is no single
   registry showing every agent's purpose, inputs/outputs, permissions, last run, enable toggle.

---

## 3. Recommendations by category

### Recommended admin sections (new)
- **Admin Copilot** (`/admin/copilot`) — *build first*.
- **Drill Library** (`/admin/drills`).
- **Practice Plans** (`/admin/practice-plans`).
- **Data Quality** (`/admin/data-quality`).
- **QA / Testing** (`/admin/qa`).
- **Theme & Accessibility** (`/admin/accessibility`).
- **AI Agent Registry** (`/admin/agents`) — promote the partial growth-agents view to a unified registry.

### Recommended AI tools
All should be **keyless-first / deterministic with an optional, clearly-labeled AI seam**, per
the project's established ethos (AI spend capped, off by default). Highest-value:
- **Admin Copilot answer engine** (composes metrics/system/alerts → plain-English answers).
- **Data quality auditor** (orphaned pages, broken internal links, empty SEO fields — much of
  the input already exists in the SEO/sitemap honesty gates).
- **Accessibility/contrast auditor** surfaced from the existing CI checks.
- **AI analysis quality auditor** (extend `/admin/ai-analyses` review queue).

### Recommended monitoring tools
- System Health already exists; add a **Data Quality** board and surface **a11y/contrast** CI
  results in-app.

### Recommended automation controls
- Feature flags + experiments exist. Add **agent enable/disable + last-run** visibility via the
  AI Agent Registry.

### Recommended safety / privacy controls
- Already strong (Legal & Privacy, Audit Log, Security/Roles, CIOS governance). Add an explicit
  **"user data is used ethically and never sold"** policy note wherever aggregated intelligence
  is shown (Copilot already includes this).

### Recommended growth / SEO tools
- GrowthOS is extensive. The remaining lever is **Data Quality** (cannibalization, orphaned
  pages, empty meta) — partly covered by existing SEO honesty gates; surface them in-app.

### Recommended product-quality tools
- **QA / Testing** board + **Theme/Accessibility** board.

---

## 4. Implementation priority

| Priority | Item | Rationale |
|---|---|---|
| **Critical** | Verify/keep admin route protection; **Admin Copilot** | Protection already solid; Copilot is the biggest founder lever |
| **High** | Data Quality dashboard; AI Agent Registry | Scale hygiene + operational visibility |
| **High** | Drill Library; Practice Plans | Core product content management |
| **Medium** | QA / Testing board | Quality at scale |
| **Medium** | Theme / Accessibility board | Surfaces existing CI checks |
| **Low** | Standalone Documentation-status board | Mostly covered by Feature Education |

### Quick-win implementation list
1. **Admin Copilot** — composes existing `getPlatformMetrics`, `getSystemStatus`,
   `deriveAlerts`, `collectServerActions`, feature-education counts and `NAV_ITEMS` into
   grounded answers. **No new data sources required.** ← *implemented in this pass.*
2. **AI Agent Registry** — a registry page reading the existing growth-agents definitions.
3. **Data Quality** — wire the existing `scripts/check-sitemap-coverage.mjs` /
   `check-duplicate-content.mjs` outputs into an in-app board.

### Long-term admin OS roadmap
- Promote growth-agents into a first-class, cross-domain **AI Agent Registry** with test
  consoles and per-agent kill switches.
- Add **Drill Library** + **Practice Plans** content management backed by the existing
  sport/drill libs.
- Add **Data Quality**, **QA/Testing**, and **Theme/Accessibility** operator boards that read
  from CI artifacts.
- Wire the Copilot's AI seam to a model adapter (env-gated, spend-capped) once a provider key is
  budgeted, keeping the deterministic engine as the always-on default.

---

## 5. Data model notes

No destructive migrations are recommended. The gaps above are mostly **read-only composition of
existing data** (Copilot, Data Quality, Agent Registry). Drill Library and Practice Plans, if
persisted, should follow the established local-first + optional-Supabase-mirror pattern used
across `lib/*`, with `created_at`/`updated_at`, a `status` review field, and admin/user
references — not a new bespoke store.

---

## 6. What was implemented in this pass

See `docs/admin-dashboard-system.md` and `docs/admin-ai-tools-roadmap.md`.

- **Admin Copilot** (`/admin/copilot`): keyless-first deterministic answer engine grounded in
  real platform metrics, system health, derived alerts, the Action Center inbox, feature-
  education coverage and the nav model. Admin-guarded page + `POST /api/admin/copilot`
  (re-asserts `requireAdmin()`, read-only). Optional, clearly-labeled AI seam (off by default).
  Registered once in `lib/admin/nav.ts`.
- **AI Agent Registry** (`/admin/agents`): one honest inventory of ~30 real agents across four
  families (product intelligence, growth, content/operator AI, safety) with runtime/control/
  safety metadata, live AI-provider annotation and inspect deep-links. Fills requested section
  #12 (was partial). `lib/admin/agent-registry.ts` + 8 tests.
- **Data Quality** (`/admin/data-quality`): keyless, deterministic hygiene checks over the SEO
  content registry (duplicate slugs/titles/meta/keywords, length, thin content, slug↔sport
  mismatch, missing CTA), showing passing checks too. `lib/admin/data-quality/*` + 9 tests.
- **Drill Library** (`/admin/drills`): read-only unified drill inventory aggregating the real
  content + DrillMatch catalogs, with coverage stats and cross-catalog duplicate detection.
  `lib/admin/drill-library/*` + 8 tests.

**Remaining gaps** (priority order): Practice Plan Management, QA/Testing board,
Theme/Accessibility auditor, then in-UI drill/practice editing.
