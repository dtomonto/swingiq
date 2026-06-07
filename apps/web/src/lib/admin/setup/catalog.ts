// ============================================================
// SwingVantage Admin — Setup & Next Steps: the catalog (single source)
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   This is the hand-written list of "things the owner might need to do",
//   written for a beginner. Each entry says what it is, why it matters,
//   the exact steps, and the exact things to copy/paste — and declares
//   how the hub checks whether it's already done (so connected keys show
//   a green "Done" with no ticking required).
//
//   To ADD a future item: append one object here (or, for a feature
//   shipped in a commit, use a `Setup:` commit trailer — see
//   scripts/scan-setup.mjs — and it appears automatically). Keep the
//   wording plain: imagine explaining it to someone who has never touched
//   a terminal.
//
//   Honesty rule (matches the rest of the app): every env name and file
//   path below is real. We never invent a step or claim something is
//   required when it is optional.
// ============================================================

import type { SetupTask } from './types';

export const CATALOG: SetupTask[] = [
  // ── Go-live essentials ─────────────────────────────────────
  {
    id: 'admin-protect',
    title: 'Lock down the admin dashboard for production',
    plainEnglish:
      'Right now anyone who finds the /admin web address could open it once the site is live. Adding an admin allowlist (or secret) means only you can get in. This is the single most important thing to set before launch.',
    category: 'go-live',
    priority: 'required',
    detect: { kind: 'derived', key: 'admin-protected' },
    steps: [
      'Open your hosting dashboard (Vercel) → your project → Settings → Environment Variables.',
      'Add ADMIN_EMAILS and set it to the email address you log in with (comma-separate more than one).',
      'Optional belt-and-braces: also add ADMIN_SECRET — a long random string. Generate one by running: openssl rand -hex 32',
      'Save, then redeploy so the change takes effect.',
    ],
    inputs: [
      { kind: 'env', value: 'ADMIN_EMAILS', example: 'you@example.com', where: 'Vercel → Settings → Environment Variables' },
      { kind: 'env', value: 'ADMIN_SECRET', secret: true, example: '(32+ random characters)', where: 'Vercel → Settings → Environment Variables' },
      { kind: 'command', value: 'openssl rand -hex 32', label: 'Generate a random secret' },
    ],
    learnMoreHref: '/admin/security',
    learnMoreLabel: 'Security & Roles',
  },
  {
    id: 'supabase-connect',
    title: 'Connect accounts & cloud sync (Supabase)',
    plainEnglish:
      'Without this, SwingVantage works but every athlete\'s data lives only on their own device. Connecting Supabase turns on real sign-in accounts and syncs each user\'s data to the cloud so nothing is lost.',
    category: 'go-live',
    priority: 'required',
    detect: { kind: 'capability', cap: 'auth' },
    steps: [
      'Create a free project at supabase.com.',
      'In Supabase, open Settings → API and copy the Project URL and the anon/public key.',
      'In Vercel → Settings → Environment Variables, add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      'Redeploy. The dashboard will flip from "Local mode" to "Live data".',
    ],
    inputs: [
      { kind: 'url', value: 'https://supabase.com/dashboard', label: 'Open Supabase' },
      { kind: 'env', value: 'NEXT_PUBLIC_SUPABASE_URL', example: 'https://your-project-id.supabase.co', where: 'Supabase → Settings → API' },
      { kind: 'env', value: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', example: 'eyJhbGciOi… (public, safe in browser)', where: 'Supabase → Settings → API' },
    ],
    learnMoreHref: '/admin/integrations',
    learnMoreLabel: 'Integrations',
  },
  {
    id: 'supabase-service-role',
    title: 'Turn on cross-user admin data (Service Role key)',
    plainEnglish:
      'This is what fills the Command Center with real numbers (total accounts, swing analyses, sport usage) instead of blanks. It is a powerful secret key, so it lives server-side only and is never shown in the browser.',
    category: 'go-live',
    priority: 'recommended',
    detect: { kind: 'env', anyOf: ['SUPABASE_SERVICE_ROLE_KEY'] },
    steps: [
      'In Supabase, open Settings → API and copy the service_role key (under "Project API keys").',
      'In Vercel → Settings → Environment Variables, add SUPABASE_SERVICE_ROLE_KEY.',
      'IMPORTANT: never put NEXT_PUBLIC_ in front of this name — that would expose it. Keep it as-is.',
      'Redeploy. The Command Center metrics will populate.',
    ],
    inputs: [
      { kind: 'env', value: 'SUPABASE_SERVICE_ROLE_KEY', secret: true, example: 'eyJhbGciOi… (KEEP SECRET)', where: 'Supabase → Settings → API → service_role' },
    ],
    learnMoreHref: '/admin/integrations',
    learnMoreLabel: 'Integrations',
  },
  {
    id: 'prod-urls',
    title: 'Point the app at your real domain',
    plainEnglish:
      'These two settings tell SwingVantage its public web address. They power correct links in Google results, the sitemap, and the page users return to after signing in or paying. Out of the box they point at localhost (your own computer), which is wrong once live.',
    category: 'go-live',
    priority: 'recommended',
    detect: { kind: 'derived', key: 'prod-urls' },
    steps: [
      'In Vercel → Settings → Environment Variables, set NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_APP_URL to your production address.',
      'Use the full https:// address with no trailing slash.',
      'Redeploy.',
    ],
    inputs: [
      { kind: 'env', value: 'NEXT_PUBLIC_SITE_URL', example: 'https://swingvantage.com', where: 'Vercel → Settings → Environment Variables' },
      { kind: 'env', value: 'NEXT_PUBLIC_APP_URL', example: 'https://swingvantage.com', where: 'Vercel → Settings → Environment Variables' },
    ],
  },

  // ── AI features ────────────────────────────────────────────
  {
    id: 'ai-vision',
    title: 'Turn on real AI swing analysis (video & photo)',
    plainEnglish:
      'This is the core promise of the product: real AI feedback on a swing video. Until a vision provider key is set, the analyzer honestly says it is not configured rather than inventing feedback.',
    category: 'ai',
    priority: 'recommended',
    detect: { kind: 'capability', cap: 'aiVision' },
    steps: [
      'Pick a provider: Anthropic, OpenAI, or Google. Create an API key in their console.',
      'In Vercel → Settings → Environment Variables, set AI_VISION_PROVIDER to anthropic, openai, or google.',
      'Add the matching key: ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_AI_API_KEY.',
      'Redeploy, then run a test analysis from the app.',
      'TIP: set a spend cap too (see "Cap daily AI spending") so a busy day can never surprise you with a bill.',
    ],
    inputs: [
      { kind: 'env', value: 'AI_VISION_PROVIDER', example: 'anthropic | openai | google', where: 'Vercel → Settings → Environment Variables' },
      { kind: 'env', value: 'ANTHROPIC_API_KEY', secret: true, where: 'console.anthropic.com' },
      { kind: 'env', value: 'OPENAI_API_KEY', secret: true, where: 'platform.openai.com/api-keys' },
      { kind: 'env', value: 'GOOGLE_AI_API_KEY', secret: true, where: 'aistudio.google.com/app/apikey' },
    ],
    learnMoreHref: '/admin/integrations',
    learnMoreLabel: 'Integrations',
  },
  {
    id: 'ai-coach',
    title: 'Turn on the live AI Coach',
    plainEnglish:
      'Lets the AI Coach write warm, tailored responses. Without a key it still works, using data-grounded template answers — so this is an upgrade, not a requirement.',
    category: 'ai',
    priority: 'optional',
    detect: { kind: 'capability', cap: 'aiCoach' },
    steps: [
      'In Vercel → Settings → Environment Variables, set AI_PROVIDER to openai or anthropic.',
      'Add the matching key (OPENAI_API_KEY or ANTHROPIC_API_KEY). If you already set up AI swing vision, you can reuse the same key.',
      'Redeploy.',
    ],
    inputs: [
      { kind: 'env', value: 'AI_PROVIDER', example: 'openai | anthropic', where: 'Vercel → Settings → Environment Variables' },
      { kind: 'env', value: 'OPENAI_API_KEY', secret: true, where: 'platform.openai.com/api-keys' },
      { kind: 'env', value: 'ANTHROPIC_API_KEY', secret: true, where: 'console.anthropic.com' },
    ],
  },
  {
    id: 'ocr',
    title: 'Turn on photo import (read numbers off a launch-monitor photo)',
    plainEnglish:
      'Lets users snap a photo of a launch-monitor screen and have the numbers read in automatically instead of typing them. It reuses whichever AI key you already set, so if AI swing vision is on, this often needs nothing extra.',
    category: 'ai',
    priority: 'optional',
    detect: { kind: 'capability', cap: 'ocr' },
    steps: [
      'If you already enabled AI swing vision, photo import already works — you are done.',
      'Otherwise set OCR_PROVIDER (anthropic | openai | google) and add that provider\'s key.',
      'Redeploy. Every extracted value still asks the user to confirm before saving.',
    ],
    inputs: [
      { kind: 'env', value: 'OCR_PROVIDER', example: 'anthropic | openai | google', where: 'Vercel → Settings → Environment Variables' },
    ],
  },
  {
    id: 'ai-budget',
    title: 'Cap daily AI spending (recommended safety net)',
    plainEnglish:
      'A global kill-switch that stops all AI calls for the day once they hit a dollar amount you choose. With a tiny ad budget and free-user goals, this protects you from any surprise bill. Set it in cents (e.g. 500 = $5/day).',
    category: 'ai',
    priority: 'recommended',
    detect: { kind: 'derived', key: 'ai-budget' },
    steps: [
      'In Vercel → Settings → Environment Variables, add AI_DAILY_BUDGET_CENTS.',
      'Set it to your daily ceiling in cents — for example 500 for $5 a day.',
      'Redeploy. Once the day\'s spend hits the cap, AI routes pause until tomorrow (the rest of the app keeps working).',
    ],
    inputs: [
      { kind: 'env', value: 'AI_DAILY_BUDGET_CENTS', example: '500  (= $5.00 / day)', where: 'Vercel → Settings → Environment Variables' },
    ],
    learnMoreHref: '/admin/system-health',
    learnMoreLabel: 'System Health',
  },

  // ── Email ──────────────────────────────────────────────────
  {
    id: 'email-resend',
    title: 'Send emails (sign-in links, captures) via Resend',
    plainEnglish:
      'Turns on real email delivery — the messages users get when they sign up or reset a password, plus email capture. Without it, captured emails are accepted but not stored or sent.',
    category: 'email',
    priority: 'recommended',
    detect: { kind: 'capability', cap: 'email' },
    steps: [
      'Create a free account at resend.com and add your sending domain (follow their DNS steps).',
      'Create an API key, and find your Audience ID under Audiences.',
      'In Vercel → Settings → Environment Variables, add RESEND_API_KEY and RESEND_AUDIENCE_ID.',
      'Redeploy.',
    ],
    inputs: [
      { kind: 'url', value: 'https://resend.com', label: 'Open Resend' },
      { kind: 'env', value: 'RESEND_API_KEY', secret: true, where: 'Resend → API Keys' },
      { kind: 'env', value: 'RESEND_AUDIENCE_ID', where: 'Resend → Audiences' },
    ],
    learnMoreHref: '/admin/integrations',
    learnMoreLabel: 'Integrations',
  },
  {
    id: 'contact-inbox',
    title: 'Receive messages from the contact form',
    plainEnglish:
      'Sets where /contact submissions are emailed. Use a forwarding role address (like support@swingvantage.com) that points at your private inbox — never put your private email here, as it would be in your settings.',
    category: 'email',
    priority: 'optional',
    detect: { kind: 'env', anyOf: ['CONTACT_TO_EMAIL'] },
    steps: [
      'Make sure Resend email (above) is set up first — the contact form sends through it.',
      'In Vercel → Settings → Environment Variables, add CONTACT_TO_EMAIL with the address that should receive messages.',
      'Optionally set CONTACT_FROM_EMAIL to a Resend-verified sender.',
      'Redeploy and send yourself a test from /contact.',
    ],
    inputs: [
      { kind: 'env', value: 'CONTACT_TO_EMAIL', example: 'support@swingvantage.com', where: 'Vercel → Settings → Environment Variables' },
      { kind: 'env', value: 'CONTACT_FROM_EMAIL', example: 'SwingVantage <noreply@swingvantage.com>', where: 'Vercel → Settings → Environment Variables' },
    ],
  },

  // ── Growth & money ─────────────────────────────────────────
  {
    id: 'analytics',
    title: 'Measure your traffic (analytics)',
    plainEnglish:
      'See how many people visit and what they do. Plausible is recommended because it is privacy-friendly and needs no cookie banner — a good fit since SwingVantage has junior athletes. Any one provider is enough.',
    category: 'growth',
    priority: 'recommended',
    detect: { kind: 'derived', key: 'analytics-any' },
    steps: [
      'Recommended: create a site at plausible.io and set NEXT_PUBLIC_PLAUSIBLE_DOMAIN to your domain.',
      'Or use Google Analytics (NEXT_PUBLIC_GA_ID) — pair with a cookie banner in the EU.',
      'Or PostHog product analytics (NEXT_PUBLIC_POSTHOG_KEY).',
      'Add one in Vercel → Settings → Environment Variables and redeploy.',
    ],
    inputs: [
      { kind: 'env', value: 'NEXT_PUBLIC_PLAUSIBLE_DOMAIN', example: 'swingvantage.com', where: 'Vercel → Settings → Environment Variables' },
      { kind: 'env', value: 'NEXT_PUBLIC_GA_ID', example: 'G-XXXXXXXXXX', where: 'Vercel → Settings → Environment Variables' },
      { kind: 'env', value: 'NEXT_PUBLIC_POSTHOG_KEY', secret: true, where: 'Vercel → Settings → Environment Variables' },
    ],
    learnMoreHref: '/admin/analytics',
    learnMoreLabel: 'Analytics',
  },
  {
    id: 'search-console',
    title: 'Verify the site in Google Search Console',
    plainEnglish:
      'Lets you submit your sitemap to Google and watch your search traffic. The simplest method is a verification meta tag — you only paste the token here.',
    category: 'growth',
    priority: 'optional',
    detect: { kind: 'derived', key: 'gsc-verify' },
    steps: [
      'Go to Google Search Console and add your domain as a property.',
      'Choose the "HTML tag" verification method and copy ONLY the token from the content="…" value.',
      'In Vercel → Settings → Environment Variables, add NEXT_PUBLIC_GSC_VERIFICATION with that token.',
      'Redeploy, then click Verify in Search Console and submit /sitemap.xml.',
    ],
    inputs: [
      { kind: 'url', value: 'https://search.google.com/search-console', label: 'Open Search Console' },
      { kind: 'env', value: 'NEXT_PUBLIC_GSC_VERIFICATION', example: 'google-site-verification token', where: 'Vercel → Settings → Environment Variables' },
    ],
    learnMoreHref: '/admin/seo',
    learnMoreLabel: 'SEO / AEO / GEO',
  },
  {
    id: 'ads',
    title: 'Turn on ads (Phase 2 — first revenue)',
    plainEnglish:
      'Per the growth plan, ads are the first revenue step — but only after you have a steady, returning audience. With nothing set, the app shows ZERO ads (the clean free experience). Because SwingVantage has junior athletes, keep ads non-personalized and get a compliance read first.',
    category: 'growth',
    priority: 'optional',
    detect: { kind: 'capability', cap: 'ads' },
    steps: [
      'Only do this once you have steady returning users (see the growth plan).',
      'Set NEXT_PUBLIC_ADS_PROVIDER and NEXT_PUBLIC_ADS_CLIENT_ID in Vercel.',
      'Keep ads contextual / non-personalized for youth safety (COPPA/GDPR-K).',
      'Redeploy.',
    ],
    inputs: [
      { kind: 'env', value: 'NEXT_PUBLIC_ADS_PROVIDER', example: 'adsense', where: 'Vercel → Settings → Environment Variables' },
      { kind: 'env', value: 'NEXT_PUBLIC_ADS_CLIENT_ID', example: 'ca-pub-XXXXXXXX', where: 'Vercel → Settings → Environment Variables' },
    ],
    learnMoreHref: '/admin/ads',
    learnMoreLabel: 'AdsOS',
  },
  {
    id: 'stripe',
    title: 'Take payments (Stripe) — later, Phase 3',
    plainEnglish:
      'Paid membership tiers are deliberately the LAST step in the plan (grow free users → ads → memberships). Until keys are set, paid plans simply show a waitlist and no charge can ever happen. You can safely ignore this for now.',
    category: 'growth',
    priority: 'optional',
    detect: { kind: 'capability', cap: 'billing' },
    steps: [
      'When you are ready for paid tiers, get your keys at dashboard.stripe.com/apikeys.',
      'Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in Vercel.',
      'Add STRIPE_WEBHOOK_SECRET and the price IDs (STRIPE_PRICE_PRO, STRIPE_PRICE_TEAM).',
      'Redeploy.',
    ],
    inputs: [
      { kind: 'env', value: 'STRIPE_SECRET_KEY', secret: true, where: 'dashboard.stripe.com/apikeys' },
      { kind: 'env', value: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', where: 'dashboard.stripe.com/apikeys' },
    ],
    learnMoreHref: '/admin/monetization',
    learnMoreLabel: 'Monetization',
  },

  // ── Reliability & security ─────────────────────────────────
  {
    id: 'rate-limit-redis',
    title: 'Make rate limits hold across the whole site (Upstash)',
    plainEnglish:
      'API limits work out of the box, but on Vercel each server has its own memory, so a determined abuser could slip past them. A free Upstash Redis database enforces one shared limit everywhere — the protection that actually caps AI spend under load.',
    category: 'reliability',
    priority: 'recommended',
    detect: { kind: 'derived', key: 'rate-limit-redis' },
    steps: [
      'Create a free database at upstash.com (Redis).',
      'Copy its REST URL and REST token.',
      'In Vercel → Settings → Environment Variables, add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.',
      'Redeploy. No extra package is needed — the app calls Upstash over its REST API.',
    ],
    inputs: [
      { kind: 'url', value: 'https://upstash.com', label: 'Open Upstash' },
      { kind: 'env', value: 'UPSTASH_REDIS_REST_URL', example: 'https://your-db.upstash.io', where: 'Upstash → your database → REST API' },
      { kind: 'env', value: 'UPSTASH_REDIS_REST_TOKEN', secret: true, where: 'Upstash → your database → REST API' },
    ],
    learnMoreHref: '/admin/system-health',
    learnMoreLabel: 'System Health',
  },
  {
    id: 'cron-secret',
    title: 'Protect scheduled jobs (Cron secret)',
    plainEnglish:
      'If you use the scheduled research/background jobs, this secret stops anyone else from triggering them. Without it in production those endpoints fail closed (return 401), which is safe — set it only if you use cron.',
    category: 'reliability',
    priority: 'optional',
    detect: { kind: 'derived', key: 'cron-secret' },
    steps: [
      'Generate a secret: openssl rand -hex 32',
      'In Vercel → Settings → Environment Variables, add CRON_SECRET with that value.',
      'Make sure your vercel.json cron uses the same value as its Authorization bearer token.',
      'Redeploy.',
    ],
    inputs: [
      { kind: 'command', value: 'openssl rand -hex 32', label: 'Generate a secret' },
      { kind: 'env', value: 'CRON_SECRET', secret: true, where: 'Vercel → Settings → Environment Variables' },
    ],
  },

  // ── On your computer (one-time) ────────────────────────────
  {
    id: 'env-local',
    title: 'Create your local settings file (.env.local)',
    plainEnglish:
      'For running the app on your own computer, settings live in a file called .env.local. Copy the example file and fill in only what you want to try locally. This file is private and never committed.',
    category: 'local-setup',
    priority: 'optional',
    detect: { kind: 'manual' },
    steps: [
      'In the apps/web folder, copy .env.example to a new file named .env.local.',
      'Open .env.local and uncomment + fill in only the lines you want to enable.',
      'Save it. Restart the dev server so it picks up the changes.',
    ],
    inputs: [
      { kind: 'file', value: 'apps/web/.env.example', label: 'The template to copy' },
      { kind: 'command', value: 'cp apps/web/.env.example apps/web/.env.local', label: 'Copy it (Mac/Linux)' },
    ],
  },
  {
    id: 'install-hooks',
    title: 'Install the auto-publish git hooks (one-time)',
    plainEnglish:
      'Runs a one-time command so that, after each commit, "Update:" notes auto-publish and feature/setup lists refresh themselves. It only touches this repo and never pushes anything for you.',
    category: 'local-setup',
    priority: 'optional',
    detect: { kind: 'manual' },
    steps: [
      'Open a terminal in the project folder.',
      'Run: npm run hooks:install',
      'That\'s it — it is safe to run again any time.',
    ],
    inputs: [
      { kind: 'command', value: 'npm run hooks:install', label: 'Install git hooks' },
    ],
  },

  // ── Shipping & deploys (reference) ─────────────────────────
  {
    id: 'deploy-how',
    title: 'How your changes go live',
    plainEnglish:
      'swingvantage.com automatically redeploys whenever the origin/master branch updates on GitHub. There is nothing to fill in here — this card is just a reminder of how shipping works so the steps above make sense.',
    category: 'deploy',
    priority: 'optional',
    detect: { kind: 'info' },
    steps: [
      'Environment variable changes (the cards above) take effect on the NEXT deploy — after saving in Vercel, trigger a redeploy.',
      'Code changes go live when origin/master updates on GitHub.',
      'Database files (next section) are applied by hand in Supabase and take effect immediately.',
    ],
  },
];
