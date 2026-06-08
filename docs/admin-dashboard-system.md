# Admin Dashboard System

How the SwingVantage admin operating system is structured, how it is protected,
and how to extend it. Pair this with `docs/admin-dashboard-ai-tools-audit.md`
(the gap audit) and `docs/admin-ai-tools-roadmap.md` (the AI-tool roadmap).

---

## Overview

The admin dashboard at `/admin/*` is the internal control center for the whole
business: product, growth, AI, content, user intelligence and operations. It is
built from a few reusable parts:

| Concern | Source of truth |
|---|---|
| Navigation / section catalogue | `apps/web/src/lib/admin/nav.ts` (`NAV_ITEMS`) |
| Roles & permissions (RBAC) | `apps/web/src/lib/admin/rbac.ts` |
| Server guard + role resolution | `apps/web/src/lib/admin/context.ts`, `app/admin/layout.tsx` |
| Shared UI kit | `apps/web/src/components/admin/*` |
| Honest data layer | `apps/web/src/lib/admin/data/*` |

Every section page is a server component that wraps content in the shared
`PageHeader` + `HelpPanel` (the "what is this / what to do" education layer) and
uses `SectionCard`, `MetricStat`, `StatusBadge`, `AlertCard` for a consistent,
readable, dark, high-contrast look.

---

## How admin route protection works

Defence in depth, two layers:

1. **Entry guard** — `app/admin/layout.tsx` (server component) blocks every
   `/admin/*` route unless **either**:
   - the request carries the `x-admin-secret` header matching `ADMIN_SECRET`
     (constant-time compared via `safeEqual`), **or**
   - the logged-in Supabase user's email is on the `ADMIN_EMAILS` allowlist
     (`isAdminUser()`).

   With no `ADMIN_SECRET` set, access is open **only** in `NODE_ENV=development`
   for local iteration, and closed in production. Non-admins are redirected to
   `/dashboard` (not shown a 403) so the route's existence is not confirmed.

2. **RBAC narrowing** — once inside, `lib/admin/rbac.ts` defines 21 permissions
   and 10 roles. Anyone who clears the guard defaults to **Super Admin**; finer
   roles are opt-in via the `ADMIN_ROLES` env map or the role-assignment overlay.
   The nav model hides sections a role lacks permission for, and **every admin
   API route re-asserts** with `requireAdmin()` + `contextCan(ctx, permission)` —
   never trust the client.

> **Rule:** any new admin API route or server action MUST start with
> `const admin = await requireAdmin(); if (!admin.ok) return 401;` and then a
> `contextCan(admin, '<permission>')` check before doing anything.

---

## How to add a new admin section

1. **Declare it once** in `lib/admin/nav.ts` — add a `NAV_ITEM` with `id`,
   `label`, `href`, `icon`, `group`, a one-line `blurb`, optional `permission`,
   `built: true`, and search `keywords`. The sidebar, Command Center grid,
   breadcrumbs and global search pick it up automatically.
2. **Create the page** at `app/admin/<section>/page.tsx` as a server component.
   Use `PageHeader` (title + plain-English description), the `SectionCard` kit,
   and end with a `HelpPanel`. Set `export const metadata = { robots: 'noindex,
   nofollow' }` and `export const dynamic = 'force-dynamic'` when reading live data.
3. **Add data via the honest pattern** — read real data server-side and degrade
   to an explicit "connect this" prompt when a source is unavailable. Never
   invent numbers (see `lib/admin/data/metrics.ts` for the reference pattern).
4. **Gate sensitive work** behind a `permission` (nav) and `contextCan` (API).

## How to add a new admin API route

Place it under `app/api/admin/<name>/route.ts`, `runtime = 'nodejs'`,
`dynamic = 'force-dynamic'`. Start with `requireAdmin()` + a `contextCan`
permission check (see `app/api/admin/copilot/route.ts` or `analytics-os/route.ts`
for the template). Keep secrets server-side; return only booleans/aggregates.

---

## Admin Copilot (worked example)

The Admin Copilot (`/admin/copilot`) is the reference implementation of a
read-only, AI-flavored admin tool built keyless-first.

```
lib/admin/copilot/
  types.ts      # CopilotSnapshot (aggregate, privacy-safe) + CopilotAnswer
  questions.ts  # intent registry + keyword matcher (pure)
  engine.ts     # answerCopilotQuestion(snapshot, query) — pure, deterministic
  snapshot.ts   # buildCopilotSnapshot() — SERVER-ONLY data composition
  ai-seam.ts    # optional model adapter, OFF by default, clearly labeled
app/admin/copilot/
  page.tsx          # server: builds snapshot + opening answer
  CopilotConsole.tsx# client: chips + free-text → /api/admin/copilot
app/api/admin/copilot/route.ts  # read-only POST, requireAdmin + analytics.view
```

Design rules it follows (and that new AI tools should follow):

- **Aggregate-only snapshot** — counts, booleans and alert summaries; never
  per-user rows. The Copilot intentionally does not surface individual users.
- **Computed by default** — the deterministic engine answers from real signals
  with no model call (no AI spend). The AI seam is env-gated
  (`ADMIN_COPILOT_AI=1` + a registered adapter) and answers are labeled
  *AI-assisted* when used.
- **Read-only** — the endpoint never publishes, emails or deletes. Answers carry
  `needsApproval: false` because nothing is executed; any future destructive
  capability must set this and require explicit confirmation.
- **Honest** — when data is missing the answer says so (a `caveat`) and links to
  the tool that has it, rather than guessing.
- **Transparent** — every answer shows how it was produced and its data sources.

---

## How to add a new GrowthOS tool / CentralIntelligenceOS insight / sport page

- **GrowthOS tool** — add a page under `app/admin/growth/<tool>/page.tsx` and a
  nav entry in the `growth` group; reuse the existing GrowthOS data libs.
- **CentralIntelligenceOS insight** — extend `lib/central-intelligence/*` and
  surface it as a panel in `/admin/central-intelligence`; keep it aggregate and
  consent-aware.
- **Sport admin page** — sports are driven by `app/admin/sports/[sport]/page.tsx`
  reading the sport taxonomy in `packages/core`; add the sport to the taxonomy,
  the page renders automatically.
- **Drill / practice-plan management** (planned) — follow the local-first +
  optional-Supabase-mirror pattern used across `lib/*`, with `status` review
  fields and `created_at`/`updated_at`.

---

## Security & privacy rules

- Admin routes are inaccessible to non-admins (guard + redirect).
- Never expose secrets/env values client-side — return booleans and aggregates.
- Re-assert `requireAdmin()` + RBAC on every API route/server action.
- Destructive actions require explicit confirmation; log sensitive actions to the
  audit log.
- Separate aggregate intelligence from PII. Aggregated learning is framed as
  **product-improvement intelligence, not user surveillance**, and **user data is
  used ethically and never sold** — state this wherever such data is shown.

---

## Future roadmap

See `docs/admin-ai-tools-roadmap.md` and the priority table in
`docs/admin-dashboard-ai-tools-audit.md`. Near-term: AI Agent Registry, Data
Quality dashboard, Drill Library + Practice Plans, QA/Testing and
Theme/Accessibility operator boards.
