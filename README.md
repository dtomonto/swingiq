# SwingIQ — AI Swing Performance Platform

A production-grade, web-based AI swing development platform for **golf, tennis, baseball, slow pitch softball, and fast pitch softball**.

Web-first. Mobile-optimized. No app store required. Works on any phone, tablet, or desktop browser.

---

## What SwingIQ Does

Switching your active sport changes the **entire product experience** — dashboard, profile, sessions, training, drills, AI coaching, warm-up, reports, milestones, comparison, and more.

| Sport | Primary Data Source | What You Get |
|---|---|---|
| ⛳ Golf | Launch-monitor CSV or image screenshot | Diagnosis, scores, club gapping, loft autofill, stroke savings, training routines |
| 🎾 Tennis | Video analysis | Stroke phase breakdown, 24 issue categories, drill plan |
| ⚾ Baseball | Video + manual entry | Swing phase analysis, 24 issue categories, drill plan |
| 🥎 Slow Pitch Softball | Video + manual entry | Arc-timing analysis, 24 issue categories, line-drive coaching |
| 🥎 Fast Pitch Softball | Video + manual entry | Compact swing analysis, 24 issue categories, reaction timing |

---

## Feature Overview

### 🏠 Dashboard
Sport-specific dashboard that changes completely when you switch sports.
- **Golf:** Diagnosis card, stroke savings, Player DNA, club gap analysis, daily drill, practice reminder
- **Non-golf:** Primary issue from video analysis, recent analyses, setup progress, AI Coach CTA

### 👤 Profile
Five distinct profile forms — one per sport. No golf fields appear when analyzing a baseball swing.

### 📊 Sessions
- Filtered by active sport by default with "All Sports" toggle
- Golf: imports from launch monitor CSV
- All sports: screenshot/image import from performance tables (FlightScope, TrackMan, HitTrax, Rapsodo, Blast Motion, etc.)
- Non-golf: manual session logging or video upload

### 🎬 Video Analysis
Sport-aware video analyzer with phase-by-phase coaching for all five sports.
- Sport-specific camera angle selector
- Issue detection with severity labels (Critical / Notable / Minor / Watch)
- All detections labeled as heuristic estimates — honest confidence labels throughout

### 🔍 Swing Diagnosis (Golf)
- Diagnostic engine evaluates 24 issue categories against validated benchmarks
- Face control, path, low point, strike quality, spin, launch, and dispersion
- Shot dispersion chart, stroke savings potential, benchmarks by club type

### 🏌️ Smart Golf Bag & Loft Autofill
- 25+ club types supported (driver through putter)
- Loft autofills from 30+ model-specific manufacturer specs on club selection
- Falls back to evidence-based generic defaults when model is unknown
- Shows loft source and confidence label (manufacturer spec / generic default / custom)
- Manual override with "Reset to default" option
- **Loft Gapping view** — color-coded gap analysis with recommendations

### 📸 Screenshot / Image Import
- Upload photos or screenshots of performance tables from any device
- Supports FlightScope, TrackMan, Foresight, HitTrax, Rapsodo, Blast Motion, Zepp, spreadsheets, and more
- Manual review and edit before any data is saved — no unreviewed OCR output is ever analyzed
- Auto-extraction coming in a future release; manual entry available now

### 🏋️ Training
- Golf: interactive drill checklist based on active diagnosis, training effectiveness tracker
- Non-golf: drill checklist sourced from sport-specific drill library, filtered to primary video issue

### 📅 Practice Schedule
Generates a personalized 7-day practice week based on diagnosis and frequency preference.

### ☀️ Pre-Round / Pre-Game Warm-Up
- Golf: pre-round warm-up routine tailored to active diagnosis
- Tennis/Baseball/Softball: full sport-specific warm-up checklist with coaching cues

### 📹 Drill Library
- 80+ drills across all five sports
- Defaults to active sport's drills
- Searchable and filterable by difficulty
- "Recommended for Your Swing" card based on active diagnosis

### 📈 Progress Tracker
- Golf: score trend chart, ball data trends, personal bests, handicap estimate
- Non-golf: video analysis score sparkline, recurring issue frequency chart

### 🏆 Milestones
Sport-specific achievement system across all five sports.

### 🤖 AI Coach
Five sport-specific system prompts — grounded in your actual data. Never invents measurements.

### 📋 Reports
Sport-aware coach report generator. Copy a formatted summary to share with your coach.

### 🎥 Professional Swing Reference Library & Side-by-Side Comparison
- Browse 32 seeded professional athlete profiles across 5 sports (all pending admin verification)
- Filter by sport, sex, movement type, handedness, and style tags
- Preview reference detail with YouTube search fallback (privacy-enhanced embeds for verified videos)
- Side-by-side comparison: your video on the left, professional reference on the right
- Sport-specific phase checklist and honest limitation notice
- All unverified entries clearly marked — no fake YouTube IDs

