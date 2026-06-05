# Architecture Decisions

This document explains the major technical choices made when building SwingIQ and why each decision was made. It's written for developers joining the project, and also for the owner to understand why the app works the way it does.

## 📘 In Plain English (start here)

**What this page is:** A record of the big "what is SwingIQ built with, and why" choices — like which website tool, which database, and which AI service it uses.

**What you actually need to know:**
- SwingIQ is built out of popular, mainstream tools that lots of people know. That's on purpose: it makes the app cheaper to host, easier to get help with, and more likely to keep working for years.
- You are not locked in to any single company. The app is built so the AI provider, the database, and even the website framework can be swapped later if needed.
- Nothing on this page is a task for you. It's the "why it's built this way" background.

**What to do next:** Nothing is required. If you're curious, read the bold **Decision** and **Why** lines in each section — you can safely skip the code boxes. If you ever hire a developer or ask an AI assistant for help, point them here first; it gets them up to speed fastest.

> Everything below this point is technical background for a developer or an AI assistant helping you. You don't need to read or understand it to use or run SwingIQ.

---

## How to Read This Document

Each section follows this format:
- **Decision:** What was chosen
- **Why:** The reason it was chosen over alternatives
- **Trade-offs:** What you give up by making this choice
- **How to change it later:** If the choice needs to be revisited

---

## 1. Framework: Next.js 14 (App Router)

**Decision:** The web app is built with Next.js 14 using the App Router.

**Why:**
- Next.js is the most popular React framework for production apps
- The App Router supports both server-rendered pages (good for SEO) and interactive client components
- Vercel (the deployment platform) is made by the same company as Next.js, so deployment is seamless
- Strong TypeScript support, which catches errors before users see them

**Trade-offs:**
- More complex than a simple React app
- Requires some understanding of server vs. client components
- App Router is newer and has fewer tutorials than the older Pages Router

**How to change it later:** Migrating to another framework (Remix, Astro, etc.) would require rewriting routes — significant work. The core logic in `packages/core` is framework-independent.

---

## 2. Monorepo Structure: Turborepo

**Decision:** The project is organized as a monorepo using Turborepo, with apps and packages.

**Why:**
- The diagnostic engine (`packages/core`) is shared between the web app and any future mobile/desktop app
- TypeScript types defined once in `packages/core` are used everywhere — no duplication
- Turborepo caches build artifacts, making repeated builds faster

**Structure:**
```
apps/
  web/       ← The Next.js web app (the main product)
packages/
  core/      ← Shared TypeScript: types, diagnostics, sport configs, scoring
  config/    ← Shared configuration (sport metadata, SEO configs)
  ui/        ← (Reserved) Shared UI components
```

**Trade-offs:**
- Slightly more setup complexity than a single-repo app
- Requires understanding which code lives in apps vs. packages

**How to change it later:** If you ever remove the mobile app or stop needing shared packages, you could simplify to a single Next.js project.

---

## 3. State Management: Zustand with localStorage

**Decision:** All user data (sessions, profile, equipment, settings) is stored in a Zustand store that persists to the browser's localStorage.

**Why:**
- Users can use the app without an account — no friction at first use
- localStorage is built into every browser — no server needed until Supabase is connected
- Zustand is small, fast, and TypeScript-friendly
- The export/import backup system means users can move their data between devices

**Trade-offs:**
- Data is tied to one browser/device until Supabase sync is enabled
- If a user clears their browser data, their sessions are lost (the backup system mitigates this)
- localStorage has a ~5MB limit — users with thousands of sessions may hit this

**Planned migration path:**
- When Supabase is connected, swap the `createJSONStorage(() => localStorage)` adapter for a Supabase-backed storage adapter
- The store structure is intentionally designed to map directly to the Supabase schema

---

## 4. Database: Supabase (PostgreSQL)

**Decision:** The database is PostgreSQL via Supabase.

**Why:**
- PostgreSQL is the most reliable open-source database, used by companies like Shopify and GitHub
- Supabase provides a managed PostgreSQL instance + authentication + storage + real-time in one service
- Row Level Security (RLS) means users can only access their own data — enforced at the database level
- Supabase has a generous free tier for early-stage apps
- If Supabase ever shuts down, the database is standard PostgreSQL that can be exported

**Trade-offs:**
- Requires setup before auth and sync features work
- Not free at scale (but competitively priced vs. alternatives)

**How to change it later:** The database schema is in `server/supabase_schema.sql`. The queries are isolated in `apps/web/src/lib/supabase.ts` and `supabase-server.ts`. Swapping providers means updating those files.

---

## 5. AI Provider: Provider-Independent Architecture

**Decision:** AI coach functionality is built to be provider-independent. The prompt builder in `apps/web/src/lib/ai-coach-prompts.ts` is separate from the actual API call.

**Why:**
- AI provider landscape changes rapidly (OpenAI, Anthropic, Google Gemini, etc.)
- Prices and capabilities shift frequently
- No single provider is locked in — just set the `AI_PROVIDER` environment variable

