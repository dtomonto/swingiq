# Master Scheduled Audit Report

_Consolidated: 2026-06-01 · Branch: `chore/seo-audit/2026-06` · Status: **local working document — nothing pushed**_

> **🔄 Auto-compiled monthly.** This report is regenerated on the 1st of each month at 11:00 AM by the
> `monthly-master-audit-report` scheduled task, which merges every scheduled audit — SEO/AEO/GEO (S1),
> AI-features (S7), engagement/retention (S9), build/CI health (S8), security (S3/S4), and growth (S5/S6) —
> into this single executive document. Each source audit writes its own dated report under `docs/audits/…`;
> the compiler reads those and overwrites this file. It commits **locally only — never pushes** (the owner reviews + pushes).
>
> 📋 **For the full schedule** — every audit/automation, how often it runs, and what it does — see the
> [Scheduled Audits & Automations Registry](scheduled-audits-registry.md). This report is the *findings*;
> that registry is the *schedule*.

> **📘 In Plain English (start here).** This single page merges every audit SwingVantage has
> run — the monthly SEO/AEO/GEO scan, the staged-navigation review, the automated security
> checks, and the weekly growth report — into one prioritized to-do list. It does **not**
> invent new problems: every item points back to the file it came from. If you only read one
> section, read **§4 Top 10 Actionable Insights** and the companion
> [audit-action-dashboard.md](audit-action-dashboard.md). The two highest-value, lowest-effort
> wins are: (1) add a share image + app icon (right now every shared SwingVantage link is a blank
> box), and (2) connect analytics so you can actually measure whether anything is working.

---

## 1. Executive Summary

SwingVantage's audit trail tells a consistent and encouraging story: **the technical SEO/security
foundations are healthy**, and the remaining work is mostly *activation* (turning on switches,
connecting providers, verifying claims) rather than *repair*.

**Biggest strengths confirmed across audits**
- All five built-in growth/trust checks pass (no broken internal links, no thin pages, no
  sitemap gaps, no placeholder text) — `docs/audits/seo-aeo-geo/2026-06-01.md`.
- The custom security scanner reports **0 findings, 0 critical** — `security-reports/custom-check-results.txt`.
- The staged-navigation audit closed every P0/P1 it found (404 page, middleware public paths,
  robots.txt, sitemap, trust/FAQ pages, internal linking) — `docs/audits/staged-navigation-seo-geo-aeo-audit.md`.

**Biggest risks (do not launch commercially without addressing)**
1. **No production observability or analytics.** You cannot see errors, uptime, or any KPI today —
   the growth report's metric table is empty because nothing is wired up. This is the single
   biggest blind spot for a launch.
2. **Owner security switches not enabled.** Branch protection, secret scanning, Dependabot alerts,
   and private vulnerability reporting are documented but not turned on in GitHub. The CI exists
   but does not yet gate merges.
3. **Legal/compliance is unreviewed.** Privacy Policy and Terms are practical placeholders; no
   COPPA/GDPR/CCPA review has happened. This matters before charging money or scaling youth use.

**Highest-ROI quick wins (high impact, low effort)**
- Add (or auto-generate) the missing `og-default.png` + app icons → fixes blank link previews,
  the missing favicon, the un-installable PWA, and the 404'ing Organization logo in one stroke.
- Connect an analytics provider + Google Search Console → unblocks the entire measurement loop.
- Flip the four GitHub security switches → ~30 minutes, materially hardens the repo.

**The honest framing:** SwingVantage is in good shape *as code*. The gap between "audited clean" and
"safely live for paying/youth users" is a checklist of activation and governance items, captured
below with sources.

---

## 2. Audit Sources Reviewed

