# Outbound re-engagement reminders

_Last updated: 2026-06-13_

How scheduled outbound reminders (retest-due, streak-at-risk, comeback, …) are
built, what's done, and what's required to turn them on. **Off by default** —
reminders stay in-app until a provider key + accounts are configured.

## The model

A re-engagement nudge is selected by one honest, shared rule set so an email/push
reminder follows the exact same policy as the in-app card:

- **Triggers** (`apps/web/src/lib/reengage/triggers.ts`) — 7 of them, each with a
  cooldown and allowed channels. `retest_due` and the comeback triggers allow
  email; `streak_at_risk` is in-app/push only (no email, to avoid daily spam).
- **Selection engine** (`apps/web/src/lib/reengage/engine.ts`, `selectNudge`) —
  picks at most one nudge, honoring per-trigger cooldowns, a global daily cap,
  dismissals, and the channels available to the user.
- **Delivery primitive** (`apps/web/src/lib/notifications/deliver.ts`,
  `deliverNudge`) — sends across configured channels (Resend email, VAPID web
  push); each channel is an honest no-op when unconfigured.

## What this scaffold adds

- **`apps/web/src/lib/reengage/outbound.ts`** — the decision layer:
  - `planOutboundForUser` — given a user's signal, state, and email, decides
    whether/what to send, gating on the channels they actually opted into.
  - `runReengageBatch` — runs one pass over candidates with injected deps
    (so it's fully unit-tested, no network); honest no-op when not configured.
- **`apps/web/src/app/api/reengage/cron/route.ts`** — the entrypoint, auth'd by
  `CRON_SECRET` (or an admin "run now"), allow-listed in middleware. Returns an
  honest summary (`{ configured, considered, sent, suppressed, errors }`).
- **`isReengageOutboundConfigured()`** (`lib/capabilities.ts`) — true only when
  accounts (Supabase) **and** a channel (Resend or VAPID) are configured.
- Tests: `apps/web/src/lib/reengage/__tests__/outbound.test.ts`.

## What's required to turn it on

Two prerequisites remain — by design, the scaffold is dormant until both exist:

1. **Accounts active (Supabase).** Outbound enumerates users + their email
   server-side; that's impossible for keyless, device-only profiles. See
   [SUPABASE_ACCOUNTS_RELATIONAL.md](SUPABASE_ACCOUNTS_RELATIONAL.md).
2. **A server-side re-engage prefs/email model.** Today, opt-in prefs and send
   history (`NudgeState`) live in device `localStorage`
   (`apps/web/src/lib/reengage/store.ts`), so the server can't know who opted in
   or their cooldown state. Outbound needs a server mirror of that state plus a
   stored contact email (captured at the post-analysis "save your progress"
   moment). Until it exists, `loadOutboundCandidates`
   (`apps/web/src/lib/reengage/batch.server.ts`) returns `[]` and the cron is a
   safe no-op.

### Activation checklist

1. Activate accounts + cloud sync (Supabase project, schema, env vars).
2. Set a channel: `RESEND_API_KEY` (email) and/or `VAPID_PUBLIC_KEY` +
   `VAPID_PRIVATE_KEY` (push); set `CRON_SECRET`.
3. Implement the server-side prefs/email model + `loadOutboundCandidates`
   (build each user's `ActivitySignal` from their synced sessions/training, read
   their server-side `NudgeState`, and their contact email).
4. Add the schedule to `vercel.json`, e.g.
   `{ "path": "/api/reengage/cron", "schedule": "0 8 * * *" }` (deliberately not
   added yet — it would be a daily no-op until step 3 lands).
5. Verify: hit the route with the `CRON_SECRET` bearer token and confirm the
   `sent` / `suppressed` summary; check a real email/push arrives for a test user.
