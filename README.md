# SwingIQ — AI Swing Performance Platform

A production-grade, web-based swing performance system that turns launch-monitor data, performance data, and video recordings into complete player development for **golf, tennis, baseball, slow pitch softball, and fast pitch softball**.

Web-first. Mobile-optimized. No app store required. Works on any phone, tablet, or desktop.

---

## What SwingIQ Does

Switching your active sport changes the **entire product experience** — dashboard, profile, sessions, training, drills, AI coaching, warm-up, reports, milestones, and more.

| Sport | Primary Data Source | What You Get |
|---|---|---|
| ⛳ Golf | Launch-monitor CSV | Diagnosis, scores, club gapping, stroke savings, training routines |
| 🎾 Tennis | Video analysis | Stroke phase breakdown, technique issues, drill plan |
| ⚾ Baseball | Video + manual entry | Swing phase analysis, hitting issues, drill plan |
| 🥎 Slow Pitch Softball | Video + manual entry | Arc-timing analysis, hip rotation, contact zones |
| 🥎 Fast Pitch Softball | Video + manual entry | Compact swing analysis, reaction timing, bat path |

---

## Feature Overview

### 🏠 Dashboard
Sport-specific dashboard that changes completely when you switch sports.
- **Golf:** Diagnosis card, stroke savings, Player DNA, club gap analysis, daily drill, practice reminder
- **Non-golf:** Primary issue from video analysis, recent analyses, setup progress, AI Coach CTA

### 👤 Profile
Five distinct profile forms — one per sport. No golf fields appear when you're analyzing a baseball swing.
- Golf: handicap, scoring average, launch monitor, ball used, shot shape
- Tennis: dominant hand, backhand style, racquet setup, playing level
- Baseball: batting side, bat specs, timing tendency, competition level
- Slow Pitch: league type, bat certification, desired hitting style
- Fast Pitch: contact point tendency, pitch speed range, competition level

### 📊 Sessions
- Filtered by active sport by default
- "All Sports" toggle to view across sports
- Golf: imports from launch monitor CSV
- Non-golf: manual session logging or video upload

### 🎬 Video Analysis
Sport-aware video analyzer with phase-by-phase coaching for all five sports.
- Phase names, overlay labels, and coaching language change per sport
- Sport-specific camera angle selector (face-on, down-the-line, catcher view, etc.)
- Issue detection with severity labels (Critical / Notable / Minor / Watch)
- All detections labeled as heuristic estimates — honest confidence labels throughout

### 🔍 Swing Diagnosis (Golf)
- Diagnostic engine analyzes launch-monitor data against validated benchmarks
- Identifies face control, path, low point, strike quality, spin, launch, and dispersion issues
- Shot dispersion chart (SVG scatter plot with 95% confidence ellipse)
- Stroke savings potential estimate per diagnosis

### 🏋️ Training
- Golf: interactive drill checklist based on active diagnosis, training effectiveness tracker
- Non-golf: drill checklist sourced from sport-specific drill library, filtered to primary video issue

### 📅 Practice Schedule
Generates a personalized 7-day practice week based on your diagnosis and frequency preference (1×/week to daily).

### ☀️ Pre-Round / Pre-Game Warm-Up
- Golf: pre-round warm-up routine tailored to active diagnosis
- Tennis/Baseball/Softball: full sport-specific warm-up checklist with coaching cues

### 📹 Drill Library
- 80+ drills across all five sports
- Defaults to your active sport's drills
- Searchable and filterable by difficulty
- "Recommended for Your Swing" card based on active diagnosis

### 📈 Progress Tracker
- Golf: score trend chart, ball data trends, personal bests, handicap estimate
- Non-golf: video analysis score sparkline, recurring issue frequency chart, analysis history

### 🏆 Milestones
Sport-specific achievement system — golf earns club and shot milestones, non-golf earns video and analysis milestones.

### 🤖 AI Coach
Five sport-specific system prompts — the AI speaks golf, tennis, baseball, slow-pitch, or fast-pitch language depending on your active sport. Answers are grounded in your actual data (launch-monitor stats or video analysis results).

### 📋 Reports
Sport-aware coach report generator. Copy a formatted text summary to share with your coach, club fitter, or training partner.

### 🔄 Compare Sessions
Side-by-side analysis of any two sessions — scores, key metrics, and a verdict.

---

## Architecture

