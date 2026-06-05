# SwingVantage — AI Swing Performance Platform

A production-grade, web-based AI swing development platform for **golf, tennis, baseball, slow pitch softball, and fast pitch softball**.

Web-first. Mobile-optimized. No app store required. Works on any phone, tablet, or desktop browser.

## 📘 In Plain English (start here)

**What this page is:** The technical "front door" to the project — mostly for a developer or an AI assistant. It lists every feature, the folder layout, the setup commands, and the technology behind SwingVantage.

**What you actually need to know:**
- **If you're the owner and just want to get the app running, don't start here.** Start with **[docs/BEGINNER_START_HERE.md](docs/BEGINNER_START_HERE.md)** — it walks you through every step in plain language.
- The app **works fully without any setup keys** — it saves your data in your browser. A database, logins, and live AI answers are optional add-ons you can turn on later.
- The **Feature Overview** section just below is a complete, readable catalogue of what SwingVantage can do — handy to skim when you forget whether a feature exists.

**What to do next:** Owner → open [docs/BEGINNER_START_HERE.md](docs/BEGINNER_START_HERE.md). Developer or AI assistant → keep reading here.

> The Quick Start, Architecture, API Routes, and Technology Stack sections further down are developer reference. You don't need to understand them to use SwingVantage — the feature list, though, is written for everyone.

---

## What SwingVantage Does

Switching your active sport changes the **entire product experience** — dashboard, profile, sessions, training, drills, AI coaching, warm-up, reports, milestones, comparison, and more.

| Sport | Primary Data Source | What You Get |
|---|---|---|
| ⛳ Golf | Launch-monitor CSV or image screenshot | Diagnosis, scores, club gapping, loft autofill, stroke savings, training routines |
| 🎾 Tennis | Video analysis | Stroke phase breakdown, 24 issue categories, drill plan |
| ⚾ Baseball | Video + manual entry | Swing phase analysis, 24 issue categories, drill plan |
| 🥎 Slow Pitch Softball | Video + manual entry | Arc-timing analysis, 24 issue categories, line-drive coaching |
| 🥎 Fast Pitch Softball | Video + manual entry | Compact swing analysis, 24 issue categories, reaction timing |

> **All five sports** also get **Motion Lab** (`/motion-lab`) — browser-based 3D motion analysis with a rotatable 3D viewer, sport-specific phase breakdowns, biomechanical scores, a coaching plan, and an optional two-camera "true 3D" mode.

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

### 🧪 Motion Lab — 3D Motion Analysis (all sports)
Browser-based 3D motion analysis at `/motion-lab` (`lib/motion-lab`, `components/motion-lab`, `lib/pose3d`). Works for golf, tennis, baseball, slow pitch, and fast pitch softball.
- **Upload or record in-app**, optional **trim** to the rep, then pick sport + motion (driver/iron/wedge/putt, forehand/backhand/serve/volley, hitting/pitching/throwing/fielding…)
- On-device pose → **sport-specific phase segmentation**, ~13 biomechanical proxy metrics, and six component scores (power, sequencing, rotation, balance, timing, consistency) plus an overall Motion Score
- **Interactive 3D viewer** (pure canvas, zero new dependencies): orbit / zoom / frame-scrub / motion trails / ghost-compare / confidence shading / PNG screenshot
- **Trained single-view 3D depth model** (`lib/pose3d`, committed weights) — a "Pro 3D depth" toggle refines per-joint depth; result stays an honest single-camera estimate
- **Two-camera "true 3D" mode** — film the same rep from two angles and SwingVantage produces **measured** 3D via per-capture self-calibration (normalized 8-point essential matrix + RANSAC + bundle adjustment) and DLT triangulation; confidence comes from real reprojection error
- 5-tone coaching report, 4-drill prescription + weekly plan, local session save, session compare, **JSON / CSV / PDF** export, and a developer debug panel
- Everything runs **on-device**; the original video never leaves the browser. No medical, injury, or tour-grade claims. See `docs/motion-lab.md` and `docs/pose3d.md`.

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
- **Optional OCR auto-extraction** — when an extraction provider is configured, SwingVantage reads the numbers off your image to pre-fill the review table (labeled with a confidence note); without a provider it falls back to manual entry automatically
- Manual review and edit before any data is saved — no unreviewed OCR output is ever analyzed
- Manual entry stays the default, supported path on every device