**Structure:**
```
ai-coach-prompts.ts  → builds the prompt (no AI calls)
api/ai-coach/route.ts → makes the actual API call (swappable)
```

**Current support:** OpenAI GPT-4 and Anthropic Claude (set via `AI_PROVIDER` env var)

**How to change it later:** Add a new case to the `AI_PROVIDER` switch statement in `apps/web/src/app/api/ai-coach/route.ts`.

---

## 6. Sport System: Centralized Config Registry

**Decision:** All sport-specific logic (phases, benchmarks, drills, equipment types, camera guidance) is registered in `packages/core/src/sports/sport-registry.ts`.

**Why:**
- Without this, sport-specific code gets scattered across dozens of files
- Adding a new sport (e.g., pickleball) only requires adding one config file and registering it
- Components read from the registry instead of using if/else sport checks

**Supported sports and IDs:**
| Sport | ID |
|-------|-----|
| Golf | `golf` |
| Tennis | `tennis` |
| Baseball | `baseball` |
| Slow Pitch Softball | `softball_slow` |
| Fast Pitch Softball | `softball_fast` |

**How to add a new sport:** 
1. Create `packages/core/src/sports/[sport-name]/` directory
2. Add phases, benchmarks, and analysis files
3. Register the sport in `sport-registry.ts`
4. Add the sport to the `SportId` type in `packages/core/src/sports/types.ts`

---

## 7. Data Portability: Versioned Backup Schema

**Decision:** User data can be exported as a versioned JSON backup and imported on any device.

**Why:**
- Users should own their data — they shouldn't be locked into one browser
- If the app resets or crashes, users can restore from backup
- Builds trust: "you can always get your data out"

**Schema versioning:**
```
v1.0.0 → v1.1.0 → v1.2.0 (current)
```
Each version migration is handled in `apps/web/src/lib/backup/migrate.ts`.

**Structure of a backup file:**
```json
{
  "backupFormat": "swingiq-backup-v1",
  "backupVersion": "1.2.0",
  "schemaVersion": "1.2.0",
  "exportedAt": "2025-05-01T12:00:00Z",
  "data": { ... all user data ... },
  "metadata": { ... counts and summaries ... }
}
```

**How to change it later:** Add a new migration function in `migrate.ts` for each schema change. Never break older backup files.

---

## 8. Internationalization (i18n): Custom Translation System

**Decision:** A custom lightweight i18n system lives in `apps/web/src/lib/i18n/`.

**Why:**
- The major i18n libraries (next-intl, i18next) added significant bundle size and complexity
- SwingIQ's translation needs are manageable with a simple key-value system
- Each language is a TypeScript object, so TypeScript catches missing translation keys

**Supported languages:** 20 languages including English, Spanish, French, German, Portuguese, Italian, Dutch, Japanese, Korean, Chinese (Simplified), Chinese (Traditional), Hindi, Arabic, Turkish, Vietnamese, Tagalog, Polish, Thai, Indonesian, Urdu.

**RTL support:** Arabic and Urdu automatically set `dir="rtl"` on the HTML body.

**Trade-offs:**
- URL-based routing (e.g., `/es/dashboard`) is not implemented — the language preference is stored in user settings
- Professional-quality translations are placeholders — real translations by native speakers are needed for non-English languages

---

## 9. Styling: Tailwind CSS

**Decision:** All styles use Tailwind CSS utility classes.

**Why:**
- Tailwind is the industry standard for utility-first CSS
- No CSS files to manage — all styles are in the component files
- The design system is defined in `apps/web/tailwind.config.ts` (custom colors, fonts)
- Very fast to develop with once you learn the class names

**Custom colors defined:**
- `golf-dark` — the dark green sidebar background
- `golf-fairway` — the lighter green for active states and accents

**Trade-offs:**
- HTML can look verbose with many class names
- Requires Tailwind knowledge to modify designs

---

## 10. Video Processing: Client-Side Only

**Decision:** Video files never leave the user's browser. Only metadata and analysis results are sent to the server.

**Why:**
- Video files are large (100MB+) — uploading to a server is slow and expensive
- Privacy: the user's swing videos stay on their device
- No server storage costs for video
- The pose estimation and frame analysis runs in the browser using JavaScript

**Trade-offs:**
- Cannot run advanced computer vision server-side yet
- Analysis quality depends on the quality of pose data the browser can extract
- No permanent cloud backup of videos

**Planned future enhancement:** When Supabase Storage is connected, offer optional video cloud backup as a premium feature.

---

## 11. Authentication: Keyless-First, with Optional Supabase Auth

**Decision:** SwingIQ is keyless by default — anyone can start immediately and their data is saved privately on their own device. Supabase Auth is wired in and activates automatically when Supabase env keys are present, for users who want an account and cloud sync.

**Current state:**
- You can open SwingIQ and use it with no account; data lives on-device (localStorage) by default
- Login, signup, and password-reset pages are functional; the Supabase client initializes in `apps/web/src/lib/supabase.ts`
- When Supabase env keys are set, session middleware activates and API routes verify identity server-side (IDOR protection is in place on the data routes)
- Cross-device portability without an account is available today via Backup & Restore