```
swingiq/
├── apps/
│   └── web/                    # Next.js 14 App Router — mobile-optimized
│       └── src/
│           ├── app/            # 22 routes (dashboard, profile, sessions, video, etc.)
│           ├── components/     # UI, layout, video, sport, chart components
│           ├── contexts/       # SportContext (active sport + labels/config)
│           ├── lib/            # AI prompts, video utilities, pose estimation
│           └── store/          # Zustand store (persisted to localStorage)
├── packages/
│   └── core/                   # Shared TypeScript logic (@swingiq/core)
│       ├── types/              # Universal data schema
│       ├── schemas/            # Zod validation (shot, profile, sport profiles)
│       ├── diagnostic/         # Golf diagnostic engine + 24 rule categories
│       ├── training/           # Training routine generator
│       ├── import/             # CSV normalizer for all major launch monitor brands
│       ├── scoring/            # Swing scores (overall, face, path, strike, dispersion)
│       ├── analytics/          # Club gapping, shot dispersion, practice schedule
│       ├── video-analysis/     # Golf video analyzer + phase grading
│       ├── sports/             # Multi-sport module
│       │   ├── types.ts        # SportId, SportConfig, SportBenchmarks, etc.
│       │   ├── sport-profiles.ts # Per-sport profile schemas + nav labels + quick actions
│       │   ├── sport-registry.ts # Analysis engine dispatch + sport configs
│       │   ├── tennis/         # Phases, drills, benchmarks, analysis
│       │   ├── baseball/       # Phases, drills, benchmarks, analysis
│       │   ├── softball-slow/  # Phases, drills, benchmarks, analysis
│       │   └── softball-fast/  # Phases, drills, benchmarks, analysis
│       └── research/           # Benchmark research workflow
├── server/
│   └── supabase_schema.sql     # PostgreSQL schema (optional cloud sync)
└── docs/
    ├── BEGINNER_START_HERE.md
    ├── OWNER_TASKS.md
    ├── TROUBLESHOOTING.md
    ├── WEB_APP_GUIDE.md
    └── DATA_IMPORT_GUIDE.md
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

### 2. Set up environment variables (optional — app works without them)

```bash
cp apps/web/.env.example apps/web/.env.local
```

| Variable | Required for | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Cloud sync | supabase.com → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cloud sync | supabase.com → Settings → API |
| `AI_PROVIDER` | AI Coach real answers | Set to `openai` or `anthropic` |
| `OPENAI_API_KEY` | AI Coach (OpenAI) | platform.openai.com/api-keys |
| `ANTHROPIC_API_KEY` | AI Coach (Anthropic) | console.anthropic.com |

> **Without any keys:** the app runs fully on localStorage. The AI Coach returns data-grounded placeholder responses instead of live AI answers.

### 3. Start the dev server

```bash
npm run dev:web
# Open http://localhost:3000
```

### 4. Build for production

```bash
npm run build
```

---

## Non-Developer Setup

If you are not a developer, start with the owner guide:
**[docs/BEGINNER_START_HERE.md](docs/BEGINNER_START_HERE.md)**

---

## Technology Stack

| Layer | Technology |
|---|---|
| Web Framework | Next.js 14 (App Router), TypeScript 5 |
| Styling | Tailwind CSS, Radix UI primitives |
| State | Zustand (localStorage-persisted) |
| Server State | TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts + custom SVG |
| Icons | Lucide React |
| AI | OpenAI GPT-4o-mini or Anthropic Claude (configurable) |
| Database (optional) | Supabase (PostgreSQL + Auth) |
| Monorepo | Turborepo |
| Package Manager | npm 10 (workspaces) |

---

## Supported Sports

| Sport | Movement Types | Data Sources |
|---|---|---|
| ⛳ Golf | Full swing, pitch, chip, putt | Launch monitor CSV, video, manual |
| 🎾 Tennis | Forehand, backhand, serve, volley, return | Video, manual, sensor (optional) |
| ⚾ Baseball | Hitting swing | Video, manual, bat sensor (optional), radar (optional) |
| 🥎 Slow Pitch Softball | Hitting swing | Video, manual, bat sensor (optional) |
| 🥎 Fast Pitch Softball | Hitting swing | Video, manual, bat sensor (optional), radar (optional) |

---

## Supported Launch Monitors (Golf)

| Brand | Models | Import |
|---|---|---|
| FlightScope | Mevo, Mevo+, X3 | CSV |
| TrackMan | TM4, iO, Range | CSV |
| Foresight | GCQuad, GC3, Bushnell Launch Pro | CSV |
| SkyTrak | SkyTrak, SkyTrak+, ST Max | CSV |
| Uneekor | Eye Mini, Eye XO, Eye XR | CSV |
| Garmin | Approach R10 | CSV |
| Rapsodo | MLM, MLM2PRO | CSV |
| Full Swing | KIT | CSV |
| Any device | — | Manual column mapping |

---

## Golf Diagnostic Engine

The engine evaluates 24 issue categories:

- Face control: slice/weak fade, hook/strong draw
- Path: pull, push, out-to-in, in-to-out
- Strike: fat contact, thin contact, heel strike, toe strike, low point position
- Launch & spin: dynamic loft too high/low, spin too high/low, launch angle issues
- Efficiency: poor smash factor, distance loss, inconsistent carry
- Attack angle: steep, shallow, driver attack angle down

---

## Swagger / API Routes

| Route | Method | Description |
|---|---|---|
| `/api/ai-coach` | POST | Sport-aware AI coaching response |
| `/api/video-analysis` | POST | Video metadata analysis dispatch |
| `/api/research/benchmarks` | GET | Benchmark registry (golf) |
| `/api/research/proposals` | GET/POST | Research proposals |
| `/api/research/run` | POST | Run a benchmark research workflow |
| `/api/research/runs` | GET | List research runs |

---

## Documentation

| File | For |
|---|---|
| [BEGINNER_START_HERE.md](docs/BEGINNER_START_HERE.md) | Non-developer owners — start here |
| [OWNER_TASKS.md](docs/OWNER_TASKS.md) | Setup checklist (Supabase, Vercel, AI key) |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | When something breaks |
| [WEB_APP_GUIDE.md](docs/WEB_APP_GUIDE.md) | Using the web app features |
| [DATA_IMPORT_GUIDE.md](docs/DATA_IMPORT_GUIDE.md) | Exporting CSV from each launch monitor brand |

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `master` | Stable baseline |
| `feature/sport-aware-platform-parity` | Active development — multi-sport platform |
| `feature/golf-research-benchmark-evolution` | Golf benchmark research system |