### 🏋️ Training
- Golf: interactive drill checklist based on active diagnosis, training effectiveness tracker
- Non-golf: drill checklist sourced from sport-specific drill library, filtered to primary video issue

### 🛠️ Fix Stack — One Fix at a Time (`/fix`)
- Surfaces your single **highest-impact issue** and turns it into a 3-step loop: **feel it** (one body cue), **drill it** (the best-matched drill for your level + available gear), **retest it** (a fair before/after)
- Learns from what worked for you so the next recommendation is sharper
- Deterministic and local-first — no AI account required (`lib/drillmatch`, `components/drillmatch`)
- Found at **Practice → Fix Stack**

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

### 🛣️ Player Arc — The Story of Your Improvement (`/arc`)
- A narrative of your progress over time: the **recurring faults** that keep coming back ("flaw fingerprint"), which drills actually helped, and honest proof of what each retest changed
- Builds automatically with every session and retest you add (`lib/progress`, `components/progress`)
- Found at **Progress → Player Arc**

### 🧪 SwingVantage Labs — Foundations (`/labs`)
- An in-app home for emerging, on-device tools — each **honest about its confidence and limits**
- Includes a daily **readiness score**, a private **player model**, **cross-sport skill transfer**, a personal **performance graph**, and **benchmark mirrors** (`lib/readiness`, `lib/playerModel`, `lib/skillTransfer`, `lib/performanceGraph`, `lib/benchmarkMirror`; `components/foundations`)
- Some are early v1s; all sharpen the more you practise and retest
- Found at **Progress → SwingVantage Labs**

### 🧠 Athlete General Intelligence (`/agi`)
- One engine that reasons across **all your sports at once** — the generalist on top of every specialist tool
- Fuses six local signals (Motion Lab, launch-monitor, profile/goal, readiness, snapshot history, drill feedback) into one athlete model, then finds your **keystone**: the single capability limiting the most sports
- Shows what **transfers** between sports, detects recurring faults & plateaus, tracks progress over time, and builds **one readiness-scaled plan** that leads with the drills you've personally found helpful
- Every conclusion shows its **reasoning chain, basis, and confidence**, all under an honest **A–D trust grade**; single-camera inputs stay labeled estimates
- **Commit-to-plan** with an approval gate sets a 2-week retest date and closes the loop; outputs a coach-shareable report; summarized on the Today dashboard
- Deterministic and local-first (optional LLM may only re-word, never change numbers). Found at **Analyze → Athlete GI** (`lib/agi`, `components/agi`). See `docs/athlete-general-intelligence.md` + `docs/ATHLETE_GI_STRATEGY.md`

### 🧑‍🏫 Coach & Team Mode (`/coach`)
- A local-first roster for coaches and parents: group sessions by athlete, track each athlete's progress and recurring issues
- Surfaces the **shared weakness a whole roster has in common** plus per-athlete upload tracking
- Everything stays on your device. Found at **Analyze → Coach & Team**

### 🕺 3D Swing Avatar (`/avatar`)
- A lightweight, rotatable **3D avatar view** of a swing for a quick visual read
- For the full biomechanical breakdown (phases, metrics, scores, drills), use **Motion Lab**. Found at **Analyze → 3D Swing Avatar**

### 🔁 Retest — Prove the Change
- Dedicated **Retest** page (`/retest`) that closes the improvement loop
- Reminds you when a diagnosed finding is **due for a retest** after you've drilled it
- After you re-analyze under the same conditions (camera angle, distance, equipment), shows an honest **before-and-after read** of whether the finding actually changed
- Golf retests match curated faults against fresh launch-monitor data; video sports retest from a re-analysis
- Comparisons are clearly labeled as **directional reads**, not measured biomechanics
- Retest reminders and results also surface on the dashboard

### 🗣️ Role-Aware Fault Explanations
- The same diagnosed fault is explained in the way most useful to **who is reading it**
- **Player:** a plain, encouraging "here's what to feel" explanation
- **Coach:** the technical cause and cue
- **Parent:** a supportive, jargon-free version they can use to help
- Appears on the **Diagnose, Training, and Retest** screens

### 🏆 Milestones
Sport-specific achievement system across all five sports.

### 🤖 AI Coach
Five sport-specific system prompts — grounded in your actual data. Never invents measurements.

### 📋 Reports
Sport-aware coach report generator. Copy a formatted summary to share with your coach.
- **Share as an image** — turn your report card (top priority, recommended drills, practice plan) into a clean, ready-to-post square image. The image is built privately on-device; mobile shares straight to messages/social apps, desktop downloads it.

