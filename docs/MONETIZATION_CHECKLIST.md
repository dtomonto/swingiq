# SwingIQ — Monetization Checklist (the least-expensive path to your first paying user)

_Built from the master audit (`docs/master-audit-report.md`) + a read of the actual billing code. Last updated: June 2026._

---

## 📘 In Plain English (start here)

**What this page is:** The exact, ordered list of everything you need to do to start charging money — sequenced so you spend the least possible while doing it safely.

**The three things to know before you start:**
1. **Good news — most of the payment code already exists.** SwingIQ already has a working Stripe checkout built in (no expensive "build payments" project needed). You are mostly *turning it on*, not building it.
2. **The real money cost of running a paid app is tiny** — roughly **$5–$20/month + about 3% of what you collect + ~$12/year for a domain.** Everything else can run on free tiers to start.
3. **There is real work left**, but it's specific and small: a payment "confirmation" webhook, remembering *which* user paid, a cancel button, and the legal/compliance gates. This page lists every piece.

**Legend used below:**
- **[You]** — only you can do this (create an account, make a money decision, accept legal terms).
- **[Build]** — code work. A developer can do it, or Claude can build it for you in this repo.
- 💲 — where money is actually spent (and the cheapest option).

> This is business/operations guidance, not legal advice. The legal items below flag where a professional review is worth the money.

---

## The honest status: what's already built vs. missing

| Piece | Status | Where |
|---|---|---|
| Pricing tiers (Free / Pro $12 / Team $49) | ✅ Built | `apps/web/src/lib/billing/tiers.ts` |
| Pricing page + "Upgrade" button | ✅ Built | `apps/web/src/app/(marketing)/pricing/` |
| Stripe Checkout (hosted, subscription) | ✅ Built (SDK-free) | `apps/web/src/lib/billing/stripe.ts`, `api/billing/checkout/route.ts` |
| "Waitlist unless keys present" safety | ✅ Built | `apps/web/src/lib/capabilities.ts` |
| Share image + app icons (credible link previews) | ✅ Done | `apps/web/public/og-default.png`, `icon-*.png` |
| **Athlete General Intelligence** (cross-sport keystone + coach-shareable report) | ✅ Built — keep free (growth/virality driver) | `apps/web/src/lib/agi/`, `/agi`, `/athlete-general-intelligence` |
| **Payment confirmation webhook** | ❌ Missing | needs `api/billing/webhook/route.ts` |
| **Remembering which user is paying** (per-user entitlement) | ❌ Missing | today the app only knows "Stripe is on," not "this user is Pro" |
| **Linking a checkout to the logged-in user** | ❌ Missing | checkout doesn't yet attach a user id/email |
| **Cancel/manage subscription (billing portal)** | ❌ Missing | needs a portal route |
| **Cloud "delete my account + data" flow** | ❌ Missing (master F-16) | required before charging/scaling |
| Real Stripe keys + Price IDs | ❌ Not set | you create these in Stripe |
| Legal: Terms (refund + AI disclaimer) + Privacy covering payments | ⚠️ Placeholder (master F-15) | `apps/web/src/app/(marketing)/terms`, `privacy` |

**Translation:** the expensive-sounding part (building a payment system) is done. What remains is ~4 small code pieces, the Stripe account setup, and the legal/compliance gates.

---

## 💲 What it actually costs to run a paid app (cheapest viable stack)

| Need | Cheapest option | Cost |
|---|---|---|
| Payment processing | **Stripe** — no monthly fee | $0 fixed + ~**2.9% + 30¢** per charge |
| Database + accounts | **Supabase free tier** | $0 (see `docs/SUPABASE_SETUP_WALKTHROUGH.md`) |
| Hosting the app (commercial) | **see note ↓** | **$5–$20/mo** |
| Domain name | Cloudflare / Namecheap | ~**$10–12/year** |
| Analytics | **GA4** or **PostHog free** | $0 |
| Error + uptime monitoring | **Sentry free** + **UptimeRobot free** | $0 |
| Payment receipts to customers | **Stripe sends these automatically** | $0 |
| Lifecycle email (optional) | **Resend free tier** | $0 |
| Legal pages | generator now, attorney before scale (↓) | ~$0–40 now |

> **⚠️ The one unavoidable cost — hosting.** You're probably on **Vercel's free Hobby plan**, but Vercel forbids commercial (money-making) use on Hobby. The moment you charge, you need a commercial-allowed host. Cheapest compliant choices:
> - **Vercel Pro — ~$20/mo** (zero migration; just upgrade the plan). Easiest.
> - **A $5/mo VPS** (e.g. Hetzner/DigitalOcean) you self-host on. Cheapest, more hands-on.
> - **Cloudflare Pages** (free tier allows commercial use), but Next.js server features need extra config — more fiddly.

**Realistic monthly floor to be live and charging: about $5–$20.** Plus ~3% of revenue. That's it.

