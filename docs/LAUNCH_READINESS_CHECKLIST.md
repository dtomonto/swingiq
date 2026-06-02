# SwingIQ Launch Readiness Checklist

This checklist tells you exactly what to do before you open SwingIQ to the public, before you charge users, and for long-term growth. Every item is written in plain English — no developer jargon without an explanation.

---

## What These Categories Mean

- **Must fix before public launch** — If these aren't done, the app will break or users will be confused. Do these first.
- **Should fix before paid users** — If you want to charge money, these protect you legally, financially, and technically.
- **Strategic future enhancement** — Nice-to-have improvements that will help you grow over time.
- **Long-term moat opportunity** — Things that make SwingIQ hard for competitors to copy.

---

## CATEGORY 1: Must Fix Before Public Launch

### 1.1 Supabase Database Setup
- [ ] Create a Supabase account at https://supabase.com (free plan is fine to start)
- [ ] Create a new Supabase project (name it "SwingIQ")
- [ ] Copy the SQL from `server/supabase_schema.sql` and paste it into the Supabase SQL Editor
- [ ] Click "Run" to create all database tables
- [ ] Copy your Supabase URL and keys from the Supabase dashboard (Settings → API)
- [ ] Add them to `apps/web/.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```
- [ ] Test that login and signup work

### 1.2 AI Provider Setup
- [ ] Choose an AI provider: OpenAI (most common) or Anthropic Claude
- [ ] Create an API key at https://platform.openai.com (OpenAI) or https://console.anthropic.com (Anthropic)
- [ ] Add the key to your environment:
  - OpenAI: `OPENAI_API_KEY=sk-...`
  - Anthropic: `ANTHROPIC_API_KEY=sk-ant-...`
- [ ] Test the AI Coach page — type a question and verify it responds

### 1.3 Domain and Deployment
- [ ] Purchase a domain name (e.g., swingiq.app) at Namecheap, Cloudflare, or Google Domains
- [ ] Deploy to Vercel (free tier): https://vercel.com — connect your GitHub repository
- [ ] Add your custom domain in Vercel dashboard (Project → Settings → Domains)
- [ ] Verify SSL certificate is active (the padlock icon shows in the browser)
- [ ] Test all major pages on mobile and desktop

### 1.4 Environment Variables in Production
- [ ] Add all `.env.local` variables to Vercel (Project → Settings → Environment Variables)
- [ ] Never put your API keys in the code itself — only in environment variables
- [ ] Enable "Encrypt sensitive variables" in Vercel

### 1.5 Basic Legal Pages
- [ ] Review and update `apps/web/src/app/privacy/page.tsx` — replace placeholder text with your actual policy
- [ ] Review and update `apps/web/src/app/terms/page.tsx` — replace placeholder text with your actual terms
- [ ] Recommended: Have an attorney review both pages before launch
- [ ] Check that your privacy policy matches how the app actually uses data

### 1.6 Navigation and Dead Ends
- [ ] Visit every page listed in the sidebar and verify it loads without errors
- [ ] Verify the "Back to Dashboard" or home link works on every page
- [ ] Test on a phone: all sidebar items should be accessible via the bottom nav or "More" menu
- [ ] The 404 not-found page shows and has a link back to the dashboard

### 1.7 Contact and Support
- [ ] Update `SECURITY.md` — replace `[Add your security contact email here]` with a real email
- [ ] Create a simple contact/support email address (e.g., support@swingiq.app)
- [ ] Add that email to the `/trust` page and `/privacy` page

### 1.8 Core Feature Smoke Test
- [ ] Sign up as a new user and complete the onboarding
- [ ] Create a golf session and run a diagnosis
- [ ] Upload a short video and verify analysis runs
- [ ] Export your data from Data Center and verify the JSON file downloads
- [ ] Re-import the backup file and verify it restores correctly
- [ ] Switch sports (e.g., to Tennis) and verify the sidebar labels update
- [ ] Open the help guide (the "?" button) and verify it shows relevant content

---

## CATEGORY 2: Should Fix Before Paid Users

