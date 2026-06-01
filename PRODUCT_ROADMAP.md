# SwingIQ Product Roadmap

_Last updated: May 2026_

---

## 📘 In Plain English (start here)

**What this page is:** The plan for where SwingIQ is heading — what's already built, what's hoped for in the next 30, 60, and 90 days, and ideas for charging money later.

**What you actually need to know:**
- This is a **planning and wish-list document**, not a list of things that are broken or things you must do today.
- Items marked **✅ Done** are finished. Everything else is a goal, not a promise or a deadline.
- The pricing tiers (Free, Pro at $12/month, Team at $49/month) are **proposals** — none of them are live or charging anyone yet.

**What to do next:** Nothing is required. Use this page to decide what to prioritize, or to brief a developer, contractor, or AI assistant on the direction.

> The sections below use some technical shorthand (feature names, file paths). You can read it as a plain list of "done vs. planned" and skip anything that looks like code.

---

## Current State (Built)

### Core Platform
- Next.js 15 App Router with TypeScript, Tailwind CSS, Zustand, Radix UI
- Multi-sport support: golf, tennis, baseball, slow pitch softball, fast pitch softball
- Sport context with persistent localStorage selection
- Authenticated app shell with mobile bottom nav + desktop sidebar
- Progressive Web App (manifest, service worker hooks, install prompt)

### Golf — Launch Monitor Import
- CSV import wizard (multi-step) for FlightScope, TrackMan, Foresight, Garmin, Rapsodo, SkyTrak
- Universal column normalizer with brand-specific overrides
- Shot-level data storage with BallData, ClubDeliveryData, StrikeData schemas
- Loft comparison (OCR stub + manual entry) across brands

### Analysis Engines
- Deterministic diagnostic rules engine (golf swing faults, severity scoring)
- Sport-specific analysis: tennis strokes, baseball/softball hitting phases
- Video analysis with swing phase definitions and visual issue detection
- YouTube drill search URL builder per fault

### Benchmarks & Training
- Tour-calibrated benchmarks per club and skill level (golf)
- Tennis ATP/WTA technical phase benchmarks
- Baseball/softball exit velocity, launch angle, and bat speed benchmarks by age/level
- Practice routine generator with weekly schedule builder
- Drill library per sport and fault type

### Gamified Community System
- Achievement/badge system with 50+ badges across 10 categories (consistency, improvement, data protection, sport mastery, etc.)
- XP and leveling system with event history
- Challenge system (consistency, improvement, data, personal best, skill, team types)
- Activity feed with visibility controls (private / followers / public)
- Groups/clubs with sport filtering and group challenges
- Leaderboards based on improvement % and consistency — not raw scores
- Youth athlete privacy protections (extra data protection flags, separate ranking)
- All community progress included in backup/restore (schema v1.2.0)

### Contextual Help / Tutorial System
- Always-accessible "?" button in mobile top bar and desktop sidebar on every screen
- 20+ screen-specific step-by-step guides (Dashboard, Profile, Equipment, Sessions, Diagnose, Training, Video Analysis, Community, Challenges, Badges, Leaderboard, Data Center, Settings, and more)
- Plain-language content written for athletes, parents, and coaches
- Tutorial progress tracked in Zustand store and included in every backup
- Centralized content registry (`lib/tutorial/content.ts`) for easy additions
- Keyboard accessible — Escape to close, arrow keys to navigate

### Backup & Data Portability (Schema v1.2.0)
- Complete data backup covering all sports, profiles, sessions, equipment, community/gamification, tutorial progress, and settings
- Auto-migration: old backups (v1.0.0, v1.1.0) upgrade automatically on import
- AES-256-GCM password encryption with PBKDF2 (310k iterations, no external deps)
- Merge restore (deduplicates by ID and composite key) and Replace restore
- Enhanced restore preview showing every category with counts
- Security hardening: prototype pollution guard, complexity bomb guard, 50 MB cap
- Backup data registry (`lib/backup/registry.ts`) — centralized contract for future features
- Developer documentation: `docs/BACKUP_SYSTEM.md`

