# SwingVantage — Automation Opportunity Audit

_Date: 2026-06-07 · Status: **strategic audit — nothing implemented yet** · Author: automation-architecture review_

> **📘 In Plain English (start here).** This document looks at the whole SwingVantage
> web app and asks one question: **"Where can robots do the boring/risky work so a tiny
> team can run a huge product safely?"**
>
> The honest headline: **SwingVantage is already one of the most automated solo-built
> apps you will ever see.** You have CI security scanning, a fleet of monthly "audit
> robots," a post-commit chain that keeps your changelog/feature-registry/setup-list in
> sync, and whole engines that draft tutorials, videos, SEO pages and social posts for
> you. So this is **not** a "you have nothing, add AI everywhere" audit. It is the
> opposite: you have a lot of automation *building* things, and almost no automation
> *watching* whether the live app is healthy, whether real users are getting stuck, or
> whether an automated change broke a screen.
>
> **The three sentences that matter most:**
> 1. Your biggest gap is **eyes, not hands** — there is no production error monitoring, no
>    analytics provider switched on, and your existing end-to-end tests *exist but never
>    run automatically*. You are flying a very sophisticated plane with the instrument
>    panel switched off.
> 2. The single best automation to build first is the **"Critical-Journey Safety Gate"** —
>    wire the Playwright tests you already wrote into CI and Vercel previews so a broken
>    sign-in / upload / analyze flow can never reach swingvantage.com. It's ~80% built and
>    pure upside.
> 3. The highest *strategic* win is an **Automation Control Plane** — one admin screen that
>    shows every robot's last run, findings, and health, so you can operate the whole fleet
>    without reading code.
>
> Sections 1–3 and 16 are written for you. Sections 4–15 are the engineering detail.

---

## Table of contents

