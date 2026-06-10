# UI/UX Rebuild — Front-End Audit & Execution Plan (#1, #2, #3)

> Prompt #1 mandates an audit + plan **before** coding ("Required Output Before Coding").
> This is that deliverable, plus the execution plans for #2 (admin dashboard) and #3 (Theme Lab OS).
> **Governing principle: audit-first — extend, don't rebuild.** Most of #1's design-system work already exists.

## Stack reality (audited 2026-06-09)
- **Next 16 / React 19 / Tailwind v4** (CSS-first `@theme` in `apps/web/src/app/globals.css` — there is **no** `tailwind.config.js`; tokens live in CSS).
- Radix primitives + CVA + `tailwind-merge` (shadcn-style), `lucide-react`, `zustand`, `zod`, `@tanstack/react-query`, `three`, React Compiler on.
- **No Storybook** dependency. **No framer-motion** (dead dep — use the CSS `--animate-*` motion language already in `globals.css`).
- Playwright present (`test:e2e`, axe a11y spec) but thin coverage.

---

## #1 — Premium UI/UX Rebuild (FRONT-END): phase-by-phase status

| Phase | Status | Evidence / Gap |
|---|---|---|
| 1 Audit | ✅ this doc | — |
| 2 Product/persona diagnosis | 🟡 partial | `AudienceLanding`, five-persona overhaul shipped; no consolidated persona→CTA map |
| 3 Design system (tokens/type/color/layout/components) | ✅ ~done | Full `@theme` token layer, 7 themes, per-sport accents, semantic surfaces, motion, radius/shadow art-direction |
| 4 Per-sport branded verticals | 🟡 partial | Per-sport **tokens** exist + `SportSelector`/`sportStrategy.ts`; **gap: no `SportShell`/`SportHero` that applies a sport's accent + motif as a reusable wrapper** |
| 5 Homepage/landing conversion | 🟡 verify | Marketing routes exist; audit current homepage against the 10-section conversion structure |
| 6 Navigation / IA | ✅ ~done | `AppShell` nav + mobile drawer + bottom-nav, all theme-aware/AA |
| 7 Conversion & trust | ✅ strong | Rich `trust/*` library (PrivacyAssurance, AnalysisTransparency, WhatHappensToMyVideo, …) |
| 8 Mobile-first | ✅ ~done | 16px inputs, 44px targets, pinch-zoom, bottom nav, drawer, safe-area docks |
| 9 Empty/loading/error states | 🟡 partial | `EmptyState`/`LoadingSkeleton`/`ErrorRecoveryCard` exist; **gap: not applied across all key routes** |
| 10 Accessibility | ✅ ~done | focus-visible, reduced-motion, contrast gate (335 tests), axe e2e |
| 11 Perf/SEO/Lighthouse | ✅ strong | React Compiler, next/font, lazy three.js, SEO registries, speed-insights |
| 12 Storybook | ❌ gap | Not installed — **document setup plan; add incrementally for core primitives** |
| 13 Playwright critical flows | 🟡 partial | a11y spec only; **gap: homepage/CTA/nav/upload/sport-page/auth happy-paths** |
| 14 Design QA sweep | 🟡 ongoing | run after each slice |
| 15 Prioritization | ✅ below | — |

