# SwingVantage — Athlete General Intelligence: Product & Monetization Strategy

_The single source of truth for how Athlete General Intelligence (AGI) fits SwingVantage's
growth, positioning, and monetization. Built from the shipped feature (`lib/agi`,
`/agi`, `/athlete-general-intelligence`) and the existing strategy docs
(`MONETIZATION_CHECKLIST.md`, `COMPETITIVE_POSITIONING.md`, `PRODUCT_ROADMAP.md`).
Last updated: June 2026._

---

## 📘 In Plain English (start here)

**What this is:** SwingVantage now has one engine — **Athlete General Intelligence** — that
looks across *all* your sports at once and finds the single skill that, if you improve
it, lifts the most of them. This page explains why that matters for the business: how it
grows free users, how it can make money later, and why no competitor can easily copy it.

**The three things to know:**
1. **AGI is a free-user magnet, not (yet) a paywall.** Our priority is growth, and the
   honest "here's the *one* thing to train across your sports" hook is exactly the kind of
   thing people share and come back to. Keep the core free.
2. **It's a built-in growth loop.** The coach-shareable report turns every user into
   organic reach (a user emailing their report to a coach *is* free acquisition), and the
   public explainer page feeds search/answer engines.
3. **It has clean, honest upsell hooks for later** — richer AI narrative, deeper history,
   true-3D measured analysis, and team-wide AGI for coaches — without ever crippling the
   free experience.

> "AGI" = **Athlete General Intelligence**. "General" means breadth across your sports
> (the real AI sense), **not** human-level/sci-fi AI. Everything carries a basis +
> confidence + an A–D trust grade. This honesty is itself part of the moat.

---

## 1. What it is (one paragraph)

A cross-sport reasoning layer (`/agi`, summarized on the Today dashboard) that fuses **six
local signals** — Motion Lab captures, launch-monitor sessions, saved video analyses, your
declared profile/goal, today's readiness, and your drill-feedback — into one model of you
as an athlete. It then reasons across **nine axes** (keystone, goal alignment, today's
readiness, progress-over-time, cross-sport recurring faults, plateau detection, strengths,
transfer/imbalance, consistency) and outputs: your **keystone** (the one skill limiting the
most sports), what **transfers** between your sports, a readiness-scaled **plan** that leads
with drills you've personally found helpful, a progress trend, and a **coach-shareable
report** — all under a single **A–D trust grade** that tells you exactly what would raise it.

---

## 2. Why it matters strategically (the moat)

- **It deepens our #1 differentiator (multi-sport).** Competitors are single-sport, so they
  *cannot* reason across sports at all. AGI is only possible *because* SwingVantage is one
  multi-sport platform — it turns a feature into a structural advantage rivals can't copy
  without rebuilding as multi-sport first.
- **It extends our "honest, closed loop" differentiator.** Diagnosis → keystone → plan →
  progress-over-time → retest, with a trust grade on the whole thing. Most tools stop at a
  number; AGI prioritises *and* proves change honestly.
- **It is an answer-engine-friendly story.** "What's the one thing I should train?" is a
  natural-language question; the public explainer + FAQ are written to be cited by
  generative search.

---

## 3. Monetization positioning (Free / Pro / Team)

**Guiding rule (from the monetization north star, `docs/MONETIZATION_STRATEGY.md`):**
the order is **grow free users → ads (first revenue) → membership tiers**. The *core* AGI
experience is free forever — it is the funnel, the retention hook, and the viral loop. The
Pro/Team AGI items below are **Phase 3** upsells (gated behind ad revenue, dormant until
then), never a Phase 1/2 paywall on the core insight. In an ad-supported product, "remove
ads" also becomes a natural Pro perk alongside these depth upgrades.

