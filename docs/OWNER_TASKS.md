# SwingIQ — Owner Task Checklist

Use this file to track what has already been built and what you still need to set up manually.

---

## ✅ Already Built — No Action Required

### Core Platform
- [x] Multi-sport platform: golf, tennis, baseball, slow pitch softball, fast pitch softball
- [x] Sport context — switching sport changes the entire app experience
- [x] Turborepo monorepo with `@swingiq/core` package and `apps/web` Next.js 15 app
- [x] Zustand state management with localStorage persistence (works offline, no Supabase required)
- [x] Mobile-optimized responsive layout — works on any phone, tablet, or desktop

### Golf Features
- [x] CSV import wizard (7-step, supports all major launch monitor brands)
- [x] Diagnostic engine with 24 issue categories (face, path, strike, launch, spin, dispersion)
- [x] Training routine generator (personalized to diagnosis + skill level)
- [x] Shot dispersion chart (SVG scatter plot with 95% confidence ellipse)
- [x] Club gap analysis (carry gaps between clubs, ideal/too-large/too-close status)
- [x] Swing scores (overall, face control, path control, strike quality, consistency, dispersion)
- [x] Stroke savings potential per diagnosis
- [x] Training effectiveness tracker (before/after comparison on target metric)
- [x] Score trend chart (SVG line chart across sessions)
- [x] Personal bests and handicap estimate
- [x] Pre-round warm-up generator (personalized to active diagnosis)
- [x] Practice schedule generator (7-day, configurable frequency and session length)
- [x] **Golf bag loft autofill** — 30+ model-specific specs, generic defaults for all club types, loft source/confidence labels, manual override, reset to default
- [x] **Loft Gapping view** — color-coded gap analysis with recommendations (Equipment page → "Loft Gapping" tab)

### Multi-Sport Diagnostic Engines
- [x] Tennis: 24 issue categories (split step, unit turn, racquet path, serve trophy, recovery, etc.)
- [x] Baseball: 24 issue categories (load, stride, hip-shoulder separation, bat path, contact point, etc.)
- [x] Slow Pitch Softball: 24 issue categories (arc timing, pitch tracking, line-drive bat path, etc.)
- [x] Fast Pitch Softball: 24 issue categories (compact launch, quick load, timing pressure, etc.)
- [x] All engines return sport-specific severity, confidence, evidence, and drill recommendations

### Multi-Sport Features
- [x] Sport-specific profile forms (golf, tennis, baseball, slow pitch, fast pitch)
- [x] Sport-specific dashboard for all 5 sports
- [x] Sport-aware sessions page (filtered by active sport, toggle to view all)
- [x] Sport-specific empty states and CTAs throughout
- [x] Non-golf training page with sport-specific drill checklist
- [x] Non-golf progress tracker (video analysis score trends, recurring issues)
- [x] Non-golf pre-game warm-up checklists (tennis, baseball, slow pitch, fast pitch)
- [x] Non-golf session log page (manual entry)
- [x] Sport-specific camera angle selector in video analyzer
- [x] Sport-specific milestones (golf: clubs/shots; non-golf: videos/analyses)

### Video Analysis
- [x] Video upload and playback with sport-specific phase timeline
- [x] Heuristic swing analysis for all 5 sports
- [x] Phase-by-phase coaching panels (issues, phase tips, drills)
- [x] Sport-specific issue detection with confidence labels
- [x] Drill recommendations from video analysis
- [x] Honest "estimated" labels throughout

### AI Coach
- [x] Five sport-specific system prompts
- [x] Answers grounded in actual data (launch monitor stats or video analysis results)
- [x] Rate limiting and off-topic guardrails
- [x] Works with OpenAI (GPT-4o-mini) or Anthropic (Claude)
- [x] Data-grounded placeholder responses when no API key is configured

### Screenshot / Image Import
- [x] Upload photos of performance tables from FlightScope, TrackMan, Foresight, HitTrax, Rapsodo, Blast Motion, Zepp, spreadsheets, and more (Settings → Import from Image)
- [x] Manual review and edit before any data is saved
- [x] 4-step wizard: Upload → Review → Confirm → Analyze
- [x] Auto-extraction (OCR) service layer is built — requires API key integration to activate