### 2.1 Payment Processing
- [ ] Set up Stripe (https://stripe.com) — industry standard, safe for non-developers
- [ ] Create product plans in Stripe dashboard (e.g., "SwingIQ Pro — $9.99/month")
- [ ] Implement Stripe Checkout or Stripe Billing portal
- [ ] Add Stripe webhook handling to verify payments server-side
- [ ] Test with Stripe test cards before going live
- [ ] Display clear pricing on `/pricing` page

### 2.2 User Authentication Security
- [ ] Enable email confirmation in Supabase (Authentication → Settings → Enable email confirmation)
- [ ] Enable Row Level Security (RLS) on all Supabase tables (already defined in schema — just needs to be applied)
- [ ] Set up password reset flow
- [ ] Consider enabling two-factor authentication option for users

### 2.3 Youth and Family Safety
- [ ] The usage category selection (adult / parent-guardian / coach / minor) is already in the app
- [ ] Ensure minor accounts (under 13) cannot access AI features or community without parent confirmation
- [ ] Add a clear age gate check during signup
- [ ] Review COPPA compliance (US law for children under 13): https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy
- [ ] Consider getting legal review for handling minors' data

### 2.4 Data Retention and Deletion
- [ ] Implement a "Delete my account and all data" button in Settings
- [ ] When a user deletes their account, delete all their Supabase data within 30 days
- [ ] Document your data retention policy in the Privacy Policy
- [ ] Test the deletion flow

### 2.5 Terms of Service for Paid Features
- [ ] Add a "by clicking Subscribe you agree to our Terms of Service" step before charging
- [ ] Include refund policy in Terms
- [ ] Include AI disclaimer in Terms: AI coaching is for entertainment/improvement purposes and is not a substitute for professional instruction

### 2.6 Production Monitoring
- [ ] Set up error monitoring (Sentry is free for small projects: https://sentry.io)
  - Add to `apps/web`: `npm install @sentry/nextjs`
  - Follow Sentry's Next.js setup wizard
- [ ] Set up uptime monitoring (free options: Better Uptime, UptimeRobot)
- [ ] Review Vercel Analytics dashboard after launch to see which pages users visit

### 2.7 Security Headers
- [ ] Verify that Vercel (or your host) serves these HTTP security headers:
  - `X-Frame-Options: DENY` (prevents clickjacking)
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - Content Security Policy (CSP) — see `docs/security-automation.md`
- [ ] Test your headers at https://securityheaders.com (enter your domain after launch)

### 2.8 Backups of Production Data
- [ ] Enable Supabase daily automatic backups (available on paid plans)
- [ ] Verify that backups are retained for at least 7 days
- [ ] Test restoring a backup at least once before launch

---

## CATEGORY 3: Strategic Future Enhancement

### 3.1 Email Marketing and Retention
- [ ] Set up a free Mailchimp or ConvertKit account for newsletters
- [ ] Build an email capture on the landing page for "notify me when pro is ready"
- [ ] Create a welcome email sequence for new signups
- [ ] Monthly update email to users (tie to the `/updates` page)

### 3.2 Analytics
- [ ] Add Google Analytics 4 or Plausible (privacy-friendly alternative) to track:
  - Which sports are most popular
  - Where users drop off (funnel analysis)
  - Which features are used most
- [ ] Create a Google Search Console account and submit your sitemap (`/sitemap.xml`)
- [ ] Check that your site is indexed after launch

### 3.3 Coach and Team Dashboard
- [ ] Build a coach-facing view showing all athletes on the coach's roster
- [ ] Allow coaches to add notes to athlete sessions
- [ ] Team leaderboard within a closed group (existing community groups can expand to this)
- [ ] Parent dashboard: simplified view showing child's progress summary

### 3.4 Referral System
- [ ] Create a referral code system ("Invite a friend, both get 1 month free")
- [ ] Track referrals in Supabase
- [ ] Add referral banner to dashboard after 3+ sessions

### 3.5 Premium AI Features
- [ ] "AI Practice Plan" — 4-week personalized plan based on weaknesses
- [ ] "Compare to pro" — overlay your swing stats against professional benchmarks
- [ ] "Progress report" — monthly AI-generated PDF summary
- [ ] "Coach export" — share a session report with your actual coach

### 3.6 Mobile PWA Improvements
- [ ] Test "Add to Home Screen" on both iOS Safari and Android Chrome
- [x] Offline mode shows a friendly banner when there's no internet, and queues network actions to finish on reconnect (IndexedDB outbox) — shipped; verify it on your own device
- [ ] Add push notifications for practice reminders (Web Push API)
- [ ] Test that the app icon and splash screen look correct on phone home screen

### 3.7 Community Moderation
- [ ] Build a reporting flow: "Report this post/user" button in community areas
- [ ] Create an admin page for reviewing reported content (already has admin routes)
- [ ] Set community guidelines (add to `/community` page)
- [ ] Define your moderation policy in Terms of Service

### 3.8 Affiliate and Marketplace Foundation
- [ ] Research golf equipment affiliate programs (Golf Galaxy, Dick's Sporting Goods, PGA Tour Superstore)
- [ ] Add "Shop this club" links to the equipment diagnostic results (non-intrusive)
- [ ] Create a disclosure label ("affiliate link") per FTC guidelines
- [ ] Track clicks in analytics to see which products convert

---

## CATEGORY 4: Long-Term Moat Opportunities

### 4.1 Proprietary Benchmark Database
- **What it is:** Your own database of swing metrics from thousands of SwingIQ users (aggregated, anonymous)
- **Why it matters:** Commercial benchmarks (TrackMan, Arccos) cost millions. Yours grows with your user base.
- **How to start:** Add a field to the database schema that records aggregated swing scores by skill level and sport
- **Goal:** Replace third-party benchmark citations with "SwingIQ Community Benchmarks"

### 4.2 AI Coach Memory
- **What it is:** The AI remembers what you worked on last session and references it next session
- **Why it matters:** Creates an irreplaceable personal relationship between user and app
- **How to start:** Store the last 3 session summaries per user and include them in the AI prompt context
- **Goal:** AI can say "Last week your issue was X — today let's see if it improved"

### 4.3 Multi-Generational Profiles
- **What it is:** A parent can track their child's swing development from ages 10–18 in one app
- **Why it matters:** 12+ years of data creates massive switching costs
- **How to start:** Add "family group" to the auth system — parent account with child sub-accounts
- **Goal:** SwingIQ becomes the "baby book" of athletic development

### 4.4 White-Label for Golf Courses / Schools
- **What it is:** A golf course pays for branded "Pinebrook Golf Academy powered by SwingIQ"
- **Why it matters:** B2B revenue is higher and more predictable than B2C subscriptions
- **How to start:** Extract the theme colors and logo into a config file (already partly done in tailwind.config.js)
- **Goal:** 5 white-label customers at $500/month = $30K ARR

### 4.5 Video Analysis at Scale
- **What it is:** When Supabase AI vision features mature, run real computer vision on uploaded videos
- **Why it matters:** True pose estimation (not just metadata) enables 10x better coaching
- **How to start:** The video analysis system already accepts landmark data — connect a real pose estimation model
- **Goal:** Detect swing faults automatically from video, reducing the need for launch monitor data

### 4.6 Certification and Badging for Coaches
- **What it is:** SwingIQ-certified coaches get a badge they can show students
- **Why it matters:** Creates a professional network effect and marketing channel
- **How to start:** Add a "Certified Coach" flag to the coach user type and design a certification flow
- **Goal:** 100 certified coaches who actively recommend SwingIQ to students

---

## Quick Reference: Priority Order

| Priority | Item | Time to Complete |
|----------|------|-----------------|
| 1 | Supabase database setup | 1–2 hours |
| 2 | AI provider API key | 30 minutes |
| 3 | Deploy to Vercel + domain | 2–4 hours |
| 4 | Update privacy/terms pages | 2–4 hours (plus attorney review) |
| 5 | Security contact email | 15 minutes |
| 6 | Smoke test all features | 2–3 hours |
| 7 | Stripe payment setup | 4–8 hours |
| 8 | Error monitoring (Sentry) | 1–2 hours |
| 9 | Google Search Console + sitemap | 30 minutes |
| 10 | Email list setup | 1 hour |

---

## How to Use This Checklist

1. Print this page or open it in a separate window
2. Work through Category 1 first — nothing else matters until the basics work
3. Check off each item as you complete it
4. When you're ready to charge users, work through Category 2
5. Revisit Category 3 every quarter as a growth roadmap
6. Category 4 items are for Year 2 and beyond — don't rush them

---

*Last updated: May 2026 | See also: `docs/OWNER_TASKS.md`, `docs/BEGINNER_START_HERE.md`, `docs/SECURITY_AND_PRIVACY.md`*