### Infrastructure
- Auth middleware (Supabase-ready, activates on env key presence)
- Rate limiter (in-memory, per-IP)
- CI security scan pipeline
- Admin guard middleware
- IDOR protection on data routes
- 20-language i18n system with RTL support (Arabic, Urdu)

### Image/Table Import
- Image upload page (4-step wizard): drag-and-drop, preview, manual entry, confirm, save
- OCR extraction stub (returns manual entry prompt; real OCR not yet wired)
- normalizeManualEntry utility in packages/core

---

## 30-Day Priorities

### Must Ship
1. **Supabase auth** — replace stub middleware with real Supabase session management (sign up, sign in, magic link, Google OAuth)
2. **Loft autofill live** — wire loft comparison tool to actual Supabase persisted user data
3. **Session persistence** — save imported sessions to Supabase `sessions` table; show in sessions list
4. **OCR integration (basic)** — wire extractTableFromImage to OpenAI Vision API or Google Cloud Vision; show extracted results for user review before saving

### Quality
5. Fix all remaining TypeScript strict-mode errors
6. Mobile layout audit — ensure all pages are usable at 375px width
7. End-to-end test for CSV import → diagnosis flow

---

## 60-Day Priorities

### New Features
1. **Coach / team accounts** — invite athletes, view their sessions, annotate findings
2. **Video storage** — upload swing videos to Supabase Storage; link to sessions
3. **Real OCR pipeline** — production OCR with confidence scores, column mapping suggestions, and user correction UI
4. ~~**Progress tracking**~~ **✅ Done — score trend chart, ball data trends, personal bests, training effectiveness card, handicap estimator all live**
5. ~~**AI Coach chat**~~ **✅ Done — AI Coach now uses real session data, diagnosed faults, and training history**

### Platform
6. Email notifications (session saved, diagnosis complete, weekly summary)
7. Supabase Row Level Security audit
8. ~~GDPR-compliant data export (download all my data as JSON)~~ **✅ Done — full backup system live (v1.2.0)**
9. Account deletion with full data purge

---

## 90-Day Priorities

### Monetization
1. **Free tier** — unlimited analyses, 30-day session history, 3 saved routines
2. **Pro tier** ($12/mo) — unlimited history, video storage, OCR import, AI Coach chat, priority support
3. **Team/Facility tier** ($49/mo) — up to 20 athletes, coach dashboard, aggregate analytics, white-label option
4. Stripe integration (checkout, portal, webhooks)
5. Usage metering hooks for AI API cost management

### Mobile & PWA
6. ~~iOS/Android install prompts with proper PWA manifest~~ **✅ Done — PWA install banner live (beforeinstallprompt)**
7. Offline-first session logging (IndexedDB sync)
8. Push notifications for practice reminders
9. Share card generation (Instagram-ready session summary image)

### API
10. Public API (read-only) for third-party integrations
11. Webhook support for real-time session events

---

## AI Roadmap

### Near Term
- Better diagnostic prompts: chain-of-thought with explicit evidence citations
- Per-user learning profile: adapts drill difficulty and language complexity over time
- Confidence calibration: reduce false positives by requiring minimum sample sizes

### Medium Term
- Pose estimation integration (MediaPipe or similar) for video-based angle extraction
- Video frame analysis: detect swing phases from uploaded video without manual annotation
- Multi-session pattern recognition: identify consistent faults vs. one-off errors

### Longer Term
- Predictive injury risk scoring based on swing pattern + volume data
- Personalized benchmark adjustment based on athlete's physical profile
- LLM fine-tuning on curated sports biomechanics dataset

---

## Monetization Roadmap

| Tier | Price | Key Limits | Target Segment |
|---|---|---|---|
| Free | $0 | 30-day history, 3 routines, basic diagnosis | Self-coached athletes, trial users |
| Pro | $12/mo | Unlimited history, video storage, OCR, AI Chat | Serious amateurs, data-focused athletes |
| Team | $49/mo | 20 athletes, coach dashboard, aggregate analytics | Coaches, training facilities, academies |
| Enterprise | Custom | Unlimited athletes, API access, white-label | Large facilities, collegiate programs |

**Free tier strategy:** Keep diagnosis fully free. Monetize storage, history depth, and collaboration features. Never paywalled: data import, basic drill recommendations, practice schedule.
