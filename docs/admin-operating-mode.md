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