| Capability | Tier | Status | Why this split |
|---|---|---|---|
| Cross-sport **keystone**, transfers, plan, capability profile, trust grade, today's note | **Free** | ✅ Shipped | The hook + retention driver. Must stay free to grow users. |
| **Coach-shareable report** (copy / email / web-share / print-to-PDF, text-only, youth-safe) | **Free** | ✅ Shipped | It *is* the acquisition loop — never gate sharing. |
| Public explainer + SEO (`/athlete-general-intelligence`) | **Free / public** | ✅ Shipped | Top-of-funnel discovery. |
| **AI-enhanced AGI narrative** (the optional LLM `enhanceNarrative` seam rewording insights) | **Pro $12** | 🔜 Seam built, provider not wired | Fits the existing "Unlimited AI narrative coaching" Pro perk; cost-bearing, so paid. |
| **True-3D measured capture** (2-camera Motion Lab → `measured` basis → higher trust grade) | **Pro $12** | 🔜 Engine built (`lib/pose3d`), the trust nudge already points here | The single most direct lever on the trust grade; richer processing = a fair paid upgrade. |
| **Deep progress history** (unlimited snapshots / long-horizon trajectories) | **Pro $12** | 🔜 Free keeps recent; Pro unlimited | Storage-bearing; rewards committed athletes. |
| Advanced report (cloud-stored, shareable link, branded PDF) | **Pro $12** | 🔜 Ties to existing "PDF reports & coach sharing" Pro perk | Pro already owns richer sharing. |
| **Team-wide AGI** — every athlete's keystone, **roster-level capability gaps**, "what to train across the team" | **Team $49** | 🔜 Roadmap (builds on the local-first Coach & Team roster) | High-value for coaches/academies; the natural Team headline feature. |

**Honesty guardrail:** only Free AGI items are on the live pricing page today. Pro/Team AGI
items above are *roadmap* — surface them as "rolling out," never as shipped, until wired.

---

## 4. Growth & virality

- **The viral artifact:** the coach-shareable AGI report. Every share is a branded,
  honest, text-only summary ending in "Made with SwingVantage — swingiq.app." Track
  `REPORT_COPIED` / `COACH_SHARE_CLICKED` / `REPORT_SHARED` to measure the loop.
- **The retention hook:** the Today dashboard summary surfaces the keystone + today's
  action every visit; progress-over-time gives a reason to come back ("did it move?").
- **Top-of-funnel SEO/AEO:** the public explainer is in the sitemap and cross-linked from
  `/methodology` and `/how-it-works`; its FAQ directly answers "is this real AGI?" and
  "what's the one thing to train?" for answer engines.
- **Announcement:** shipped on the public changelog (`/updates`, update-078, featured +
  major milestone) with answer-engine/generative summaries.

---

## 5. Competitive differentiation (one line each)

- **vs single-sport apps (HUDL, OnForm, Dartfish):** they physically cannot reason across
  sports; AGI's whole premise is unavailable to them.
- **vs launch monitors (TrackMan, FlightScope):** they measure ball flight in one sport;
  AGI reasons about the *athlete* across sports and prioritises one thing to train.
- **vs pure-LLM "AI coach" apps:** AGI is deterministic-first with an inspectable reasoning
  chain and a trust grade — not a chatbot guessing.

---

## 6. Roadmap (AGI-specific)

- **Near term:** wire the AI-narrative provider behind the existing seam (Pro); add a
  benchmark/percentile context layer once it maps cleanly to capabilities.
- **Medium term:** Team-wide AGI (roster keystones + aggregate capability gaps); cloud
  history sync (Pro); a shareable read-only report link.
- **Longer term:** trained on-device 3D model raising more capabilities to `measured`
  basis (lifts trust grades across the board); richer launch-monitor adapters as stored
  data deepens.

---

## 7. Where it lives

- **Product:** `/agi` (sidebar → Analyze → Athlete GI), Today dashboard summary, `/reports`
  card, onboarding Welcome Back, public explainer `/athlete-general-intelligence`.
- **Code:** engine `apps/web/src/lib/agi/` (pure, source-agnostic), UI `components/agi/`,
  feature docs `docs/athlete-general-intelligence.md`.
- **Strategy cross-refs:** `MONETIZATION_CHECKLIST.md` (tiers + growth), `COMPETITIVE_POSITIONING.md`
  (differentiator #8), `PRODUCT_ROADMAP.md` (built + AI/monetization roadmap).