---

## Phase 0 — Decide what you're selling (15 min) **[You]**

- [ ] **Start with ONE paid tier, not two.** Launch **Pro ($12/mo)** only; keep **Team** as "Contact us / coming soon." Fewer moving parts = cheaper and faster to first dollar.
- [ ] Confirm the Free tier stays genuinely useful (it does today) — that's your funnel.
- [ ] Decide: monthly only to start? (Add annual later — annual needs a second Stripe price.)
- [ ] Pick what Pro unlocks. The tiers file already lists it (cloud sync, video storage, OCR, pro library, unlimited AI narrative, PDF/coach sharing, priority support). Make sure each is real or clearly "rolling out."
- [ ] **Keep the core of Athlete General Intelligence free** — the cross-sport keystone, plan, and coach-shareable report are the funnel + viral loop; do **not** paywall them. The honest Pro/Team upsells layer on top: **AI-enhanced Athlete GI narrative** (the LLM seam, fits the existing "Unlimited AI narrative" perk), **true-3D measured capture** (2-camera Motion Lab → raises the trust grade), **deep progress history**, and **team-wide Athlete GI** for coaches (roster keystones + capability gaps → a natural Team headline). Full split + rationale: `docs/ATHLETE_GI_STRATEGY.md`.

---

## Phase 1 — Be live first (you can't charge on localhost) **[You]**

> You need a working, deployed app with real accounts before money makes sense. Most of this is the existing launch checklist — do these first.

- [ ] 💲 **Buy your domain** (~$12/yr) if you don't own it yet.
- [ ] **Connect the free database** — follow `docs/SUPABASE_SETUP_WALKTHROUGH.md` (run `server/supabase_setup_all_in_one.sql`, paste 2 keys). $0.
- [ ] 💲 **Deploy to a commercial-allowed host** (Vercel Pro ~$20/mo, or the $5 VPS). Connect your GitHub repo; add your domain; confirm the padlock (SSL) shows.
- [ ] **Smoke-test the live site**: sign up, run a diagnosis, upload a video, export a backup, switch sports. (Master "Core Feature Smoke Test.")

---

## Phase 2 — Business & legal gate (do NOT skip before charging) **[You]**

- [ ] **Create a Stripe account** at https://stripe.com — free. You'll provide a bank account (to receive payouts) and basic business/tax info. Sole-proprietor is fine to start in most places.
- [ ] **Terms of Service must cover paid use** (master **F-15**): add a **refund policy** and the **AI disclaimer** ("coaching is for improvement, not professional instruction/medical advice"). Edit `apps/web/src/app/(marketing)/terms`.
- [ ] **Privacy Policy must mention payments** — that Stripe processes card data and you don't store card numbers. Edit `apps/web/src/app/(marketing)/privacy`.
- [ ] **Add a "by subscribing you agree to the Terms" checkbox/line** at the point of upgrade. **[Build]** (small).
- [ ] 💲 **Cheapest responsible legal path:** use a reputable policy generator (Termly, GetTerms ~$0–40 one-time) for v1. **Before you scale or knowingly take under-13 users, get a real attorney + COPPA/GDPR/CCPA review** — that's the one place skimping is risky (master F-15, `docs/privacy-and-youth-safety-notes.md`).

---

## Phase 3 — Set up Stripe (dashboard, ~30–45 min) **[You]**