| # | Source file | Type | Date | Scheduled? | What it contributed |
|---|---|---|---|---|---|
| S1 | [docs/audits/seo-aeo-geo/2026-06-01.md](audits/seo-aeo-geo/2026-06-01.md) | SEO/AEO/GEO audit | 2026-06-01 | ✅ Monthly (`seo-aeo-geo-monthly-audit`, cron `7 9 1 * *`) | OG/icon gap (P1), metadata-standardization gap (P2), llms.txt CV claim to verify (P3), deferred marketing pages, Organization/WebSite + llms.txt fixes |
| S2 | [docs/audits/staged-navigation-seo-geo-aeo-audit.md](audits/staged-navigation-seo-geo-aeo-audit.md) | Navigation + SEO/GEO/AEO audit | 2026-05-31 | ⚠️ One-time sprint audit (code inspection) | Closed P0/P1 (404, middleware, robots, sitemap); deferred a11y (skip-link, focus, breadcrumbs), deep-page back links, BreadcrumbList/HowTo JSON-LD, content gaps, E2E tests |
| S3 | [security-reports/custom-check-results.txt](../security-reports/custom-check-results.txt) | Custom security scan output | 2026-06-01 | ✅ Weekly via CI + on every push | 0 findings (no public secret vars, no unsanitized HTML, no eval, no hardcoded keys) |
| S4 | [.github/workflows/security-audit.yml](../.github/workflows/security-audit.yml) | CI security pipeline | (config) | ✅ Weekly (Mon 08:00 UTC) + every push/PR | Gitleaks, `npm audit` (fail on critical), lint/typecheck, custom scanner — defines the recurring security regime |
| S5 | [content/growth/reports/2026-06-01.md](../content/growth/reports/2026-06-01.md) | Growth surface report | 2026-06-01 | ✅ On-demand (`npm run growth:report`) | Surface counts (9 published / 5 draft SEO pages, 6 tools, 2 challenges, 6 emails); **KPI table empty → measurement gap** |
| S6 | [content/growth/weekly-plans/2026-06-01.md](../content/growth/weekly-plans/2026-06-01.md) | Weekly growth plan | 2026-06-01 | ✅ On-demand (`npm run growth:plan`) | Content/outreach cadence (1 article, 5 scripts, 10 outreach, 3 community posts, 1 conversion improvement) — drafts only, manual posting |
| S7 | docs/audits/ai-features/&lt;YYYY-MM-DD&gt;.md (written per run) | AI-features audit | (recurring) | ✅ Monthly (`ai-features-monthly-audit`, cron `23 8 1 * *`) | Audits/fixes/improves/enhances the AI video-vision feature, AI Coach/agents, prompts, model IDs, prompt caching, fallbacks, input validation & security, and capability-copy honesty. Commits LOCALLY only (owner pushes); feeds AI findings (F-04, F-25) into this report |
| S8 | docs/audits/build-health/&lt;YYYY-MM-DD&gt;.md (written per run) | Build / CI health audit | (recurring) | ✅ Weekly (`weekly-github-build-audit`, cron `47 8 * * 1`) | Audits GitHub open/stuck PRs + failing CI/Actions and local type-check/lint/build; fixes safe breakages. Commits LOCALLY only (owner pushes); feeds build/CI health into this report |
| S9 | docs/audits/engagement/&lt;YYYY-MM-DD&gt;.md (written per run) | Engagement / retention audit | (recurring) | ✅ Monthly (`engagement-features-monthly-audit`, cron `39 9 1 * *`) | Audits/fixes/improves/enhances the "ethical progress" engagement layer — Today's Fix returning-user card + `fixFraming` copy, Swing Passport milestones, ethical streaks + comeback flows, role coaching tones, challenges, coach-safe share cards, coaching-language i18n. Checks for dark patterns/manipulation, honesty/determinism, a11y, mobile-first, reuse, and translation coverage. Commits LOCALLY only (owner pushes); feeds engagement findings (F-30) into this report |
| — | (compiler) | Executive consolidation | (recurring) | ✅ Monthly (`monthly-master-audit-report`, cron `0 11 1 * *`) | Merges S1/S3/S4/S5/S6/S7/S8/S9 into THIS executive report + `audit-action-dashboard.md` + `master-audit-report.json`. Commits LOCALLY only (owner pushes) |
| R1 | [docs/LAUNCH_READINESS_CHECKLIST.md](LAUNCH_READINESS_CHECKLIST.md) | Reference backlog | May 2026 | — | 4-tier launch backlog (DB, AI key, deploy, legal, payments, monitoring, RLS, deletion, moat items) |
| R2 | [docs/OWNER_TASKS.md](OWNER_TASKS.md) | Reference backlog | — | — | Owner manual steps: key rotation (P1), GitHub security switches (P3), RLS/storage (P4), ADMIN/CRON secrets (P5), pro-reference verification, legal review (P6) |
| R3 | [docs/privacy-and-youth-safety-notes.md](privacy-and-youth-safety-notes.md) | Reference (privacy) | 2026-05-31 | — | Privacy posture, youth handling, claims avoided, "needs legal review before scale" |
| R4 | [docs/SEO_GEO_AEO.md](SEO_GEO_AEO.md) | Reference (strategy) | May 2026 | — | Content calendar, GSC setup, backlink strategy, on-page checklist, tracking targets |
| R5 | [docs/seo-system.md](seo-system.md) | Reference (system) | — | — | Canonical helpers (`buildMetadata`, `jsonLd.ts`), anti-thin-content gate — basis for standardization recommendation |
| R6 | [docs/automation.md](automation.md) | Reference (automation) | — | — | Script catalog, CI map, a11y lint posture (7 rules at warn), no-auto-publish policy |
| R7 | [docs/security-automation.md](security-automation.md) | Reference (security) | — | — | Workflow detail, branch-protection settings, Dependabot, custom rule table |

> **Traceability note.** S1–S9 are genuine audit *outputs* (S7 AI-features → `docs/audits/ai-features/`,
> S8 build/CI health → `docs/audits/build-health/`, S9 engagement/retention → `docs/audits/engagement/`);
> the compiler row is the process that merges them
> here. R1–R7 are reference docs that
> contain backlog/recommendations and supply evidence; they are not themselves "scheduled audit
> runs," and are labeled as such so findings stay honest.
>
> **Complete schedule (incl. non-audit automations).** The table above lists only the sources that feed
> *findings*. The full catalog of every scheduled job — including the weekly **SEO content production**
> task (`seo-content-production-weekly`, Wed ~9:15 AM, which produces pages rather than auditing) and the
> CI/hook automations — with each one's frequency and description, lives in the
> [Scheduled Audits & Automations Registry](scheduled-audits-registry.md).

