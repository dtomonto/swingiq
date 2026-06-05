# SwingVantage — Implementation Notes

*Last updated: 2026-06-05. This document is maintained alongside the codebase.*

---

## 📘 In Plain English (start here)

**What this page is:** A quick technical "map" of the project — what each part is built with, where every page lives, and the commands a developer runs.

**What you actually need to know:**
- This is a reference sheet for a developer or an AI assistant, not a to-do list for you.
- One useful fact for you: right now the app saves everything **in your browser** and works fully **without a database**. It only needs the Supabase database once you want accounts, logins, and syncing across devices.
- If something here ever contradicts what you see in the app, trust the app — this is a snapshot that can drift over time.

**What to do next:** Nothing. If you bring in a developer or ask an AI assistant for help, hand them this page and they'll understand the whole project in a few minutes.

> Everything below this point is a technical reference for a developer or an AI assistant. You don't need to read it to use or run SwingVantage.

---

## Architecture Summary

SwingVantage is a **Turborepo monorepo** with the following workspaces:

| Workspace | Path | Purpose |
|-----------|------|---------|
| `@swingiq/web` | `apps/web` | Next.js 15 web app — primary product |
| `@swingiq/core` | `packages/core` | Shared TypeScript: types, diagnostic engine, training routines, CSV normalizer, scoring |
| `@swingiq/config` | `packages/config` | Shared ESLint/TS config |
| `server` | `server/` | Supabase PostgreSQL schema (not yet applied) |

---

## Framework & Routing

- **Framework:** Next.js 15 (App Router)
- **React version:** React 19
- **TypeScript:** Yes, strict mode across all packages
- **Routing:** App Router (`apps/web/src/app/`) — file-based routing
- **Styling:** Tailwind CSS 3 + Radix UI primitives + class-variance-authority
- **State:** Zustand with `persist` middleware (localStorage)
- **Data fetching:** TanStack React Query for any server-fetched data

---

## Route Structure

### Public marketing routes (no auth required)
```
/                          Homepage
/how-it-works              4-step explainer
/golf-swing-analysis       Golf-specific SEO landing page
/tennis-swing-analysis     Tennis-specific SEO landing page
/baseball-swing-analysis   Baseball-specific SEO landing page
/softball-swing-analysis   Softball-specific SEO landing page (covers both slow/fast)
/faq                       Consolidated FAQ (AEO/GEO content)
/parents                   Youth athlete / parent safety page
/pricing                   Pricing page
/updates                   Public changelog
/trust                     Trust & Safety page
/privacy                   Privacy Policy
/terms                     Terms of Service
/login                     Optional Supabase auth — sign in
/signup                    Optional Supabase auth — sign up
/forgot-password           Optional Supabase auth — password reset
```

### App routes (keyless by default; require auth only when Supabase is connected)
> SwingVantage uses keyless local accounts by default — these routes work with no sign-in, storing data on-device. They become auth-gated only when Supabase auth keys are present.
```
/dashboard                 Sport-aware dashboard (golf vs non-golf)
/profile                   Sport-specific profile form
/equipment/[sport]         Per-sport equipment (golf bag + loft gapping); old /bag → /equipment/golf
/sessions                  Session history
/sessions/import           CSV import wizard (golf) / session log (other sports)
/sessions/import/image     Image/screenshot import
/sessions/log              Manual session log (non-golf)
/diagnose                  Diagnostic engine UI
/training                  Training routine generator
/fix                       Fix Stack — highest-impact issue → feel cue + best-matched drill + retest
/practice                  Practice schedule
/pre-round                 Pre-round / pre-game warm-up
/video                     Video analysis (sport-aware)
/motion-lab                Motion Lab — browser 3D motion analysis (all sports; lib/motion-lab, lib/pose3d)
/agi                       Athlete GI — cross-sport keystone reasoning + plan (lib/agi, components/agi)
/coach                     Coach & Team — local-first roster over Motion Lab sessions (lib/motion-lab/roster)
/drills                    Drill library
/equipment                 Equipment hub (all sports)
/progress                  Progress tracking
/arc                       Player Arc — improvement narrative, flaw fingerprint, retest outcomes
/labs                      SwingVantage Labs — readiness, player model, skill transfer, performance graph, benchmark mirrors
/retest                    Retest hub — due reminders + directional before/after reads
/milestones                Milestones tracker
/community                 Community hub — badges, XP, challenges, groups, leaderboards
/compare                   Session comparison / professional references
/ai-coach                  AI coaching chat
/reports                   Session reports
/avatar                    Swing avatar visualizer
/data                      Data Center — backup, restore, export
/settings                  App settings
/settings/backup           Backup & Restore
/admin/research            Admin: research benchmark viewer
```

### API routes
```
/api/ai-coach              Claude/OpenAI coaching narrative endpoint
/api/research/*            Research benchmark management
/api/user/export           Data export endpoint
/api/user/import/preview   Import preview endpoint
/api/user/import/restore   Import restore endpoint
/api/video-analysis        Video analysis endpoint
```

---

## Storage Model

**Current state: local-first (no database required)**

| Layer | Technology | Status |
|-------|-----------|--------|
| Primary storage | Zustand + localStorage (via `persist`) | Active |
| Database | Supabase PostgreSQL | Schema written, NOT yet applied |
| Auth | Supabase SSR auth (`@supabase/ssr`) | Middleware wired, passes through without env vars |
| Backup/restore | Custom JSON export/import with AES-256-GCM encryption | Active |

