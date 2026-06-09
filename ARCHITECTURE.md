# SwingVantage — Architecture

> The map a developer or AI agent needs before touching this codebase. The
> [README](README.md) is the feature catalogue; this is the *shape* of the system —
> how the layers fit, where data flows, and the conventions every change must follow.
> For setup-in-plain-English, owners should start at
> [docs/BEGINNER_START_HERE.md](docs/BEGINNER_START_HERE.md).

---

## 1. The one idea that explains everything: **keyless-first**

SwingVantage runs **fully with zero configuration**. Clone, `npm install`, `npm run dev` —
and every feature works, persisting to the browser. Databases, logins, live AI, email,
billing, and ads are **optional upgrades**: providing a key unlocks the real provider; the
absence of a key falls back to a local, honest, no-op mode. Nothing is ever faked or sent
off-device without a configured sink.

This is enforced in exactly one place — **[`apps/web/src/lib/capabilities.ts`](apps/web/src/lib/capabilities.ts)** —
the single source of truth for "is integration X configured?". `isConfigured()` treats the
documented `.env.example` placeholders (`your-…`, `change-me-…`, `none`, empty) as *not
configured*, so a copied-but-unedited `.env.local` never produces a false positive.

| Capability | Keyless default | Unlocked by |
|---|---|---|
| Auth / DB | browser-local store | `NEXT_PUBLIC_SUPABASE_URL` + anon key |
| AI Coach | deterministic local coaching | `AI_PROVIDER` + provider key |
| AI Vision / Pose | on-device MediaPipe | provider key (optional cloud) |
| OCR (launch-monitor screenshots) | manual entry | OCR provider key |
| Email | no-op | Resend SMTP |
| Billing | waitlist | Stripe keys |
| Ads | zero ads | `NEXT_PUBLIC_ADS_PROVIDER` + client id |
| Observability | local log / drop | Sentry (see §8) |

**Consequence for every change:** a new integration must be added to `capabilities.ts`,
default OFF, with a local fallback. Never make a feature hard-require a key.

---

## 2. Monorepo layout (Turborepo + npm workspaces)

```
swingiq/
├── apps/web/            # The Next.js 16 App-Router application (the product)
├── packages/
│   ├── core/            # @swingiq/core — pure, framework-free domain logic
│   ├── ui/              # shared UI primitives
│   └── config/          # shared tsconfig / lint config
├── server/              # SQL schemas + server-side helpers (Supabase)
├── scripts/             # Node CLI tooling, CI gates, git hooks, generators
└── docs/                # deep-dive docs, roadmaps, audits, runbooks
```

- **Build orchestration:** `turbo` (`npm run build`, `type-check`, `lint`, `test`).
- **Stack:** Next.js `^16` (App Router, React Compiler on), React `19`, TypeScript `^6`,
  Zustand `^5`, Supabase JS `^2`, Tailwind.
- **`@swingiq/core` resolution gotcha:** it resolves to **`src`** for `tsc`/Next, but to
  **`dist`** for Jest's runtime. Put new app-level code in `apps/web/src/lib` (path `@/lib`)
  unless it is genuinely framework-free domain logic that belongs in core. When a Jest
  runtime suite needs core, the compiled `dist` must exist.

---

## 3. `apps/web/src` — the application

```
src/
├── app/                 # App Router: routes, layouts, API handlers
│   ├── (app)/           # authed product surface (gated by middleware)
│   ├── (auth)/          # login / reset / confirm
│   ├── (marketing)/     # public marketing pages
│   ├── [lang]/          # localized marketing (es / fr)
│   ├── admin/           # admin "OS" surfaces — noindex, RBAC-gated
│   ├── api/             # 71 route handlers
│   ├── player/          # public shareable recruiting profile
│   ├── layout.tsx       # root layout (global counter banner, providers)
│   └── sitemap.ts       # curated trust-surface sitemap
├── components/          # React components
├── content/             # SEO pages registry, sport strategy, marketing copy
├── contexts/            # React contexts
├── data/                # committed JSON registries (auto-updates, features, setup, audits)
├── hooks/               # React hooks
├── lib/                 # 90+ domain modules (the brain — see §4)
├── store/               # the single Zustand store (slices) — see §5
├── instrumentation.ts          # server boot: env validation + onRequestError
├── instrumentation-client.ts   # browser: global error/rejection capture
└── middleware.ts        # auth gating + public-prefix allowlist
```