### #1 build queue (highest impact first — each: Stitch ideate → Figma if URL given → implement on tokens → preview → variations)
1. **`SportShell` + `SportHero` (Phase 4)** — reusable wrappers that apply the existing per-sport accent token + motif; converts the sport pages into distinct-but-unified branded experiences without per-sport template duplication. *Highest brand ROI, builds on shipped tokens.*
2. **State-coverage sweep (Phase 9)** — apply `EmptyState`/`LoadingSkeleton`/`ErrorRecoveryCard` to the key `(app)` routes that still hand-roll states.
3. **Homepage conversion refinement (Phase 5)** — audit `(marketing)/page.tsx` against the 10-section structure; tighten hero/proof/CTA hierarchy.
4. **Storybook (Phase 12)** — setup + stories for Button/Card/Badge/MetricCard/EmptyState/SportHero (the reusable core).
5. **Playwright critical flows (Phase 13)** — homepage loads, primary CTA, nav (incl. mobile drawer), a sport page, auth route.
6. **Per-page design-QA sweep (Phase 14)** + user-facing theme selector polish (Phase 3 of prompt #3).

All slices: provide **several switchable variations** before finalizing; **preview before launch**; **nothing auto-publishes**; tandem-safe pathspec commits.

---

## #2 — Admin-Dashboard / PublishingOS Rebuild (BACK-END): plan
**Already shipped (don't rebuild):** PublishingOS core (`lib/publishing/`, `/admin/publishing` with 3 switchable directions A/B/C, `/updates` override-aware, 37+ tests, `9c4677ea`).

Execution order (per prompt #2 parts 1–21):
1. **Admin-shell audit** — inventory every `/admin/*` route (academy/growth/research/video-studio/publishing/…) for consistent shell, header, nav, status vocab.
2. **PublishingOS UI polish** — bring the command center (Overview·Queue·Areas·Activity) to the prompt's UX bar across all 3 directions; Stitch-ideate the 6 admin screens (command center, areas audit, publish detail, SEO flow, sport-config flow, rollback) → Figma → implement.
3. **Publishable Areas Audit completeness** — fill the registry/readiness map for every admin-controlled surface (status labels: live-connected/draft-only/file-backed/mock/needs-integration/high-risk/ready).
4. **Wire remaining public reads** through overrides: `/dev-updates`, `/blog`, `/learn`, milestones, homepage modules (db-ready, not merged).
5. **Deploy-backed PR-job executor** (`PublishJob`) — currently a stub; GitHub-App abstraction, branch/commit/PR/deploy tracking, failure + rollback states (server-only secrets).
6. **Scheduling** (`scheduledFor`) cron executor.
7. **Security/observability/tests/docs** sweep per parts 12/15/16/17; **several admin-UI variations** to try before finalizing.

## #3 — Theme Lab + UI/UX Intelligence OS: plan
**Build ON the existing 7-theme `[data-theme]` engine + the PublishingOS durable-override + audit pattern. Do not replace the theme engine.** The 7 themes already map to the prompt's sample set (Standard, Dark Performance, Coach Mode, Heritage Club, Field & Court, Arcade Practice, + Bird Print).

Execution order (per prompt #3 phases):
1. **Theme registry** — wrap the existing themes in a registry with metadata (category/status/version/visibility/rollout/sport+page compat/scores) — `lib/theme-lab/registry.ts`.
2. **`resolveThemeForUser()`** — documented resolution hierarchy (forced override → user assignment → experiment → user preference → segment default → seasonal → global default → fallback) with deterministic percentage bucketing; thorough tests.
3. **Theme Lab admin** `/admin/theme-lab` — dashboard · library · builder (token editor over the existing CSS vars) · **preview** (across key journeys, no publish) · **publishing center** (admin-only/user/segment/%/sport/page/all) — reuse PublishingOS risk/validation/rollback/audit.
4. **Segmentation + experimentation/rollout** — reuse existing feature-flag infra; A/B variants, metrics, winner.
5. **Seasonal system** — Christmas Swing Lab as the sample (premium, reduced-motion-safe, scheduled, opt-in).
6. **Preference-learning + admin recommendation engine** — reuse existing analytics events; privacy-safe; "expand/pause/rollback/retire" recommendations.
7. **User-facing selector** polish (extends existing `ThemeSelector`) — lock / allow-seasonal / allow-recommended.
8. **Governance** — nothing auto-publishes; everything admin-gated with preview + confirmation + audit log + rollback. New themes can be generated **periodically into the library**, never auto-published.

---

## Workflow for every slice (both agents)
**Google Stitch** (ideation: several directions) → **Figma remote MCP** (`https://mcp.figma.com/mcp`, source of truth — pass explicit file/frame URLs, no live selection) → **Claude Code** (implement on shadcn/ui + Tailwind v4 tokens) → preview + **several switchable variations** → owner picks final. Keep the reserved status palette (emerald/amber/red/sky/violet); brand/theme accents sit outside it. Tandem-safe: explicit pathspec commits, never `-A`.
