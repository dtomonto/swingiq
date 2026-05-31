# SwingIQ Product Roadmap

_Last updated: May 2026_

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

### Infrastructure
- Auth middleware (Supabase-ready)
- Rate limiter (in-memory, per-IP)
- Backup encryption system (AES-256 stub)
- CI security scan pipeline
- Admin guard middleware
- IDOR protection on data routes

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
4. **Progress tracking** — session-over-session trend charts for key metrics
5. **AI Coach chat** — context-aware chat with session data injected into prompt

### Platform
6. Email notifications (session saved, diagnosis complete, weekly summary)
7. Supabase Row Level Security audit
8. GDPR-compliant data export (download all my data as JSON)
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
6. iOS/Android install prompts with proper PWA manifest
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