Route scale: **~302 pages, 71 API routes.** A large share of `admin/*` are internal
operating-system surfaces (GrowthOS, SearchIntelligenceOS, SecurityOS, BranchGuardianOS,
Central Intelligence, Coach Mix, Feature Education, Mission Control, Setup hub …).

---

## 4. `lib/` — the domain layer (the recurring pattern)

`lib/` holds 90+ modules. Almost all of them follow the **same shape**, and learning it once
explains the whole codebase:

```
lib/<feature>/
├── types.ts          # the domain model
├── <engine>.ts       # PURE functions: input → output, no I/O, no React
├── store.ts          # (optional) local-first Zustand persist overlay for human decisions
├── index.ts          # public surface
├── __tests__/        # pure-engine unit tests (project-local jest cache)
└── adapters/         # (optional) provider seams, keyless by default
```

**The invariant: the engine is pure.** It is fast, deterministic, testable, and powers live
render. Persistence, network, and React state are *separate, thin* layers wrapped around it.
This is why features work keyless — the engine never needs a key; only the adapter does.

**Honest data labelling.** Anything that could be mistaken for a verified number carries a
`DataSource` label (`real | estimated | imported | placeholder | mock`) surfaced in the UI via
`DataSourceBadge`. **Never fabricate** rankings, volumes, traffic, or backlinks. Estimated
values are labelled estimated.

**Compose, don't duplicate.** New "OS" modules reuse existing engines rather than rebuild.
Example: `SearchIntelligenceOS` (`lib/growth/search-intelligence`) composes the existing
`runLinkAgent()` from `lib/growth/link-intelligence` for the overlapping signals and only adds
net-new analysis on top. Audit-first: before building, check whether the capability already
exists (it very often does).

---

## 5. State management — one store, many slices

The client store is a single Zustand store at **`apps/web/src/store`**, split into slices:

```
store/slices/  agent · clubs · community · dailyNotes · equipment · importMappings
               onboarding · prioritySnapshots · profile · sessions · settings
               training · tutorial · video
```

- **Local-first:** the store persists to the browser and is the working source of truth.
- **Cloud sync (when Supabase is configured):** the account becomes the source of truth via
  the relational sync engine in `lib/db`, which mirrors the store to 14 relational tables.
- Feature-local decisions (dismiss/complete/status overlays in admin OS surfaces) use their
  own small `persist` stores rather than bloating the main store.

---

## 6. Routing, auth & the admin surface

- **`middleware.ts`** gates protected routes. In real-accounts mode (Supabase configured) it
  redirects unauthenticated users to `/login`. A `PUBLIC_PREFIXES` allowlist exempts public
  endpoints (e.g. `/api/audit`, `/api/research/run`). **Adding a public API route means adding
  its prefix here** — a frequent gotcha.
- **Admin is defense-in-depth:** `admin/*` routes inherit `robots: noindex, nofollow`, are
  RBAC-gated (`requireAdmin()` / permission checks like `devops.manage`, `security.manage`),
  and admin data accessors fail closed (`if (!(await requireAdmin()).ok) return empty`).
- **Admin tables use RLS-on / no-policy** = service-role only. See §7.

---

## 7. Data & security model

- **Supabase Postgres** with **Row-Level Security as the crown jewel.** Every user table is
  owner-scoped; admin tables have RLS enabled with no policy (service-role only). SQL schemas
  live in `server/*.sql` and `apps/web/*.sql`.
- **CI gate — [`scripts/check-rls.mjs`](scripts/check-rls.mjs):** fails the build if any
  `create table public.<x>` ships without a matching `enable row level security` (understands
  both explicit `alter table … enable row level security` and the `format()` array-loop
  pattern). Wired into `security:all` and the Security Audit workflow. A genuinely-safe table
  goes in the script's `ALLOWLIST` with a reason — it cannot silently skip RLS.
- **Secrets** never reach the client; only the boolean capability summary does
  (`/api/capabilities`). Server-only capability checks read secret env vars and must only run
  server-side.
- Other hardening (constant-time secret compare, fail-closed middleware, distributed rate
  limiting, trusted client-IP, JSON-LD escaping, CSP, AI-spend kill-switch) is documented in
  [docs/SECURITY_AUDIT_2026-06.md](docs/SECURITY_AUDIT_2026-06.md) and [SECURITY.md](SECURITY.md).
