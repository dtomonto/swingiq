# Growth / Conversion / Activation — Gap Map

**Audited:** 2026-06-08 · **Fixes shipped:** `origin/master` 9e9046d (live)

This maps the 20-section "Growth, Conversion, Trust, SEO/AEO/GEO, Analytics &
First-Use Activation Overhaul" master prompt against the **actual codebase**.

## TL;DR

The product is already **~95% aligned** with the master prompt. The strategic
pivot to **"one fix, three drills, a 7-day retest plan"** has largely shipped.
The biggest remaining growth unlock is **not code** — it's pasting one analytics
provider key so the (already-built) funnel starts recording.

Do **not** treat the master prompt as greenfield. Audit-first; most landing
pages, sample reports, tools, sport hubs, `/start`, and the analytics catalog
already exist. Rebuilding them would duplicate working code and risk regressions.

Legend: ✅ verified · 🟢 done (route/file confirmed, not deep-tested) ·
🆕 fixed 2026-06-08 · ⚠️ partial / judgment-needed · ⛔ owner action

## P0 — highest priority

| Item | Status | Evidence |
|---|---|---|
| P0.1 CTAs → no-account start | ✅ | Homepage hero + final CTAs route to `/start`; "No account required" badge live (`components/marketing/LocalizedHome.tsx`) |
| P0.2 Problem-first onboarding | ✅ | Homepage "What are you trying to fix?" sport cards; `/start` = problem → sport → method → quiz (`components/onboarding/StartHereFlow.tsx`) |
| P0.3 Founding counter | 🆕 | Was "Founding Members: — / 1,000" (negative proof). Now "Join the Founding 1,000" until ≥25 real members qualify, then the tally (`components/founding/banner-content.ts` `shouldShowFoundingCount` / `FOUNDING_COUNTER_MIN_TO_SHOW`) |
| P0.4 Conversion homepage | ✅ | Hero "One fix. One plan. One retest.", trust badges, 3-step, sample-report preview, FAQ, JSON-LD |
| P0.5 Login/signup copy | 🆕 | Removed "Golf Performance System" + "All swing sports. One genie." → "AI Swing Analysis" + the core promise on signup |
| P0.6 No-video quiz CTA | ✅ | `/start` method step + "Just answer a couple of questions instead" fallback; `/tools/swing-mistake-quiz` |
| P0.7 Problem landing pages | 🟢 | `golf/fix-slice`, `golf/stop-topping-the-ball`, `golf/stop-hitting-it-fat`, `softball/stop-popping-up` +30 more under `app/(marketing)/{golf,softball,baseball,tennis}/` |
| P0.8 Analytics instrumentation | ✅ + 🆕 | ~100-event catalog (`packages/core/src/analytics/events.ts`) covers the funnel; added `INPUT_METHOD_SELECTED` (video-vs-import-vs-quiz split) |
| P0.9 Trust / proof system | 🟢 | `/trust`, `/methodology`, `/privacy`; `TrustBar`, `AnalysisTransparency`, `SampleReportPreview`, `SportProofBlock`, youth-safety + not-a-coach notices |

## P1

| Item | Status | Notes |
|---|---|---|
| P1.1 Smart dashboard | 🟢 needs verify | `/dashboard` + `PriorityPanel` exist; empty/active-state copy not deep-audited |
| P1.2 Report sharing / PDF / coach summary | 🟢 needs verify | Events exist (`pdf_downloaded`, `report_shared`, `coach_share_clicked`); end-to-end wiring not deep-audited |
| P1.3 Retest reminder lifecycle | 🟢 needs verify | `/reminders`, `/retest` routes + `retestDate` in `/start` result |
| P1.4 PWA / mobile | ✅ | Service worker, `/offline`, richer manifest (prior mobile pass) |
| P1.5 Admin growth dashboard | 🟢 | `/admin/growth`, growth agents, link-intelligence |

## §8 SEO/AEO/GEO · §10 pages · §13 nav · §14 free tools

- **SEO:** 🟢 sitemap honesty-gate, self-referencing canonicals, JSON-LD
  (Organization / Website / SoftwareApplication / FAQ / Breadcrumbs), hreflang
  (es/fr), HTML `/sitemap`.
- **Pages:** 🟢 ~22 of the 25 listed exist (golf / softball / baseball / tennis /
  pickleball / padel hubs + problem spokes + sample reports + tools +
  parents / coaches / teams + trust).
- **Nav & free tools:** 🟢 problem-first nav and pain-organized tools already in place.

## Genuine remaining items (not defects — judgment / owner calls)

1. ⛔ **Analytics provider key** — the funnel is fully instrumented but inert
   until the owner sets one of `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` /
   `NEXT_PUBLIC_GA_ID` / PostHog. **Highest-leverage open item.**
2. ⚠️ **"5 vs 7 sports" copy** — *not* a bug. The swing-mistake quiz genuinely
   covers 5 sports (golf, baseball, tennis, slow-pitch, fast-pitch — no
   pickleball/padel); the platform taxonomy is 7 (`SPORT_TAXONOMY`). Each
   surface is locally accurate. Best honest polish is to name sports per surface
   rather than cite a count. Do **not** blanket find-replace "5"→"7" (false claim).
3. 🟢→verify **P1.1–P1.3 deep audit** — dashboard empty-state, PDF export, and
   the day-0→day-14 reminder lifecycle are present but not exercised end-to-end.

## Guardrails honored

No fabricated testimonials / user counts / outcomes / endorsements; no
overstated AI accuracy or compliance; no thin SEO pages; no private pages
indexed; no users gated into login before value.
