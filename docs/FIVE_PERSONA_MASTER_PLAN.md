# SwingVantage — Five-Persona Master Implementation Plan
### Turning one multi-sport platform into five specific improvement products on one engine

> **Status:** Plan only — no code written yet. Authored 2026-06-06 after a full audit of the live repo.
> **Owner action needed:** confirm the Tennis tier (see "Sport Strategy Toggle") and say "go" to start Phase 1.
> **Core principle:** All persona/sport configuration in this plan (`personas.ts`, `sampleReports.ts`, `sportProof.ts`, `positioning.ts`, `seoPages.ts`, `sportStrategy.ts`) is **developer-only** — typed config files edited in code and deployed via commit. There is no admin UI and nothing is exposed to end users.

> **Update (2026-06-10):** Delivered and expanded since authoring. SwingVantage now supports **7 sports** (golf, tennis, pickleball, padel, baseball, slow-pitch & fast-pitch softball), and the sample-report set has grown from the 5 planned to **8** (`/sample-report/{golf,tennis,pickleball,padel,baseball,slow-pitch,fast-pitch}` + the softball chooser). "Five sports / five sample reports" below reflects the original 2026-06-06 plan, not current scope.

---

## In Plain English (start here)

**The problem (in one line):** Right now SwingVantage looks like *one broad AI swing tool that happens to do five sports.* It should feel like *five sharp, specific products* (a golf slice-fixer, a baseball exit-velo coach, a slow-pitch line-drive system, etc.) that quietly share one powerful engine underneath.

**The good news:** The site already has almost everything needed to do this — a content system for SEO pages, trust components, a sample-report card, a pricing model, and analytics. We are **not** rebuilding the app. We're adding a thin "personality layer" on top of what exists. About 70% of this work is writing content and arranging existing pieces, not new engineering.

**What changes for a visitor:**
1. The homepage asks **"What are you trying to fix?"** and shows cards like *"Fix my slice"*, *"Stop popping up"* — each going to a page built for that exact problem.
2. **Slow-pitch and fast-pitch softball get their own pages** instead of sharing one generic softball page. (Slow-pitch is a big, underserved search opportunity.)
3. **Five sample reports** (one per sport) so anyone can "see what they'll get" before starting.
4. Every sport page shows **real proof** — an example diagnosis, an honest "here's what we can't know from limited video," and a clear confidence label.

**What stays exactly the same:** It's still free, still works in a browser, still no account required to start, still private. We keep all the honest disclaimers (just worded more warmly). We do **not** push paid subscriptions — the money plan stays *free users first → ads → memberships later*.

**The toggle you asked for:** One small settings file lets you decide, per sport, whether it's a **headline card** (`primary`), a **small "also available" link** (`secondary`), or **hidden from menus** (`hidden`). Flip one word to promote or retire a sport across the whole site — without breaking anything or losing Google traffic. Tennis starts as `secondary` (the "middle ground").

**How it ships:** In phases, safest and highest-impact first — the homepage router, then the new softball pages + sample reports, then the SEO content wedges (slow-pitch, fast-pitch, and baseball, built to parity), then proof/trust, then pricing cleanup, then analytics.

---

## 1. Executive Summary

SwingVantage is a mature, well-architected Next.js app (App Router, Turbo monorepo, `@swingiq/core` engine package, token-based Tailwind theme system) with a strong SEO/content engine, a clean trust-component library, a working billing-tier model, and an analytics abstraction. It does not have a product problem — it has a **positioning and proof-specificity problem**.

Today the homepage presents "5 Sports, 1 Platform" with feature-described cards (and both softball cards link to the *same* generic page). There is **one** golf-only sample report. Sport hubs make claims but show limited worked proof. Slow-pitch — the biggest opportunity — is buried inside a shared softball page.