---

## 3. Consolidated Findings Table

Priority: **P0** critical / **P1** high / **P2** medium / **P3** low. Effort: S/M/L. Confidence:
High / Med / Low (Low = *needs verification*).

| ID | Category | Finding | Business Impact | Technical Impact | Recommendation | Priority | Effort | Confidence | Source(s) |
|---|---|---|---|---|---|---|---|---|---|
| F-01 | SEO / Brand / PWA | `og-default.png`, `icon-192.png`, `icon-512.png` referenced but **absent** from `apps/web/public/` (verified: only `robots.txt` + `llms.txt` exist) | Blank link previews on every share; no favicon; PWA not installable; Org logo in JSON-LD 404s | Metadata, JSON-LD `logo`, and manifest reference non-existent assets | Add real artwork **or** implement `app/opengraph-image.tsx` + `app/icon.tsx` (brand green `#1a3a2a`, "SQ" wordmark) | P1 | S–M | High | S1 |
| F-02 | SEO / Theme / Debt | ~16 public marketing pages mid-edit (theme tokenization) were skipped by the SEO audit | Delays consistent branding + re-audit coverage | Uncommitted working tree blocks safe automated edits | Commit theme-tokenization work, then re-audit + tokenize those pages | P2 | M | High | S1, git status |
| F-03 | SEO / Maintainability | Sport-analysis & other pages hand-roll `metadata` + JSON-LD instead of `buildMetadata()` / `jsonLd.ts` builders | Inconsistent canonicals/Twitter cards; weaker Org linkage; drift risk | Duplicated SEO logic; some pages lack explicit canonical | Migrate hand-rolled pages onto the shared helpers | P2 | M | High | S1, R5 |
| F-04 | AEO / Accuracy / Trust | `llms.txt` claims SwingVantage "does not provide … computer vision pixel-level analysis" — may now conflict with the live AI-vision analyzer | Inaccurate claim erodes trust + AI-engine accuracy | Capability statement out of sync with shipped feature | Verify against current video analyzer; correct the claim either way | P1 | S | Med | S1, project memory |
| F-05 | Accessibility | No skip-to-content link; focus rings only Tailwind default; no breadcrumb component | Harder for keyboard/screen-reader users; WCAG gap | AppShell lacks skip target; no `<Breadcrumbs>` | Add skip-link to AppShell, standardize visible focus, build breadcrumb component | P1 | S–M | High | S2 |
| F-06 | UX / Navigation | `/sessions/import/image` and `/sessions/log` lack back links (dead-end risk) | Users can get stuck mid-workflow | Missing return navigation on deep pages | Add "back to import"/return links | P2 | S | High | S2 |
| F-07 | SEO / Content | Content-hub coverage conflicts across audits: staged audit says `/features`, `/resources`, `/glossary` "not created"; strategy doc lists glossary/blog/features/benchmarks as built | Missed long-tail/AEO coverage if gaps remain | Routing/content state unclear | **Verify** which hub pages exist now; fill remaining gaps; run monthly content calendar | P2 | M | Low | S2, R4 |
| F-08 | AEO | `BreadcrumbList` + `HowTo` JSON-LD deferred on sport-analysis pages | Fewer rich-result/answer-engine surfaces | Schema builders exist but unused on these pages | Add breadcrumb + HowTo schema (rides on F-05 breadcrumb work) | P2 | S | High | S2, R5 |
| F-09 | GEO | Site-wide `Organization` + `WebSite` entity nodes were missing; **fixed on homepage** | Improves "who are you" signals for AI engines | Other pages still lack Org linkage until F-03 | Spread Org linkage via F-03 standardization | P2 | — | High (partly resolved) | S1 |
| F-10 | GEO | `llms.txt` answer-page coverage was sparse — **fixed** (categorized full listing) | More answer pages discoverable by AI crawlers | — | None — resolved; keep updated as pages ship | — | — | High (resolved) | S1 |
| F-11 | Security / Process | GitHub branch protection on `master`, secret scanning, Dependabot alerts/auto-updates, private vuln reporting **not enabled** | CI runs but doesn't gate merges; no auto dep fixes | Protections are config-only until owner enables | Flip the four switches (Settings → Branches/Security) | P1 | S | High | R2, R7 |
| F-12 | Security | OpenAI API key was in a local plaintext file — treat as compromised | Key abuse / unexpected billing risk | — | Rotate key; update `.env.local` + Vercel | P0 | S | High | R2 |
| F-13 | Security / Config | `ADMIN_SECRET` and `CRON_SECRET` not set for production | Admin panel + cron endpoints unprotected if deployed without them | Endpoints expect these env vars | Generate (`openssl rand -hex 32`) and set in `.env.local` + Vercel | P1 | S | High | R2 |
| F-14 | Security / Data | Supabase RLS migration + private storage buckets not yet applied | Row-level data exposure once cloud is live | `apps/web/supabase-rls.sql` ready but unapplied | Apply RLS SQL; set buckets to private | P1 | S | High | R2, R1 |
| F-15 | Privacy / Compliance | Privacy Policy + Terms are placeholders; no COPPA/GDPR/CCPA review | Legal exposure before paid/youth scale | — | Attorney review before commercial launch | P1 | L (external) | High | R2, R3, R1 |
| F-16 | Privacy / Compliance | No cloud "delete my account + all data" flow or documented retention policy | COPPA/GDPR deletion-right gap once cloud accounts ship | Deletion exists locally; cloud path missing | Build account-deletion flow; document retention | P2 | M | Med | R1 |
| F-17 | Content / Trust | Professional swing references use `PLACEHOLDER_REQUIRES_ADMIN_VERIFICATION` video IDs | Reference library looks unfinished; trust dip | Unverified entries flagged in UI | Verify real YouTube IDs; set `verified: true` | P2 | M | High | R2 |
| F-18 | Reliability / Observability | No error monitoring (Sentry) or uptime monitoring configured | Outages/errors invisible in production | No instrumentation hook installed | Add Sentry + uptime monitor before launch | P1 | S–M | High | R1 |
| F-19 | Growth / Measurement | Analytics not connected; growth-report KPI table is empty | Cannot measure funnel, drop-off, or any KPI — blocks the growth loop | 30-event abstraction exists but no provider wired | Connect GA4/PostHog/Plausible; set up GSC; fill KPIs | P1 | S–M | High | S5, R1, R4 |
| F-20 | SEO / Performance | Core Web Vitals + live-crawl checks pending production deploy | Unknown real-world performance/SEO health | Requires live deployment to measure | Run CWV + crawl after first deploy | P2 | S | High | S2, R4 |
| F-21 | SEO | Sitemap not yet submitted to Google Search Console / Bing | Slower indexing/discovery | — | Submit `sitemap.xml` post-deploy (~30 min) | P2 | S | High | S2, R4 |
| F-22 | Product / AI | OCR auto-extraction service built but inactive (needs API key integration) | Image-import friction (manual entry only) | Service layer present, not wired to a provider | Integrate OCR provider key; activate | P3 | M | High | R2 |
| F-23 | Quality / Debt | No E2E navigation tests (Playwright) | Regressions in nav/journeys can slip through | Test coverage gap | Add Playwright journey tests | P2 | M | High | S2 |
| F-24 | Accessibility / Debt | 7 jsx-a11y rules set to `warn` (pre-existing violations); ~126 lint warnings | Latent a11y issues remain | Incremental-cleanup backlog | Burn down the 7 warn-rules in older surfaces | P3 | M | High | R6, S1 |
| F-25 | AI / Architecture | AI Coach memory/session continuity not built; AI-enhancement backlog (latest model IDs, prompt caching, fallbacks) | Weaker retention "moat"; missed AI quality gains | Recurring AI audit now automated (S7, `ai-features-monthly-audit`); still add session-memory context | P2 | M–L | Med | R1, S7, project memory |
| F-26 | Growth / Retention | Email templates exist but no provider connected; no welcome sequence | Lost re-engagement; leads not nurtured | `/api/email-capture` honest no-op without provider | Connect provider; build welcome series | P2 | S–M | High | R6, R1 |
| F-27 | Business / Product | No payment processing (Stripe) implemented | Cannot monetize | — | Implement Stripe Checkout + webhooks before paid tier | P1 (pre-paid) | L | High | R1 |
| F-28 | Security | Production HTTP security headers need post-deploy verification | Misconfig could weaken CSP/clickjacking defense | Headers reportedly set in middleware/next config | Verify at securityheaders.com after deploy | P2 | S | Med | R1, R2 |
| F-29 | Debt / Verify | Parse error seen in `video/SportVideoAnalyzerContent.tsx` during audit dev run; `tsc` now clean | Possible transient/already-fixed | — | Confirm builds clean on the committed tree | P3 | S | Low | S1 |
| F-30 | Product / Retention | "Ethical progress" engagement layer shipped (master @ `78a08ac`/`5d7afd2`): Today's Fix returning-user card + centralized `fixFraming` copy, Swing Passport milestones, role coaching tones (incl. Team organizer), "Choose your coaching language" label. Reuses existing agent/community/i18n engines (no duplication); verified tsc + 87 tests + lint clean + browser-rendered | Stronger return loop + clearer next action (retention moat, complements F-25/F-26) | Reframes the existing deterministic resume engine — no new claims/data; degrades gracefully on missing local data | **Enhance** (now auto-audited monthly via S9): translate the new fix-framing CTAs into the other 19 languages; wire streak-eligible/engagement events into analytics (F-19) so retention is measurable; optional app-wide CTA-language sweep | P3 | M | High | S9, project memory |

