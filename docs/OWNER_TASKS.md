# SwingIQ — Owner Task Checklist

Use this file to track what you need to do manually vs. what has already been built.

---

## Things Claude Code Has Already Built

- [x] Full monorepo project structure
- [x] Shared core package with TypeScript types
- [x] Universal launch-monitor data schema
- [x] Diagnostic engine with 12+ rules
- [x] Training routine generator
- [x] YouTube drill link generator
- [x] Scoring engine (face control, strike, consistency, etc.)
- [x] CSV import normalizer for all major brands
- [x] Next.js web app — mobile-optimized, works on phone/tablet/computer
- [x] Web dashboard home page
- [x] Web golfer profile form
- [x] Web golf bag manager
- [x] Web CSV import wizard (7-step)
- [x] Web diagnostic results page
- [x] Web training routine page
- [x] Mobile-responsive navigation (hamburger menu on phones, sidebar on desktop)
- [x] Supabase database schema (SQL)
- [x] Row-Level Security for user data
- [x] Environment variable templates
- [x] All beginner documentation

---

## Things You Need to Do Manually

### One-Time Setup

- [ ] Install Node.js on your computer (see BEGINNER_START_HERE.md Step 1)
- [ ] Install VS Code on your computer (see BEGINNER_START_HERE.md Step 2)
- [ ] Create a Supabase account at https://supabase.com
- [ ] Create a new Supabase project named "SwingIQ"
- [ ] Copy your Supabase Project URL (from Supabase → Settings → API)
- [ ] Copy your Supabase anon key (from Supabase → Settings → API)
- [ ] Create the file `apps/web/.env.local` from the `.env.example` template
- [ ] Paste your Supabase URL into `apps/web/.env.local`
- [ ] Paste your Supabase anon key into `apps/web/.env.local`
- [ ] Run the database schema: copy `server/supabase_schema.sql` into Supabase SQL Editor and click Run
- [ ] Open a terminal in VS Code and run: `npm install`

### First Launch

- [ ] In terminal, run: `npm run dev:web`
- [ ] Open a browser and go to: http://localhost:3000
- [ ] Confirm the SwingIQ dashboard appears
- [ ] On your phone, open the same address in a mobile browser to confirm it looks good on a small screen

### First Use

- [ ] Create your golfer profile in the web app
- [ ] Add at least 3 clubs to your bag
- [ ] Export a CSV from your launch monitor (see BEGINNER_START_HERE.md for instructions per device)
- [ ] Import the CSV using the Import Data wizard
- [ ] Run the diagnostic engine on the imported session
- [ ] Review the primary diagnosis
- [ ] Click through to the training routine
- [ ] Open at least one YouTube drill link

---

## Things You Need to Sign Up For

- [ ] **Supabase** (free plan) — https://supabase.com — for database storage
- [ ] **Vercel** (free plan) — https://vercel.com — ONLY needed if you want to share the web app with others over the internet (not required for personal use)

---

## Things You Need to Copy and Paste

### From Supabase:
- Your Project URL → paste into `apps/web/.env.local`
- Your anon key → paste into `apps/web/.env.local`
- The entire contents of `server/supabase_schema.sql` → paste into Supabase SQL Editor

### Into VS Code terminal:
- `npm install` — installs all software packages
- `npm run dev:web` — starts the web app

---

## Things to Test After Setup

- [ ] Web app loads at http://localhost:3000
- [ ] "My Profile" page loads and the form works
- [ ] "Golf Bag" page loads and you can add a club
- [ ] "Import Data" wizard runs through all 7 steps
- [ ] "Diagnose" page shows a diagnosis after import
- [ ] "Training" page shows the routine and YouTube links
- [ ] Web app looks good on your phone (open http://localhost:3000 in your phone's browser while on the same Wi-Fi network)

---

## Things You Don't Need to Worry About Yet

These are for later phases:

- [ ] Deploying to the internet (sharing with others) — MVP 2+
- [ ] Connecting a real AI model (OpenAI) — MVP 3+
- [ ] Video analysis — MVP 3
- [ ] 3D avatar model — MVP 4
- [ ] Coach sharing features — MVP 5
- [ ] Setting up custom email/domain
- [ ] Paying for any services (Supabase free plan is sufficient for personal use)

---

## If Something Goes Wrong

See **TROUBLESHOOTING.md** for solutions to common problems.

If you are stuck, describe exactly:
1. What step you were on
2. What you typed or clicked
3. What happened (copy/paste any error message you see)

Common issues and solutions are listed in TROUBLESHOOTING.md.
