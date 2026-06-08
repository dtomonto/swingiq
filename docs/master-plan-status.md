# Master Improvement Plan — Status vs. Reality

_Audit date: 2026-06-07 • Source: the "SwingVantage Master Improvement Plan" (14 workstreams, 30/90/180-day plans)._

## In Plain English (start here)

You handed me a big strategy doc that reads like a fresh to-do list. The honest news: **most of it is already built.** SwingVantage is not a "promising concept" that needs the core loop constructed — the core loop (upload → #1 fix → drill → retest → progress) already exists, and so do player profiles, practice plans, SEO pages, trust pages, confidence scoring, and a monetization scaffold.

So the plan's real value isn't "build these 200 things." It's a **checklist to find the 10% that's genuinely missing or only half-wired.** This document is that checklist.

Two of the plan's own assumptions turned out to be **wrong** when I checked the code:

- The plan implies a **methodology page is missing**. It already exists at [`/methodology`](../apps/web/src/app/(marketing)/methodology/page.tsx) ("What SwingVantage Measures, Estimates, and Does Not") with an FAQ.
- The plan treats **confidence scoring** as not-yet-done. It's already built in **both** AI paths (see §6 below).

That's the whole point of auditing before building: it stops the concurrent agents from re-constructing things that already ship.

**Legend:** ✅ Built · 🟡 Partial (exists, but a real gap remains) · ⬜ Missing · ⏸️ Deliberately deferred (a real choice, not an oversight)

---

## Scorecard — the 14 workstreams

| # | Workstream | Status | Where it lives / what's missing |
|--:|------------|:------:|---------------------------------|
| 1 | Product strategy / hierarchy | 🟡 | Core flow + tiers exist; the Tier-1→4 hierarchy is implicit, not a single source of truth. See §1. |
| 2 | User experience | ✅ | Mobile pass shipped, themes, "One Fix Today" framing. Gap: first-screen "what to improve today?" intent picker. |
| 3 | AI analysis quality | ✅ | Deterministic diagnostic engine + visual AI schema, both structured. |
| 4 | Trust & credibility | ✅ | `/methodology`, `/trust`, disclaimers, honest-first framing. Gap: "coach-reviewed" labels, before/after examples. |
| 5 | Sport-specific depth | ✅ | 7 sports with per-sport analysis/benchmarks in `packages/core/src/sports/*`. |
| 6 | Player profiles & memory | ✅ | Profile schema + athletic journey + AGI memory + cloud sync. |
| 7 | Practice planning & retesting | ✅ | `lib/retest` engine + `/retest` + `/practice` + progress history. |
| 8 | SEO/AEO/GEO | ✅ | ~30 marketing pages, self-maintaining sitemap, JSON-LD, i18n (es/fr). |
| 9 | Monetization | ⏸️ | 3 tiers + Stripe scaffold built but "Coming Soon" **by design** (free-users-first). |
| 10 | Coach/team/family | 🟡 | `lib/team` engine + Team tier + `/coaches`/`/teams` marketing. Gap: no Family plan; in-app coach dashboard is thin. |
| 11 | Data strategy / moat | 🟡 | Profiles + history + benchmarks exist. Gap: the issue→drill→**outcome** dataset isn't explicitly captured as a unit. |
| 12 | Privacy, safety, liability | 🟡 | Privacy/terms/disclaimers + export/delete. Gap: a **formal guardian-consent workflow for minors**. |
| 13 | Analytics & experimentation | 🟡 | Rich event catalog + abstraction layer built. Gap: **no provider configured**, so events drop in prod; no A/B harness. |
| 14 | Technical scalability / automation | ✅ | Modular sport architecture, AI guardrails, content automation, offline/PWA. |

**One-line takeaway:** 7 of 14 are essentially done, 5 are partial-with-a-clear-gap, 1 is a deliberate deferral, 0 are greenfield.

---

## Detail by area (with evidence)

### §1 Product strategy — 🟡
The Tier 1–4 hierarchy the plan asks for already exists *as features*, but not as one written source of truth that agents work from. Closest thing today is the scattered project memory + `docs/`. **Gap:** a single "what tier is this feature, and does it serve which of the 4 north-star outcomes?" map. (This doc is a first cut.)

### §2 User experience — ✅ with one real gap
- Mobile/a11y/PWA pass shipped (live). 7-theme token system. Centralized "Today's Fix" copy in [`lib/coaching/fixFraming.ts`](../apps/web/src/lib/coaching/fixFraming.ts).
- **Gap (worth doing):** the plan's §5.1 "first screen asks one question — *what do you want to improve today?*" intent picker. The pieces exist (sport selector, persona router) but there's no single low-cognition entry screen that funnels straight into the analysis flow.

### §3 AI analysis quality — ✅
- **Data path:** [`packages/core/src/diagnostic/engine.ts`](../packages/core/src/diagnostic/engine.ts) detects issues, ranks by `score_impact` then `confidence`, separates raw vs sample-calibrated confidence, and applies a small-sample penalty so "a few shots can't fabricate a high-confidence diagnosis." This *is* the structured framework §6 asks for.
- **Visual path:** [`packages/core/src/video-analysis/visual/schema.ts`](../packages/core/src/video-analysis/visual/schema.ts) requires `evidenceFromVideo` on every observation and carries a `confidence` level — i.e. no generic praise, evidence-backed only.

### §4 Trust & credibility — ✅ (2 small adds)
- Built: [`/methodology`](../apps/web/src/app/(marketing)/methodology/page.tsx), [`/trust`](../apps/web/src/app/(marketing)/trust/page.tsx), `/privacy`, `/terms`, `/vulnerability-disclosure`, coach-friendly positioning, and a standing rule to *keep* disclaimers (reworded confident, not deleted).
- **Gaps (nice-to-have):** "Coach-reviewed drill" label and anonymized before/after examples (§7.2–7.3).

### §6 AI confidence & uncertainty — ✅ (closed 2026-06-07)
Already built (see §3), and on closer inspection the confidence **number is already shown in both paths**: the visual panel renders overall `%` + per-priority/per-phase confidence chips ([`AIVisualAnalysisPanel.tsx`](../apps/web/src/components/video/AIVisualAnalysisPanel.tsx)); the data-driven `/diagnose` shows per-issue `%` + a transparency panel with a computed level/score. So the "surface the number" half was already met (audit was pessimistic).
- **The one real sub-gap — now fixed (local `e29f064`):** the plan's §6 "AI uncertainty" prompt (e.g. *"your lower body wasn't fully visible — upload a down-the-line view"*) existed only as a quiet box at the bottom of the visual result. Added [`lib/video/visual-uncertainty.ts`](../apps/web/src/lib/video/visual-uncertainty.ts) (pure, tested) + a prominent, welcoming banner atop the visual result that triggers only when the model's own confidence (<50%) or overall visibility (limited/poor) is weak, names the specific limitation, and surfaces the model's next-capture tip.

### §7 Practice & retest loop — ✅
[`lib/retest`](../apps/web/src/lib/retest) (engine/store/targets/useRetests) + `/retest`, `/practice`, `/progress`, `/drills`, `/arc`. The loop the plan calls the north star ("diagnose → practice → retest → adjust") is the product's spine, not a gap.

### §9 Monetization — ⏸️ deliberately deferred
[`lib/billing/tiers.ts`](../apps/web/src/lib/billing/tiers.ts) defines **Free / Pro ($12) / Team ($49)** with a full Stripe scaffold (`stripe.ts`, `entitlements.ts`, `plan.ts`, checkout/portal/webhook routes). They're shown **"Coming Soon"** until Stripe keys exist — **on purpose**, per the go-to-market north star (free users first → ads → tiers; subscriptions are Phase 3). 
- **Conflict to flag:** the plan's §12 wants a one-time **premium report** and separate **Family / Coach** plans *now*. That contradicts your committed sequencing. Recommendation: **don't build these yet** — they're correctly deferred. (Also: a copy bug — the Free tier lists "All 5 sports (golf, tennis, baseball, softball)" but names only 4 and you actually ship 7.)

### §10 Coach / team / family — 🟡
- Built: [`lib/team`](../apps/web/src/lib/team) (engine/store/types/useTeam), the **Team** tier, marketing `/coaches` + `/teams`, and a coach-shareable recruiting hub + public `/player/[slug]` view.
- **Gaps:** no **Family** plan/profiles (multi-athlete under one parent), and the in-app coach dashboard (roster → assign drills → review) is thinner than the marketing pages imply. Both are §90–180-day items — fine to leave.

### §11 Data moat — 🟡
Profiles, history, and benchmarks exist. **The missing piece the plan correctly identifies as the moat:** capturing **issue → drill → outcome** as one linked record (so you can later say "for this athlete type + this issue, this drill sequence produced this improvement"). Today those live in separate stores. This is the single most strategically valuable *new* thing in the whole plan.

### §12 Privacy / youth safety — 🟡
Privacy/terms/disclaimers + data export & delete exist; "guardian/consent/minor" language appears across `/parents`, `/privacy`, `/terms`, signup. **Real gap:** a *workflow* (not just copy) for **guardian consent when a minor signs up** — the plan's §15 asks for this explicitly and it matters most given youth athletes.

### §13 Analytics & experimentation — 🟡 (biggest quick win)
- [`packages/core/src/analytics/events.ts`](../packages/core/src/analytics/events.ts) is a rich catalog covering the **entire** §16 funnel (page_view → sport_selected → upload_started/completed → analysis_started/completed → priority_fix_viewed → drill_started/completed → retest_plan_clicked → pricing_viewed → upgrade_clicked → account_created). The abstraction layer [`lib/analytics.ts`](../apps/web/src/lib/analytics.ts) supports GA4/Plausible/PostHog with graceful fallback.
- **UPDATE (2026-06-07, local `bbef981`):** the catalog covered the funnel but the *core value moment* fired nothing — upload-completed, analysis-started/completed/failed, priority-fix-viewed and account-created were defined-but-never-emitted. Those are now wired at the shared chokepoints (`VideoUpload`, `useSwingAnalysis`, `AIVisualAnalysisPanel`, `SignupForm`) with a guard test. So the funnel now genuinely measures the improvement loop.
- **Remaining gap:** `isAnalyticsEnabled` is still `false` until the owner pastes **one** provider key — the only outstanding step. There's also no A/B harness for the §16 experiments.

---

## Build-Next shortlist (respecting your constraints)

Ordered by value-per-effort, filtered to **only genuine gaps** and **excluding** anything that violates your free-users-first sequencing or duplicates existing code. All are tandem-safe (new/isolated files).

1. ~~**Turn analytics on (§13).**~~ **Code DONE — local `bbef981`.** The core funnel now fires end-to-end (was defined-but-dark). Only step left: the owner pastes one provider key into `apps/web/.env.local` (Plausible recommended — cookieless, no consent banner). See [`docs/analytics-events.md`](analytics-events.md) → "Turning analytics on". Until then you still can't read the north-star metric, so this owner step is the highest-ROI 5-minute task remaining.
2. ~~**Surface the confidence score in the result UI (§6).**~~ **DONE — local `e29f064`.** The number was already shown in both paths; added the missing prominent "limited read — here's how to sharpen it" uncertainty prompt to the visual result.
3. **First-screen intent picker (§2/§5.1).** One low-cognition "What do you want to improve today?" entry that routes into the existing analysis flow. Reuses sport selector + persona router.
4. **Issue → drill → outcome record (§11 — the moat).** Define one linked record that ties a diagnosis to the drills assigned to the retest result. This is the durable data advantage; everything else is catch-up.
5. **Guardian-consent workflow for minors (§12/§15).** A real signup branch, not just copy. Matters disproportionately because youth athletes use this.

**Explicitly NOT recommended now** (deferred on purpose, would fight your north star): premium one-time report, Family/Coach paid plans, hard paywalls, more sport breadth (you already ship 7), 3D motion expansion.

---

## Two strategic tensions the plan creates (decide before building)

1. **Focus vs. breadth.** Plan §8 says "golf first, build depth one sport at a time." Your live product already ships **7 sports as primary/secondary** (golf, tennis, baseball, softball primary; pickleball, padel secondary). You're past the "golf-first" fork. Decision: keep multi-sport and deepen the *strongest* wedge (data will tell you which once analytics is on), rather than re-narrowing to golf.
2. **Monetize-now vs. free-first.** Plan §12 pushes premium reports and multiple paid plans early. Your committed order is free → ads → tiers. These conflict. Recommendation: hold the line on free-first; the billing scaffold is ready to flip on later without rework.

---

## How to keep this honest

This file is a point-in-time snapshot. The repo already has self-maintaining honesty gates (sitemap coverage, feature registry, drift checks). If you want this map to stay current, the cheapest path is to re-run an audit pass against this checklist quarterly rather than to auto-generate it — the value is in the human judgment about *deliberate deferrals*, which a script can't infer.