### 🎥 Professional Swing Reference Library & Side-by-Side Comparison
- Browse 32 seeded professional athlete profiles across 5 sports (all pending admin verification)
- Filter by sport, sex, movement type, handedness, and style tags
- Preview reference detail with YouTube search fallback (privacy-enhanced embeds for verified videos)
- Side-by-side comparison: your video on the left, professional reference on the right
- Sport-specific phase checklist and honest limitation notice
- All unverified entries clearly marked — no fake YouTube IDs

### 💾 Backup & Restore (Schema v1.2.0)
- **Complete data backup** — all sports, profiles, sessions, video analyses, drills, equipment, community progress, tutorial progress, and settings in one file
- **Community / gamification data included** — badges, XP totals, challenge history, streaks, group memberships, and privacy settings all backed up
- **Tutorial progress included** — which in-app guides have been completed or dismissed, portable across devices
- Download as `swingiq-backup-YYYY-MM-DD.json` or `.swingiqbackup` (encrypted)
- **Optional password-based encryption** (AES-256-GCM, PBKDF2, 310k iterations — no external dependencies)
- **Auto-migration** — old backups (v1.0.0, v1.1.0) are automatically upgraded to the current schema on import
- Restore modes: **Merge** (add to current, deduplicates by ID and composite key) or **Replace** (full restore with confirmation)
- **Enhanced restore preview** — shows every category being restored including badge/XP counts
- Smart duplicate detection (by ID and by sport + date + source)
- **Security hardening** — prototype pollution guard, complexity bomb guard, 50 MB size cap, extension whitelist
- **Backup data registry** (`lib/backup/registry.ts`) — centralized contract so every future feature declares its own export/import behavior
- Multi-device portability — backup on any device, restore anywhere
- Found at **Data Center** (`/data`) or **Settings → Backup & Restore**

### ❓ Always-Accessible Contextual Help System
- Every major screen has a built-in step-by-step guide — tap the **?** button in the top bar (mobile) or sidebar (desktop)
- **20+ screen-specific tutorials** covering Dashboard, Profile, Equipment, Sessions, Diagnose, Training, Video Analysis, Community, Data Center, Settings, and more
- Tutorials use plain language — written for athletes, parents, and coaches, not developers
- **Tutorial progress is saved** in the browser and included in your backup — guides restore when you switch devices
- Guides can be dismissed, restarted, and reset from Settings
- Keyboard accessible — `Escape` closes, `←`/`→` navigates steps
- i18n-ready architecture — content is structured for extraction into all 20 supported languages
- Centralized content registry (`lib/tutorial/content.ts`) — adding a tutorial for a new screen takes one object

### 🎨 Customizable Themes
- **7 curated themes** — Standard, Dark Performance, Coach Mode, Heritage Club, Field & Court, Arcade Practice, and Bird Print Lifestyle
- Themes change only the visual/emotional layer — **never** layout, navigation, coaching logic, data, or accessibility
- Each theme redefines the same semantic tokens (`globals.css`); single source of truth in `lib/theme/themes.ts`
- Selected theme persists per user and is included in backup/restore
- Choose under **Settings → Appearance**

### 🌐 Multi-Language Support
SwingVantage is available in 20 languages with full Spanish and French translations. Switch languages from Settings or the language toggle in the navigation. "Today's Fix" engagement CTAs are translated across all 20 coaching languages.

### 🚪 Keyless Instant Start (No Account Required)
- Open SwingVantage and start analyzing immediately — **no sign-up wall**
- Data is saved privately on your own device by default (keyless local account)
- An **optional account** is available anytime — sign-up, sign-in, and password reset all work when Supabase auth is configured, for users who want cloud sync
- Monetization follows a fixed order — **grow free users → ads (first revenue) → membership tiers** (north star: `docs/MONETIZATION_STRATEGY.md`). It's keyless too: paid tiers show **"Coming Soon"** (with an optional email notify) and only become live checkout when Stripe keys are present; ads stay off until an ad-network id is set (see `lib/billing/tiers.ts`, `lib/capabilities.ts`)

### 📶 Offline Support
- A clear **offline status banner** appears when the connection drops (common at a range or back field)
- Your work is held safely on-device; anything that needs the network is queued in an **IndexedDB outbox** and completes automatically once you reconnect
- Nothing to set up — offline handling is always on