**Supabase activation:** When the owner adds `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `apps/web/.env.local`, the middleware will enforce Supabase auth on all protected routes.

**Data abstraction:** `apps/web/src/lib/backup/` contains `export.ts`, `restore.ts`, `validate.ts`, `schema.ts`, `crypto.ts` — a complete local-first data safety layer ready to swap to a cloud backend.

---

## Package Manager & Commands

**Package manager:** npm (workspace-aware via `package.json > workspaces`)  
**Build tool:** Turborepo

```bash
# From repo root:
npm install               # Install all workspace dependencies
npm run dev:web           # Start Next.js dev server (apps/web)
npm run build             # Build all workspaces
npm run lint              # Lint all workspaces
npm run type-check        # TypeScript typecheck all workspaces
npm run test              # Run tests (if configured)
npm run security:deps     # npm audit (critical level)
npm run security:check    # Custom security check script
npm run security:all      # Run all security checks

# From apps/web:
npm run dev               # Next.js dev server
npm run build             # Next.js build
npm run lint              # ESLint
npm run type-check        # TypeScript noEmit
```

---

## Authentication & Authorization

- Auth is **Supabase SSR** (`createServerClient`) via `apps/web/src/middleware.ts`
- Without Supabase env vars: middleware passes all traffic through (dev mode)
- With Supabase env vars: all routes NOT in `PUBLIC_PATHS` redirect to `/login`
- `PUBLIC_PATHS` includes all marketing, SEO, legal, and informational pages
- Protected routes: all `/dashboard`, `/sessions`, `/diagnose`, `/training`, etc.

---

## Sport Support

All 5 sports are supported with independent diagnostic engines in `packages/core/src/sports/`:

| Sport | ID | Diagnostic Issues | Notes |
|-------|----|------------------|-------|
| Golf | `golf` | 24 categories | Full launch monitor support |
| Tennis | `tennis` | 24 categories | Phase-by-phase analysis |
| Baseball | `baseball` | 24 categories | Exit velocity, launch angle, bat speed |
| Slow Pitch Softball | `softball_slow` | 24 categories | Arc timing, line-drive path |
| Fast Pitch Softball | `softball_fast` | 24 categories | Compact launch, quick timing |

Sport context is stored in `localStorage` key `swingiq_active_sport` and managed by `apps/web/src/contexts/SportContext.tsx`.

---

## Security Architecture

- **Security headers:** Configured in `apps/web/next.config.mjs` — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CORP, COOP
- **GitHub Actions:** `.github/workflows/security-audit.yml` (dependency audit, lint, typecheck, build) and `.github/workflows/codeql.yml` (weekly CodeQL analysis)
- **Secret scanning:** `.gitleaks.toml` config for Gitleaks
- **Source maps:** Disabled in production (`productionBrowserSourceMaps: false`)
- **Dependabot:** `.github/dependabot.yml` should be checked for currency

---

## SEO / GEO / AEO Architecture

- **Metadata:** Per-page `export const metadata` in each App Router page
- **Canonical URLs:** `alternates.canonical` set on all public pages
- **Open Graph:** `openGraph` block on all public pages
- **Structured data:** JSON-LD `WebApplication` + `FAQPage` on homepage; `FAQPage` on `/faq`; `BreadcrumbList` — TBD
- **Sitemap:** `apps/web/src/app/sitemap.ts` — Next.js dynamic sitemap at `/sitemap.xml`
- **robots.txt:** `apps/web/public/robots.txt` — allows public pages, blocks app/admin/API routes
- **llms.txt:** `apps/web/public/llms.txt` — plain-text summary for AI crawlers

---

## Known Risks & Constraints

| Risk | Severity | Notes |
|------|----------|-------|
| Supabase not connected | Medium | App runs in local-only mode until env vars are added |
| No sitemap submission | Medium | Sitemap exists but must be submitted to Search Console manually |
| Privacy/Terms are placeholder | High before commercial launch | Attorney review required |
| Single-camera estimates labeled as such | Low | On-device MediaPipe pose + the `lib/pose3d` engine are real (Motion Lab); single-view output and the legacy video analyzer's issue detection stay labeled "estimated/heuristic" — honest by design |
| Equipment catalog is empty | Medium | Equipment section exists but has no manufacturer data yet |
| No automated E2E tests | Medium | No Playwright/Cypress — routing tested manually |
| Mobile app (React Native) | Low | `apps/mobile` directory exists but is not the focus — web-first |

---

## Implementation Decisions

1. **Local-first by default:** All user data stays in localStorage until Supabase is connected. This was a deliberate privacy-first choice.
2. **Backup/restore without auth:** Export and import work without any account — critical for local-first data safety.
3. **Heuristic labels everywhere:** Every AI or estimated output is labeled with "estimated" or "heuristic" to avoid false confidence.
4. **No native mobile app:** The `apps/mobile` workspace exists for reference but the product is web-first / PWA.
5. **Middleware pass-through in dev:** The middleware gracefully passes all traffic when Supabase env vars are absent — safe for local development.

---

## Deferred Items

- Supabase cloud sync (schema written; optional auth wired, sync/storage activation pending)
- Equipment catalog with manufacturer data
- E2E test suite (Playwright recommended)
- Usage category / youth safety onboarding flow
- Server-side OCR provider key for image-import auto-extraction (service is live; falls back to manual entry without a provider)
- ONNX single-view depth model fine-tuned on real motion-capture (provider seam ready in `lib/pose3d`)
- Professional reference video **verification** (32 seeded profiles exist; YouTube IDs pending admin verification)
- Google Search Console + Bing Webmaster setup (manual, requires production domain)
- Custom analytics event instrumentation (Vercel Analytics wired; event taxonomy in `docs/analytics-events.md`)

> **Now shipped (previously deferred):** on-device pose + 3D Motion Lab (`lib/motion-lab`, `lib/pose3d`), the professional reference library, AES-256-GCM encrypted backup, and the Fix Stack / Player Arc / SwingVantage Labs coaching layer.