1. [Executive Summary](#1-executive-summary)
2. [Automation Opportunity Map](#2-automation-opportunity-map)
3. [Highest-Leverage Automations (Top 10)](#3-highest-leverage-automations-top-10)
4. [Developer Automation Audit](#4-developer-automation-audit)
5. [Product Automation Audit](#5-product-automation-audit)
6. [Content, SEO, AEO, GEO Automation Audit](#6-content-seo-aeo-and-geo-automation-audit)
7. [Tutorial, Manual, and Video Automation Audit](#7-tutorial-manual-and-video-automation-audit)
8. [QA, Regression, and Accessibility Automation Audit](#8-qa-regression-and-accessibility-automation-audit)
9. [Security and Reliability Automation Audit](#9-security-and-reliability-automation-audit)
10. [Analytics and Business Intelligence Automation Audit](#10-analytics-and-business-intelligence-automation-audit)
11. [Admin and Internal Operations Automation Audit](#11-admin-and-internal-operations-automation-audit)
12. [AI-Agent Automation Architecture](#12-ai-agent-automation-architecture)
13. [Automation Governance Model](#13-automation-governance-model)
14. [Prioritized Roadmap](#14-prioritized-roadmap)
15. [Implementation Backlog](#15-implementation-backlog)
16. [Recommended First Implementation](#16-recommended-first-implementation)

---

## 1. Executive Summary

SwingVantage is a large Next.js 16 / React 19 application — **243 page routes, 58 API
routes, ~60 self-contained `lib/` engines, ~246 components, 33 admin sections, and 121 Jest
test files** — deployed to swingvantage.com via Vercel from `origin/master`. It is backed by
Supabase, instrumented with a clean analytics abstraction, and already wrapped in an
unusually deep automation layer.

**What is already automated (and genuinely good):**

- **CI/CD security & quality:** three GitHub workflows — `codeql.yml` (code scanning),
  `security-audit.yml` (Gitleaks + `npm audit` + lint/typecheck + custom scanner), and
  `growth-ci.yml` (type-check, lint, build, `audit:growth`) — plus grouped **Dependabot**
  across web, root, and Actions.
- **A "robot fleet" of scheduled audits** (local-commit-only, never-push): SEO/AEO/GEO,
  AI-features, build/CI health, engagement/retention, a weekly SEO content producer, and a
  monthly master-report compiler that merges them all into `docs/master-audit-report.md`.
- **A 4-stage post-commit hook** that keeps `/updates`, the social queue, the feature
  registry, and the owner setup list in sync automatically.
- **Content & product engines:** Feature Education Engine (drafts the full learning package
  per shipped feature), Video Studio, Blog→Social, Link Intelligence, GrowthOS (28 modules),
  7 deterministic Growth Agents, Athletic Journey, AGI, Motion Lab, Recruiting, BodySync.
- **A disciplined governance culture already in place:** draft-first, human-reviewed,
  never auto-publish SEO/updates, never auto-post social, never expose youth data, AI spend
  capped behind a kill-switch (`lib/ai-budget.ts`, `AI_DAILY_BUDGET_CENTS`).

**The biggest opportunities are therefore not "more generation" — they are "observation,
safety, and orchestration."** The five structural gaps:

1. **No production observability or live analytics.** There is no error monitor (no Sentry /
   `instrumentation.ts`), no uptime check, and although `lib/analytics.ts` + `Analytics.tsx`
   cleanly support GA4/Plausible/PostHog, **no provider env var is set**, so every event drops
   in production. You cannot currently see a single error, outage, funnel, or drop-off. This
   is the master gap — it blocks an entire *class* of "watch the live app" automations.
2. **Your safety net exists but is unplugged.** Four Playwright specs (`apps/web/e2e/*.spec.ts`)
   cover smoke, keyless-auth, CSV-import-diagnosis, and floating-help overlap — but
   `@playwright/test` isn't installed by default and **no CI workflow runs them**. The
   auto-deploy to production is gated only by type-check/lint/build/unit tests, never by a
   real user journey.
3. **No accessibility / contrast / visual / performance gate in CI.** You did the hard work —
   335 Jest contrast-regression tests exist — but on a **local, unpushed branch**
   (`fix/theme-contrast-mobile`), and 7 `jsx-a11y` rules are still at `warn`. There is no
   automated axe / Lighthouse / Core-Web-Vitals check on pull requests or previews.
4. **The audit robots build reports, but nothing closes the loop.** Findings land in dated
   markdown the owner must read and act on by hand. There is no living backlog with status,
   no "finding → ticket → fix → verified" tracking, and no single dashboard of robot health.
5. **No live-site watcher.** `validate:links` checks *static* hrefs at build time; nothing
   crawls the deployed site for broken pages, runtime console errors, layout overlap, or
   regressions after a deploy.

**The strategic thesis:** SwingVantage has spent its automation budget on *offense*
(generating content, features, tutorials). The next phase must spend on *defense and
instrumentation* (watching the live app, gating changes, closing audit loops) — precisely
because the offense is now powerful enough that an unwatched bad output is the main risk.
Build the instrument panel and the safety gate first; then layer the AI agents on top of a
foundation that can prove it didn't break anything.

---

## 2. Automation Opportunity Map

Scoring uses the requested framework, each sub-score 1–5:

> **Impact Score = Business Value + Engineering Leverage + UX Improvement + Revenue Potential + Risk Reduction − Implementation Complexity** (max 24).

Timing: **Now** (1–2 wks) · **Near** (30–60 d) · **Strategic** (3–6 mo) · **Later/Gated** · **Avoid**.

| # | Automation | Domain | Replaces (current manual/inefficient process) | Cx | Biz Impact | Eng Risk | Score | Timing |
|---|---|---|---|---|---|---|---|---|
| A1 | **Critical-Journey Safety Gate** (Playwright in CI + Vercel preview) | QA / CD | E2E specs exist but run by hand, rarely; prod gated only by build | L | High | Low | **18** | Now |
| A2 | **Production Observability** (Sentry + uptime + release health) | Reliability | Zero error/outage visibility in prod | L–M | Transformational | Low | **19** | Now |
| A3 | **Analytics Activation + Event QA** (turn on Plausible/PostHog, assert events) | Analytics | Provider unset → all events dropped; KPI tables empty | L | Transformational | Low | **18** | Now |
| A4 | **Accessibility + Contrast CI Gate** (axe + push the 335 contrast tests) | A11y / QA | Contrast tests stuck on a local branch; 7 a11y rules at warn | L–M | High | Low | **17** | Now |
| A5 | **Live-Site Synthetic Monitor** (scheduled crawl: broken pages/links/console/overlap) | Reliability / SEO | `validate:links` is static-only; nothing watches the deployed site | M | High | Low | **16** | Near |
| A6 | **Automation Control Plane** (admin: every robot's status/findings/health) | Admin Ops | ~12 robots + 4 CI + hooks with no unified live view | M | Transformational | Med | **16** | Near |
| A7 | **Lighthouse CI / Core Web Vitals budgets** (on preview URLs) | Performance | No CWV/perf budget; "check after deploy" is manual | L–M | High | Low | **15** | Near |
| A8 | **Pre-Publish Content Quality & Safety Agent** (gate AI/auto content) | Content / Trust | Quality scoring exists per-engine; no unified pre-publish gate | M | High | Med | **15** | Near |
| A9 | **Funnel Drop-off → Product Recommendation loop** (needs A2/A3) | Product / BI | "Find drop-off points" impossible with analytics off | M | High | Med | **15** | Near |
| A10 | **Env/Secret Schema Validation** (fail-fast at build/boot) | Developer | `integrations.ts` *reports* config; nothing *enforces* it | L | Med | Low | **13** | Now |
| A11 | **Audit→Ticket→Verify loop** (turn audit findings into tracked backlog) | Admin Ops | Findings in static md; owner reads + acts manually | M | High | Med | **14** | Near |
| A12 | **Email Lifecycle Automation** (connect provider + behavioral triggers, draft-first) | Growth / Retention | Templates + capture exist; no provider, no welcome series | M | High | Med | **13** | Near |
| A13 | **Feature→Tutorial→Video unified pipeline** (orchestrate existing engines) | Content / Education | Feature-Ed, Video Studio, Tutorial run as separate manual steps | M | High | Med | **13** | Strategic |
| A14 | **Sport-specific Learning-Path generator** (journeys auto-assembled per sport/persona) | Product | Journeys config-driven but hand-curated per sport | M | High | Med | **13** | Strategic |
| A15 | **Player-Profile Enrichment loop** (sessions/notes/wearable → profile deltas) | Product | AGI fuses sources on read; no scheduled enrichment/decay | M | Med | Med | **11** | Strategic |
| A16 | **Repo Hygiene & Refactor Radar** (large-file/dup/complexity budgets) | Developer | `check:naming` only; no size/complexity/dup detection | L–M | Med | Low | **10** | Near |
| A17 | **Incident Response & Alert Runbooks** (paging + auto-runbook; needs A2) | Reliability | No alerting/on-call/runbook | M | Med | Med | **10** | Strategic |
| A18 | **Competitive Intelligence live monitor** (extend Link Intelligence adapters) | Growth / SEO | Curated competitor seeds; no live keyword/backlink/AEO-visibility watch | M–H | Med | Med | **9** | Strategic |
| A19 | **Backlink + Internal-Linking automation** (suggest links on new content) | SEO | Internal-link engine exists; suggestions not auto-injected into drafts | M | Med | Med | **11** | Near |
| A20 | **Data-Quality & Governance checks** (schema/PII/retention drift) | Data / Compliance | RLS ready; no automated PII/retention/data-drift checks | M | Med | Med | **11** | Strategic |
| A21 | **Monetization / Ad-RPM & UX-friction monitor** (gated on ads-on) | Monetization | Ads off by design; no RPM/viewability/friction loop yet | M | Med (High later) | Med | **10** | Later/Gated |
| A22 | **Consent / Privacy automation** (cookieless-by-default verifier, DSAR flow) | Compliance | Privacy posture good but unautomated; no cloud deletion/DSAR flow | M | Med | Med | **11** | Strategic |
| A23 | **Release Notes / Changelog AI polish** (extend the trailer hook) | Docs | Trailer hook publishes raw lines; no grouping/summary | L | Low–Med | Low | **9** | Near |
| A24 | **PR Auto-Review Assistant** (diff-aware reviewer comments, advisory) | Developer | No automated PR review; solo + agents commit directly | M | Med | Med | **10** | Strategic |
| A25 | **Self-improving AI prompt/eval harness** (golden-set evals on AI routes) | AI Quality | `eval:agi` exists; not generalized across AI routes or CI-gated | M–H | Med | Med | **10** | Strategic |

---

## 3. Highest-Leverage Automations (Top 10)

Ranked by score, then by how much they *unblock other automations*.

1. **A2 — Production Observability (19).** The instrument panel. Sentry + uptime turns every
   future automation from "hope it worked" into "prove it worked." Foundational for A9, A11,
   A17, A25.
2. **A1 — Critical-Journey Safety Gate (18).** The seatbelt. Already ~80% built. Makes it
   *safe* to let any automation (or agent) modify the app, because a broken core journey
   can't ship. Prerequisite-in-spirit for the entire agent layer (§12).
3. **A3 — Analytics Activation + Event QA (18).** Flips on the data that makes "find user
   drop-off" and every BI automation possible. Mostly an owner config step + a test that
   asserts events actually fire.
4. **A4 — Accessibility + Contrast CI Gate (17).** You already wrote the tests; they're
   stranded on a local branch. Pushing them + adding axe converts past effort into a
   permanent regression net (and protects the 7-theme token system).
5. **A5 — Live-Site Synthetic Monitor (16).** The night watchman: scheduled crawl of the
   deployed site for broken pages, runtime console errors, broken links, and layout overlap —
   the literal "automatically detect broken pages" ask.
6. **A6 — Automation Control Plane (16).** The cockpit. One admin screen showing every robot's
   last run / findings / health so a non-technical owner can operate the fleet. The
   highest-leverage *operations* automation.
7. **A7 — Lighthouse CI / CWV budgets (15).** Performance guardrail on every preview; protects
   SEO rankings and mobile UX automatically.
8. **A8 — Pre-Publish Content Quality & Safety Agent (15).** A single trust gate every
   auto/AI-generated artifact must pass before a human can publish — prevents thin/duplicate/
   off-brand/inaccurate content at the source.
9. **A9 — Funnel Drop-off → Product Recommendation loop (15).** Turns analytics into a weekly
   "here's where users quit and what to try" brief. Pure leverage once A2/A3 exist.
10. **A11 — Audit→Ticket→Verify loop (14).** Closes the gap between your excellent audit
    robots and actual fixes by turning findings into a tracked, status-bearing backlog.

> **The shape of the top 10:** items 1–4 are *defense & instrumentation* (build now), 5–7 are
> *continuous watchers* (near-term), and 8–10 are *intelligence loops* that only pay off once
> the watchers are feeding them data.

---

## 4. Developer Automation Audit

**Current state (strong):** Turborepo monorepo; `npm run ci` chains type-check + naming +
security; `growth-ci.yml` runs type-check/lint/build/`audit:growth` on push/PR to `master`;
Dependabot grouped weekly; CodeQL + Gitleaks + custom scanner; post-commit hook chain keeps
data registries in sync.

**Gaps & recommendations:**

| Opportunity | Detail | Rec |
|---|---|---|
| **E2E never runs in CI (A1)** | `playwright.config.ts` + 4 specs exist; `@playwright/test` not installed; no workflow invokes `test:e2e`. | Add `@playwright/test` devDep; new `e2e.yml` (or a job in `growth-ci.yml`) that builds + runs the suite on PRs; later target the Vercel **preview URL** so journeys run against the real deployment. |
| **Env validation is advisory only (A10)** | `lib/config/integrations.ts` reports what's configured; a missing/malformed required var still builds and deploys. | Add a `zod`-validated env module (e.g. `lib/config/env.ts`) imported at the top of `next.config.mjs` / server entry; fail the build on missing **required-for-the-target-environment** vars. Keep optional integrations optional. |
| **No preview-environment QA gate** | Vercel auto-creates preview deploys per push, but nothing runs checks against them. | Use Vercel's preview URL as the target for A1 (Playwright), A4 (axe), A7 (Lighthouse). One "preview-quality" workflow, three checks. |
| **No repo-hygiene radar (A16)** | `check:naming.mjs` enforces naming only. `lib/` has 636 `.ts` files; some are large. | Add `scripts/repo-radar.mjs`: flag files > N lines, high duplication (jscpd), and cyclomatic hotspots; write a weekly `docs/audits/repo-health/<date>.md` (local-commit-only, matching the existing robot pattern). Advisory, never auto-refactors. |
| **No PR auto-review (A24)** | Solo owner + tandem agents commit directly (no PRs, by policy). | Lower priority *because* the workflow is push-direct. If/when PRs return, add a diff-aware advisory reviewer. Until then, fold its value into A1/A4/A7 gates. |
| **Release governance** | `origin/master` auto-deploys; local master chronically diverged. | Document + automate a "ship checklist" gate (the existing `npm run type-check && lint && audit:growth && build`) as a required status check on `master` (owner enables branch protection — noted as a recurring open item in the master audit). |

**Acceptance criteria (developer track):** PRs/pushes to `master` block on (a) build, (b) E2E
journeys, (c) axe + contrast, (d) Lighthouse budget; a missing required env var fails the
build with a clear message; weekly repo-health report appears under `docs/audits/`.

---

## 5. Product Automation Audit

**Current state:** Deep, config-driven product engines already exist — Athletic Journey
(`lib/athletic-journey`), AGI (`lib/agi`, fuses 5 sources on read), Daily Notes → fault tags,
BodySync readiness, DrillMatch, Fix Stack, Progress/Arc, Recruiting. Onboarding lives in
`lib/onboarding`; Next-Best-Action + First-Swing-Journey cards exist.

**Automation opportunities:**

- **A14 — Sport-specific Learning-Path generator.** Journeys are config-driven but assembled
  by hand per sport/persona. Automate assembly: given `SPORT_TAXONOMY` + persona + the
  athlete's classified level (G0–G10 / T0–T10) + recurring fault tags, deterministically
  generate the ordered path (skills → drills → retests → milestones), AI used only to *word*
  it, behind the budget kill-switch. **Guardrail:** deterministic skeleton; AI never invents
  drills, only phrases existing ones.
- **A9 — Drop-off-driven product improvement.** Once A3 events flow, a weekly job correlates
  funnel steps (`upload → analyze → result → save → return`) with drop-off and emits a
  ranked "friction list" to the admin + a `docs/audits/product/<date>.md`. **This is the
  single highest-value product automation, and it's currently impossible** because analytics
  is off.
- **A15 — Player-profile enrichment loop.** AGI fuses sources *on read*; add a scheduled
  enrichment that materializes profile deltas (new keystone skill, momentum shift, readiness
  trend, stale-data decay) so the dashboard's "Your read" is fresh without a manual visit.
- **Onboarding completion automation.** Detect stalled onboarding (no first analysis within N
  days) and trigger the *existing* honest re-engagement bridge (`lib/agents/...` + reengage),
  never shame-based — consistent with the engagement-audit governance.
- **Feature discovery.** The Feature Education Engine knows what shipped; surface "new since
  you last visited" contextually (it already drafts in-app help) — automate the *placement*,
  not just the drafting.

**Why it matters:** these convert SwingVantage's static intelligence into *adaptive* loops —
the product gets more personalized over time without per-user manual work, which is the whole
point of scaling to millions with a lean team.

---

## 6. Content, SEO, AEO, and GEO Automation Audit

**Current state (very strong):** weekly SEO content producer (`seo-content-production-weekly`),
monthly SEO/AEO/GEO audit robot (S1), `validate:seo` / `validate:content` / `validate:links` /
`check-sitemap` in CI via `audit:growth`, an anti-thin-content gate, shared `buildMetadata()` +
`jsonLd.ts` helpers, Link Intelligence (internal links + white-hat backlink/competitor seeds),
self-maintaining i18n (`i18n/upkeep.mjs`, ES + FR live), Blog→Social.

**Gaps & recommendations:**

| Opportunity | Detail | Rec |
|---|---|---|
| **A8 — Unified pre-publish content gate** | Each engine has its own quality score; there's no *single* gate every artifact crosses. | A `lib/content-gate/` reviewer that every draft (SEO page, blog, social, tutorial, release note) must pass: thin-content, duplicate/near-dup (cosine over existing corpus), reading level, brand-voice, claim-honesty (no overclaiming vs `llms.txt`), schema completeness. **Returns a score + blocking reasons; a human still clicks publish.** This is the guardrail that lets you safely scale generation. |
| **A19 — Auto internal-link suggestions** | Link Intelligence finds opportunities; they aren't injected into new drafts. | When a draft is generated, run the internal-link recommender and attach suggested anchors for human acceptance. Never auto-insert. |
| **A18 — Live competitive/AEO visibility** | Competitor data is curated seeds + env-gated adapters. | Add a scheduled, **env-gated** monitor: keyword-gap deltas, new competitor pages, and — uniquely valuable — **AI-answer-engine visibility** (does ChatGPT/Perplexity cite SwingVantage for target questions?). Write to `docs/audits/competitive/<date>.md`, draft-only recommendations. |
| **Metadata/schema drift** | Some pages hand-roll metadata instead of `buildMetadata()`. | A CI check that fails when a public `page.tsx` exports raw `metadata`/JSON-LD instead of the shared helpers (extends the existing validators). |
| **Content freshness/decay** | No "this page is stale / its claim drifted" signal. | Extend S1 to flag pages older than N months or whose claims diverge from current capabilities, queued as *refresh* drafts (never auto-edited live). |

**Hard guardrail (matches existing policy):** **no automation may publish an SEO/marketing page
or social post.** Every new content automation outputs **drafts that a human reviews**, and
must pass A8 before it can even be marked publishable. This directly satisfies the brief's "do
not create uncontrolled low-quality SEO pages" constraint and your own `docs/automation.md`
"what we do NOT automate" policy.

---

## 7. Tutorial, Manual, and Video Automation Audit

**Current state (best-in-class already):** the **Feature Education Engine** auto-detects shipped
features (routes/nav/API/commit `Feature:` trailers via `scan-features.mjs` → `feature-registry.json`,
refreshed by the post-commit hook) and drafts the *entire* learning package — tutorial, how-to,
manual, FAQ, troubleshooting, onboarding, in-app help, video script, release note, support doc,
SEO, academy lesson — quality-scored and security-scanned, reviewed at `/admin/feature-education`.
**Video Studio** scans for video gaps → briefs → generates (keyless mock + pluggable providers) →
places → measures. Tutorial Center has 37 recorded narrated walkthroughs.

This is the most mature part of the system. The opportunity is **orchestration, not creation:**

- **A13 — Feature→Tutorial→Video unified pipeline.** Today the chain is
  *detect (auto) → draft learning package (Feature-Ed) → generate video (Video Studio) →
  place (Tutorial) → announce (/updates)* — but the hops are operated separately in different
  admin screens. Automate the **conveyor belt**: a new `feature-registry` entry opens a single
  "Learning Package" work item that walks Feature-Ed → Video Studio brief → placement →
  release-note, each step gated by human approval, with a visible status per feature
  (`detected → drafted → video-briefed → placed → announced`).
- **Drift detection (already scaffolded).** There's a `feature-education/drift` route — promote
  it to a scheduled check that flags tutorials whose underlying feature changed (UI moved, route
  renamed) so docs don't silently rot. This is the docs equivalent of A5.
- **Admin guide self-regen (already built — keep it healthy).** `npm run docs:admin-guide:*`
  regenerates the illustrated PDF from `sections.json` + Playwright captures. Add a scheduled
  "is the admin guide stale vs current /admin routes?" check (you added 33 admin sections; the
  guide should track them).
- **Video cost governance.** Video Studio spend is off by default (`VIDEO_STUDIO_MAX_COST_CENTS=0`).
  Keep generation human-triggered; never let the pipeline spend autonomously. Orchestration
  automates the *routing*, not the *spending*.

**Acceptance criteria:** every feature in `feature-registry.json` has a visible learning-package
status; a feature whose route/nav changed raises a drift flag within one scheduled cycle; no
video is generated without an explicit human action and a non-zero budget.

---

## 8. QA, Regression, and Accessibility Automation Audit

**Current state:** 121 Jest files (strong unit coverage of `lib/` engines); 4 Playwright E2E
specs; `eslint-plugin-jsx-a11y/recommended` mostly at error, 7 rules at `warn`; **335 contrast
regression tests written but stranded on local branch `fix/theme-contrast-mobile`**.

**This is the highest-ROI cleanup area because most of the work is already done but disconnected.**

| Layer | Today | Recommendation |
|---|---|---|
| **Critical journeys (A1)** | Specs exist, never run in CI | Install `@playwright/test`; run on PR + against Vercel preview. Cover: sign-in (keyless + real), upload→diagnose→result, CSV/photo import, sport switch, dashboard load, admin gate. |
| **Visual regression** | None | Add Playwright `toHaveScreenshot()` snapshots for the dashboard, a marketing page, and one sport page across **light/dark + 1 mobile + 1 desktop**; this catches layout overlap & theme regressions automatically (you've fought both — see the floating-dock/contrast memories). |
| **Accessibility (A4)** | 7 a11y rules at `warn`; no runtime axe | Land the 335 contrast tests off the local branch; add `@axe-core/playwright` assertions to the journey specs; ratchet the 7 `warn` rules to `error` one at a time as surfaces are cleaned. |
| **Performance (A7)** | "Check CWV after deploy" (manual) | `@lhci/cli` (Lighthouse CI) against preview URLs with a budget (LCP/CLS/TBT, a11y ≥ 95, SEO ≥ 95). Fail PR on regression. |
| **Forms/uploads/media** | Unit-tested in parts | Add journey coverage for the upload + import + contact/email-capture forms (happy path + one validation failure each). |
| **Responsiveness** | Manual | Run the journey + visual suite at mobile and desktop viewports (Playwright `devices`). |

**Why it matters:** SwingVantage auto-deploys to production. Right now the only thing between a
bad commit (yours **or an agent's**) and swingvantage.com is build + unit tests. Journey +
visual + a11y + perf gates convert "we hope the page renders" into "the robot proved the core
experience still works, looks right, meets WCAG, and is fast" — on every change. **This is the
safety substrate the whole tandem-agent model needs.**

---

## 9. Security and Reliability Automation Audit

**Current state (mature on security, absent on reliability):** Gitleaks + CodeQL + `npm audit` +
custom scanner in CI; Dependabot; constant-time secret comparison, fail-closed middleware,
distributed Upstash rate limiting, trusted client-IP across 22 routes, CSP hardening, CRON
`safeEqual`, AI-spend kill-switch — all shipped (see `docs/SECURITY_AUDIT_2026-06.md`).

**The asymmetry: security automation is excellent; reliability automation is zero.**

| Opportunity | Detail | Rec |
|---|---|---|
| **A2 — Error monitoring** | No Sentry, no `instrumentation.ts`, no release health. | Add `@sentry/nextjs`; capture API-route + client errors, AI-route failures/fallbacks/rate-limit rejections, with release + source maps. This is the #1 reliability gap. |
| **A2 — Uptime monitoring** | None. | External monitor (UptimeRobot / Better Uptime / Vercel's own) on `/`, `/api/capabilities`, and a couple of key routes; alert to owner. |
| **A17 — Incident runbooks/alerts** | None. | Once A2 exists: severity thresholds → notification (email/Slack), with a one-page auto-runbook per alert type (rollback = redeploy previous Vercel build). |
| **Upload safety** | Validated per-route. | Add a recurring check that upload routes enforce size/type/rate limits and that storage buckets are private (RLS noted as an owner step). |
| **Abuse prevention** | Rate limiting shipped. | Add anomaly alerts (spike in AI-route spend approaching the kill-switch threshold; surge in a single IP/account) surfaced on `/admin/system-health`. |
| **Secrets/env drift** | Gitleaks on commits. | Pair with A10 (fail-fast env schema) so a missing prod secret is caught at build, not at runtime. |
| **Backups** | Relational Supabase sync exists. | Document + verify automated DB backups + a periodic restore-test; surface "last successful backup" on system-health. |

**Acceptance criteria:** a forced error appears in Sentry within minutes; an induced outage
fires an uptime alert; AI spend nearing budget raises an admin alert; system-health shows last
backup + uptime + error-rate.

---

## 10. Analytics and Business Intelligence Automation Audit

**Current state:** a clean, provider-agnostic abstraction (`lib/analytics.ts` →
GA4/Plausible/PostHog, with a `~30-event` taxonomy in `@swingiq/core`), an InsightsDashboard
component, a `growth-report` script — but **no provider env var is set, so production emits
nothing.** Every BI table is empty by construction.

**The unlock sequence (do in order):**

1. **A3 — Switch it on.** Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (recommended: cookieless,
   no consent banner, fits the youth-safe positioning) and/or `NEXT_PUBLIC_POSTHOG_KEY` for
   product analytics + funnels. Add an **event-QA test** (Playwright) that asserts key events
   actually fire — so "analytics is on" can't silently regress.
2. **A9 — Funnel & drop-off automation.** Weekly job pulls the funnel (PostHog API or GA4 Data
   API), computes step-conversion + drop-off, segments by sport/persona/device, and writes a
   ranked friction report to `/admin/insights` + `docs/audits/product/<date>.md`.
3. **Cohort/retention + feature-adoption.** Automated weekly cohort retention curves and
   feature-adoption (which `lib/` features get used) → feeds the growth loop and prioritizes
   the tutorial pipeline (low-adoption features get a tutorial push).
4. **Executive dashboard automation.** Auto-fill the currently-empty KPI tables in
   `growth:report` from live analytics; surface a single `/admin/analytics` exec view
   (acquisition → activation → retention → revenue-readiness).
5. **Monetization analytics (A21, gated).** When ads turn on (per the free→ads→subs
   go-to-market order), automate RPM / viewability / UX-friction-vs-revenue monitoring. **Not
   now** — correctly deferred behind the monetization phase.

**Why it matters:** every "find drop-off," "recommend product improvements," "measure whether
anything works" ask in the brief is **blocked on this one switch.** It is simultaneously the
cheapest (an env var + a test) and the most unblocking automation in the whole audit — which is
why A3 sits at the top of the roadmap alongside the safety gate.

---

## 11. Admin and Internal Operations Automation Audit

**Current state:** 33 admin sections including `/admin/system-health`, `/admin/feature-education`,
`/admin/video-studio`, `/admin/social`, `/admin/growth` (28 sub-modules), `/admin/seo`,
`/admin/security`, `/admin/feature-flags`, `/admin/audit-log`, `/admin/setup`, `/admin/support`,
`/admin/monetization`. Admin-guarded, with an allowlist (`lib/auth/admin-allowlist`).

**The meta-gap: lots of admin *screens*, no single *operations cockpit*.** A non-technical owner
currently has to know which of 33 screens to check, and the ~12 scheduled robots are invisible
in the UI (they write markdown to `docs/`).

- **A6 — Automation Control Plane (the flagship admin automation).** One screen
  (`/admin/automations`) that reads the robots' dated reports + CI status + hook outputs and
  shows, per automation: **last run, status (green/amber/red), # findings, trend, and a
  one-click link to the report.** Effectively a live mirror of
  `scheduled-audits-registry.md` + `master-audit-report.json`, but rendered and current. This
  is what lets the owner "manage the platform without deep technical knowledge."
- **A11 — Audit→Ticket→Verify loop.** Parse the audit robots' findings into a tracked backlog
  (status: open / in-progress / fixed / verified), shown in the Control Plane, so findings
  don't die in markdown. Optionally let an agent *draft* fixes on a branch for human review
  (never auto-merge).
- **Content approval queues (partly exist).** Feature-Ed, Social, SEO each have review UIs;
  unify them into one "needs your review" inbox on the Control Plane (count badge).
- **System-health enrichment.** Once A2/A3 land, surface uptime, error rate, AI-spend-vs-budget,
  last backup, and analytics-provider status on `/admin/system-health` (the integration-status
  reporter already exists — `getIntegrationStatus()`).

**Acceptance criteria:** from `/admin/automations` the owner can see every robot's health and
last finding count, every "needs review" queue with counts, and live system health — without
opening a terminal or reading a markdown file.

---

## 12. AI-Agent Automation Architecture

SwingVantage already runs **7 deterministic Growth Agents** + a coordinator (`lib/agents/*`:
churn, dispatch, activation, referral, practice-companion, trust-linter, ad-creative). The
right model here is **not** "add autonomous LLM agents everywhere" — it's a **fleet of mostly-
deterministic agents with narrow LLM phrasing, every one draft-first, budget-capped, and
human-gated**, surfaced through the Control Plane (A6). This matches the culture that's already
working.

**Universal agent contract (applies to all):**
- **Inputs:** read-only from existing engines/data + (for watchers) live analytics/Sentry.
- **Outputs:** **drafts, findings, or tickets — never live publishes, never pushes, never
  user-facing sends** without a human click.
- **Guardrails:** deterministic core; LLM only for wording, behind `AI_DAILY_BUDGET_CENTS`;
  must pass A8 (content gate) before anything is publishable; honesty-linter (`trust-linter`)
  on all copy.
- **Approval:** lands in a Control-Plane review queue with confidence score + rationale.
- **Audit:** every action logged to `/admin/audit-log`.

| Agent | Purpose | Inputs | Outputs | Guardrails | Lives in |
|---|---|---|---|---|---|
| **Developer QA Agent** | Triage CI / E2E / a11y / Lighthouse failures; draft fixes | CI logs, Playwright traces, Sentry | Failure summary + draft fix branch | No auto-merge; tests must pass | `/admin/automations`, CI |
| **SEO/AEO/GEO Agent** | Extend S1: drafts, schema, internal links, AEO visibility | Sitemap, seoPages, GSC, AI-engine probes | Draft pages/metadata + report | No auto-publish; A8 gate | `/admin/seo`, S1 task |
| **Content Quality Agent (A8)** | The pre-publish trust gate every artifact crosses | Any draft + existing corpus | Score + blocking reasons | Blocks publish on fail | `lib/content-gate`, all review UIs |
| **Tutorial Generation Agent** | Already real (Feature-Ed); orchestrate the conveyor (A13) | feature-registry | Learning-package draft + status | Human approve each hop | `/admin/feature-education` |
| **Video Generation Agent** | Already real (Video Studio); keep spend human-gated | Video gaps, briefs | Brief → video → placement | `VIDEO_STUDIO_MAX_COST_CENTS` | `/admin/video-studio` |
| **Security Review Agent** | Summarize CodeQL/Gitleaks/`npm audit`/custom scanner; propose patches | CI security outputs, Dependabot | Prioritized findings + draft bumps | Advisory; no auto-merge | `/admin/security` |
| **Accessibility Review Agent** | Run axe/contrast, propose token/markup fixes | axe results, contrast tests | A11y findings + draft fixes | Must not regress contrast suite | A4 pipeline |
| **Theme Regression Agent** | Watch visual snapshots + contrast tokens across 7 themes | Playwright screenshots, token diffs | Regression flags | Snapshot review required | A4/A8 pipeline |
| **User Journey Agent (A9)** | Find drop-off, propose product fixes | Live analytics (A3) | Weekly friction report + experiment ideas | Read-only; suggestions only | `/admin/insights` |
| **Sports Coaching Agent** | Assemble per-sport learning paths (A14) | SPORT_TAXONOMY, AGI, faults | Deterministic path + AI wording | No invented drills; honesty gate | `lib/athletic-journey`, `/journey` |
| **Analytics Insight Agent** | Cohorts, retention, feature-adoption summaries | Analytics APIs | Exec summary, KPI fill | Read-only | `/admin/analytics` |
| **Monetization Agent (gated)** | RPM/UX-friction vs revenue (when ads on) | Ad metrics, analytics | Optimization suggestions | Off until ads-on phase | `/admin/monetization` |
| **Documentation Agent** | Keep docs/admin-guide/changelog in sync; drift flags | Routes, features, commits | Doc drafts, drift flags | No auto-publish | `scripts/`, `/admin` |
| **Competitive Intelligence Agent (A18)** | Keyword/backlink/AEO-visibility deltas | Env-gated adapters | Draft recommendations | White-hat only; draft-only | `/admin/growth/market-intel` |
| **Backlink/Internal-Linking Agent (A19)** | Suggest internal/outreach links on new content | Link Intelligence | Anchor suggestions | Never auto-insert | `/admin/growth/link-intelligence` |
| **Admin Assistant Agent** | Natural-language "what needs my attention?" over the Control Plane | All robot reports, queues, health | Prioritized daily brief | Read-only; links to sources | `/admin/automations` |

**Sequencing:** the *deterministic watchers and gates* (Developer QA, Content Quality,
Accessibility, Theme Regression, User Journey, Analytics Insight) come first because they only
need A1–A4 + A2/A3. The *generative* agents already exist (Tutorial, Video, SEO, Growth) — they
need orchestration (A13/A6), not invention. The *Admin Assistant* comes last, as the natural-
language face over a Control Plane that already has structured data.

---

## 13. Automation Governance Model

SwingVantage already has a **strong, explicit governance posture** (`docs/automation.md` §"What
we do NOT automate"; scheduled-tasks "local commits only, never push"; draft-first everything;
AI budget kill-switch). The job here is to **formalize and extend** it into a model that scales
to the agent fleet — not to invent it.

**The five gates every automation must pass:**

1. **Capability gate — least privilege.** An automation may *read* broadly but may only *write*
   to: a draft store, a findings/report file, a review queue, or a branch. **No automation may
   publish content, send a user message, post social, push git, or spend AI budget without an
   explicit human action.** (Codifies current behavior.)
2. **Quality/safety gate (A8).** Anything destined for users (content, tutorials, emails) must
   pass the Content Quality & Safety Agent: thin/duplicate/honesty/brand/schema/a11y checks.
   Below threshold ⇒ blocked, with reasons.
3. **Confidence threshold.** Each finding/draft carries a confidence score; low-confidence items
   are flagged "needs verification" (mirrors the master-audit's existing confidence column) and
   never auto-actioned.
4. **Human-in-the-loop approval.** All user-facing or destructive actions require a click in a
   review queue (Control Plane). Tandem-agent safety rule stays: **commit only with explicit
   pathspec, never `-A`/bare; prefer a worktree for multi-file work.**
5. **Auditability & rollback.** Every automated action is logged to `/admin/audit-log` with
   actor (which robot), inputs, output, and confidence. Rollback paths: content = unpublish
   draft; deploy = redeploy previous Vercel build; data = restore from backup (A2/§9).

**Spend governance:** all AI usage routes through `lib/ai-budget.ts`; the global kill-switch
(`AI_DAILY_BUDGET_CENTS`, off by default) is the hard ceiling. Watchers/gates are deterministic
and **free**; only phrasing/generation costs money and is human-triggered.

**Trust governance:** the `trust-linter` honesty agent runs on all generated copy (no
overclaiming, keep "estimated" labels, no fake reviews/ratings) — this is a *competitive moat*,
not just compliance, and must remain a hard gate.

**Anti-goals (explicitly avoid):** autonomous SEO-page publishing, autonomous social posting,
autonomous user emails, autonomous git push, mass-DM/scraping, any youth-data exposure, and any
"self-healing" that edits production without a human reviewing the diff. These are already your
stated policy — the model just makes them enforceable as code, not just convention.

---

## 14. Prioritized Roadmap

### Phase 1 — Foundation (next 1–2 weeks): *instrument & make-safe*
- **A2** Production observability (Sentry + uptime). *#1 reliability unblock.*
- **A1** Critical-Journey Safety Gate (Playwright in CI + preview). *#1 safety substrate.*
- **A3** Analytics activation + event-QA test. *#1 data unblock (mostly owner config).*
- **A10** Env/secret schema validation (fail-fast).
- **A4** Land the 335 contrast tests off the local branch + add axe to journeys.

> Phase 1 is deliberately *defense*. It is cheap, low-risk, and **converts every later
> automation from "hope" to "proof."** Three of the five are mostly wiring assets you already own.

### Phase 2 — Quality & growth watchers (30–60 days)
- **A7** Lighthouse CI / CWV budgets on previews.
- **A5** Live-site synthetic monitor (broken pages/links/console/overlap).
- **A6** Automation Control Plane v1 (read-only fleet status + review queues).
- **A8** Pre-publish Content Quality & Safety gate.
- **A9** Funnel drop-off → product recommendation loop (needs A3).
- **A11** Audit→Ticket→Verify backlog.
- **A12** Email lifecycle (connect provider, draft-first welcome series).
- **A19** Auto internal-link suggestions on drafts.

### Phase 3 — AI-agent orchestration (3–6 months)
- **A13** Feature→Tutorial→Video unified pipeline + docs drift detection.
- **A14** Sport-specific learning-path generator (Sports Coaching Agent).
- **Developer QA / Accessibility / Theme-Regression / Analytics-Insight agents** over the
  Phase-1/2 data.
- **A18** Competitive + AEO-visibility monitor.
- **A16** Repo-hygiene radar; **A17** incident runbooks.
- **A6 v2** Admin Assistant Agent ("what needs my attention?").

### Phase 4 — Advanced predictive / self-improving (6 months+)
- **A25** Generalized AI eval harness (golden-set evals gating AI-route changes in CI).
- **A15** Predictive profile enrichment + churn-risk → proactive (honest) re-engagement.
- **A21** Monetization/ad-RPM optimization (only after the ads phase begins).
- **A20/A22** Data-quality, retention-drift, and DSAR/consent automation as cloud accounts scale.
- Self-tuning content/learning-path systems that adjust from measured outcomes (always
  human-gated, always honesty-linted).

---

## 15. Implementation Backlog (developer-ready tickets)

> Full field set for the Phase-1 tickets (the ones to build now). Phase-2+ items are captured in
> the Opportunity Map (§2) and Roadmap (§14) and can be expanded the same way when scheduled.

### TICKET A1 — Critical-Journey Safety Gate
- **Title:** Run the existing Playwright E2E suite in CI and against Vercel previews.
- **Objective:** Block any change that breaks a core user journey from reaching production.
- **User/business value:** Protects the auto-deploy pipeline; makes tandem-agent and automated
  edits safe; prevents revenue/trust loss from a broken sign-in/upload/analyze flow.
- **Technical scope:** Add `@playwright/test` devDep to `apps/web`; new `.github/workflows/e2e.yml`
  (build + `npm run test:e2e` on PR/push to `master`); add a preview-targeted run using the Vercel
  deployment URL; expand specs to cover sign-in (keyless + real), upload→diagnose→result, CSV +
  photo import, sport switch, dashboard, admin gate. Keep e2e excluded from `tsc`/build (already is).
- **Files/systems:** `apps/web/package.json`, `apps/web/playwright.config.ts`, `apps/web/e2e/*.spec.ts`,
  `.github/workflows/e2e.yml`, Vercel preview URL (CI env).
- **Acceptance criteria:** PR fails when a core journey breaks; suite runs green on a clean tree;
  preview run executes against the deployed preview; retries=1 in CI (already configured).
- **Testing/validation:** Intentionally break a route → CI red; fix → green. Confirm no flake over
  3 consecutive runs.
- **Priority:** P0 (build first). **Complexity:** Low.

### TICKET A2 — Production Observability
- **Title:** Add Sentry error monitoring + external uptime monitoring + release health.
- **Objective:** Make production errors, AI-route failures, and outages visible in real time.
- **User/business value:** You can't fix or improve what you can't see; prerequisite for every
  "watch the live app" automation (A9, A11, A17).
- **Technical scope:** `@sentry/nextjs` with `instrumentation.ts` + client config; capture API-route,
  client, and AI-route failures/fallbacks/rate-limit rejections; upload source maps per release;
  tag by Vercel release. External uptime monitor on `/`, `/api/capabilities`, 1–2 key routes →
  owner alert. Surface status on `/admin/system-health` via `getIntegrationStatus()`.
- **Files/systems:** new `apps/web/instrumentation.ts`, `sentry.*.config.ts`, `next.config.mjs`
  (Sentry wrapper), `apps/web/src/app/admin/system-health/*`, external monitor (owner config).
- **Acceptance criteria:** forced error appears in Sentry with source context; induced downtime
  fires an alert; system-health shows error rate + uptime + provider status.
- **Testing/validation:** throw a test error in a non-prod build; pause a route to trip uptime.
- **Priority:** P0. **Complexity:** Low–Med. **Eng risk:** Low (additive).

### TICKET A3 — Analytics Activation + Event QA
- **Title:** Turn on a privacy-first analytics provider and guard events with a test.
- **Objective:** Make real usage/funnels measurable; stop silently dropping every event in prod.
- **User/business value:** Unblocks drop-off analysis, retention, KPI dashboards, and the entire BI
  automation class (A9) — the cheapest high-leverage switch in the audit.
- **Technical scope:** Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (cookieless; no consent banner) and/or
  `NEXT_PUBLIC_POSTHOG_KEY` (funnels). Add a Playwright event-QA spec asserting key events
  (`page_view`, upload, analyze, save) fire. Auto-fill `growth:report` KPI tables from the analytics
  API. **Owner step + small code.**
- **Files/systems:** Vercel env vars; `apps/web/src/lib/analytics.ts` + `components/analytics/Analytics.tsx`
  (already support all three); new `apps/web/e2e/analytics-events.spec.ts`; `scripts/growth-report.mjs`.
- **Acceptance criteria:** events visible in the provider dashboard; event-QA spec passes; KPI tables
  populate.
- **Testing/validation:** run a journey, confirm events land; break event wiring → spec fails.
- **Priority:** P0. **Complexity:** Low. **Eng risk:** Low.

### TICKET A10 — Env/Secret Schema Validation
- **Title:** Fail the build/boot when a required env var is missing or malformed.
- **Objective:** Catch misconfiguration at build time, not as a runtime 500 in production.
- **User/business value:** Prevents silent prod breakage (e.g., deployed without `SUPABASE_*` or a
  required secret); pairs with Gitleaks for full secrets hygiene.
- **Technical scope:** `zod`-validated `lib/config/env.ts` (server + `NEXT_PUBLIC_` split) imported
  early in `next.config.mjs`/server entry; required vs optional per target env; clear error messages.
  Reuse the truth in `lib/config/integrations.ts` (which already enumerates required vars).
- **Files/systems:** new `apps/web/src/lib/config/env.ts`, `next.config.mjs`, `lib/config/integrations.ts`.
- **Acceptance criteria:** removing a required prod var fails the build with a readable message;
  optional integrations remain optional; type-check stays green.
- **Testing/validation:** unit test the schema with present/absent/malformed envs.
- **Priority:** P1. **Complexity:** Low. **Eng risk:** Low.

### TICKET A4 — Accessibility + Contrast CI Gate
- **Title:** Land the contrast regression tests in CI and add runtime axe checks to journeys.
- **Objective:** Make WCAG contrast + a11y regressions impossible to merge; protect the 7-theme tokens.
- **User/business value:** Locks in accessibility work already done; prevents the recurring
  white-on-white / dark-on-dark theme regressions from returning.
- **Technical scope:** Bring the **335 contrast tests** from `fix/theme-contrast-mobile` onto `master`
  (cherry-pick into a tandem-safe worktree; explicit pathspec); run them in `growth-ci.yml`. Add
  `@axe-core/playwright` assertions to the journey specs (A1). Begin ratcheting the 7 `jsx-a11y`
  `warn` rules to `error` as surfaces are cleaned.
- **Files/systems:** `apps/web/src/lib/theme/*` + contrast test files, `.github/workflows/growth-ci.yml`,
  `apps/web/.eslintrc.json`, journey specs.
- **Acceptance criteria:** contrast suite runs in CI and fails on a token regression; axe finds no
  serious violations on covered journeys; no net-new `warn` rules.
- **Testing/validation:** nudge a token below AA → CI red; restore → green.
- **Priority:** P1. **Complexity:** Low–Med. **Eng risk:** Low.

---

## 16. Recommended First Implementation

**Build A1 — the Critical-Journey Safety Gate — first.**

**Why it's first (over even observability/analytics):**
- **It's the keystone of safety for everything else in this audit.** You auto-deploy `origin/master`
  to swingvantage.com, multiple agents share the checkout (tandem mode), and the *entire thesis* of
  this audit is "automate more." You should not accelerate automated change **until a robot can prove
  the core journeys still work.** A1 is that proof. Every other automation — and every tandem agent —
  becomes materially safer the moment it exists.
- **It's ~80% already built.** `playwright.config.ts` and four real specs
  (`smoke`, `keyless-auth`, `csv-import-diagnosis`, `floating-help-overlap`) exist. The missing 20%
  is *wiring*, not authoring: install `@playwright/test`, add one workflow, point it at the preview.
- **It is pure upside / lowest risk.** No user-facing change, no new runtime dependency in the app
  bundle, no privacy/security/spend surface, no external account required to start (unlike Sentry's
  project or an analytics provider). It can't make production worse; it can only catch regressions.
- **It pairs perfectly with the owner-side activations.** A2 (Sentry) and A3 (Plausible) each need an
  external account + an owner decision; A1 needs neither and can be merged today. Do A1 in code this
  week; flip on A2/A3 in parallel as owner-config tasks.

**Safe implementation plan (tandem-aware, no disruption to in-flight agents):**
1. **Isolate.** Create a dedicated git worktree (`scripts/agent-worktree.mjs` convention) so the
   other agents' uncommitted working-tree changes are never touched. Work only on E2E + CI files.
2. **Install + wire.** Add `@playwright/test` to `apps/web` devDependencies; add
   `.github/workflows/e2e.yml` that builds and runs `npm run test:e2e` on PR/push to `master`
   (the config already sets `retries: 1` and the `github` reporter under CI).
3. **Prove the gate works.** Run locally (`npm run test:e2e:install && npm run test:e2e`),
   confirm green; then intentionally break a route in the worktree to confirm the gate goes red,
   and revert.
4. **Expand coverage incrementally.** Add specs for the highest-value journeys not yet covered
   (real sign-in, upload→diagnose→result, sport switch, admin gate) — one per commit.
5. **Target the preview.** Add a second CI job that runs the suite against the Vercel **preview URL**
   so journeys are validated on the actual deployment before promotion.
6. **Commit tandem-safe.** Explicit pathspec only (the e2e + workflow files), never `-A`/bare;
   local commit; the owner reviews and pushes (consistent with the project's never-auto-push norm).
   Disable the feature-registry post-commit hook for these commits if you don't want registry churn
   (`git -c core.hooksPath= commit …`).

**Then, the same week, flip the two switches that need an owner decision:** create the Sentry project
(A2) and set the Plausible domain (A3). With the safety gate merged and the instrument panel on, the
entire Phase-2 watcher layer — and the agent fleet in §12 — has a foundation that can *prove* it never
broke the app and *measure* whether it helped.

---

_This is an audit only — no application code was changed. To proceed, the recommended order is
§16 (A1) → A2 → A3 → A10 → A4, then the Phase-2 roadmap in §14._