### 💾 Backup & Restore
- Full data backup: all sports, all profiles, sessions, video analyses, drills, settings
- Download as `swingiq-backup-YYYY-MM-DD.json` or `.swingiqbackup` (encrypted)
- **Optional password-based encryption** (AES-256-GCM, PBKDF2, 310k iterations — no external dependencies)
- Restore modes: **Merge** (add to current) or **Replace** (overwrite with confirmation)
- Smart duplicate detection (by ID and by sport + date + source)
- Multi-device portability — backup on iPad, restore on iPhone
- Found at **Settings → Backup & Restore**

### 🔒 Security
- Security headers on every response (CSP, HSTS, X-Frame-Options, etc.)
- Source maps disabled in production
- Supabase session middleware (activates when env keys are set)
- Admin routes protected by `ADMIN_SECRET` environment variable
- Rate limiting on all AI and video analysis endpoints
- Automated CI security pipeline (Gitleaks, npm audit, CodeQL, custom scanner)

---

## Architecture

```
swingiq/
├── apps/
│   └── web/                    # Next.js 15 App Router — mobile-optimized
│       ├── public/             # robots.txt, manifest
│       └── src/
│           ├── app/            # 35+ routes
│           │   ├── (app)       # dashboard, profile, sessions, video, training…
│           │   ├── compare/    # Professional references + side-by-side comparison
│           │   ├── settings/backup/  # Backup & Restore
│           │   ├── sessions/import/image/  # Screenshot/image import wizard
│           │   ├── api/        # ai-coach, video-analysis, user/export, user/import/*
│           │   └── (public)    # /, /how-it-works, /golf-swing-analysis,
│           │                   # /tennis-swing-analysis, /baseball-swing-analysis,
│           │                   # /softball-swing-analysis, /pricing, /parents,
│           │                   # /privacy, /terms
│           ├── components/     # UI, layout, video, sport, chart components
│           ├── contexts/       # SportContext
│           ├── lib/            # analytics, backup (schema/export/validate/restore/crypto),
│           │                   # rate-limit, supabase-server, ai-coach-prompts
│           └── store/          # Zustand store (persisted to localStorage)
├── packages/
│   └── core/                   # Shared TypeScript logic (@swingiq/core)
│       ├── types/              # Universal data schema
│       ├── schemas/            # Zod validation
│       ├── diagnostic/         # Golf diagnostic engine (24 rule categories)
│       ├── golf/               # Loft autofill service + gapping analysis
│       ├── training/           # Training routine generator
│       ├── import/             # CSV normalizer + image extraction service
│       ├── scoring/            # Swing scores
│       ├── analytics/          # Club gapping, practice schedule, event constants
│       ├── video-analysis/     # Golf video analyzer + YouTube service
│       └── sports/             # Multi-sport module
│           ├── types.ts        # SportId, 90+ SportIssueId values
│           ├── sport-profiles.ts
│           ├── sport-registry.ts
│           ├── professional-references.ts   # 32 pro athlete seed data
│           ├── professional-reference-service.ts
│           ├── tennis/         # Phases, 24 issue categories, drills, benchmarks
│           ├── baseball/       # Phases, 24 issue categories, drills, benchmarks
│           ├── softball-slow/  # Phases, 24 issue categories, drills, benchmarks
│           └── softball-fast/  # Phases, 24 issue categories, drills, benchmarks
├── .github/
│   ├── workflows/              # security-audit.yml, codeql.yml
│   ├── dependabot.yml
│   ├── CODEOWNERS
│   └── pull_request_template.md
└── docs/
    ├── BEGINNER_START_HERE.md
    ├── OWNER_TASKS.md
    ├── TROUBLESHOOTING.md
    ├── WEB_APP_GUIDE.md
    ├── DATA_IMPORT_GUIDE.md
    └── security-automation.md
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 10+

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables (optional — app works fully without them)

```bash
cp apps/web/.env.example apps/web/.env.local
```

| Variable | Required for | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Cloud sync + auth | supabase.com → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cloud sync + auth | supabase.com → Settings → API |
| `ADMIN_SECRET` | Admin panel protection | `openssl rand -hex 32` |
| `CRON_SECRET` | Vercel cron jobs | `openssl rand -hex 32` |
| `AI_PROVIDER` | AI Coach real answers | Set to `openai` or `anthropic` |
| `OPENAI_API_KEY` | AI Coach (OpenAI) | platform.openai.com/api-keys |
| `ANTHROPIC_API_KEY` | AI Coach (Anthropic) | console.anthropic.com |

> **Without any keys:** the app runs fully on localStorage. AI Coach returns data-grounded placeholder responses.

### 3. Start the dev server

```bash
npm run dev:web
# Open http://localhost:3000
```

### 4. Validate

```bash
npm run type-check   # TypeScript
npm run security:all # Security scan + npm audit
```

### 5. Build for production

```bash
npm run build
```

---

## Non-Developer Setup

Start here: **[docs/BEGINNER_START_HERE.md](docs/BEGINNER_START_HERE.md)**

---

## Technology Stack

| Layer | Technology |
|---|---|
| Web Framework | Next.js 15 (App Router), TypeScript 5 |
| Styling | Tailwind CSS, Radix UI primitives |
| State | Zustand (localStorage-persisted) |
| Server State | TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts + custom SVG |
| Icons | Lucide React |
| AI | OpenAI GPT-4o-mini or Anthropic Claude (configurable) |
| Encryption | Web Crypto API — AES-256-GCM (backup encryption, no external deps) |
| Database (optional) | Supabase (PostgreSQL + Auth + RLS) |
| Monorepo | Turborepo |
| Package Manager | npm 10 (workspaces) |
| CI/CD | GitHub Actions (security-audit.yml, codeql.yml) |

---

## API Routes

| Route | Method | Auth Required | Description |
|---|---|---|---|
| `/api/ai-coach` | POST | No (rate-limited) | Sport-aware AI coaching response |
| `/api/video-analysis` | POST | No (rate-limited) | Video metadata analysis dispatch |
| `/api/user/export` | GET | Yes (Supabase) | Server-side data export |
| `/api/user/import/preview` | POST | Yes (Supabase) | Validate backup without applying |
| `/api/user/import/restore` | POST | Yes (Supabase) | Apply backup (merge or replace) |
| `/api/research/benchmarks` | GET | No | Benchmark registry metadata |
| `/api/research/proposals` | GET/PATCH | Admin secret | Benchmark change proposals |
| `/api/research/run` | POST | Admin secret | Run benchmark research workflow |
| `/api/research/runs` | GET | Admin secret | List research runs |

---

## Golf Diagnostic Engine

The engine evaluates 24 issue categories across face control, path, strike quality, launch, spin, efficiency, and attack angle. Benchmarks are segmented by club type and periodically updated via the research workflow.

---

## Supported Launch Monitors (Golf CSV Import)

FlightScope · TrackMan · Foresight/Bushnell · SkyTrak · Uneekor · Garmin R10 · Rapsodo MLM2PRO · Full Swing KIT · Any device (manual column mapping)

---

## Public Pages (SEO)

| Route | Purpose |
|---|---|
| `/` | Landing page with JSON-LD structured data |
| `/how-it-works` | 4-step explainer, sport engine detail |
| `/golf-swing-analysis` | Golf SEO landing page |
| `/tennis-swing-analysis` | Tennis SEO landing page |
| `/baseball-swing-analysis` | Baseball SEO landing page |
| `/softball-swing-analysis` | Slow + fast pitch softball SEO page |
| `/pricing` | Free tier + Pro coming soon |
| `/parents` | Youth safety, FAQ |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service + AI disclaimer |

---

## Documentation

| File | For |
|---|---|
| [BEGINNER_START_HERE.md](docs/BEGINNER_START_HERE.md) | Non-developer owners — start here |
| [OWNER_TASKS.md](docs/OWNER_TASKS.md) | Full setup checklist + manual steps |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | When something breaks |
| [WEB_APP_GUIDE.md](docs/WEB_APP_GUIDE.md) | Using every app feature |
| [DATA_IMPORT_GUIDE.md](docs/DATA_IMPORT_GUIDE.md) | Exporting CSV from each launch monitor brand |
| [PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md) | 30/60/90-day roadmap + monetization |
| [ANALYTICS_PLAN.md](ANALYTICS_PLAN.md) | Event taxonomy, funnels, KPIs |
| [SEO_AEO_GEO_PLAN.md](SEO_AEO_GEO_PLAN.md) | SEO page map + structured data strategy |
| [COMPETITIVE_POSITIONING.md](COMPETITIVE_POSITIONING.md) | Category framing + differentiation |
| [ADMIN_OPERATIONS_ROADMAP.md](ADMIN_OPERATIONS_ROADMAP.md) | Professional video verification, data ops |
| [SECURITY.md](SECURITY.md) | Vulnerability reporting, secret rotation, hardening checklist |
| [docs/security-automation.md](docs/security-automation.md) | CI/CD security workflow guide |

---

## Security

SwingIQ has a production-grade security posture:
- All responses include CSP, HSTS, X-Frame-Options, and 5 additional security headers
- Production source maps disabled
- Supabase session middleware (activates on env key presence)
- ADMIN_SECRET protects all `/admin` routes and `/api/research/*` endpoints
- Rate limiting on all AI/video endpoints (in-memory; Upstash Redis upgrade path documented)
- Automated CI: Gitleaks secret scan, npm audit, GitHub CodeQL, custom scanner
- Supabase RLS SQL ready to apply (`apps/web/supabase-rls.sql`)

To report a vulnerability: see [SECURITY.md](SECURITY.md).

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `master` | Stable baseline |
| `security/platform-hardening` | Security hardening pass (headers, admin guard, middleware) |
| `feature/complete-sprints` | Next.js 15, rate limiter, backup encryption, auth middleware |
| `feature/swingiq-multisport-diagnostics-loft-ocr-comparison` | Current: loft autofill, expanded diagnostics, reference library, comparison, SEO |

---

## License

Copyright © 2024–2025 SwingIQ. All rights reserved. Proprietary and confidential. See [LICENSE](LICENSE).