---

## 4. Top 10 Actionable Insights

### 1. Ship the missing share image + app icons (F-01)
- **What's wrong:** `og-default.png`, `icon-192.png`, `icon-512.png` are referenced everywhere but
  don't exist. Verified: `apps/web/public/` contains only `robots.txt` and `llms.txt`.
- **Why it matters:** Every shared SwingVantage link is a blank box (kills click-through), there's no
  favicon, the PWA can't be installed, and the Organization logo in structured data 404s.
- **What to do:** Either drop real artwork, or — faster — implement `app/opengraph-image.tsx` +
  `app/icon.tsx` to generate branded images in code (brand green `#1a3a2a`, "SQ" wordmark).
- **Expected impact:** Higher share CTR, installable PWA, complete brand/knowledge signals.
- **Implementation notes:** Next.js App Router supports file-based dynamic OG/icon generation; no
  design files required for the code path.
- **Success metric:** Non-blank preview when pasting a link into iMessage/Slack; favicon visible;
  Lighthouse PWA "installable" check passes.

### 2. Connect analytics + Google Search Console (F-19, F-21)
- **What's wrong:** No analytics provider is wired; the growth report KPI table is blank.
- **Why it matters:** You can't improve what you can't measure — funnel, drop-off, and every
  growth KPI are invisible. This blocks the entire weekly growth loop (S6).