- **`.github/CODEOWNERS`** requires owner review for sensitive paths (workflows, API routes,
  middleware, `lib/security/*`, `next.config.mjs`, all `*.sql`, `check-rls.mjs`, admin routes).

---

## 8. Observability (the Sentry seam)

Error reporting is **provider-agnostic and already wired** — there is *no hard SDK dependency*:

- `instrumentation.ts` (`onRequestError`) and `instrumentation-client.ts` (global
  `error`/`unhandledrejection` listeners) forward every error to
  `lib/observability/report.ts → reportError()`.
- `reportError()` delivers to whatever sink is configured and is otherwise a safe no-op (logs
  in dev, drops in prod). **To activate Sentry:** install `@sentry/nextjs`, init it, and set the
  single global `globalThis.__svCaptureException = Sentry.captureException` (or expose
  `window.Sentry`). No core files change. See [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md).

This is why the roadmap treats "wire Sentry" as an owner-key + small-dependency step, not an
architectural change — the application code is already calling the seam everywhere.

---

## 9. Tooling, CI & automation

- **`scripts/`** holds the CI gates and generators, run via root `package.json`:
  `check:rls`, `check:naming`, `validate:seo`, `check:duplicate-content`,
  `check:sitemap:coverage`, `security:all`, plus registry generators (features / setup /
  audits / updates / social) and the worktree helper (`npm run wt`).
- **GitHub Actions:** Growth CI, Tests (Jest + Playwright), **Security Audit**
  (Gitleaks · npm-audit · ESLint · custom checks · **RLS gate**), and CodeQL (default setup).
  ESLint v9 flat config lives in `apps/web/eslint.config.mjs`, so lint runs with `apps/web` as
  CWD (`cd apps/web && npx eslint src`).
- **Git hooks (`scripts/hooks/`):** `post-commit` turns `Update:` / `Dev-Update:` commit
  trailers into `/updates` entries (explicit pathspec, never `-A`, never pushes, fails open).
  Per-commit registry refreshes are **opt-in** behind `SWINGVANTAGE_REGISTRY_AUTOCOMMIT` to
  avoid noisy chore commits and JSON races. `pre-push` runs the sitemap-coverage gate.

---

## 10. Conventions every change must follow

1. **Keyless-first.** New integrations go through `capabilities.ts`, default OFF, local
   fallback. Never hard-require a key.
2. **Audit before building.** Most "new" capabilities already exist — compose, don't rebuild.
3. **Pure engine, thin shells.** Domain logic is side-effect-free and unit-tested; I/O lives
   in adapters/stores.
4. **Honest data.** Label every uncertain value with a `DataSource`; never fabricate metrics.
5. **Security defaults.** New `public` table → RLS (or allowlist with reason). New public API
   route → `middleware.ts` `PUBLIC_PREFIXES`. Sensitive path → CODEOWNERS.
6. **Concurrency-safe git.** Multiple agents share one working tree and index. **Never**
   `git add -A` / `git commit -a` — stage explicit paths and commit with a pathspec
   (`git commit -m "…" -- path1 path2`), then verify with `git show --stat HEAD`. Prefer a
   worktree (`npm run wt`). Never skip hooks or force-push. See [CLAUDE.md](CLAUDE.md).
7. **Admin = noindex + RBAC + fail-closed.** New admin surfaces inherit the guard; data
   accessors return empty when `requireAdmin()` fails.

---

## 11. Where to look next

| You want to… | Go to |
|---|---|
| Get the app running (plain English) | [docs/BEGINNER_START_HERE.md](docs/BEGINNER_START_HERE.md) |
| See the full feature catalogue | [README.md](README.md) |
| Understand the agent/contributor rules | [CLAUDE.md](CLAUDE.md) |
| Review the security posture | [SECURITY.md](SECURITY.md) · [docs/SECURITY_AUDIT_2026-06.md](docs/SECURITY_AUDIT_2026-06.md) |
| Turn on error tracking | [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md) |
| See performance decisions | [docs/PERFORMANCE.md](docs/PERFORMANCE.md) |
| See the prioritized improvement plan | [docs/ROADMAP.md](docs/ROADMAP.md) |
