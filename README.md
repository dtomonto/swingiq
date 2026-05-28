# SwingIQ — Golf Performance System

A production-grade multi-platform golf performance system that turns launch-monitor data into complete player development.

## What SwingIQ Does

1. **Accepts launch-monitor data** from FlightScope, TrackMan, Foresight, SkyTrak, Uneekor, Garmin, Rapsodo, and more
2. **Diagnoses swing patterns** — identifies what is wrong and why (face control, path, low point, strike location, launch, spin)
3. **Generates training routines** — tells you exactly what to practice, how many balls to hit, and what success looks like
4. **Links to YouTube drills** — finds the right drill videos for your specific data issue
5. **Tracks improvement** — shows whether your metrics are improving over time

## Architecture

```
swingiq/
├── apps/
│   ├── web/          # Next.js 14 web dashboard (primary analysis tool)
│   └── mobile/       # React Native + Expo mobile app (field use)
├── packages/
│   └── core/         # Shared TypeScript logic
│       ├── types/    # Universal data schema
│       ├── schemas/  # Zod validation
│       ├── diagnostic/ # Diagnostic engine + rules
│       ├── training/ # Training routine generator
│       ├── import/   # CSV normalizer for all major brands
│       └── scoring/  # Scoring formulas
├── server/
│   └── supabase_schema.sql  # Database schema
└── docs/
    ├── BEGINNER_START_HERE.md
    ├── OWNER_TASKS.md
    ├── TROUBLESHOOTING.md
    ├── WEB_APP_GUIDE.md
    └── DATA_IMPORT_GUIDE.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- A Supabase account (free at supabase.com)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
# Web app
cp apps/web/.env.example apps/web/.env.local
# Fill in your Supabase URL and anon key

# Mobile app
cp apps/mobile/.env.example apps/mobile/.env
# Fill in same Supabase values
```

### 3. Run the database schema

Copy the contents of `server/supabase_schema.sql` into your Supabase SQL Editor and run it.

### 4. Start the web app

```bash
npm run dev:web
# Open http://localhost:3000
```

### 5. Start the mobile app

```bash
npm run dev:mobile
# Scan QR code with Expo Go app on your phone
```

## Non-Developer Setup

If you are not a developer, start here:
**[docs/BEGINNER_START_HERE.md](docs/BEGINNER_START_HERE.md)**

## Technology Stack

| Layer | Technology |
|---|---|
| Web App | Next.js 14, TypeScript, Tailwind CSS |
| Mobile App | React Native, Expo, TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| State | Zustand, TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| 3D | React Three Fiber, Three.js |
| Shared Logic | `@swingiq/core` package |

## Supported Launch Monitors

| Brand | Models | Import Method |
|---|---|---|
| FlightScope | Mevo, Mevo+, X3 | CSV (FS Golf app) |
| TrackMan | TM4, iO, Range | CSV |
| Foresight | GCQuad, GC3, Bushnell Launch Pro | CSV (FSX) |
| SkyTrak | SkyTrak, SkyTrak+, ST Max | CSV |
| Uneekor | Eye Mini, Eye XO, Eye XR | CSV (View) |
| Garmin | Approach R10 | CSV (Garmin Golf app) |
| Rapsodo | MLM, MLM2PRO | CSV |
| Full Swing | KIT | CSV |
| Any device | — | Manual column mapping |

## Diagnostic Rules

The engine detects:

- Open face / slice / weak fade
- Closed face / hook / strong draw
- Pull pattern
- Push pattern
- Fat contact / low point behind ball
- Thin contact
- Excess dynamic loft
- Insufficient dynamic loft
- Heel strike pattern
- Toe strike pattern
- Steep attack angle
- Shallow attack angle
- High spin rate
- Low spin rate
- High launch angle
- Low launch angle
- Distance loss (poor smash factor)
- Inconsistent carry
- Equipment fit concerns

## MVP Phases

- **MVP 1** (current): Profile, bag, CSV import, diagnostic engine, training routines, YouTube links
- **MVP 2**: Trend engine, club benchmarks, wedge matrix, driver profile
- **MVP 3**: Video analyzer, swing phase grading
- **MVP 4**: 3D avatar swing model
- **MVP 5**: Coach/player ecosystem, shareable reports

## Documentation

| File | Who should read it |
|---|---|
| [BEGINNER_START_HERE.md](docs/BEGINNER_START_HERE.md) | Non-developer owners |
| [OWNER_TASKS.md](docs/OWNER_TASKS.md) | Task checklist for setup |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | When something breaks |
| [WEB_APP_GUIDE.md](docs/WEB_APP_GUIDE.md) | Using the web app |
| [DATA_IMPORT_GUIDE.md](docs/DATA_IMPORT_GUIDE.md) | Exporting from each launch monitor |