### 🎥 Pose & Motion Engine
- On-device **MediaPipe** pose estimation lives in `lib/pose` (the single source of truth), with selectable model quality (lite / full / heavy)
- The motion engine (`lib/motion`) and the **Motion Lab** pipeline (`lib/motion-lab`) consume it for phase, metric, scoring, and report analysis
- The proprietary 3D engine (`lib/pose3d`) adds **multi-view triangulation** (measured 3D) and a **trained single-view depth model** (estimated), behind a clean provider seam ready for a future ONNX model
- All single-camera pose output stays labeled as a heuristic/directional estimate — honest by design

### 🏅 Community Hub
- **50+ Badges** across 10 categories: consistency, improvement, data protection, sport mastery, and more
- **XP & Leveling** — earn XP for sessions, diagnoses, drills, backups, and milestones
- **Challenges** — consistency, improvement, personal best, data, skill, and team challenge types
- **Groups/Clubs** — join or create sport-specific groups with group leaderboards and challenges
- **Activity Feed** — privacy-controlled (private / followers / public)
- **Leaderboards** — ranked by improvement % and consistency, not raw scores; youth athletes ranked separately
- All community progress (badges, XP, challenge history, group memberships) is **included in backup/restore**

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
│   └── web/                    # Next.js 16 App Router — mobile-optimized
│       ├── public/             # robots.txt, manifest
│       └── src/
│           ├── app/            # 90+ routes (App Router)
│           │   ├── (app)       # dashboard, profile, sessions, video, motion-lab, agi, coach, avatar, training…
│           │   ├── compare/    # Professional references + side-by-side comparison
│           │   ├── settings/backup/  # Backup & Restore
│           │   ├── sessions/import/image/  # Screenshot/image import wizard
│           │   ├── api/        # ai-coach, video-analysis, user/export, user/import/*
│           │   └── (public)    # /, /how-it-works, /golf-swing-analysis,
│           │                   # /tennis-swing-analysis, /baseball-swing-analysis,
│           │                   # /softball-swing-analysis, /pricing, /parents,
│           │                   # /privacy, /terms
│           ├── components/     # UI, layout, video, sport, chart components
│           ├── contexts/       # SportContext, LanguageContext
│           ├── hooks/          # useTutorial (tutorial progress hook)
│           ├── lib/
│           │   ├── agi/        # Athlete General Intelligence — cross-sport reasoning (capabilities, world model, keystone, transfer, plan, team)
│           │   ├── motion-lab/ # Motion Lab — 3D pipeline (phases, metrics, scoring, report, drills, multiview)
│           │   ├── pose3d/     # Proprietary 3D engine (triangulation, self-calibration, trained lift model)
│           │   ├── pose/       # On-device MediaPipe pose detection (lite/full/heavy)
│           │   ├── motion/     # Motion engine provider seam + honest data-basis labeling
│           │   ├── drillmatch/ # Fix Stack — highest-impact issue → feel cue + best-matched drill + retest
│           │   ├── progress/   # Player Arc — improvement narrative, flaw fingerprint, retest outcomes
│           │   ├── readiness/, playerModel/, skillTransfer/, performanceGraph/, benchmarkMirror/  # SwingVantage Labs foundations
│           │   ├── backup/     # schema, export, validate, restore, migrate,
│           │   │               # registry, crypto — complete data portability system
│           │   ├── tutorial/   # content registry (20+ screens), types
│           │   ├── community/  # achievements, challenges, XP, backup-health,
│           │   │               # activity-feed, groups, leaderboard
│           │   └── i18n/       # 20-language system with RTL support
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
    ├── BACKUP_SYSTEM.md        ← backup/restore architecture guide
    ├── ARCHITECTURE_DECISIONS.md ← 13 ADRs for all major design choices
    ├── LAUNCH_READINESS_CHECKLIST.md ← pre-launch checklist (4 tiers)
    ├── DATA_PORTABILITY.md     ← export/import guide
    ├── SECURITY_AND_PRIVACY.md ← OWASP, GDPR/COPPA/CCPA
    ├── SEO_GEO_AEO.md          ← SEO/GEO/AEO strategy
    ├── HOW_TO_PUBLISH_UPDATES.md ← guide for /updates page
    ├── AUTO_PUBLISH_UPDATES.md ← auto-publish /updates + /dev-updates from commit trailers
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
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Analytics (**recommended** — cookieless, no consent banner) | plausible.io → your site domain |
| `NEXT_PUBLIC_GA_ID` | Analytics (Google Analytics 4) | analytics.google.com |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Google Search Console verification + indexing | search.google.com/search-console → HTML tag |

