# SwingIQ — Owner Task Checklist

Use this file to track what has already been built and what you still need to set up manually.

---

## ✅ Already Built — No Action Required

### Core Platform
- [x] Multi-sport platform: golf, tennis, baseball, slow pitch softball, fast pitch softball
- [x] Sport context — switching sport changes the entire app experience
- [x] Turborepo monorepo with `@swingiq/core` package and `apps/web` Next.js app
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
- [x] Golf: answers grounded in launch monitor stats
- [x] Non-golf: answers grounded in video analysis results and sport profile
- [x] Sport-specific suggested questions
- [x] Rate limiting and off-topic guardrails
- [x] Works with OpenAI (GPT-4o-mini) or Anthropic (Claude)
- [x] Data-grounded placeholder responses when no API key is configured

### All Pages
- [x] Dashboard, Profile, Equipment (Bag), Sessions, Import/Log, Video Analysis
- [x] Diagnose, Training, Practice Schedule, Pre-Round/Pre-Game
- [x] Drill Library (80+ drills, sport-filtered), Progress, Milestones
- [x] Compare Sessions, AI Coach, Reports (with copy-to-clipboard coach report)
- [x] Settings (units, coaching style, full data export)
- [x] Avatar page, Login/Signup pages

---

## 📋 Things You Need to Do Manually

### Task 1: Get the App Running Locally

- [ ] Install Node.js from https://nodejs.org (choose "LTS")
- [ ] Install VS Code from https://code.visualstudio.com
- [ ] Open the `swingiq` folder in VS Code
- [ ] Open a terminal in VS Code (Terminal → New Terminal)
- [ ] Run: `npm install`
- [ ] Copy `apps/web/.env.example` → rename copy to `apps/web/.env.local`
- [ ] Run: `npm run dev:web`
- [ ] Open http://localhost:3000 — confirm the dashboard appears

### Task 2: Enable the AI Coach (5 minutes, pick one)

The AI Coach works without a key (returns data-grounded placeholder responses). To enable live AI answers:

**Option A — OpenAI (recommended, slightly cheaper):**
- [ ] Go to https://platform.openai.com/api-keys and create an API key
- [ ] Add a small credit balance ($5–10 lasts months at SwingIQ usage rates)
- [ ] In `apps/web/.env.local`, set:
  ```
  AI_PROVIDER=openai
  OPENAI_API_KEY=sk-your-key-here
  ```

**Option B — Anthropic (Claude):**
- [ ] Go to https://console.anthropic.com and create an API key
- [ ] In `apps/web/.env.local`, set:
  ```
  AI_PROVIDER=anthropic
  ANTHROPIC_API_KEY=sk-ant-your-key-here
  ```

- [ ] Restart the dev server (`Ctrl+C` then `npm run dev:web`)
- [ ] Test: open the AI Coach page and ask a question

### Task 3: Deploy to the Internet with Vercel (10 minutes)

Vercel lets you access SwingIQ from any device, anywhere — not just your home computer.

> **Good news:** The project now includes a `vercel.json` configuration file. Vercel will automatically use the correct build command and output directory — **no manual overrides needed**.

- [ ] Create a free account at https://vercel.com (sign in with GitHub)
- [ ] Click **Add New → Project**
- [ ] Import `dtomonto/swingiq` from GitHub
- [ ] On the "Configure Project" screen, **leave all build settings at their defaults** — the `vercel.json` in the repo handles everything automatically
- [ ] Add these environment variables before clicking Deploy:
  - `NEXT_PUBLIC_APP_URL` = `https://your-app-name.vercel.app` *(update after first deploy)*
  - `AI_PROVIDER` = `openai`
  - `OPENAI_API_KEY` = your key *(copy from `apps/web/.env.local`)*
- [ ] Click **Deploy** — takes about 2 minutes
- [ ] When it finishes, copy your real Vercel URL (e.g. `swingiq-dtomonto.vercel.app`)
- [ ] Go to **Settings → Environment Variables** → update `NEXT_PUBLIC_APP_URL` to your real URL
- [ ] Go to **Deployments** → click three dots on latest → **Redeploy**
- [ ] Open your Vercel URL on your phone to confirm it works

> After this, every push to GitHub `master` automatically deploys to Vercel within 2 minutes.

### Task 4: Set Up Supabase for Cloud Data Storage (optional, 20 minutes)

Supabase is optional. Without it, all data is saved in your browser's localStorage — it works perfectly for personal use on one device. Add Supabase when you want cloud backup or multi-device access.

- [ ] Create a free account at https://supabase.com
- [ ] Click **New project** → name it `swingiq`, choose a region, set a database password
- [ ] Wait ~1 minute for the project to provision
- [ ] Go to **Settings → API** and copy:
  - **Project URL** (looks like `https://abcxyz.supabase.co`)
  - **anon public** key (long string starting with `eyJ`)
  - **service_role** key (keep this secret)
- [ ] Add to `apps/web/.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://abcxyz.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  ```
- [ ] In Supabase, go to **SQL Editor → New query**
- [ ] Open `server/supabase_schema.sql` in VS Code, copy all the content, paste into Supabase SQL Editor, click **Run**
- [ ] Add the same Supabase env vars to your Vercel project (Settings → Environment Variables → Redeploy)

---

## 🧪 Things to Test After Each Step

### After local setup:
- [ ] App loads at http://localhost:3000
- [ ] Switch to tennis sport — dashboard changes
- [ ] Switch back to golf — dashboard shows golf content
- [ ] "My Profile" shows sport-appropriate fields
- [ ] Import wizard runs (golf) or log session page loads (non-golf)

### After AI key is added:
- [ ] Open AI Coach page
- [ ] Ask: "What should I work on today?"
- [ ] Confirm response is relevant to your sport (not generic placeholder)

### After Vercel deployment:
- [ ] App loads at your Vercel URL on a different device (phone, tablet)
- [ ] Sport switcher works on mobile
- [ ] All pages load without errors

### After Supabase setup:
- [ ] Data entered on one device appears on another device after refresh

---

## 📱 Optional: Add to Phone Home Screen

SwingIQ is a PWA (Progressive Web App) — you can add it to your home screen.

**iPhone (Safari):**
1. Open the Vercel URL in Safari
2. Tap the Share icon (box with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add"

**Android (Chrome):**
1. Open the Vercel URL in Chrome
2. Tap the three-dot menu
3. Tap "Add to Home Screen"

It will open full-screen, just like a native app.

---

## 💡 Tips for Getting the Most Out of SwingIQ

- **Consistency beats volume.** One session per week analyzed correctly beats ten sessions ignored.
- **Pick one sport at a time.** The sport switcher is there, but focus on your primary sport first.
- **For golf:** import after every range session, even a short one.
- **For non-golf:** any video at a side angle gives the most useful analysis.
- **Use the Pre-Game Warm-Up** page before practices. It takes 10–15 minutes and tunes you into your current focus.
- **Share your coach report.** The Reports page generates a formatted text summary to paste into a message to your coach.
