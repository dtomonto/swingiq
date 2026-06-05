# SwingIQ — Monetization Strategy (the north star)

_The single source of truth for **how and in what order** SwingIQ makes money.
Every other monetization doc is subordinate to this sequence. Last updated: June 2026._

---

## 📘 In Plain English (start here)

**The plan, in one sentence:** First grow a big free user base, **then** turn on ads to
earn the first revenue, and **only after ads are actually making money** do we strategically
roll out paid membership tiers.

**Why this order (and not the reverse):**
- **Free first** is the cheapest, fastest way to prove people actually want SwingIQ. The app
  runs at ~$0 with zero users (it's local-first), so growth costs almost nothing.
- **Ads before subscriptions** because ads earn money from people who would *never* pay —
  you monetize the whole audience without asking anyone for a credit card. That requires
  traffic, not a payment system, so it's the natural first dollar.
- **Tiers last** because subscriptions only make sense once you have (a) a real audience and
  (b) proof that audience is monetizable. By then you'll know who your power users are and
  what they'd actually pay for — so the tiers can be designed from evidence, not guesses.

**What stays true at every phase:** the core SwingIQ experience stays **free and genuinely
useful forever**. We never cripple the free product to force money out of it. Ads stay
non-intrusive and youth-safe; paid tiers only ever *add* depth on top.

> This is business strategy, not legal advice. The ads and youth-safety notes below flag
> where a professional review is worth the money before you flip anything on.

---

## The three phases (and the gate between each)

```
  PHASE 1                  PHASE 2                     PHASE 3
  Grow free users   ──▶    Monetize via ads     ──▶    Roll out membership tiers
  (NOW)                    (first revenue)             (strategic, evidence-led)

  gate: a real,            gate: ads producing
  returning audience       stable, meaningful
                           revenue
```

You do **not** advance a phase because time passed — you advance it because the **gate**
ahead of it is met. Each gate is a measured fact, not a date.

---

## Phase 1 — Grow the free user base  ·  **STATUS: ACTIVE (now)**

**Goal:** a real, returning audience. Nothing is monetized yet.

**What we lean on (all $0 / free-tier):**
- The whole app is free and local-first → runs at ~$0 regardless of user count (the only
  usage cost is the AI API, which is capped — see [`project-go-to-market`] memory).
- **Growth loops already built:** the coach-shareable Athlete GI report (every share is
  free acquisition), the public SEO/AEO explainer pages, shareable swing/plan images.
- **Retention already built:** Today's Fix, streaks, challenges, badges, progress-over-time.
- **Cheap levers to keep pushing:** measurement (Plausible/PostHog free tier), email capture
  (Kit/ConvertKit free), Google Search Console + sitemap, founder distribution in niche
  sport communities.

**The gate to Phase 2 (do NOT turn on ads before this):**
- A **steady, returning audience** — sustained weekly-active users and organic traffic that
  an advertiser would actually pay to reach. (Ads on an empty site earn pennies and only
  hurt the experience.) Use the analytics from Phase 1 to confirm the trend is real and not
  a one-off spike.

**Owner decision recorded:** near-term priority is **grow free users first, NOT monetize**
(2026-06-03). Phase 1 is where we are.

---

## Phase 2 — Monetize via ads  ·  **STATUS: planned, not built (correct for now)**

**Goal:** the **first revenue**, earned from the free audience without charging anyone.

**Principles (non-negotiable):**
1. **Free experience stays intact.** Ads are non-intrusive — no interstitials over a
   diagnosis, no blocking the result a user came for. Think tasteful placements around
   content, not in the middle of the coaching loop.
2. **Youth-safe by default.** SwingIQ has youth/junior athletes, which means potential
   under-13 users and COPPA/GDPR-K exposure. Ads must be **non-personalized / contextual
   only** unless and until age-gating + consent are in place. This is the one place to get a
   real legal/compliance read before flipping anything on (see `docs/MONETIZATION_CHECKLIST.md`
   legal notes and `docs/privacy-and-youth-safety-notes.md`).
3. **Privacy-first.** Prefer contextual ad networks over behavioral/tracking-heavy ones —
   it fits SwingIQ's existing cookieless, local-first positioning and avoids a heavy
   consent-banner burden.

**How it's wired in code (keyless-first, like everything else):**
- There is a dedicated **ads capability seam**: `isAdsConfigured()` in
  `apps/web/src/lib/capabilities.ts`, surfaced as `ads` in the `/api/capabilities` summary.
- **Off by default.** With no ad-network id set, the app renders **zero ads** — the clean
  free experience. Ads only appear once an ad-network id env var is present (mirrors how
  Stripe stays a waitlist until keys exist). Env vars live (commented) in
  `apps/web/.env.example` under "Ads".
- When the gate is met, the build work is: pick a youth-safe/contextual network, add a thin
  `<AdSlot>` component that renders nothing unless `ads` is configured, and place a few
  honest, non-intrusive slots. No ad code ships active until then.

**The gate to Phase 3 (do NOT launch paid tiers before this):**
- Ads producing **stable, meaningful revenue** — proof the audience is monetizable and large
  enough that a paid layer is worth the added complexity, support load, and legal/compliance
  cost of charging money.

---

## Phase 3 — Strategically roll out membership tiers  ·  **STATUS: rails pre-built, dormant**

**Goal:** layer paid subscriptions **on top of** a proven, ad-monetized audience — designed
from real usage evidence, not guesses.

**Why the code already exists but is deliberately dormant:** the Stripe checkout, the
Free/Pro/Team tier definitions, and the billing routes are already built and **safely off**
(they show a waitlist until Stripe keys are present). That's intentional pre-building — it is
**not** a signal that subscriptions are the next step. They are **Phase 3**, gated behind ad
revenue.

**When the gate is met, the playbook is:** `docs/MONETIZATION_CHECKLIST.md` — the
step-by-step, least-expensive path to the first paying user (Stripe setup, webhook,
per-user entitlements, billing portal, legal gates). Treat that doc as the **Phase 3
runbook**, executed only after Phase 2 proves out.

**Likely tier shape (revisit with real data at Phase 3):**
- Keep the core free (it's the funnel + viral loop).
- A natural Pro perk in an ad-supported product is **"remove ads"** plus the depth upsells
  already scoped (cloud sync, video storage, deep history, AI-enhanced Athlete GI narrative,
  true-3D measured capture). See `docs/ATHLETE_GI_STRATEGY.md`.
- Team/coach tier for academies and facilities.

---

## How the existing docs map to this strategy

| Doc | Role under this strategy |
|---|---|
| **`docs/MONETIZATION_STRATEGY.md`** (this file) | The north star: phase order + the gates. Read first. |
| `docs/MONETIZATION_CHECKLIST.md` | The **Phase 3** runbook (subscriptions). Deferred until ad revenue exists. |
| `docs/ATHLETE_GI_STRATEGY.md` | What stays free vs. what becomes a Phase 3 upsell. |
| `docs/PRODUCT_ROADMAP.md` | The Monetization Roadmap section follows this phase order. |
| `apps/web/src/lib/capabilities.ts` | `ads` (Phase 2) + `billing` (Phase 3) capability seams — both keyless-first/off by default. |
| `apps/web/src/lib/billing/tiers.ts` | Phase 3 tier definitions (dormant/waitlist by design). |

---

## One-line summary for any future contributor (human or agent)

**Don't push subscriptions as the next step.** The order is fixed: grow the free base →
turn on ads for first revenue → *then* roll out membership tiers, each only when the gate
ahead of it is met. Keep the free core genuinely useful and youth-safe at every phase.

[`project-go-to-market`]: ../memory note — grow free users first, ~$0 budget.