**Auth flow (when enabled):**
1. User signs up with email + password (or OAuth)
2. Supabase creates a user record
3. The Zustand store syncs to Supabase on login
4. Row Level Security (SQL ready to apply) ensures each user only sees their own data

**How to connect:** Follow the steps in `docs/OWNER_TASKS.md` for Supabase setup.

---

## 12. Testing Strategy

**Decision:** Unit and integration tests are written with Jest and React Testing Library.

**Test files are located at:**
- `apps/web/src/lib/backup/__tests__/` — backup system tests
- `apps/web/src/lib/community/__tests__/` — community/gamification tests
- `apps/web/src/lib/tutorial/__tests__/` — tutorial system tests
- `packages/core/src/sports/sports.test.ts` — sport engine tests

**Run tests:** `npm test` from the repo root

**What is NOT tested:**
- Visual/UI tests (Playwright or Cypress would be needed)
- End-to-end user flows
- The AI coach API (mocking OpenAI/Anthropic responses)

---

## 13. SEO Architecture

**Decision:** Sport-specific landing pages are static routes that are server-rendered for search engines.

**Key SEO pages:**
- `/golf-swing-analysis` — targets "free AI golf swing analyzer"
- `/tennis-swing-analysis` — targets "AI tennis swing analysis"
- `/baseball-swing-analysis` — targets "AI baseball swing analyzer"
- `/softball-swing-analysis` — targets "AI softball swing analysis"
- `/faq` — structured FAQ for voice search / AI answers
- `/glossary` — sports terminology for long-tail SEO
- `/blog` — educational content hub
- `/benchmarks/[sport]` — data-rich pages that attract backlinks

**Metadata pattern:** Each page has its own `metadata` export with title, description, and Open Graph data.

---

## 14. Motion Lab: Canvas 3D Viewer + On-Device 3D Engine

**Decision:** The Motion Lab 3D feature renders its skeleton with a dependency-free **2D-canvas 3D projection** (not Three.js / React Three Fiber), and computes 3D from the user's own clips **on-device** — a trained single-view depth model plus a two-camera triangulation path — rather than calling a cloud 3D service.

**Why:**
- Adding Three.js / R3F to a React 19 / Next 16 app is a heavy dependency with real build/peer-version risk; the canvas renderer is robust, fast, and ships **zero** new packages
- All processing stays on-device, preserving the privacy posture (the original video never leaves the browser)
- Two-camera triangulation is genuine **measured** 3D from classical geometry; the single-view model is honestly labeled an **estimate**
- A clean provider seam (`lib/pose3d/providers.ts`) lets a future ONNX model fine-tuned on real motion-capture drop in without touching the UI

**Trade-offs:**
- The canvas renderer is hand-rolled rather than using a mature 3D library's materials/lighting
- The single-view depth model is trained on synthetic projections, not real mocap — a useful prior, not lab-grade
- Two-camera mode requires the user to film the same rep from two angles

**How to change it later:** Swap the canvas viewer for a Three.js/R3F component (the pose track is the contract), and/or register an ONNX `Lift3DProvider` trained on Human3.6M/AMASS. Both paths are documented in `docs/pose3d.md`; the engine (`lib/pose3d`) and pipeline (`lib/motion-lab`) stay unchanged. An **opt-in cloud pose adapter** now exists behind the same `PoseProvider` seam (`lib/motion/adapters`, `NEXT_PUBLIC_POSE_CLOUD_URL`) — on-device stays the privacy-first default and the cloud path is off unless an operator configures it.

---

## Key Files Quick Reference

| File | Purpose |
|------|---------|
| `apps/web/src/store/index.ts` | All user state (profile, sessions, equipment, settings) |
| `apps/web/src/lib/backup/` | Export, import, migrate, validate backup data |
| `packages/core/src/sports/sport-registry.ts` | Central sport configuration registry |
| `apps/web/src/lib/i18n/` | Internationalization system (20 languages) |
| `apps/web/src/lib/community/` | Gamification, badges, XP, challenges |
| `apps/web/src/lib/tutorial/` | Contextual help and tutorial system |
| `apps/web/src/lib/motion-lab/` | Motion Lab 3D pipeline (phases, metrics, scoring, report, drills, multiview) |
| `apps/web/src/lib/pose3d/` | Proprietary 3D engine (triangulation, self-calibration, trained lift model) |
| `apps/web/src/lib/ai-coach-prompts.ts` | AI coach prompt builder (provider-independent) |
| `apps/web/src/app/api/` | Server-side API routes (AI coach, video analysis, export/import) |
| `server/supabase_schema.sql` | Full database schema |
| `docs/OWNER_TASKS.md` | Step-by-step owner setup guide |

---

*Last updated: June 2026 | See also: `docs/BACKUP_SYSTEM.md`, `docs/IMPLEMENTATION_NOTES.md`, `docs/motion-lab.md`, `docs/pose3d.md`*