- **What to do:** Wire the existing 30-event abstraction to GA4/PostHog/Plausible; verify GSC and
  submit `sitemap.xml`.
- **Expected impact:** Funnel visibility; ability to fill KPI tables; indexing insight.
- **Success metric:** Events flowing in the provider dashboard; sitemap "Success" in GSC.

### 3. Enable the four GitHub security switches (F-11)
- **What's wrong:** Branch protection, secret scanning, Dependabot alerts, and private vuln
  reporting are documented but off.
- **Why it matters:** CI runs but doesn't gate merges; no automated dependency fixes.
- **What to do:** Settings → Branches (protect `master`, require status checks) + Settings →
  Security (enable the three scanners).
- **Success metric:** Merges to `master` blocked unless `security-audit` + `CodeQL` pass.

### 4. Rotate the OpenAI key and set production secrets (F-12, F-13)
- **What's wrong:** A prior key sat in plaintext; `ADMIN_SECRET`/`CRON_SECRET` are unset.
- **Why it matters:** Exposed keys risk abuse/billing; unset secrets leave admin + cron paths open.
- **What to do:** Rotate the OpenAI key; `openssl rand -hex 32` for both secrets → `.env.local` +
  Vercel.
- **Success metric:** Old key revoked; admin/cron endpoints reject requests without the secret.

### 5. Add production observability (F-18)
- **What's wrong:** No error or uptime monitoring.
- **Why it matters:** Production failures would be invisible — unacceptable once real users arrive.
- **What to do:** Install Sentry (`@sentry/nextjs`) + an uptime monitor (UptimeRobot/Better Uptime).
- **Success metric:** A test error appears in Sentry; uptime alert fires on a forced downtime.

### 6. Close the accessibility baseline (F-05, F-08)
- **What's wrong:** No skip-to-content link, partial focus rings, no breadcrumb component.
- **Why it matters:** WCAG/keyboard/screen-reader gaps; breadcrumbs also unlock `BreadcrumbList`
  JSON-LD (AEO win).
- **What to do:** Add skip-link to AppShell, standardize visible focus, build `<Breadcrumbs>`, then
  emit BreadcrumbList + HowTo schema on sport pages.
- **Success metric:** Keyboard-only navigation reaches main content in one tab; axe/Lighthouse a11y
  score improves; breadcrumb rich results validate.

### 7. Get Privacy Policy + Terms legally reviewed (F-15)
- **What's wrong:** Both are practical placeholders; no COPPA/GDPR/CCPA review.
- **Why it matters:** Real legal exposure before charging money or scaling youth use.
- **What to do:** Engage counsel; confirm policy matches actual data flows; document third-party DPAs.
- **Success metric:** Attorney sign-off on both documents.