- [ ] In Stripe → **Products** → create **"SwingIQ Pro"** with a **$12/month recurring price**. Copy its **Price ID** (looks like `price_...`).
- [ ] (Optional, later) create **"SwingIQ Team" — $49/month** and copy that Price ID.
- [ ] In Stripe → **Developers → API keys**, copy your **Secret key** and **Publishable key**. Start in **Test mode** (toggle top-right) so no real money moves yet.
- [ ] In Stripe → **Developers → Webhooks**, you'll add an endpoint in Phase 4 and copy its **Signing secret**.
- [ ] Keep these 5 values handy for Phase 5:
  - `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, (`STRIPE_PRICE_TEAM`)
  - *(The app already reads exactly these names — see `apps/web/.env.example`.)*

---

## Phase 4 — Finish the 4 missing code pieces **[Build]** (Claude can do this)

> This is the only real development work. It's small and well-scoped because checkout already exists.

- [ ] **1. Attach the logged-in user to checkout.** Pass the Supabase user id/email into the Stripe session (`client_reference_id` / `customer_email`) so a payment can be traced back to the right account. *(Edit `lib/billing/stripe.ts` + `api/billing/checkout/route.ts`.)*
- [ ] **2. Add the payment webhook** `api/billing/webhook/route.ts` — verify Stripe's signature, then on `checkout.session.completed` / `customer.subscription.updated` / `…deleted`, record the user's current tier. *(SDK-free, same fetch style as the existing code.)*
- [ ] **3. Store + read per-user entitlement.** Add the user's plan + status to Supabase (a `subscriptions` table, or columns on `golfer_profiles`), and a `getUserTier(userId)` helper so the app gates Pro features per user — not just the global `isStripeConfigured()` switch that exists today. *(Edit `lib/capabilities.ts` / new `lib/billing/entitlements.ts`.)*
- [ ] **4. Add a "Manage / cancel subscription" button** → Stripe Billing Portal route `api/billing/portal/route.ts`. Stripe requires easy cancellation; this also reduces refund requests.
- [ ] **(Tests)** Add a couple of tests for the webhook + entitlement logic so a future change can't silently break who-gets-Pro.

---

## Phase 5 — Wire production + lock the security gates **[You]** (+ small **[Build]**)

- [ ] **Put all secrets in your host** (Vercel → Settings → Environment Variables), not in code: the 5 Stripe values, the Supabase keys, your AI key, plus:
  - [ ] 💲 `ADMIN_SECRET` and `CRON_SECRET` — generate with `openssl rand -hex 32` (master **F-13**). $0.
- [ ] **Apply database row-level security** so users can't read each other's data (master **F-14**) — already handled if you ran `server/supabase_setup_all_in_one.sql`; if not, run `apps/web/supabase-rls.sql`.
- [ ] **Build the "delete my account + all data" flow** (master **F-16**) — a legal must-have once you hold cloud data and charge. **[Build]**
- [ ] **Flip the 4 GitHub security switches** (branch protection, secret scanning, Dependabot, private vuln reporting — master **F-11**). ~30 min, $0.
- [ ] **Verify security headers** at https://securityheaders.com after deploy (master **F-28**). $0.

---

## Phase 6 — See your money and your errors (before launch, all free) **[You]**

- [ ] 💲 **Analytics — free:** wire **GA4** or **PostHog free** so you can see signups → upgrades → churn (master **F-19**). Submit your sitemap to **Google Search Console** (master F-21).
- [ ] 💲 **Monitoring — free:** add **Sentry** (`@sentry/nextjs`, free tier) for errors and **UptimeRobot** (free) for downtime alerts (master **F-18**). If checkout breaks at 2am, you want to know.
- [ ] **(Optional) Lifecycle email — free tier:** connect **Resend** for a welcome + "your trial/receipt" email (master F-26). Stripe already emails receipts, so this is optional.

---

## Phase 7 — Test, then go live, then take $1 **[You]**

- [ ] **Test mode end-to-end:** with Stripe in Test mode, use card `4242 4242 4242 4242` (any future expiry/CVC) to "subscribe." Confirm the webhook fires and your test account flips to **Pro**.
- [ ] **Test cancellation:** use the portal button to cancel; confirm the account drops back to Free.
- [ ] **Switch Stripe to Live mode**, swap in the **live** keys + **live** Price IDs in your host's env vars, redeploy.
- [ ] **Do one real purchase yourself** (a real $12 charge on your own card) end-to-end; confirm payout appears in Stripe; then cancel/refund yourself.
- [ ] **Announce it** — flip the pricing page CTA from waitlist to live (it switches automatically once keys are present), add an entry to `/updates`.

---

## Quick reference — cheapest-path priority order

| # | Do this | Who | Cost |
|---|---|---|---|
| 1 | Decide: Pro-only, monthly, $12 | You | $0 |
| 2 | Domain + Supabase free + deploy to commercial host | You | ~$12/yr + $5–20/mo |
| 3 | Stripe account + Terms (refund + AI disclaimer) + Privacy | You | $0 (+~$0–40 legal gen) |
| 4 | Create Stripe Product/Price; copy keys (test mode) | You | $0 |
| 5 | Build: link user → checkout, webhook, per-user tier, cancel portal | Build | $0 (dev time) |
| 6 | Prod secrets, RLS, account-deletion flow, GitHub switches | You + Build | $0 |
| 7 | Analytics + Sentry + UptimeRobot (all free) | You | $0 |
| 8 | Test-mode purchase → go live → $1 real test → announce | You | ~3% of revenue |

**Bottom line:** to *begin* charging, your only out-of-pocket costs are **hosting (~$5–20/mo)**, a **domain (~$12/yr)**, and **~3% of each payment** to Stripe. The biggest remaining effort is the four small code pieces in Phase 4 — everything else is account setup and switches.

---

*See also: `docs/ATHLETE_GI_STRATEGY.md` (Athlete GI tiering + growth/virality), `docs/master-audit-report.md` (F-27 payments, F-15 legal, F-13/F-14/F-16 security, F-18/F-19 measurement), `docs/LAUNCH_READINESS_CHECKLIST.md` (Category 2), `docs/INTEGRATIONS_SETUP.md` (Stripe + Supabase env), `docs/SUPABASE_SETUP_WALKTHROUGH.md`.*
