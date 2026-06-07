# Monetization Ethics & No-Dark-Pattern Rules

> **In Plain English (start here):** SwingVantage makes money *without* tricking anyone. The free product stays genuinely free and useful. We never charge a card unless real payment keys are configured. Ads (when we eventually turn them on) never get between you and your result, and never run on a kid's report. Paid upgrades are only ever suggested at a moment they'd actually help you — and saying "no" is always easy. This doc writes those rules down so every future change follows them.
>
> **Order of monetization (locked):** grow free users → ads (first revenue) → membership tiers (Phase 3, *not* next). See [MONETIZATION_STRATEGY.md](MONETIZATION_STRATEGY.md).

This is the standard for §10 of [FIVE_PERSONA_MASTER_PLAN.md](FIVE_PERSONA_MASTER_PLAN.md). It is **policy + a map of what already enforces it** — most of it is already implemented.

---

## 1. Current state (verified)

| Guardrail | Status | Where it lives |
|---|---|---|
| Free tier fully usable, forever | ✅ Built | `lib/billing/tiers.ts` (Free has the full core feature set) |
| Pro/Team shown as "Coming Soon" + waitlist until launch | ✅ Built | `app/(marketing)/pricing/PricingCTA.tsx` |
| **No card is ever charged without Stripe keys** | ✅ Built | `PricingCTA` → `/api/capabilities` gate; real checkout only when `billing` capability is true |
| Ads **off by default** (keyless) | ✅ Built | `components/ads/AdSlot.tsx`, `lib/ads`, `lib/capabilities.ts` (`NEXT_PUBLIC_ADS_*`) |
| Ads never shown to minors; members are ad-free | ✅ Built | `AdSlot` returns `null` for minors/members/disabled/no-fill |
| Ads clearly labeled "Advertisement", non-personalized for youth | ✅ Built | `AdSlot` paid container |
| House promos (grow the product) as the keyless default | ✅ Built | `HouseAdCard` |

**Deliberately NOT done yet:** we do **not** label the Free tier "ad-supported" in user-facing copy, because ads are currently off. Claiming "ad-supported" while no ads run would be misleading. Add that label only when ads are actually enabled.

---

## 2. No-dark-pattern rules (policy)

These are hard rules. A change that violates one should not ship.

1. **Never hide the free path.** The free option is always visible and selectable. No "free" buried under paid CTAs.
2. **No fake urgency or scarcity.** No countdown timers, "only N left", or invented deadlines on a digital product.
3. **No pre-checked upsells.** Paid add-ons/options are never opted-in by default.
4. **No confirm-shaming.** Decline copy is neutral ("Not now"), never guilt-based ("No, I don't want to improve").
5. **Cancel is as easy as subscribe.** When billing is live, cancellation is self-serve and obvious (`BillingPortalButton`).
6. **No bait-and-switch.** What's free today stays free; we don't quietly move core free features behind a paywall.
7. **Honest labels only.** Never present an estimate as a measurement, a house promo as a paid endorsement, or a "coming soon" tier as if it's purchasable.
8. **No charge without explicit, key-gated checkout.** The capability gate must remain; never wire a charge path that can fire without configured keys.

## 3. Ethical ad placement rules

1. **Never between a user and their result.** No ad gates the analysis, the diagnosis, the drills, or the plan.
2. **Never inside a youth report**, and never to a minor (enforced by `AdSlot`).
3. **No interstitials on `/start` or the upload flow.** The first-result path stays frictionless.
4. **One ad slot maximum per free content page.** No ad walls.
5. **Always labeled** "Advertisement"; **non-personalized** where youth may view.
6. **Members are ad-free** — a real, honored benefit of upgrading.
7. **No layout shift** when a slot is empty (`AdSlot` reserves nothing and renders `null`).

## 4. Helpful upgrade moments (not manipulative)

Show Pro value **only at the moment it is genuinely useful**, with a clear, neutral dismiss:

| Moment | Honest prompt | Event |
|---|---|---|
| User opens the app on a 2nd device | "Sync your data across devices with a free account / Pro" | `upgrade_clicked {feature:'sync'}` |
| After the Nth analysis | "Keep your full video & report history" | `upgrade_clicked {feature:'history'}` |
| On share | "Email a polished PDF to your coach" | `upgrade_clicked {feature:'pdf'}` |

Rules: value-framed (not fear-framed); dismissible; never blocks the free action; never repeats nagging after dismissal in the same session.

---

## 5. Review checklist (use on any monetization PR)

- [ ] Free path still visible and fully usable.
- [ ] No charge path can fire without Stripe keys (capability gate intact).
- [ ] Pro/Team still "Coming Soon" until launch (or real checkout only when keys exist).
- [ ] Ads off unless `NEXT_PUBLIC_ADS_*` set; none shown to minors; members ad-free.
- [ ] No countdown/scarcity/pre-checked/confirm-shaming patterns.
- [ ] Any "ad-supported" copy matches reality (only if ads are actually on).
- [ ] Upgrade prompts are value-framed, dismissible, and non-blocking.
