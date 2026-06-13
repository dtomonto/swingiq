# Admin: GAI Operating Mode

**Where:** `/admin/operating-mode` (Operate → Video Analysis). Read needs
`logs.view`; changes need `settings.manage`. The page is `noindex`.

One screen to set the platform's posture toward AI spend, tune the three GAI
analysis tiers, and watch routing observability.

## The two modes

### Default AI Mode
> Uses configured GAI routing rules for the best available analysis quality while
> still applying heuristics and cache where they improve speed, reliability, or
> cost efficiency.

- Allows heuristic, hybrid, full-AI, cached, and fallback routes.
- Instant Estimate stays heuristic by design; AI Swing Report → hybrid; Premium
  Retest Plan → full AI when video + budget + a healthy provider are available.

### Cost-Saving Mode
> Protects API spend by prioritizing deterministic GAI logic, cached
> recommendations, reusable drill plans, and safe fallback behavior while
> preserving core user flows.

- **Free and Instant Estimate requests never hit paid AI**, regardless of any
  toggle. This is enforced server-side in `decideRoute` — it cannot be bypassed
  from the client.
- Deeper tiers use AI **only** for the tiers you explicitly allow (the
  "Allow AI for these tiers" chips), and only when budget + provider health
  permit.
- Every core flow — sport selection, diagnosis, report, drills, retest, upgrade
  — is preserved.

Enabling Cost-Saving Mode shows a confirmation prompt.

## Safety controls

- **Force heuristic everywhere** — serve deterministic GAI for every request,
  all tiers (useful during a provider incident).
- **Kill switch (no paid AI)** — a hard stop on every paid AI call; heuristic +
  cache only until turned off.

Both win over mode and tier settings (`ADMIN_FORCED_HEURISTIC`).

## Tier rollout (waitlist → full rollout)

The two paid tiers — **AI Swing Report** and **Premium Retest Plan** — ship on a
**waitlist** by default; only the free **Instant Estimate** is live. On the page,
each paid tier has a **Waitlist ↔ Full rollout** toggle plus a live count of how
many signed-in users have registered interest.

- **Waitlist:** the tier is announced but not active. The live video routes return
  a "join the waitlist" message instead of a paid call, and the
  `TierWaitlistButton` lets a signed-in user register interest with one tap
  (recorded once per user in `tier_waitlist`). Switching a tier to **Full
  rollout** prompts a confirmation, makes it live immediately, and stops the
  waitlist from collecting new names. It can be switched back at any time.
- The rollout state lives in the same operating-mode store (no new schema); the
  interest counts come from the additive `tier_waitlist` table.

User interest is recorded via `POST /api/intelligence/waitlist` (sign-in
required, so each interest maps to a real account); `GET` returns per-tier
rollout status + which tiers the current user already joined.

## Tier invitations (no-pressure placements)

A dynamic, admin-managed system for *where* the calm early-access invitation
appears — adjustable live from `/admin/operating-mode` with **no redeploy**.

- **Master switch** turns every invitation off at once.
- **Per-slot controls**: enable/disable, target tier, and an optional gentle
  headline. Registered slots: `post-diagnosis` (on by default), `dashboard`,
  `pricing`, `todays-tasks` (all mounted at high-conversion, value-already-
  delivered moments; the static/snapshotted surfaces default off — enable any
  with one click).
- **Zero-pressure by design**: the `<TierInvite>` card is informational, fully
  dismissible (remembers the dismissal), and only ever shows for a tier still on
  the **waitlist** — there is nothing to "upgrade" to, no urgency, scarcity, or
  countdowns. Once a tier is rolled out (Live), its invitations auto-hide.
- **Persistence**: the same durable store pattern (Upstash key
  `intelligence:placements`, per-instance memory fallback) — no DB schema.
- **APIs**: `GET /api/intelligence/placements` (public, resolved config the
  component reads); `GET/POST /api/admin/intelligence/placements` (admin-gated:
  read = `logs.view`, change = `settings.manage`).

To add a new placement: register a slot in `lib/intelligence/placements.ts`,
mount `<TierInvite slot="<id>" />` at the spot, and it appears in the admin
control automatically.

## Persistence

State is stored via the operating-mode store (`lib/intelligence/operating-mode.ts`),
mirroring the AI-budget / AI-routing override stores: a single durable Upstash
key (fleet-wide) with a per-instance in-memory fallback the UI labels honestly.
The env default is `INTELLIGENCE_OPERATING_MODE` (defaults to `DEFAULT_AI_MODE`).
Every change stamps the actor email and timestamp.

## Observability

When `apps/web/supabase-intelligence.sql` is applied, each route decision is
logged to `analysis_logs` and the page shows, over a trailing window: total
analyses, heuristic vs AI split, cache-hit rate, fallback rate, estimated spend
(upper bound), estimated cost avoided, and average confidence. Without the table,
routing still works — it just isn't persisted here.

Cost ceilings, per-user caps, and usage history live alongside the
[AI Provider Control Center](/admin/ai-provider); see
[ai-cost-controls.md](./ai-cost-controls.md).