> **Without any keys:** the app runs fully on localStorage. AI Coach returns data-grounded placeholder responses, and analytics events log to the dev console only.

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
| Web Framework | Next.js 16 (App Router), TypeScript 6 |
| Styling | Tailwind CSS, Radix UI primitives, 7-theme semantic-token system |
| State | Zustand (localStorage-persisted) |
| Server State | TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts + custom SVG |
| Icons | Lucide React |
| AI | OpenAI GPT-4o-mini or Anthropic Claude (configurable) |
| Pose / Motion | On-device MediaPipe pose (`lib/pose`, lite/full/heavy) → Motion Lab 3D pipeline (`lib/motion-lab`) + proprietary 3D engine (`lib/pose3d`: multi-view triangulation + trained single-view depth model) |
| Auth | Keyless local accounts by default; optional Supabase auth |
| Billing | Tiers show "Coming Soon" (free→ads→tiers); optional Stripe checkout when keys present |
| Offline | IndexedDB outbox + offline status banner |
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
| `/about` | Mission, values, who uses SwingVantage |
| `/features` | Full feature grid with 14+ features |
| `/faq` | Accordion FAQ with 18 Q&As + JSON-LD schema |
| `/trust` | Data privacy commitments and AI honesty |
| `/glossary` | Searchable ~45 swing terms across all sports |
| `/resources` | Getting started guides and quick links |
| `/updates` | User-facing product update history (plain-English changelog) |
| `/dev-updates` | Engineering log — the technical story behind the changelog |
| `/blog` | Blog index + 8 SEO articles |
| `/blog/[slug]` | Individual blog posts (8 statically pre-rendered) |
| `/benchmarks` | Performance standard index for all sports |
| `/benchmarks/[sport]` | Beginner → elite ranges: golf, tennis, baseball, softball |
| `/golf-swing-analysis` | Golf SEO landing page |
| `/tennis-swing-analysis` | Tennis SEO landing page |
| `/baseball-swing-analysis` | Baseball SEO landing page |
| `/softball-swing-analysis` | Slow + fast pitch softball SEO page |
| `/free-swing-analysis` | Free analysis conversion landing page |
| `/golf/*`, `/softball/*`, `/tennis/*`, `/baseball/*` | Programmatic SEO landing pages (see `content/seoPages.ts`) |
| `/start` | Onboarding entry point ("Start Here") |
| `/methodology` | What SwingVantage measures vs. estimates (transparency) |
| `/athlete-general-intelligence` | Public explainer for Athlete GI (cross-sport keystone reasoning) |
| `/sports` | Multi-sport hub linking the per-sport analysis pages |
| `/sample-report` | Worked example of a swing report (old `/report/sample` redirects here) |
| `/tools`, `/tools/*` | Free quizzes, drill & practice generators |
| `/challenges`, `/challenges/*` | Free multi-sport practice challenges |
| `/coaches`, `/creators`, `/teams`, `/partners` | Partner / audience landing pages |
| `/pricing` | Free tier + paid tiers as "Coming Soon" (keyless; optional Stripe checkout) |
| `/parents` | Youth safety, FAQ |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service + AI disclaimer |
| `/vulnerability-disclosure` | Responsible security disclosure policy |

> The canonical, machine-readable list of indexable URLs is `apps/web/src/app/sitemap.ts`; crawler rules live in `apps/web/public/robots.txt`. The `/drills` library is part of the authenticated app, not a public SEO route.

---

## Documentation

