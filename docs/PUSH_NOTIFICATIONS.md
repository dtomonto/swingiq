# Push & lifecycle delivery

## In plain English

SwingVantage can nudge an athlete back to practice through two channels —
**browser push** and **email** — driven by the existing re-engagement engine
(`lib/reengage`) and the guided First 7 Days. Both are **keyless-first**: they do
nothing (and show nothing) until you add keys, so there's never a fake switch.

## What's wired

- **Email** — already sends via Resend (`lib/agents/dispatch/send-email.ts`,
  `sendDispatchEmail`). With `RESEND_API_KEY` set it delivers; without, it
  honest-dry-runs.
- **Web push** — full pipeline: a per-account subscription store, a service
  worker handler, a subscribe/unsubscribe API, and a VAPID-gated sender.
- **One delivery primitive** — `lib/notifications/deliver.ts` `deliverNudge()`
  fans a nudge out to every configured channel and reports honestly which sent.
- **User control** — a `PushToggle` on `/reminders` (hidden until push is
  configured) lets athletes opt in and send themselves a test.

## Owner setup (one-time)

**1. Email:** set `RESEND_API_KEY` (already used for auth email). Done.

**2. Web push:**
```bash
npx web-push generate-vapid-keys
```
Set these env vars (the public key appears twice — server + browser):
```
VAPID_PUBLIC_KEY=<public>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public>
VAPID_PRIVATE_KEY=<private>
VAPID_SUBJECT=mailto:you@swingvantage.com
```
Apply the subscriptions table (auto-listed in **/admin/setup**):
```
supabase-push-subscriptions.sql
```

Once those are set, the `PushToggle` appears on `/reminders`, athletes can opt
in, and `deliverNudge()` will send real push + email.

## Triggering (your choice)

`deliverNudge()` is the delivery primitive — call it from whatever schedule fits:
a daily cron (Vercel Cron / Supabase scheduled function) that walks due
re-engagement triggers (`lib/reengage` `selectNudge`), an admin action, or an
in-app event. Nothing sends on its own until a trigger calls it.
