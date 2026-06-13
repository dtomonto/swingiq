# Player Experience Overhaul — Master Plan

> **Goal:** Make SwingVantage feel like a premium sports-performance platform with the
> clarity, progression, and emotional pull of a modern video-game player-selection
> screen — game-like, but not childish. Lower-noise, intelligence-driven player
> experience across Today, dashboard, profile, journey, skill tree, friends, and
> upload-for-friend.

This directory breaks one giant request into **13 self-contained workstreams** that can
each be picked up in a fresh Claude Code session and worked in parallel by separate
agents. Each `WS-XX-*.md` file is a **copy-paste-ready prompt** — paste the whole file
into a new session and the agent has everything it needs.

---

## How to use this plan

1. Pick a workstream file (e.g. `WS-05-friends-foundation.md`).
2. **Copy its entire contents** into a new Claude Code session.
3. The agent works in its own git worktree (see Concurrency below), implements, tests,
   commits, and pushes its branch.
4. Open a PR per workstream against `master` (or ff-push if you're the owner).
5. Respect the **dependency order** below so foundations land before features.

Each prompt is intentionally redundant about shared conventions so it stands alone.
When something here changes, update this README and re-derive — this is the source of truth.

---

## Concurrency & branching (read first — this repo breaks when ignored)

Per `CLAUDE.md`, multiple agents touch this repo at once. **Every workstream MUST work in
its own git worktree** so agents don't share a git index:

```bash
npm run wt create <ws-short-name>     # → ../swiq-agents/<ws-short-name> on branch agent/<ws-short-name>
cd ../swiq-agents/<ws-short-name>
npm install                            # fresh worktree has no node_modules
```

Rules (non-negotiable):
- **Stage explicit paths**, then commit with a pathspec: `git commit -m "…" -- path/a path/b`.
  Never `git add -A`/`git add .`/`git commit -a` — it sweeps other agents' files into your commit.
- After committing, verify: `git show --stat HEAD` lists ONLY your files.
- Never `--force`, never `--no-verify`, never disable branch protection.
- Commit messages end with the project `Co-Authored-By` trailer (post-commit hook handles registries).
- Add changelog trailers when shipping user-facing work:
  - `Update: <one plain-English line for athletes>` (product update → `/updates`)
  - `Dev-Update: <one technical line for builders>` (dev update → `/dev-updates`)

---

## Stack facts every workstream needs (shared context)

- **Monorepo:** npm workspaces + Turbo. Web app in `apps/web` (Next.js App Router, React, TS).
  Shared code in `packages/core` (`@swingiq/core`).
- **Design system:** Tailwind + shadcn/ui. Reusable primitives in `apps/web/src/components/ui`.
- **State:** Local-first **Zustand store** (`apps/web/src/store`, persisted to localStorage),
  synced to Supabase via `apps/web/src/lib/db` (`projection.ts`, `cloud-repo.ts`,
  `relational-sync-provider.tsx`). Most product logic reads the store; cloud is a mirror.
- **Auth:** Supabase Auth (cloud) with a device-only local fallback. Helpers:
  - Server: `apps/web/src/lib/supabase-server.ts` → `getAuthenticatedUser()`,
    `createSupabaseServerClient()`
  - Browser: `apps/web/src/lib/supabase.ts` → `createBrowserClient()`
  - Admin/service-role: `apps/web/src/lib/supabase-admin.ts`
  - Unified hook: `apps/web/src/lib/auth/useAuth.ts` (`authMode()` → 'cloud' | 'local')
- **Database:** Supabase/Postgres. Migrations are **idempotent SQL files at `apps/web/*.sql`**
  named `supabase-<feature>.sql`, applied manually via the Supabase SQL editor. Use
  `create table if not exists` / `add column if not exists` guards. DB TypeScript types are
  hand-maintained inline in `apps/web/src/lib/supabase.ts` (`Database['public']['Tables']`).
- **RLS:** Every table has `user_id` and policies `using (auth.uid() = user_id)` for
  select/insert/update/delete (see `apps/web/supabase-rls.sql`). Any cross-user access
  (friends!) needs explicit, carefully scoped policies + server-side checks.
- **Analytics:** `track(event, props)` in `apps/web/src/lib/analytics.ts`; event-name
  registry in `packages/core/src/analytics/events.ts` (GA4 + PostHog + Plausible + Clarity).
  Add new events to the registry, then call `track()`.
- **Sports:** golf, tennis, baseball, softball, pickleball, padel. Sport config lives under
  `apps/web/src/lib/athletic-journey/config/` and elsewhere (each WS notes specifics).
- **Verify before landing** (from a worktree):
  ```bash
  cd apps/web
  npx tsc --noEmit
  npx jest <area> --runInBand --cacheDirectory ./.jest-cache-<area>
  npx eslint .
  ```
  Use a **private** jest cache dir to avoid concurrent-agent cache contention.

### What already exists (audit before building — do NOT rebuild)

This codebase is 80–95% built for most of this request. Reuse and extend:

| Concept in the request | Already exists as |
| --- | --- |
| Today prioritization engine | `apps/web/src/lib/priority/` (`engine.ts`, `types.ts`, `consistency.ts`) + `apps/web/src/lib/agents/` orchestrator (`orchestrator.ts`, `workflows/resume.ts`, `registry.ts`, `scoring.ts`) |
| Today / next-best-action UI | `apps/web/src/components/dashboard/PriorityPanel.tsx`, `DashboardNextAction.tsx`, `apps/web/src/components/agents/DashboardIntelligence.tsx`, `apps/web/src/components/agi/TodaysTasks.tsx`, hook `apps/web/src/hooks/useAgentInsights.ts` |
| Player dashboard | `apps/web/src/app/(app)/dashboard/page.tsx` + `DashboardContent.tsx` + `apps/web/src/components/dashboard/SecondaryPanels.tsx` |
| Athlete journey | `apps/web/src/lib/athletic-journey/` (engine, types, config per sport, store, adapters) + `apps/web/src/components/athletic-journey/*` (incl. existing `SkillTree.tsx`, `JourneyMap.tsx`, `MilestonePanel.tsx`) |
| Skill tree (branches) | `apps/web/src/lib/athletic-journey/` skill branches + `SkillTree.tsx` (extend into node graph w/ states + evidence) |
| Player profile / intelligence | store slices (`apps/web/src/store/slices/profile.ts`), AGI (`apps/web/src/lib/agi/`), journey signals |
| Analytics | `apps/web/src/lib/analytics.ts` + `packages/core/src/analytics/events.ts` |
| Friends / social | **DOES NOT EXIST** (only placeholder `allowFollowers` in `apps/web/src/lib/community/types.ts`) — net new |
| Upload-for-friend | **DOES NOT EXIST** — net new, depends on friends |

---

## The 13 workstreams & dependency graph

Mapped 1:1 to the original request's 13 sections. `WS-08` (data model) and `WS-10`
(analytics) are **foundations**; `WS-05`→`WS-06` is the net-new social chain; the rest are
mostly *extend existing systems*.

```
WS-08  Data model & migrations         ── FOUNDATION (do first; unblocks 3,4,5,6,7)
   │
   ├── WS-04  Player profile = intelligence hub ──┐
   │        │                                     │
   │        └── WS-03  Auto-generated skill tree ─┤ (profile feeds tree)
   │                     │                        │
   ├── WS-05  Friends/social foundation ──► WS-06  Upload-for-friend workflow
   │
   └── WS-10  Analytics events (foundation-ish; each WS adds its own events)

WS-01  Fix Today data overload      ◄── needs WS-03 (tree), WS-04 (profile)
WS-02  Dashboard = player-card      ◄── needs WS-03, WS-04
WS-07  Journey + integrate all      ◄── needs WS-01..WS-06 (integration capstone)

WS-09  Services/components hygiene   ── cross-cutting (shared abstractions, reviewed continuously)
WS-11  Production-readiness          ── cross-cutting (authz, privacy, a11y, states)
WS-12  Acceptance criteria QA        ── CLOSEOUT (verifies all WS against acceptance list)
WS-13  Final report                  ── CLOSEOUT (writes the delivery summary)
```

### Recommended execution order (waves)

- **Wave 1 (foundation, mostly serial):** `WS-08` → then `WS-10` can start in parallel.
- **Wave 2 (parallel after WS-08):** `WS-04`, `WS-05`. Start `WS-09`/`WS-11` as living guides.
- **Wave 3 (parallel):** `WS-03` (after WS-04), `WS-06` (after WS-05).
- **Wave 4 (parallel):** `WS-01`, `WS-02` (after WS-03 + WS-04).
- **Wave 5 (capstone):** `WS-07` integration.
- **Wave 6 (closeout):** `WS-12` acceptance QA → `WS-13` final report.

### Ownership boundaries (avoid file collisions)

| WS | Primary directories it owns / edits |
| --- | --- |
| WS-08 | `apps/web/supabase-*.sql` (new files), `apps/web/src/lib/supabase.ts` (types), `apps/web/src/lib/db/projection.ts` |
| WS-04 | `apps/web/src/lib/player-profile/` (new), `apps/web/src/store/slices/profile.ts`, profile UI |
| WS-03 | `apps/web/src/lib/skill-tree/` (new) + extend `apps/web/src/lib/athletic-journey/`, `components/athletic-journey/SkillTree.tsx` |
| WS-05 | `apps/web/src/lib/friends/` (new), `apps/web/src/app/(app)/friends/` (new), `apps/web/src/app/api/friends/` (new) |
| WS-06 | `apps/web/src/lib/upload-for-friend/` (new), upload UI/flow, `apps/web/src/app/api/uploads/` |
| WS-01 | `apps/web/src/lib/today/` (new orchestration) + `(app)/today` or dashboard Today section |
| WS-02 | `apps/web/src/components/dashboard/` (player card), `(app)/dashboard/*` |
| WS-07 | `apps/web/src/lib/athletic-journey/` integration + cross-wiring |
| WS-09/11/12/13 | docs + light touches across (coordinate, mostly review) |

When two WS must touch the same file (e.g. `supabase.ts` types, `events.ts`), the
**foundation WS owns it** and others extend after it lands. If you must touch a foreign
file, keep the diff minimal and note it in your PR.

---

## Shared definitions of done (every WS)

A workstream is done when:
- `npx tsc --noEmit` passes in `apps/web`.
- `npx eslint .` passes (no new errors).
- New logic has Jest tests (`*.test.ts` in a `__tests__` dir next to the code).
- Loading / empty / error / permission-denied states exist for any new UI.
- Mobile-first + accessible (contrast, keyboard, semantic HTML) — no white-on-white.
- No existing route is broken; existing upload/report/session flows still work.
- Analytics events added to the registry and fired.
- Server-side authorization + RLS for anything cross-user; safe privacy defaults; no
  client-supplied user IDs trusted; durable audit metadata where required.
- Honest `DataSource` labeling — never fabricate rankings/metrics/data.
- Committed with pathspec + trailers; branch pushed; PR opened (or ff-pushed by owner).

---

## Index

- `WS-01-today-focus.md` — Fix Today data overload (focused, capped-by-user-type Today).
- `WS-02-dashboard-player-card.md` — Dashboard as premium player-selection screen.
- `WS-03-skill-tree.md` — Auto-generated athlete skill tree (nodes, states, evidence).
- `WS-04-player-profile-hub.md` — Player profile as the organized intelligence hub.
- `WS-05-friends-foundation.md` — Secure friends/social foundation (requests, privacy).
- `WS-06-upload-for-friend.md` — Upload-for-friend video workflow (authz + audit).
- `WS-07-journey-integration.md` — Athlete journey + wire everything together.
- `WS-08-data-model.md` — Data model additions & migrations (FOUNDATION).
- `WS-09-services-components.md` — Shared services/components hygiene (cross-cutting).
- `WS-10-analytics.md` — Analytics events (foundation-ish).
- `WS-11-production-readiness.md` — Authz, privacy, a11y, states (cross-cutting).
- `WS-12-acceptance-qa.md` — Acceptance-criteria verification (closeout).
- `WS-13-final-report.md` — Delivery summary (closeout).