The fix is a thin **persona layer** on the existing engine:
1. A **pain-point persona router** on the homepage (5 cards → 5 distinct destinations).
2. **Five sport-specific sample reports** (reusing `ShareableReportCard`).
3. **Dedicated slow-pitch and fast-pitch hubs**, plus **SEO content wedges for slow-pitch, fast-pitch, and baseball** (parity across the headline sports).
4. A reusable **`SportProofBlock`** system (example diagnosis, what-we-can't-know, confidence label, before/after, coach/parent summary).
5. **Positioning + monetization clarity** consistent with the documented order: **grow free → ads → membership (Phase 3)**. Subscriptions are NOT the next move.
6. A **Sport Strategy Toggle** so each sport can be promoted/demoted/hidden from one config file.

Because the plumbing exists, ~70% of this is content + composition, not net-new engineering.

---

## 2. Current-State Diagnosis

### 2.1 What exists today (verified in repo)

| Area | Current reality | File(s) |
|---|---|---|
| Homepage | Hero → How-it-works → **feature** sport grid (5 cards, both softball → same URL) → Themes → Why → Free tools → single sample preview → trust → disclaimer → FAQ+JSON-LD → final CTA. **No pain-point persona routing.** | `apps/web/src/app/(marketing)/page.tsx` |
| Sport hubs | 4 hubs: golf, tennis, baseball, softball. Softball = "two modes" (slow/fast) in one page. Good FAQ + JSON-LD + `RelatedGuides`, but **no worked example / before-after / confidence explainer / coach summary** on the hub. | `(marketing)/{golf,tennis,baseball,softball}-swing-analysis/page.tsx` |
| Sample report | **One** hardcoded golf-slice sample. | `(marketing)/sample-report/page.tsx`, `components/report/ShareableReportCard.tsx` |
| SEO content engine | **Excellent.** Config registry → renderer → thin routes → auto-sitemap. 20 published pages incl. 4 softball. AEO/GEO format already. | `content/seoPages.ts`, `components/seo/SeoArticle.tsx`, `app/sitemap.ts` |
| SEO/schema/metadata | `buildMetadata()`, `buildGraph()` + Organization/WebSite/SoftwareApplication/FAQ/HowTo/Article/Service/Breadcrumb. Canonicals + OG centralized. | `lib/seo/metadata.ts`, `lib/seo/jsonLd.ts` |
| Trust components | `TrustBar`, `PrivacyAssuranceBlock`, `NotCoachReplacementNotice`, `YouthSafetyNotice`, `SafeUploadExplainer`, `WhatHappensToMyVideo`, `AnalysisTransparency`, `SampleReportPreview`. | `components/trust/` |
| Monetization | Free / Pro $12 / Team $49; Stripe gated by env (no keys = no charge). Documented order: **ads first, subscriptions Phase 3.** | `lib/billing/tiers.ts`, `(marketing)/pricing/page.tsx` |
| Analytics | `track(event, props)` → GA4/Plausible/PostHog/console. ~60 events. | `lib/analytics.ts`, `packages/core/src/analytics/events.ts` |
| Nav / footer | Persistent `MarketingHeader` + `PublicFooter`. | `components/layout/MarketingHeader.tsx`, `PublicFooter.tsx` |
| Onboarding entry | `/start` → `StartHereFlow`. | `(marketing)/start/page.tsx` |

### 2.2 Specific gaps mapped to the audit
1. **No intent-first routing.** Homepage sells *features*, not *pains*. Both softball cards collide on one URL.
2. **Softball is one product, not two + chooser.** Slow-pitch and fast-pitch have no hubs of their own.
3. **One sample report, golf only.**
4. **Proof is thin on hubs** ("what we look for" lives only inside SEO articles).
5. **No confidence-label explainer, no "what we can't know," no before/after, no coach/parent summary** as reusable components.
6. **Positioning is generic** ("Free AI Swing Analysis").
7. **Analytics lacks a persona dimension.**

### 2.3 Reconciliation: Tennis
The engine supports **5 sports**: `golf, tennis, baseball, softball_slow, softball_fast`. The audit's "five products" are **Golf, Baseball, Slow Pitch, Fast Pitch, General Softball** — and **omit tennis**, which is live (hub + 3 SEO pages + benchmarks + blog). **Decision: middle ground** — keep tennis as a `secondary` sport (small "Also analyze: Tennis →" link + nav/footer), not a headline persona card. Controlled by the Sport Strategy Toggle (§14B) so it can be promoted or retired anytime.

---

## 3. Strategic North Star

**Positioning statement (canonical, reused verbatim across surfaces):**
> *"The free, web-based swing improvement system for everyday athletes across golf, baseball, and softball — one fix, one plan, one retest at a time."*

**Three pillars every page must express:**
1. **Specific, not generic** — visitor feels "this is for *my* swing in *my* sport" within 3 seconds.
2. **Honest proof over hype** — every claim backed by a worked example, a confidence label, and an explicit "what we can't know." (Keep disclaimers; reframe confident & welcoming.)
3. **Free-first growth** — frictionless start (no account), ad-supported free, helpful (never manipulative) upgrades. Subscriptions are Phase 3.

**Locked constraints:** Fast, mobile-first, web-based, free to start; cloud-sync framing (never "local-only" for *data* — but keep true *video-privacy* claims); no dark patterns; no medical/guaranteed-performance claims; commit only with explicit pathspec (shared master / tandem agents).

---

## 4. Five-Persona Experience Strategy

Each persona is a thin routing + content layer mapping to an engine sport ID.

| # | Persona (card) | Engine sport | Primary destination | Sample report |
|---|---|---|---|---|
| 1 | **Golfer** — "Fix my slice or improve contact" | `golf` | `/golf-swing-analysis` | Golf slice |
| 2 | **Baseball** — "Hit harder and shorten my swing" | `baseball` | `/baseball-swing-analysis` | Rollover / low exit velo |
| 3 | **Slow Pitch** — "Stop popping up and hit line drives" | `softball_slow` | **[NEW]** `/softball-swing-analysis/slow-pitch` | Slow-pitch pop-up |
| 4 | **Fast Pitch** — "Catch up to speed and improve contact point" | `softball_fast` | **[NEW]** `/softball-swing-analysis/fast-pitch` | Fast-pitch late-contact |
| 5 | **Softball (general)** — "Choose the right softball swing path" | softball (chooser) | `/softball-swing-analysis` (becomes explicit chooser) | Mode-selection report |

**Routing model:** persona cards link to the relevant **hub** (best for SEO + browsing) with a `?intent=` query the hub and `/start` flow can read to preselect sport + pre-seed the example. The "analyze now" CTA routes to `/start?sport=<id>` to keep the no-account, fast path intact.

**Per-card spec** (drives `personas.ts` in §14):

- **Golfer** — Pain: drives leak right / can't find the face. CTA "Fix my slice — free" → `/golf-swing-analysis?intent=slice`. ATF: *"Stop the slice. Strike it pure. Your #1 path/face fix + a 7-day plan — free, no account."* Proof: golf example-diagnosis + slice before/after. Sample: `/sample-report/golf`. Goal: start a golf analysis.
- **Baseball** — Pain: weak grounders, long swing, low exit velo. CTA "Shorten my swing — free" → `/baseball-swing-analysis?intent=rollover`. ATF: *"Hit harder with a shorter, on-time swing. See what's leaking power — free."* Proof: rollover/exit-velo example + sequence "can't know." Sample: `/sample-report/baseball`.
- **Slow Pitch** — Pain: pop-ups / lazy flies. CTA "Stop popping up — free" → `/softball-swing-analysis/slow-pitch`. ATF: *"Turn pop-ups into line drives. Match your path to the arc — fix + drills free."* Proof: pop-up example + launch-angle explainer + bat-path before/after. Sample: `/sample-report/slow-pitch`.
- **Fast Pitch** — Pain: late on the rise ball / jammed. CTA "Catch up to speed — free" → `/softball-swing-analysis/fast-pitch`. ATF: *"Stop getting beat by speed. Tighten timing and contact point — free."* Proof: late-contact example + contact-depth explainer. Sample: `/sample-report/fast-pitch`.
- **Softball (chooser)** — Pain: "which path is right for me?" CTA "Find my softball swing path →" → `/softball-swing-analysis`. ATF: *"Slow pitch and fast pitch need different swings. Answer two questions and we'll point you to the right one."* Proof: side-by-side slow vs fast + mode-selection sample. Sample: `/sample-report/softball`.

---

## 5. Homepage Fix Plan

**[ENHANCE]** `(marketing)/page.tsx` — new section order:
1. **Hero** (reword to North Star). H1: *"One fix. One plan. One retest. Free swing improvement for golf, baseball & softball."* Keep `LiveAndFreeBadge`, `TrustBar`, "first result ~3 min," "No account / no card / private by default."
2. **[NEW] `PersonaPathCards`** under hero, `id="find-your-fix"`: *"What are you trying to fix?"* → 5 primary cards + secondary "Also: Tennis →" row (driven by the toggle). Fires `persona_card_clicked`.
3. **How it works** (keep `TutorialVideo`).
4. **[ENHANCE]** replace the feature sport grid (which has the duplicate-softball bug) with a slim "one engine, five specialties" strip linking to the 5 hubs (no duplicate URLs).
5. **[ENHANCE]** sample-report preview → multi-sport `SampleReportSwitcher` (tabs per visible sport).
6. **Why SwingVantage** (reword to pillars).
7. **Free tools** (keep).
8. **[NEW] Proof strip** — one `SportProofBlock`.
9. **Parent & coach trust** (keep).
10. **Disclaimer + FAQ + JSON-LD + final CTA** (keep; FAQ mentions slow/fast distinction).

**Risks:** hero/SEO copy changes touch the indexed homepage `<h1>` + FAQ JSON-LD → re-validate schema, keep primary keywords. **Acceptance:** persona block above the fold on 390px; no two cards share a destination; all fire analytics; perf ≥ baseline; FAQ rich-result passes.

---

## 6. Sport Page Fix Plan

**[ENHANCE] all hubs** to a shared structure: hero (reads `?intent=`) → **`SportProofBlock`** → "what we analyze / modes" → how it works → inline mini sample report → CTA → `/start?sport=<id>` → FAQ + JSON-LD + `RelatedGuides`. *(Fix: softball hub currently CTAs to `/login`; change to `/start`.)*

**[NEW] Split softball into three routes:**
- `/softball-swing-analysis` → **chooser** (slow vs fast, routes down). **Keep this URL** (indexed, sitemap priority 0.9) — repurpose, do **not** redirect.
- `/softball-swing-analysis/slow-pitch` → **[NEW]** dedicated hub (persona 3).
- `/softball-swing-analysis/fast-pitch` → **[NEW]** dedicated hub (persona 4).

Add both children to `sitemap.ts`; breadcrumb `Home → Softball → Slow Pitch`. **[ENHANCE] `RelatedGuides`** to optionally filter by a new `discipline` field so the slow-pitch hub shows only slow-pitch guides.

**Acceptance:** each hub shows ≥1 worked example + confidence label + "what we can't know"; softball children reachable, breadcrumbed, in sitemap; no orphan/duplicate softball URL; CTAs land on `/start`.

---

## 7. Five Sample Report Plan

**[NEW] config** `content/sampleReports.ts` — one `SampleReport` per sport, consumed by a `SampleReportTemplate` + existing `ShareableReportCard`.

**Schema (every audit field):** `userProfile, inputData, issueDetected, highestPriorityFix, evidenceUsed, confidenceLevel(+label), whyItMatters, drills[3], practicePlan7Day[], retestInstructions, progressMetrics[], coachSummary, parentSummary?, trustDisclaimer`.

**[NEW] routes:** `/sample-report/{golf,baseball,slow-pitch,fast-pitch,softball}`.
- Golf: out-to-in slice; evidence path/face; drills gate/release/transition; metrics start-line & curve; "can't know: exact launch numbers without a monitor."
- Baseball: rollover / low exit velo; barrel path + sequence; metrics exit-velo trend / grounder rate.
- Slow-pitch: pop-up; path under a descending arc; metrics line-drive %, launch window.
- Fast-pitch: late contact; time-to-contact + contact depth; metrics contact depth, mishit rate.
- Softball: **mode-selection** — same hitter, different diagnosis slow vs fast → "pick your mode."

**[ENHANCE]** `/sample-report` → index linking to all five (keep URL; in sitemap).
**Honest-data rule:** `confidence: 'Illustrative example (not your data)'`; explicit `trustDisclaimer`; no invented testimonials/numbers. **Acceptance:** 5 render, print/PDF-friendly, each → `/start?sport=<id>`, fire `sample_report_viewed {sport}`; youth disables public share.

---

## 8. Sport-Specific SEO Growth Wedges (Slow Pitch + Fast Pitch + Baseball)

Each page = one `SeoPage` object + a 3-line `page.tsx`. **All three wedges are resourced for parity** — slow-pitch leads (the audit's named opportunity), with fast-pitch and baseball built to comparable depth so every headline sport has a real search-traffic engine, not just a storefront.

**Shared mechanics (all wedges):** the registry already enforces title, metaDescription, directAnswer, problemExplanation, diagnosisSteps, whatSwingVantageLooksFor, 3 drills, mistakesToAvoid, whenToWorkWithCoach, faqs (→ FAQ schema), relatedLinks, cta, schemaType, safetyNotes. Add optional `discipline?: 'slow_pitch' | 'fast_pitch'` and `exampleDiagnosis?: string` to `SeoPage` (rendered by `SeoArticle`) so softball guides route into the correct slow/fast hub via `RelatedGuides`. Each page internal-links to 2 siblings + its hub + its sample report + a matching tool/challenge where one exists. **Acceptance (each wedge):** all pages published + in sitemap; `validate:seo`/`validate:content` pass; FAQ + HowTo rich-results pass; the hub lists exactly its silo; no `draft` indexed.

### 8A. Slow-Pitch wedge (spearhead) — 6 new + enrich 2
Existing: `slow-pitch-power`, `how-to-hit-line-drives`, `stop-popping-up`, `how-to-hit-slow-pitch`.

| Slug (`softball/…`) | Primary keyword | Intent | Status |
|---|---|---|---|
| `stop-popping-up` | stop popping up slow pitch | how-to | EXISTS — enrich |
| `how-to-hit-line-drives` | hit line drives slow pitch | how-to | EXISTS — enrich |
| `best-launch-angle-slow-pitch` | best launch angle slow pitch softball | informational | NEW |
| `end-loaded-bat-swing` | how to swing an end-loaded slow pitch bat | informational | NEW |
| `bat-path-mistakes` | slow pitch bat path mistakes | informational | NEW |
| `how-to-hit-backside` | hit backside slow pitch softball | how-to | NEW |
| `timing-guide` | slow pitch softball timing | informational | NEW |
| `bat-speed-exit-velocity` | slow pitch bat speed exit velocity | commercial | NEW |

`discipline: 'slow_pitch'`; links to `/tools/slow-pitch-line-drive-guide` + `/challenges/7-day-slow-pitch-line-drive` (both exist); CTA → `/start?sport=softball_slow`. **Total: 10 slow-pitch pages.**

### 8B. Fast-Pitch wedge (NEW — parity) — 6 new
Today fast-pitch has a hub + sample report but **zero** dedicated SEO pages. This builds its search engine. (Fast-pitch is a high-intent travel-ball / HS / college-recruiting market.)

| Slug (`softball/…`) | Primary keyword | Intent | Status |
|---|---|---|---|
| `how-to-hit-a-rise-ball` | how to hit a rise ball | how-to | NEW |
| `fast-pitch-timing` | how to catch up to fast pitching | how-to | NEW |
| `fast-pitch-contact-point` | fast pitch softball contact point | informational | NEW |
| `stop-getting-jammed` | stop getting jammed fastpitch | how-to | NEW |
| `how-to-slap-hit` | how to slap hit in fastpitch softball | informational | NEW |
| `fast-pitch-bat-speed` | fast pitch bat speed and exit velocity | commercial | NEW |

`discipline: 'fast_pitch'`; CTA → `/start?sport=softball_fast`. **Total: 6 fast-pitch pages.** (Both softball disciplines now feed their own hubs cleanly via the `discipline` filter.)

### 8C. Baseball wedge (NEW — parity) — 4 new
Existing: `stop-rolling-over`, `exit-velocity-drills`, `youth-hitting` (3). Add 4 to match the others.

| Slug (`baseball/…`) | Primary keyword | Intent | Status |
|---|---|---|---|
| `stop-chasing-high-pitches` | stop swinging at high pitches | how-to | NEW |
| `how-to-time-a-pitch` | baseball hitting timing | how-to | NEW |
| `two-strike-approach` | two strike approach baseball | informational | NEW |
| `hit-the-other-way` | how to hit the ball the other way | how-to | NEW |

CTA → `/start?sport=baseball`. **Total: 7 baseball pages.**

> **Net SEO build: 16 new pages** (6 slow-pitch + 6 fast-pitch + 4 baseball) + enrich 2 slow-pitch. Golf already has ~9 (no new needed); tennis stays at 3 (`secondary`). Result: golf 9 · baseball 7 · slow-pitch 10 · fast-pitch 6 · (tennis 3) — every headline sport now has a genuine content silo.

---

## 9. Proof, Trust, and Confidence System Plan

**[NEW] reusable, config-driven components** (compose existing trust pieces; config in `content/sportProof.ts`):

| Component | Purpose | Built from |
|---|---|---|
| `SportProofBlock` | Per-sport proof wrapper | composes below |
| `ExampleDiagnosisCard` | Real-shaped diagnosis for the sport | new, config-fed |
| `WhatWeUseBlock` | "What data SwingVantage uses" | reuse `AnalysisTransparency` |
| `WhatWeCannotKnowBlock` | Honest limits from limited input | **NEW (key gap)** |
| `ConfidenceLabelExplainer` | Explains estimate / illustrative / measured tiers | **NEW** |
| `BeforeAfterRetest` | Day-1 vs Day-7 expectation (illustrative) | **NEW**, reuse `components/retest` |
| `ParentCoachSummary` | Toggle: coach view / parent view | reuse `ShareableReportCard` summary builder |
| `PrivacyTrustCallout` | Video-privacy + cloud-sync-honest data framing | reuse `PrivacyAssuranceBlock`, `WhatHappensToMyVideo`, `YouthSafetyNotice` |

**Copy guardrails (enforce in review):**
- Keep the yellow disclaimer, "heuristic estimate," "pairs with a coach" — **reword confident & welcoming, never delete.**
- **Video** privacy claims stay ("analysis runs in your browser; only selected frames sent"). **Data-storage** copy must reflect **cloud sync / hybrid**, never "local-only"; mode-gate via `useAuth().mode`. → QA: audit homepage ("saved privately in your browser") and `/parents` ("not uploaded to external servers by default") for over-claiming local-only storage.
- No medical/guaranteed-performance claims.

**Acceptance:** every hub + sample report shows example diagnosis + confidence explainer + "what we can't know"; `scan:placeholders`/`check:trust` pass; no "local-only" data claim remains.

---

## 10. Monetization Architecture Plan

Respect the documented order — **grow free → ads (first revenue) → membership (Phase 3, NOT next).** This clarifies/labels structure now; it does **not** push subscriptions.

**Tiers** (keep IDs `free/pro/team`):
- **Free (forever):** all sports, priority diagnosis, drills + plans, history/progress, backup/restore, comparison — **ad-supported**, no account where possible.
- **Pro $12 (Phase 3, "Coming soon"):** ad-free, cloud sync, video/report history, PDF coach reports, OCR/image import, pro library, advanced progress, equipment/gapping.
- **Team $49 (Phase 3):** coach dashboard, invites, team analytics, shared reports, program progress, white-label.

**[ENHANCE] now:**
1. Add Free-tier ad/value rows + "ad-supported" label; mark Pro/Team **"Coming soon"** (matches gated-Stripe reality).
2. **[NEW] `MonetizationTierComparison`** (pricing, features, compact on hubs).
3. **Ethical ads framework (off by default):** `AdSlot` reads `NEXT_PUBLIC_ADS_*` (keyless/off). Rules: never between user and result; never in a youth report; never interstitial on `/start` or upload; clearly labeled "Ad"; one slot per free content page.
4. **No-dark-pattern rules (documented + enforced):** no fake scarcity/countdowns, no pre-checked upsells, no confirm-shaming, never hide the free path, cancel as easy as subscribe.
5. **Helpful upgrade moments:** show Pro value only when genuinely useful (2nd device → sync; Nth analysis → full history; share → PDF to coach). Each fires `upgrade_clicked {feature, surface}` with a clear dismiss.

**Acceptance:** pricing shows Free (ad-supported) live + Pro/Team "coming soon"; no checkout charges without keys; ad slots render nothing when env unset; dark-pattern checklist in `docs/`.

---

## 11. Competitive Positioning Plan

Single source of truth: new `content/positioning.ts` (statement + per-surface variants).

| Surface | Expression |
|---|---|
| Homepage hero | Full statement as H1/sub |
| Sport hubs | Sport-scoped variant ("one fix, one plan, one retest") |
| Pricing | "Free to start, ad-supported, no card. Upgrade only when it helps." |
| Sample reports | "The one-fix / one-plan / one-retest loop, on sample data." |
| Upload/`/start` | "We'll find your #1 fix first — not 20 things." |
| Trust | "Honest by design: what we measure, estimate, and can't know." |
| Parents | "Clear, encouraging, private feedback between sessions." |
| Coaches/Teams | "Your athletes arrive already knowing their #1 priority." |
| Metadata/SEO | Title/description templates carry "free, web-based, golf/baseball/softball, one fix." |

**Differentiators (truthful):** genuinely free + no-account start; **priority-first** (one fix, not a dump); **honest confidence labels**; **web-based**; **slow-pitch depth**. **Acceptance:** positioning present on all 9 surfaces; `check:naming` passes.

---

## 12. SEO/AEO/GEO Architecture Plan

**IA (hub-and-spoke silos):**
- **Pillars:** `/golf-swing-analysis`, `/baseball-swing-analysis`, `/softball-swing-analysis` (+ `/{slow,fast}-pitch`), `/tennis-swing-analysis`.
- **Spokes:** the `seoPages.ts` registry.
- **Free tools** (`/tools/*`) — link tools ↔ matching pillar/spoke.
- **FAQ / Glossary / Benchmarks / Blog** — wire into silos.
- **Sample reports** — new conversion nodes.
- **Comparison pages** — 2 drafts exist; need a dedicated comparison template (P2).

**Target-theme → page map:** AI golf swing analysis → `/golf-swing-analysis` [EXISTS]; fix slice → `/golf/fix-slice` [EXISTS]; launch-monitor explanation → `/golf/launch-monitor-analysis` [EXISTS]; baseball analysis → `/baseball-swing-analysis` [EXISTS]; exit velocity → `/baseball/exit-velocity-drills` [EXISTS]; stop rolling over → `/baseball/stop-rolling-over` [EXISTS]; fast-pitch analysis → `/softball-swing-analysis/fast-pitch` [NEW]; slow-pitch analysis → `/softball-swing-analysis/slow-pitch` [NEW]; stop popping up → `/softball/stop-popping-up` [EXISTS, enrich]; hit line drives → `/softball/how-to-hit-line-drives` [EXISTS, enrich]; web-based / free swing analysis → `/free-swing-analysis` [EXISTS, enrich]; rise ball / fast-pitch timing → `/softball/how-to-hit-a-rise-ball`, `/softball/fast-pitch-timing` [NEW]; two-strike approach / hitting timing → `/baseball/two-strike-approach`, `/baseball/how-to-time-a-pitch` [NEW].

**Schema:** Hubs = Service + FAQPage + BreadcrumbList; problem pages = HowTo/Article + FAQPage (already wired); add `speakable` to direct answers (low risk); **no fake Review/AggregateRating**.
**AEO/GEO:** keep direct-answer-first format; FAQs as natural questions.
**Freshness:** add slow-pitch silo to the existing monthly SEO audit task; optional per-page `updatedAt`.
**Acceptance:** silos cross-linked; sitemap updated; `validate:seo`/`validate:links` pass; rich-results pass; no orphans (≤3 clicks from home).

---

## 13. UX and Conversion Plan

| Surface | Problem | Fix | Why | Impl. | Impact | Acceptance |
|---|---|---|---|---|---|---|
| Homepage | Feature-led, no routing, dup softball URL | `PersonaPathCards` above fold | Intent → self-ID | Client island | ↑ CTR, ↓ bounce | 5 distinct destinations, above fold mobile |
| Sport hubs | Claims w/o proof; softball CTA→`/login` | `SportProofBlock` + CTA→`/start` | Proof + no-account | Shared section | ↑ start rate | Proof + correct CTA |
| `/start` | Not persona-aware | Read `?sport`/`?intent`, preselect | Continuity | Parse query in `StartHereFlow` | ↓ drop-off | Preselect works ×5 |
| Sample report | One golf sample | 5 samples + switcher | Every persona sees result | New config + routes | ↑ start | 5 live, print-ready |
| Pricing | Implies tiers; ads unmentioned | Comparison; Free=ad-supported; Pro/Team coming-soon | Honesty | Edit page | Trust | No charge w/o keys |
| Trust | Good | + confidence/can't-know | Differentiator | Compose | ↑ trust | Both present |
| Parents | Generic + risky copy | Persona-tune + fix data-storage copy | Owner standard | Copy + `ParentCoachSummary` | Trust | Hybrid-honest copy |
| Coaches/Teams | Generic | Coach proof + Team coming-soon CTA | Lead-gen | Reuse `ParentCoachSummary` | ↑ team interest | Coach proof present |
| Mobile | Solid | Verify cards/proof at 360–390px | Mobile-first | Responsive | — | No overflow, ≥44px taps |
| CTA hierarchy | Competing CTAs | Primary "Find my fix"/"Start free"; secondary "See sample" | Clarity | Button variants | ↑ primary CTR | One primary/viewport |
| Nav | No "Sports" entry | Sports dropdown (toggle-driven) | Discovery | Edit `NAV_LINKS` | ↑ hub traffic | Works mobile+desktop |
| Footer | Softball single link | Split Slow/Fast Pitch | Wedge visibility | Edit `FOOTER_COLUMNS` | ↑ slow-pitch index | Both present |

---

## 14. Technical Architecture and Component Plan

### 14.1 New reusable components
`PersonaPathCards`, `SportProofBlock` (+ `ExampleDiagnosisCard`, `WhatWeCannotKnowBlock`, `ConfidenceLabelExplainer`, `BeforeAfterRetest`, `ParentCoachSummary`), `SampleReportTemplate`, `MonetizationTierComparison`, `SportMetricExplainer`, `TrustSafetyCallout`, `UploadCTASection`, `SampleReportSwitcher`, `AdSlot` (off), `SportsNavDropdown`.

### 14.2 Components to modify
`MarketingHeader`, `PublicFooter`, homepage, all hubs, `/sample-report`, `/pricing`, `/parents`, `/coaches`, `/teams`, `/trust`, `StartHereFlow`, `SeoArticle` (render `exampleDiagnosis` + `discipline` breadcrumb), `RelatedGuides` (optional `discipline` filter).

### 14.3 Folder / config strategy (mirror existing idiom)
```
apps/web/src/content/
  seoPages.ts          [ENHANCE] + discipline?, exampleDiagnosis?, updatedAt?
  personas.ts          [NEW] PersonaPath[]
  sampleReports.ts     [NEW] SampleReport[] (5)
  sportProof.ts        [NEW] per-sport proof config
  positioning.ts       [NEW] North-Star strings + variants
  sportStrategy.ts     [NEW] the per-sport toggle (see §14B)
apps/web/src/components/
  persona/PersonaPathCards.tsx
  proof/{SportProofBlock,...}.tsx
  report/SampleReportTemplate.tsx
  monetization/MonetizationTierComparison.tsx
  ads/AdSlot.tsx (off)
apps/web/src/app/(marketing)/
  softball-swing-analysis/{slow-pitch,fast-pitch}/page.tsx
  sample-report/{golf,baseball,slow-pitch,fast-pitch,softball}/page.tsx
  softball/{ # slow-pitch wedge (8A):
    best-launch-angle-slow-pitch, end-loaded-bat-swing, bat-path-mistakes,
    how-to-hit-backside, timing-guide, bat-speed-exit-velocity,
             # fast-pitch wedge (8B):
    how-to-hit-a-rise-ball, fast-pitch-timing, fast-pitch-contact-point,
    stop-getting-jammed, how-to-slap-hit, fast-pitch-bat-speed }/page.tsx
  baseball/{ # baseball wedge (8C):
    stop-chasing-high-pitches, how-to-time-a-pitch,
    two-strike-approach, hit-the-other-way }/page.tsx
```

### 14.4 Routing / metadata / schema
Reuse `buildMetadata()` per new page; canonical for the softball children; add new routes to `sitemap.ts`; reuse `buildGraph()` + `Breadcrumbs`.

### 14.5 Data model
`SeoPage` += `discipline?`, `exampleDiagnosis?`, `updatedAt?` (all optional → backward compatible). Persona/sample/proof/strategy configs are pure data (no DB) — keeps it free, fast, no migration.

### 14.6 Analytics events
**[ENHANCE]** `packages/core/src/analytics/events.ts` — add `PERSONA_CARD_CLICKED`, `PERSONA_PATH_VIEWED`, `RETEST_PLAN_CLICKED`, `UPGRADE_PROMPT_VIEWED`, `UPGRADE_CLICKED`, `SPORT_PAGE_ENGAGED`. **Risk:** `@swingiq/core` ships a `dist` — must rebuild (`turbo run build --filter=@swingiq/core`) or events won't resolve.

### 14.7 Performance / a11y / mobile / testing
- **Perf:** persona cards & proof are static/islands; no extra fetch; lazy-load sample switcher beyond first tab.
- **A11y:** real `<a>`/`<button>` + `aria-label`; logical tab order; explainer in `<details>`/focus-trapped dialog; token-based contrast.
- **Mobile-first:** verify 360–430px; ≥44px taps; no horizontal scroll.
- **Testing:** Jest (config integrity, persona→route mapping, no duplicate destinations, ≥1 primary sport), Playwright (`apps/web/e2e`) for card→hub→start, schema snapshot tests.

---

## 14B. Sport Strategy Toggle System (the per-sport toggle you asked for)

**Goal:** let *you (the developer)* change a sport's prominence across the whole marketing site by editing **one line** in code — no page rewrites, no risk to other sports, no lost SEO.

> **Scope — developer-only internal tool.** This is a control *you* use as the developer. It is **not** an end-user or admin-panel feature: there is no UI, nothing is exposed to visitors, and the only way to change a tier is editing this config in the repo and deploying. It's a typed config file, nothing more.

### How it works
A single config assigns each sport a **tier**:
- **`primary`** → gets a homepage persona card (your headline sports) + nav + footer + sample-switcher tab + sitemap.
- **`secondary`** → NOT a homepage card; appears as a small "Also analyze: X →" link + nav + footer + (optional) sample tab; pages stay indexed. *(Tennis default.)*
- **`hidden`** → removed from ALL marketing links (homepage, nav, footer, switcher). The hub page **stays live and indexed by default** (so you keep Google traffic); an advanced `deindex: true` flag can fully remove it later.

### The config (source of truth)
```ts
// apps/web/src/content/sportStrategy.ts
export type SportTier = 'primary' | 'secondary' | 'hidden';

export interface SportStrategyEntry {
  personaId: 'golf' | 'baseball' | 'slow-pitch' | 'fast-pitch' | 'softball' | 'tennis';
  tier: SportTier;
  order: number;        // display order within a tier
  deindex?: boolean;    // advanced: hidden + remove from sitemap/add noindex
}

export const SPORT_STRATEGY: SportStrategyEntry[] = [
  { personaId: 'golf',       tier: 'primary',   order: 1 },
  { personaId: 'baseball',   tier: 'primary',   order: 2 },
  { personaId: 'slow-pitch', tier: 'primary',   order: 3 },
  { personaId: 'fast-pitch', tier: 'primary',   order: 4 },
  { personaId: 'softball',   tier: 'primary',   order: 5 },
  { personaId: 'tennis',     tier: 'secondary', order: 6 },  // ← middle ground
];
```

### One source of truth (no env layer, no admin UI)
The config file is the **only** way to set tiers — edited in code by the developer and shipped via a normal commit/deploy. There is intentionally **no** environment-variable override, no Vercel-dashboard switch, and no in-app admin toggle. One place to look, no runtime control surface to secure or misuse.

### What reads the toggle
`PersonaPathCards` (primary only), the "Also analyze" row + `SportsNavDropdown` + footer (secondary), `SampleReportSwitcher` tabs (primary+secondary), and `sitemap.ts` (drops only `hidden` + `deindex`). One file, every surface.

### Safety rules (validated by a unit test)
- At least **one** `primary` sport must exist.
- The `softball` chooser persona is auto-hidden if **both** slow-pitch and fast-pitch are hidden.
- Changing a tier never deletes pages or data — it only changes links/prominence.
- `hidden` keeps pages indexed unless `deindex: true` (protects SEO by default).

### How you'll use it
- Promote tennis to a 6th headline card: change `tennis` to `tier: 'primary'`.
- Retire tennis from menus (keep its Google traffic): change to `tier: 'hidden'`.
- Fully remove tennis from search too: `tier: 'hidden', deindex: true`.
- Same applies to any sport (e.g., de-emphasize fast-pitch seasonally).

---

## 15. Analytics and Measurement Plan

`track(EVENT, props)` exists. **Standardize two properties everywhere: `sport` and `persona`.** Bounce/conversion-by-persona are *derived groupings*, not separate events.

| Event | Trigger | Properties | Stage | Group |
|---|---|---|---|---|
| `persona_card_clicked` [NEW] | Click homepage persona card | `persona, sport, intent, position` | Acquisition | Persona router |
| `sport_selected` [EXISTS] | Pick sport (hub/start/chooser) | `sport, source` | Acquisition | Persona/Sport |
| `cta_clicked`/`conversion_cta_clicked` [EXISTS] | Any/upload CTA | `sport, persona, surface, label` | Activation | CTA funnel |
| `sample_report_viewed` [EXISTS] | Sample report view | `sport, variant` | Consideration | Proof |
| `sport_page_engaged` [NEW] | 50% scroll / 20s on hub | `sport, persona` | Consideration | Engagement |
| `pricing_viewed` [EXISTS] | Pricing view | `referrer_surface` | Consideration | Monetization |
| `upgrade_prompt_viewed`/`upgrade_clicked` [NEW] | Helpful upgrade moment | `feature, tier, surface` | Monetization | Upgrade intent |
| `analysis_started`/`analysis_completed` [EXISTS] | Start/finish analysis | `sport, persona, input_type` | Activation | Core funnel |
| `drill_clicked`/`practice_plan_saved` [EXISTS] | Drill/plan | `sport, drill_id` | Retention | Improvement |
| `retest_plan_clicked` [NEW] | Retest CTA | `sport, days` | Retention | Retest |
| `coach_share_clicked`/`report_shared`/`pdf_downloaded` [EXISTS] | Share/PDF | `sport, method` | Advocacy | Sharing |
| `email_capture_*` [EXISTS] | SEO lead capture | `source_page, sport` | Acquisition | SEO conversion |
| `quiz_*`/`tool_result_generated` [EXISTS] | Tools | `tool, sport` | Acquisition | Tools |

**Core funnel:** `persona_card_clicked → sport_selected → analysis_started → analysis_completed → (retest_plan_clicked | coach_share_clicked)`.
**Derived dashboards:** bounce-by-persona, conversion-by-sport, SEO-landing conversion, slow-pitch wedge cohort.
**Risk:** events no-op in prod until a provider env (GA4/Plausible/PostHog) is set.

---

## 16. QA and Risk Management Plan

**Automated (existing scripts → wire into CI):** `validate:seo`, `validate:content`, `validate:links`, `scan:placeholders`/`check:trust`, `check:naming`, `generate:sitemap`, `type-check`, `lint`, `test`.

**Checklist:** broken links; unique metadata/canonical/OG per new page; HowTo/FAQ/Breadcrumb/Service schema validates (no fake reviews); mobile 360–430px; a11y (keyboard, focus, contrast); Lighthouse mobile ≥ baseline (LCP unaffected); every CTA fires the right event with `sport`+`persona`; **upload flow regression-free** (query preselect keeps no-account path); pricing shows no charge without keys; positioning present; **no "local-only" data claim**, video-privacy intact; SwingVantage naming; 5 persona cards → 5 distinct destinations; sample reports illustrative + honest + print/PDF + youth-share disabled; no hallucinated/medical/guaranteed claims.

**Top risks & mitigations:**
1. SEO regression on repurposed softball URL → keep URL, add children, update sitemap, watch Search Console.
2. Core package rebuild for new events → include `turbo build --filter=@swingiq/core`.
3. Upload-flow regression → feature-flag preselect, e2e cover.
4. Pricing/legal → never imply live charges.
5. Tandem agents on shared master → commit each batch with **explicit pathspec only** (never `-A`/bare).

---

## 17. Phased Implementation Roadmap

| Phase | Objective | User value | Business value | Tech scope | Pages/components | Risks | Deps | Acceptance | Complexity |
|---|---|---|---|---|---|---|---|---|---|
| **0 Discovery** | Confirm audit vs repo (this doc) | — | De-risk | Read-only | — | Tennis tier | none | Plan approved | S |
| **1 Quick wins** | Persona router + fix dup softball URL + CTA→`/start` + positioning hero + toggle config | Faster self-ID | ↑ activation | `PersonaPathCards`, `personas.ts`, `sportStrategy.ts`, hero, hub CTAs | homepage, hubs, nav/footer | Hero SEO copy | 0 | Cards live, 5 destinations, toggle works | M |
| **2 Routing + samples** | Slow/fast hubs + 5 sample reports + `/start` preselect | "See my result" | ↑ consideration→start | `sampleReports.ts`, `SampleReportTemplate`, 2 hubs, 5 routes, `StartHereFlow` | softball children, `/sample-report/*` | Upload regression, softball URL | 1 | 5 samples + 2 hubs live | M–L |
| **3 SEO expansion** | 16 pages (6 slow + 6 fast + 4 baseball) + enrich 2 + silo linking | Answers searchers want | Organic growth, parity | `seoPages.ts` + routes + `discipline` | `/softball/*`, `/baseball/*`, slow+fast hub guides | Thin content if rushed | 2 | 16 published, validators pass | M–L |
| **4 Proof/trust** | `SportProofBlock` everywhere + confidence/can't-know | Trust, honesty | ↓ bounce | proof components, `sportProof.ts` | hubs, homepage, trust, parents | "local-only" copy | 1 | Proof on all hubs+samples | M |
| **5 Monetization** | Tier clarity + ad framework (off) + ethical upgrades | Clear pricing | Ads-ready (first revenue) | `MonetizationTierComparison`, `AdSlot`, tier labels | pricing, features, hubs | Premature-charge copy | none | Free=ad-supported, Pro/Team coming-soon, no charge w/o keys | M |
| **6 Analytics/QA** | Events + dashboards + full QA | — | Measurable funnel | events, props, dashboards | all touched | provider env unset | 1–5 | Funnel tracked, QA green | M |

Phases 1–3 are highest ROI and ship independently. Phase 5 prepares ads (documented first revenue) without enabling charges.

---

## 18. Prioritized Backlog

**P0 — must fix immediately**
1. Fix duplicate softball homepage destination (both cards → same URL).
2. `PersonaPathCards` above the fold (toggle-driven).
3. Softball hub CTA `/login` → `/start`.
4. `sportStrategy.ts` toggle config + selectors + validation test.

**P1 — high impact**
5. Five sample reports.
6. Dedicated slow-pitch + fast-pitch hubs (keep `/softball-swing-analysis` as chooser).
7. `SportProofBlock` on all hubs + homepage.
8. 16 new SEO pages for parity — slow-pitch (6), fast-pitch (6), baseball (4) — + enrich 2 slow-pitch.
9. Positioning rollout (`positioning.ts`) across 9 surfaces.
10. Persona analytics (events + `sport`/`persona` props; rebuild core).

**P2 — medium impact**
11. `MonetizationTierComparison` + Free=ad-supported / Pro-Team "coming soon."
12. `AdSlot` framework (off by default) + dark-pattern rules doc.
13. Sports nav dropdown + footer slow/fast split.
14. `/start` query preselect.
15. Confidence-label explainer + "what we can't know."
16. Coach/Teams proof + Team lead-gen CTA.
17. Fix "local-only" data-storage copy → hybrid framing.

**P3 — future**
18. Comparison template (ship the 2 `compare/*` drafts properly).
19. `speakable`/AEO schema on direct answers.
20. Before/after retest visualization.
21. Per-page `updatedAt` + freshness in monthly SEO audit.
22. Tennis persona card (if promoted to `primary`).

*(Each item carries: title, description, user story, business impact, technical scope, files likely affected, dependencies, acceptance criteria, QA checklist, priority rationale — expanded at implementation time.)*

---

## 19. Acceptance Criteria for the Entire Project
- Homepage routes by intent: 5 persona cards, 5 distinct destinations, above fold mobile, all tracked.
- Softball = three coherent surfaces (chooser + slow + fast), no orphan/duplicate URLs, all indexed.
- Five sport-specific sample reports, illustrative-labeled, print/PDF-ready, each → `/start?sport=`.
- Every hub shows worked proof (example diagnosis + confidence explainer + "what we can't know").
- SEO wedges built to parity and internally linked — slow-pitch ≥10, fast-pitch ≥6, baseball ≥7 pages; validators + rich-results pass.
- Positioning present on all 9 surfaces; SwingVantage naming clean.
- Pricing: Free = ad-supported (live), Pro/Team "coming soon"; no charge without Stripe keys; ads off by default; dark-pattern checklist documented.
- Analytics: persona funnel instrumented with consistent `sport`/`persona`; core package rebuilt.
- Trust/copy: disclaimers kept & confident; no "local-only" data claim; video-privacy intact; no medical/guaranteed/hallucinated claims.
- Sport Strategy Toggle: changing one entry re-tiers a sport across homepage/nav/footer/switcher/sitemap; validation test green.
- QA: validators green; mobile/a11y/perf ≥ baseline; upload flow regression-free.
- Engineering hygiene: batches committed with explicit pathspec (tandem agents on shared master).

---

## 20. Final Recommendation

Ship in this order: **Phase 1 (persona router + toggle) → Phase 2 (slow/fast hubs + 5 sample reports) → Phase 3 (slow-pitch SEO wedge)**, then 4–6. This front-loads the changes that most directly deliver "five specific products on one engine," touches the least risky code (content + composition), and leans on infrastructure that already exists.

The biggest unlock per unit of effort is the **SEO wedges** (each page = fill one typed object + a 3-line route). Slow-pitch leads as the spearhead, with **fast-pitch and baseball built to parity** so every headline sport has its own content engine. Paired with the **persona router** and **five sample reports**, SwingVantage stops feeling like one broad tool and starts feeling like the golfer's slice-fixer, the hitter's exit-velo coach, the fast-pitch player's rise-ball guide, and — uniquely — the slow-pitch player's line-drive system.

Guardrails that must not slip: free-first (ads before subscriptions; Phase-3 tiers labeled "coming soon"), honest proof (keep disclaimers; add "what we can't know"; never claim local-only data storage), and no dark patterns.

**One open decision:** Tennis tier — defaulted to `secondary` (middle ground) and fully controlled by the Sport Strategy Toggle, so it can be promoted or retired anytime without a code rewrite.