### Backup & Restore
- [x] Full data backup (all sports, profiles, sessions, analyses, drills, settings)
- [x] Optional AES-256-GCM password encryption (PBKDF2, 310k iterations — no external dependencies)
- [x] Merge restore (add backup to current data) and Replace restore (overwrite with confirmation)
- [x] Smart duplicate detection (by ID, sport, date, source)
- [x] Multi-device portability — backup on one device, restore on another
- [x] Found at: **Settings → Backup & Restore**

### Professional Swing Reference Library
- [x] 32 seeded professional athlete profiles across all 5 sports
- [x] Filter by sport, sex, movement type, handedness, and style tags
- [x] "Pending Admin Verification" overlay on unverified entries
- [x] YouTube search fallback for all entries (no fake video IDs)
- [x] Privacy-enhanced YouTube embeds for any future verified videos

### Side-by-Side Swing Comparison
- [x] Upload your swing video or select from analysis history
- [x] Browse and select a professional reference
- [x] Side-by-side layout (stacked on mobile, side-by-side on desktop)
- [x] Sport-specific phase checklist
- [x] Honest limitation notice (professional video frames are not AI-analyzed)
- [x] Found at: **Compare & References** in the sidebar

### Public Marketing & SEO Pages
- [x] Homepage (`/`) with JSON-LD structured data (WebApplication + FAQPage)
- [x] How It Works page (`/how-it-works`)
- [x] Sport-specific SEO pages: `/golf-swing-analysis`, `/tennis-swing-analysis`, `/baseball-swing-analysis`, `/softball-swing-analysis`
- [x] Pricing page (`/pricing`) — free tier + Pro coming soon
- [x] Parents/youth safety page (`/parents`)
- [x] Privacy policy (`/privacy`)
- [x] Terms of service (`/terms`)

### Security
- [x] Security headers on all responses (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CORP, COOP)
- [x] Production source maps disabled
- [x] Admin panel protected by ADMIN_SECRET environment variable
- [x] Supabase session middleware (activates automatically when env keys are set)
- [x] Rate limiting on AI Coach and video analysis endpoints
- [x] Automated CI: Gitleaks secret scan + npm audit + CodeQL + custom security scanner
- [x] Dependabot configured for weekly automated dependency updates
- [x] Supabase RLS migration SQL ready to apply (`apps/web/supabase-rls.sql`)

### Analytics
- [x] 30-event analytics abstraction (`apps/web/src/lib/analytics.ts`)
- [x] Ready to connect to PostHog, GA4, Segment, or Mixpanel

### Documentation
- [x] README.md (full architecture + feature overview + setup guide)
- [x] PRODUCT_ROADMAP.md (30/60/90-day + AI + monetization)
- [x] ANALYTICS_PLAN.md (event taxonomy, funnels, KPIs)
- [x] SEO_AEO_GEO_PLAN.md (page map, structured data, content clusters)
- [x] COMPETITIVE_POSITIONING.md (category framing, differentiation)
- [x] ADMIN_OPERATIONS_ROADMAP.md (video verification, data ops, support)
- [x] SECURITY.md (vulnerability reporting, rotation guide, hardening checklist)
- [x] docs/security-automation.md (CI/CD workflow guide + branch protection steps)

---

## 📋 Manual Steps Required — Work Through In Order

### 🔴 Priority 1 — Do Right Now

- [ ] **Rotate your OpenAI API key**
  - Go to https://platform.openai.com/api-keys
  - Delete the current key and generate a new one
  - Update `apps/web/.env.local` with the new key
  - Update the key in your Vercel project environment variables
  - *Why: the previous key was in a local plaintext file and should be treated as compromised*

### 🟠 Priority 2 — Before Pushing to GitHub

- [ ] **Update CODEOWNERS**
  - Open `.github/CODEOWNERS`
  - Replace all 9 instances of `@REPLACE_WITH_GITHUB_USERNAME` with your actual GitHub username
  - Save the file

### 🟡 Priority 3 — After Pushing to GitHub (GitHub Settings)

- [ ] **Enable branch protection on `master`**
  - GitHub → Settings → Branches → Add rule
  - Branch name pattern: `master`
  - ✓ Require a pull request before merging
  - ✓ Require status checks: `security-audit` and `CodeQL` must pass
  - ✓ Restrict who can push directly to `master`
  - ✓ Restrict force pushes