### 8. Standardize metadata + schema on the shared helpers (F-03, F-09)
- **What's wrong:** Pages hand-roll metadata/JSON-LD instead of `buildMetadata()` / `jsonLd.ts`.
- **Why it matters:** Inconsistent canonicals/cards, weaker Organization linkage, future drift.
- **What to do:** Migrate sport-analysis + other hand-rolled pages to the helpers (do it when those
  files aren't mid-edit per F-02).
- **Success metric:** Every public page emits a canonical + consistent OG/Twitter + Org link.

### 9. Verify and fix the llms.txt computer-vision claim (F-04)
- **What's wrong:** `llms.txt` says SwingVantage doesn't do computer-vision analysis; the live analyzer
  may now contradict that.
- **Why it matters:** An inaccurate self-description erodes trust and misleads AI answer engines.
- **What to do:** Compare the claim to the current video analyzer; correct `llms.txt` (and trust/
  limitation copy) to match reality.
- **Success metric:** Capability statements match shipped behavior on review.

### 10. Lock down cloud data before it exists (F-14, F-16)
- **What's wrong:** RLS + private storage buckets unapplied; no cloud account-deletion flow.
- **Why it matters:** Once Supabase holds real (and youth) data, these become hard requirements.
- **What to do:** Apply `supabase-rls.sql`, set buckets private, build a "delete my account + data"
  flow, document retention.
- **Success metric:** RLS denies cross-user reads in a test; deletion removes all user rows within
  the stated window.

---

## 5. Priority Roadmap

### Immediate fixes — 0–7 days
- **F-12** Rotate OpenAI key. *(P0)*
- **F-11** Enable GitHub branch protection + secret scanning + Dependabot + private vuln reporting.
- **F-01** Ship OG image + icons (or implement dynamic generation).
- **F-04** Verify/correct the llms.txt computer-vision claim.
- **F-29** Confirm the committed tree builds clean (resolve the flagged parse error if still present).

### Short-term improvements — 8–30 days
- **F-19 / F-21** Connect analytics + GSC; submit sitemap; start filling KPIs.
- **F-18** Add Sentry + uptime monitoring.
- **F-13** Set `ADMIN_SECRET` + `CRON_SECRET`.
- **F-05 / F-08** Accessibility baseline + BreadcrumbList/HowTo schema.
- **F-06** Add back links to deep session pages.
- **F-03 / F-09** Standardize metadata/schema once theme work (F-02) lands.
- **F-20** Run Core Web Vitals after first deploy.

### Strategic upgrades — 31–90 days
- **F-15** Legal review of Privacy/Terms.
- **F-14 / F-16** Apply RLS + private buckets; build account-deletion flow + retention policy.
- **F-27** Implement Stripe (gate behind ToS acceptance + AI disclaimer).
- **F-26** Connect email provider; build welcome sequence.
- **F-17** Verify professional swing references.
- **F-07** Resolve content-hub gaps; run the monthly content calendar.
- **F-23** Add Playwright E2E navigation tests.
- **F-22** Activate OCR auto-extraction.
- **F-24** Burn down the 7 jsx-a11y warn-rules.
- **F-25** Monthly AI-features audit now automated (`ai-features-monthly-audit`, S7); add AI Coach session memory.
- **F-30** Engagement layer shipped + now auto-audited monthly (`engagement-features-monthly-audit`, S9); enhance by translating the fix-framing CTAs and wiring engagement events into analytics (F-19).

### Long-term platform investments — 90+ days
- AI Coach memory as a retention moat (F-25 extension).
- Proprietary community benchmark database (R1 §4.1).
- Multi-generational family profiles (R1 §4.3).
- White-label for courses/schools (R1 §4.4).
- Real pose-estimation video analysis at scale (R1 §4.5).
- Coach certification + badging network (R1 §4.6).

---

## 6. Product & User Experience Recommendations

- **Navigation safety (F-06):** Add return/back links to `/sessions/import/image` and `/sessions/log`
  so deep workflows never dead-end. The 404 page and AppShell already prevent most traps.
- **Onboarding clarity:** Keep the honest "estimated" labels on all analysis output (a confirmed
  strength); ensure youth/parent flows stay parent-oriented (R3).
- **Trust signals:** Finish the professional reference library (F-17) so the Compare feature looks
  complete; keep the no-fake-reviews/ratings policy visible near conversion points.
- **Mobile/PWA:** Once F-01 lands, validate "Add to Home Screen" on iOS Safari + Android Chrome and
  the offline message.
- **Retention:** Connect the email lifecycle (F-26) and pursue AI Coach memory (F-25) so returning
  users feel continuity.
- **Engagement layer (F-30):** The "ethical progress" surface now shipped — Today's Fix returning-user
  card, Swing Passport milestones, ethical streaks/comeback flows, role coaching tones, coach-safe
  share cards. It is now audited monthly (S9, `engagement-features-monthly-audit`) for dark patterns,
  honesty, accessibility and translation coverage. Next enhancements: translate the new fix-framing
  CTAs (currently English-only) and wire engagement events into analytics (F-19) so the return loop
  is measurable. Keep all comeback/streak copy supportive — never shame or fake-urgency.
- **Conversion measurement:** The weekly plan (S6) calls for one conversion improvement per week —
  this is only meaningful once analytics (F-19) is live to measure before/after.

---

## 7. AI & Technical Architecture Recommendations

- **Run the monthly AI audit (F-25):** Now automated as the `ai-features-monthly-audit` scheduled task
  (cron `23 8 1 * *`, 1st of each month). Each run audits/fixes/improves/enhances the AI video-vision
  feature, AI Coach/agents, and all AI items — model IDs (prefer latest Claude), prompt quality, error
  handling/fallbacks, prompt caching, input validation/security, and capability-copy honesty — commits
  LOCALLY only (owner pushes), and feeds findings back into this report (S7).
- **AI Coach session memory (F-25):** Include the last ~3 session summaries in prompt context to
  create continuity ("last week your issue was X").
- **Capability honesty (F-04):** Keep `llms.txt`, trust copy, and limitation notices in lockstep with
  what the video analyzer actually does.
- **Activate OCR (F-22):** Wire the built OCR service to a provider to remove manual image-import
  friction; keep the manual review/edit step.
- **Reliability (F-18):** Add Sentry + uptime so AI endpoint failures and rate-limit rejections are
  observable.
- **Maintainability (F-03):** Centralize SEO metadata/schema on the shared builders to reduce
  duplicated logic and drift.
- **Test coverage (F-23):** Add Playwright journeys covering sport-switching and the upload→diagnose→
  results paths.

---

## 8. SEO, AEO, GEO & Growth Recommendations

- **Indexability/freshness:** Foundations pass (links, thin-content, sitemap, placeholders). Submit
  the sitemap to GSC/Bing (F-21) and check Core Web Vitals after deploy (F-20).
- **Schema (F-08, F-09):** Add `BreadcrumbList` + `HowTo` JSON-LD to sport pages; spread the
  `Organization`/`WebSite` linkage to all pages via standardization (F-03).
- **Answer-engine visibility (F-04, F-10):** Keep `llms.txt` accurate and current as new answer pages
  ship; maintain the categorized listing.
- **Content structure (F-07, R4):** Verify the content-hub gaps, then execute the monthly calendar
  (1 article + glossary expansion + 1 update entry). Keep drafts as drafts until substantive — the
  anti-thin-content gate (R5) enforces this.
- **Conversion paths:** Improve one high-intent page per week (S6), measured via F-19.
- **Off-site:** Pursue the manual, personalized outreach + backlink strategy (S6, R4) — no automated
  posting, per policy (R6).

---

## 9. Security, Privacy & Compliance Recommendations

- **Enable governance (F-11):** Branch protection + the three GitHub scanners turn existing CI into an
  enforced gate.
- **Secrets hygiene (F-12, F-13):** Rotate the exposed OpenAI key; set `ADMIN_SECRET` + `CRON_SECRET`.
- **Cloud data protection (F-14, F-16):** Apply RLS, set storage buckets private, build the cloud
  account-deletion flow, and document retention before any real data lands.
- **Headers (F-28):** Verify production security headers at securityheaders.com after deploy.
- **Privacy posture (R3):** Maintain local-first defaults, text-summary-only sharing, and the
  no-public-youth-data rule. Keep the three contact inboxes monitored.
- **Compliance (F-15):** Attorney review of Privacy/Terms and a COPPA/GDPR/CCPA assessment before
  commercial or regulated-jurisdiction launch. The custom scanner's clean result (S3) covers code
  anti-patterns, not legal compliance — don't conflate the two.

---

## 10. Accessibility & Inclusive Design Recommendations

- **Skip-to-content (F-05):** Add to AppShell so keyboard users bypass the nav.
- **Visible focus (F-05):** Move beyond Tailwind defaults to a consistent, high-contrast focus ring.
- **Breadcrumbs (F-05, F-08):** Build the component for orientation (and the schema win).
- **Lint burndown (F-24):** Resolve the 7 jsx-a11y rules currently at `warn`
  (`label-has-associated-control`, `media-has-caption`, `no-autofocus`,
  `click-events-have-key-events`, `no-static-element-interactions`, `no-redundant-roles`,
  `interactive-supports-focus`).
- **Readability/age-inclusive (R4):** Keep plain-language, direct-answer FAQ phrasing — good for both
  screen readers and answer engines; keep youth content parent-oriented.
- **Mobile ergonomics:** Verify tap-target sizing and contrast during the F-01/PWA pass.

---

## 11. Technical Debt Register

| ID | Item | Severity | Effort | Remediation |
|---|---|---|---|---|
| TD-1 | Hand-rolled metadata/JSON-LD instead of shared helpers (F-03) | Med | M | Migrate to `buildMetadata()` + `jsonLd.ts` builders |
| TD-2 | ~16 marketing pages mid-theme-tokenization (F-02) | Med | M | Commit theme work; finish tokenization; re-audit |
| TD-3 | 7 jsx-a11y rules at `warn` + ~126 lint warnings (F-24) | Med | M | Incremental cleanup; promote rules to error as fixed |
| TD-4 | No E2E navigation tests (F-23) | Med | M | Add Playwright journey coverage |
| TD-5 | Professional references use placeholder video IDs (F-17) | Med | M | Verify real IDs; flip `verified` flags |
| TD-6 | OCR service built but inactive (F-22) | Low | M | Integrate provider key; activate extraction |
| TD-7 | Possible transient parse error in `SportVideoAnalyzerContent.tsx` (F-29) | Low | S | Confirm clean build on committed tree |
| TD-8 | No cloud account-deletion flow / retention policy (F-16) | High (pre-cloud) | M | Build deletion endpoint; document retention |
| TD-9 | Missing OG/icon assets create 404 references (F-01) | High | S | Add assets or dynamic generation |

---

## 12. Implementation Backlog

### Epic A — Brand & Shareability
- **Story A1:** As a user sharing a link, I see a branded preview image.
  - *AC:* `og-default.png` (or `opengraph-image.tsx`) resolves 200; preview renders in
    iMessage/Slack/Facebook.
  - *Files:* `apps/web/src/app/opengraph-image.tsx`, `apps/web/src/app/icon.tsx`, `apps/web/public/`,
    `apps/web/src/config/site.ts`.
- **Story A2:** As a mobile user, I can install SwingVantage to my home screen with a real icon.
  - *AC:* manifest icons resolve; Lighthouse "installable" passes.
  - *Files:* `apps/web/public/manifest*`, icon files.

### Epic B — Measurement & Observability
- **Story B1:** As the owner, I can see funnel + KPI data.
  - *AC:* events flow to the provider; growth-report KPI table can be populated.
  - *Files:* `apps/web/src/lib/analytics.ts`, layout/provider wiring, `scripts/growth-report.mjs`.
- **Story B2:** As the owner, I'm alerted to errors and downtime.
  - *AC:* test error appears in Sentry; uptime alert fires.
  - *Files:* `apps/web` Sentry config (new), external uptime monitor.
- **Story B3:** As the owner, my pages are indexed.
  - *AC:* sitemap submitted + "Success" in GSC.
  - *Files:* `apps/web/src/app/sitemap.ts` (verify), GSC console (external).

### Epic C — Security & Governance
- **Story C1:** Merges to `master` require passing security checks. *(GitHub settings)*
- **Story C2:** Secrets are rotated/set. *(`.env.local` + Vercel: OpenAI key, `ADMIN_SECRET`, `CRON_SECRET`)*
- **Story C3:** Cloud data is protected by RLS + private buckets. *(`apps/web/supabase-rls.sql`, Supabase Storage policies)*
- **Story C4:** Users can delete their account + all data. *(new API route + Settings UI; document retention in `/privacy`)*

### Epic D — SEO/AEO Consistency
- **Story D1:** Every public page uses shared metadata/schema helpers.
  - *Files:* `apps/web/src/app/*/page.tsx`, `apps/web/src/lib/seo/metadata.ts`, `lib/seo/jsonLd.ts`.
- **Story D2:** Sport pages emit BreadcrumbList + HowTo JSON-LD.
  - *Files:* sport-analysis `page.tsx`, `components/seo/*`, `lib/seo/jsonLd.ts`.
- **Story D3:** `llms.txt` capability claims match the live analyzer.
  - *Files:* `apps/web/public/llms.txt`, `apps/web/src/app/video/*`.

### Epic E — Accessibility
- **Story E1:** Keyboard users can skip to main content. *(`components/layout/AppShell*`)*
- **Story E2:** Visible focus + breadcrumb component shipped. *(`components/seo/Breadcrumbs.tsx`, global focus styles)*
- **Story E3:** jsx-a11y warn-rules resolved in older surfaces. *(`apps/web/.eslintrc.json`, affected components)*

### Epic F — Monetization & Lifecycle (pre-paid)
- **Story F1:** Users can subscribe via Stripe with ToS acceptance + AI disclaimer.
- **Story F2:** New signups receive a welcome email sequence via a connected provider.

---

## 13. KPI Measurement Plan

| Area | KPI | Source / Tool | Target |
|---|---|---|---|
| SEO | Organic clicks, impressions, avg position, indexed pages | Google Search Console | Growing MoM; <10 avg position on primary keywords (R4) |
| SEO | Core Web Vitals | GSC / Lighthouse | All green post-deploy |
| Product | Completed analyses, tool results generated | Analytics (F-19) | Growing WoW (S5 table) |
| Conversion | Signup rate, email captures, report shares | Analytics | Improve via weekly conversion experiment (S6) |
| Retention | Returning users, sessions/user | Analytics | Growing WoW |
| AI quality | AI Coach response success rate, fallback rate, rate-limit hits | Sentry + logs (F-18, F-25) | Low fallback/error rate |
| Reliability | Uptime %, error rate | Uptime monitor + Sentry | >99.9% uptime; trending-down error rate |
| Security | Open Dependabot/CodeQL alerts, secret-scan findings | GitHub Security (F-11) | 0 critical open |
| Growth surface | Published vs draft SEO pages, tools, challenges | `npm run growth:report` (S5) | Steady publish cadence |

---

## 14. Final Strategic Recommendation

**SwingVantage's code is audited-clean; the work that remains is activation and governance, not repair.**
The fastest path to a trustworthy, scalable, discoverable launch is to sequence the cheap-but-blocking
items first, then the compliance gates, then the growth engine:

1. **This week:** rotate the key, flip the GitHub security switches, ship the OG/icon assets, and
   correct the llms.txt claim. These are hours of work and remove the most embarrassing/risky gaps.
2. **This month:** turn on the eyes — analytics + GSC + error/uptime monitoring — so every later
   decision is measured, not guessed. Close the accessibility baseline (it doubles as an AEO win).
3. **This quarter:** clear the legal/compliance gates (Privacy/Terms review, RLS, account deletion)
   before any real or youth data lands, then build the monetization + lifecycle engine.
4. **Beyond:** invest in the durable moats — AI Coach memory, a proprietary benchmark database, and
   multi-generational profiles — that competitors can't easily copy.

Maintain the project's strongest existing habit — **honesty** (estimated labels, no fake reviews,
no auto-publishing, local-first youth privacy). That posture is itself a competitive moat in a space
full of overclaiming apps. This report now stays current automatically — the `monthly-master-audit-report`
task recompiles it on the 1st of each month from every scheduled audit (see the auto-compiled note at the
top and §2).

---

_See the companion [audit-action-dashboard.md](audit-action-dashboard.md) for an at-a-glance status
board, [master-audit-report.json](master-audit-report.json) for the machine-readable version, and the
[Scheduled Audits & Automations Registry](scheduled-audits-registry.md) for the full schedule (what runs,
how often, and what each audit does)._
