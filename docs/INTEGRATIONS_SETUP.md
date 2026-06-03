# SwingIQ — Integrations Setup Checklist

_Last updated: June 2026_

---

## 📘 In Plain English (start here)

**What this page is:** A plain-English checklist for turning on the "big" features that need an outside account or key — sign-in & cloud saving (Supabase), the AI features, paid plans (Stripe), photo import (OCR), and email.

**The honest promise:** SwingIQ is built so that **everything works or fails honestly** without these. If a key isn't set, the app shows a clear "not set up yet" message instead of pretending. So you can turn these on **one at a time, in any order, whenever you're ready** — nothing breaks while they're off.

**Where the keys go:** All keys are pasted into one file on your computer: **`apps/web/.env.local`** (create it if it doesn't exist). One `NAME=value` per line. After editing it, stop and restart the app (`npm run dev:web`) so it picks up the changes. **Never commit this file** — it holds secrets and is already git-ignored.

**How to check what's on:** The code that reads these is `apps/web/src/lib/config/integrations.ts`. Each feature below lists the exact variable names it looks for.

> You do **not** need to be a developer to do most of this — it's mostly "create an account → copy a key → paste it into one file."

---

## The features, in priority order

| # | Feature | What it unlocks | Needed for |
|---|---------|-----------------|------------|
| 1 | **AI features** | Real AI swing-video review + AI Coach chat | The core "smart" experience |
| 2 | **Supabase** | Sign-in, saved sessions, sync across devices | Accounts & cloud data |
| 3 | **OCR** | Import numbers from a *photo* of a launch monitor | Easier data entry |
| 4 | **Email** | Save leads + send lifecycle emails | Growth / marketing |
| 5 | **Analytics** | See how the app is used | Measurement |
| 6 | **Stripe** | Charge for Pro/Team plans | Making money (later) |

---

## 1. AI features (video vision + AI Coach)

**What it unlocks:** the AI that reviews uploaded swing frames and the AI Coach chat.

**Get a key:** create an account at one of:
- OpenAI — https://platform.openai.com (recommended; also powers OCR)
- Anthropic — https://console.anthropic.com
- Google AI — https://aistudio.google.com

**Paste into `apps/web/.env.local`:**
```
AI_PROVIDER=openai
AI_VISION_PROVIDER=openai
OPENAI_API_KEY=sk-...your key...
# (or ANTHROPIC_API_KEY=... / GOOGLE_AI_API_KEY=... with the matching provider name)
```
Optional: `AI_VISION_MODEL=gpt-4o`, `MAX_VIDEO_FRAMES_ANALYZED=16`.

**Verify:** upload a swing at `/video`. With no key you'll see the honest "AI visual analysis is not configured" notice instead of fake feedback.

---

## 2. Supabase (accounts + cloud data)

**What it unlocks:** real sign-in, saving sessions to the cloud, and syncing across devices. Until this is set, SwingIQ runs **local-first** (data lives in the browser; the offline queue in `lib/offline/session-queue.ts` holds sessions until a backend is connected).

**Steps:**
1. Create a free project at https://supabase.com.
2. In the Supabase dashboard → **SQL Editor**, paste and run the schema from `server/supabase_schema.sql`.
3. In **Project Settings → API**, copy the Project URL and the keys.

**Paste into `apps/web/.env.local`:**
```
NEXT_PUBLIC_SUPABASE_URL=https://YOURPROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...anon key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...service role key...   # server only — keep secret
```

**Verify:** sign-in middleware activates automatically once the URL + anon key are present.

---

## 3. OCR (import from a photo)

**What it unlocks:** reading numbers off a photo of a launch-monitor screen (the import wizard currently asks for manual entry until this is on).

**Easiest path — reuse OpenAI Vision** (no extra account if you did step 1):
```
OCR_PROVIDER=openai
# uses the OPENAI_API_KEY from step 1
```

**Or Google Cloud Vision:**
```
OCR_PROVIDER=google
GOOGLE_CLOUD_VISION_API_KEY=...your key...
```

---

## 4. Email (capture + notifications)

**What it unlocks:** saving email leads and sending lifecycle emails. Pick **one** provider. Until one is set, the app honestly reports the email was **not** saved (it never fakes success).

**Resend (recommended):**
```
RESEND_API_KEY=re_...
RESEND_AUDIENCE_ID=...
```
**ConvertKit:**
```
CONVERTKIT_API_KEY=...
CONVERTKIT_FORM_ID=...
```
**Mailchimp:**
```
MAILCHIMP_API_KEY=...
MAILCHIMP_LIST_ID=...
MAILCHIMP_SERVER_PREFIX=us21
```
**Any webhook (Zapier/Make/your own):**
```
EMAIL_CAPTURE_WEBHOOK_URL=https://...
```

---

## 5. Analytics

**What it unlocks:** real usage measurement. Without it, events log to the browser console only.
```
NEXT_PUBLIC_GA_ID=G-XXXXXXX            # Google Analytics 4
# (or) NEXT_PUBLIC_PLAUSIBLE_DOMAIN=swingiq.app
# (or) NEXT_PUBLIC_POSTHOG_KEY=phc_...
```

---

## 6. Stripe (paid plans — do this last)

**What it unlocks:** charging for Pro/Team tiers. The scaffold is in `apps/web/src/lib/billing/stripe.ts` — with no key it returns "billing not set up," never a fake checkout.

**Steps:**
1. Create an account at https://stripe.com and switch to **Test mode** first.
2. Create your **Products** and **Prices** (e.g. Pro $12/mo, Team $49/mo). Copy each Price ID (`price_...`).
3. Copy your API keys from **Developers → API keys**.
4. Add a webhook endpoint (Developers → Webhooks) once you build the billing route, and copy its signing secret.

**Paste into `apps/web/.env.local`:**
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_TEAM=price_...
```

**Still to build (developer):** a checkout API route that calls `createCheckoutSession(...)`, a billing-portal route, and a webhook handler to flip a user's plan. The honest scaffold and price-config detection are already in place.

---

## Bonus: practice-reminder notifications

`lib/notifications/practice-reminders.ts` can show **local** reminders while the app is open (asks permission first — no setup needed). Reminders that fire when the app is **closed** need a service worker + a push service (VAPID keys or a provider); that's a future infra step, surfaced honestly via `SERVER_PUSH_NOTE`.

---

## After you add keys

1. Save `apps/web/.env.local`.
2. Restart the dev server: `npm run dev:web` (env changes need a restart).
3. For production, add the same variables in your host's environment settings (e.g. Vercel → Project → Settings → Environment Variables).
4. Confirm `apps/web/.env.local` is **not** committed to git.