- [ ] **Enable GitHub secret scanning**
  - GitHub → Settings → Security → Secret scanning → Enable

- [ ] **Enable Dependabot alerts + automatic security updates**
  - GitHub → Settings → Security → Dependabot → Enable alerts
  - GitHub → Settings → Security → Dependabot → Enable automatic security updates

- [ ] **Enable private vulnerability reporting**
  - GitHub → Settings → Security → Private vulnerability reporting → Enable

### 🟢 Priority 4 — When You Connect Supabase

- [ ] **Run the RLS migration**
  - Go to your Supabase project → SQL Editor
  - Paste the entire contents of `apps/web/supabase-rls.sql`
  - Click Run

- [ ] **Set storage buckets to private**
  - Supabase Dashboard → Storage → each bucket → Policies → Private (not Public)

- [ ] **Add Supabase keys to Vercel**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - Redeploy after adding
  - *The auth middleware in `middleware.ts` activates automatically once these keys are present*

### 🔵 Priority 5 — Before Going Live

- [ ] **Set ADMIN_SECRET**
  - Run: `openssl rand -hex 32`
  - Add the result to `apps/web/.env.local` as `ADMIN_SECRET=<result>`
  - Add the same value to Vercel environment variables

- [ ] **Set CRON_SECRET**
  - Run: `openssl rand -hex 32`
  - Add to `.env.local` and Vercel as `CRON_SECRET=<result>`
  - Update Vercel cron job configuration to use this secret

- [ ] **Replace `[Add contact email]` placeholders**
  - `apps/web/src/app/privacy/page.tsx`
  - `apps/web/src/app/terms/page.tsx`
  - `apps/web/src/app/parents/page.tsx`
  - `apps/web/src/app/pricing/page.tsx`
  - `SECURITY.md`

- [ ] **Verify professional swing references**
  - Open `packages/core/src/sports/professional-references.ts`
  - For each athlete, find a real YouTube video URL
  - Replace `PLACEHOLDER_REQUIRES_ADMIN_VERIFICATION` with the actual video ID
  - Set `verified: true` and `requiresVerification: false`
  - See `ADMIN_OPERATIONS_ROADMAP.md` for the full verification workflow

### ⚪ Priority 6 — Legal Review (Before Commercial Launch)

- [ ] **Privacy policy attorney review**
  - `apps/web/src/app/privacy/page.tsx` is a practical placeholder
  - Get legal counsel review before collecting user data commercially
  - Especially important for GDPR (EU), CCPA (California), COPPA (under-13 users)

- [ ] **Terms of service attorney review**
  - `apps/web/src/app/terms/page.tsx` is a practical placeholder

---

## 🔧 Developer Setup (First Time)

- [ ] Install Node.js 18+ from https://nodejs.org
- [ ] Run `npm install` from the repo root
- [ ] Copy `apps/web/.env.example` → `apps/web/.env.local`
- [ ] Run `npm run dev:web` — open http://localhost:3000

---

## 🚀 Deploy to Vercel

- [ ] Sign in at https://vercel.com with GitHub
- [ ] Import the `swingiq` repository
- [ ] Leave all build settings as defaults (vercel.json handles everything)
- [ ] Add environment variables before deploying (at minimum: `OPENAI_API_KEY`, `AI_PROVIDER=openai`)
- [ ] Deploy — takes ~2 minutes
- [ ] Update `NEXT_PUBLIC_APP_URL` to your Vercel URL in environment variables → Redeploy

> After setup, every push to GitHub `master` auto-deploys to Vercel within 2 minutes.

---

## 📱 Add to Phone Home Screen (PWA)

**iPhone (Safari):** Open SwingIQ → tap Share → "Add to Home Screen" → Add

**Android (Chrome):** Open SwingIQ → three-dot menu → "Add to Home Screen"

---

## 🧪 Post-Setup Test Checklist

- [ ] App loads at http://localhost:3000
- [ ] Switching sports changes the dashboard
- [ ] Golf import wizard runs (7 steps)
- [ ] Video analyzer works for a non-golf sport
- [ ] AI Coach responds (placeholder or live depending on key)
- [ ] Settings → Backup & Restore — download a backup file
- [ ] Equipment → Loft Gapping tab shows club gaps
- [ ] Compare & References → Browse References shows athlete cards
- [ ] Homepage (/) shows the public landing page (not the dashboard)