| File | For |
|---|---|
| [BEGINNER_START_HERE.md](docs/BEGINNER_START_HERE.md) | Non-developer owners — start here |
| [master-audit-report.md](docs/master-audit-report.md) | **Consolidated audit roadmap** — merges every scheduled audit (SEO, security, growth) into one prioritized to-do list; see [audit-action-dashboard.md](docs/audit-action-dashboard.md) for the at-a-glance board. Feed each future scheduled-audit run back into §3. |
| [OWNER_TASKS.md](docs/OWNER_TASKS.md) | Full setup checklist + manual steps |
| [SUPABASE_SETUP_WALKTHROUGH.md](docs/SUPABASE_SETUP_WALKTHROUGH.md) | Click-by-click, screen-by-screen guide to connecting the free Supabase database |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | When something breaks |
| [WEB_APP_GUIDE.md](docs/WEB_APP_GUIDE.md) | Using every app feature |
| [motion-lab.md](docs/motion-lab.md) | **Motion Lab** — 3D motion analysis feature + pipeline (plain-English intro) |
| [athlete-general-intelligence.md](docs/athlete-general-intelligence.md) | **Athlete GI** — the cross-sport reasoning engine (plain-English intro + architecture) |
| [ATHLETE_GI_STRATEGY.md](docs/ATHLETE_GI_STRATEGY.md) | Athlete GI product strategy + free/Pro/Team split |
| [pose3d.md](docs/pose3d.md) | **3D pose engine** — multi-view triangulation, self-calibration, trained lift model, ONNX upgrade path |
| [DATA_IMPORT_GUIDE.md](docs/DATA_IMPORT_GUIDE.md) | Exporting CSV from each launch monitor brand |
| [BACKUP_SYSTEM.md](docs/BACKUP_SYSTEM.md) | **Developer guide** — backup schema, registry, migration, tutorial system |
| [ARCHITECTURE_DECISIONS.md](docs/ARCHITECTURE_DECISIONS.md) | 13 ADRs explaining every major technology and design choice |
| [LAUNCH_READINESS_CHECKLIST.md](docs/LAUNCH_READINESS_CHECKLIST.md) | Plain-English pre-launch checklist (4 readiness tiers) |
| [DATA_PORTABILITY.md](docs/DATA_PORTABILITY.md) | Backup/export developer and owner guide |
| [SECURITY_AND_PRIVACY.md](docs/SECURITY_AND_PRIVACY.md) | OWASP coverage, GDPR/COPPA/CCPA status, breach plan |
| [SEO_GEO_AEO.md](docs/SEO_GEO_AEO.md) | SEO/GEO/AEO strategy with content calendar |
| [HOW_TO_PUBLISH_UPDATES.md](docs/HOW_TO_PUBLISH_UPDATES.md) | Guide for adding entries to the /updates page (manual route) |
| [AUTO_PUBLISH_UPDATES.md](docs/AUTO_PUBLISH_UPDATES.md) | Auto-publish /updates + /dev-updates from `Update:` / `Dev-Update:` commit trailers |
| [PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md) | 30/60/90-day roadmap + monetization |
| [MONETIZATION_STRATEGY.md](docs/MONETIZATION_STRATEGY.md) | **The north star** — monetization order: grow free → ads → membership tiers (+ the gate between each) |
| [MONETIZATION_CHECKLIST.md](docs/MONETIZATION_CHECKLIST.md) | The Phase 3 (subscriptions) runbook — least-expensive path to the first paying user (Stripe + gates) |
| [ANALYTICS_PLAN.md](docs/ANALYTICS_PLAN.md) | Event taxonomy, funnels, KPIs |
| [SEO_AEO_GEO_PLAN.md](docs/SEO_AEO_GEO_PLAN.md) | Legacy SEO plan (superseded by docs/SEO_GEO_AEO.md) |
| [COMPETITIVE_POSITIONING.md](docs/COMPETITIVE_POSITIONING.md) | Category framing + differentiation |
| [ADMIN_OPERATIONS_ROADMAP.md](docs/ADMIN_OPERATIONS_ROADMAP.md) | Professional video verification, data ops |
| [SECURITY.md](SECURITY.md) | Vulnerability reporting, secret rotation, hardening checklist |
| [docs/security-automation.md](docs/security-automation.md) | CI/CD security workflow guide |

---

## Security

SwingVantage has a production-grade security posture:
- All responses include CSP, HSTS, X-Frame-Options, and 5 additional security headers
- Production source maps disabled
- Supabase session middleware (activates on env key presence)
- ADMIN_SECRET protects all `/admin` routes and `/api/research/*` endpoints
- Rate limiting on all AI/video endpoints — distributed (Upstash Redis REST) when configured, with an in-memory per-IP fallback that never fails open (`lib/rate-limit.ts`)
- Automated CI: Gitleaks secret scan, npm audit, GitHub CodeQL, custom scanner
- Supabase RLS SQL ready to apply (`apps/web/supabase-rls.sql`)

To report a vulnerability: see [SECURITY.md](SECURITY.md).

---

## Branch Strategy

All development is merged directly into `master`. Feature branches are deleted after merge.

| Branch | Purpose |
|---|---|
| `master` | Single production branch — all features live here |

---

## License

Copyright © 2024–2026 SwingVantage. All rights reserved. Proprietary and confidential. See [LICENSE](LICENSE).
