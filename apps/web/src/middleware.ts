/**
 * SwingVantage Route Protection Middleware
 *
 * Protects all app routes from unauthenticated access.
 * Public routes (login, signup, landing) are explicitly allowed through.
 *
 * Auth integration: this middleware is wired for Supabase SSR auth.
 * It will become fully active once NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local.
 * Until then it passes requests through (dev mode without Supabase).
 *
 * IMPORTANT: When Supabase is connected, uncomment the session check
 * block below and remove the early-return dev bypass.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { MARKETING_LOCALE_CODES } from '@/lib/marketing-i18n/constants';

// Posture: protect app routes by default; allow public routes explicitly.
// Public routes are expressed two ways so the list does not drift as new
// SEO pages are added:
//   • PUBLIC_PATHS         — exact, single public pages.
//   • PUBLIC_SUBTREES      — prefix match; covers a route AND all of its
//                            nested children (e.g. every /tools/* page).
// Keep this in sync with the route tree in apps/web/src/app.

// Exact, single public pages (no meaningful children).
const PUBLIC_PATHS = new Set([
  '/',
  // Auth
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  // Marketing & product
  '/how-it-works',
  '/methodology',
  '/swinglab',
  '/pricing',
  '/faq',
  '/glossary',
  '/resources',
  '/about',
  '/sports',
  '/updates',
  '/dev-updates',
  '/start',
  '/free-swing-analysis',
  // Founding Members campaign — public so new visitors can see the journey
  // + free-for-life offer before signing up (the checklist itself reads the
  // local store once they're in).
  '/founding',
  // PWA offline fallback — served by the service worker when a navigation
  // fails offline. Must be reachable without a session so the worker can
  // precache it regardless of auth state. See public/sw.js.
  '/offline',
  // Audience landing pages
  '/parents',
  '/coaches',
  '/teams',
  '/creators',
  '/partners',
  // Trust & legal
  '/contact',
  '/privacy',
  '/terms',
  '/trust',
  '/vulnerability-disclosure',
]);

// Public subtrees — prefix match covers the page and every nested child,
// so new SEO/marketing pages under these trees are public automatically.
// NOTE: the sport prefixes also cover the hyphenated pillar pages
// (e.g. '/golf' matches both '/golf/fix-slice' and '/golf-swing-analysis').
const PUBLIC_SUBTREES = [
  // Feature hub + every per-feature guide (/features AND /features/<slug>).
  // Must be a SUBTREE, not an exact path — otherwise the detail pages redirect
  // logged-out visitors to /login in cloud mode (caught via preview).
  '/features',
  '/tools',
  '/challenges',
  '/blog',
  '/benchmarks',
  // Public video library (/learn + /learn/<slug>) — crawlable for SEO/AEO/GEO.
  '/learn',
  // Sample reports: the index AND the per-sport children
  // (/sample-report/golf, /baseball, /slow-pitch, /fast-pitch, /softball).
  '/sample-report',
  // Mental Performance pillar: the public hub + every /[sport] and
  // /[sport]/[situation] routine page. The in-app /mental tools stay protected
  // (prefix '/mental-performance' does not match '/mental').
  '/mental-performance',
  '/golf',
  '/tennis',
  '/pickleball',
  '/padel',
  '/baseball',
  '/softball',
  // Public recruiting profiles shared by link. Coaches/scouts open these
  // WITHOUT an account — the page itself enforces the link's password,
  // revocation, expiry, and per-item visibility, and is noindex.
  '/player',
  // Dev-only design/preview lab for auth-gated components (e.g. the dashboard
  // ScoreRing glow). The pages themselves notFound() in production, so this
  // prefix is only ever reachable in development; it stays noindex.
  '/design-lab',
];

// Prefixes that are always public (static assets, Next.js internals, health).
const PUBLIC_PREFIXES = [
  '/_next/',
  '/favicon',
  '/manifest',
  '/icons/',
  // Dynamically-generated social share images (Open Graph). Must be public so
  // Facebook/X/LinkedIn crawlers can fetch them without a session.
  '/api/og/',
  '/api/health',
  // Public form endpoints — anonymous visitors on public pages must be able
  // to POST these. Each self-rate-limits by IP and stores/sends nothing
  // sensitive. Without these, a logged-out visitor's submission is redirected
  // to /login and the form silently fails (the lead/feedback never arrives).
  '/api/contact',
  '/api/email-capture',
  // Consent region lookup — a logged-out visitor on any public page must reach
  // it to pick the cookie-consent default (EU opt-in vs. opt-out). Returns an
  // aggregate region only (no IP/PII). See app/api/region and lib/consent.ts.
  '/api/region',
  // Founding-campaign progress — PUBLIC, privacy-safe aggregate counter (no
  // user data). The global counter banner + the /founding journey read it on
  // public pages, so a logged-out visitor must reach it or the counter never
  // shows. See app/api/central-intelligence/founding/progress.
  '/api/central-intelligence/founding/progress',
  // Email-confirmation / auth callbacks must be reachable while logged
  // out — they are what ESTABLISH the session. See app/auth/confirm.
  '/auth/',
  // Cron entry for scheduled social publishing — Vercel Cron has no Supabase
  // session; the route self-protects with CRON_SECRET. See api/social/run-scheduled.
  '/api/social/run-scheduled',
  // Cron entry for the Link Intelligence Agent — same rationale; the route
  // self-protects with CRON_SECRET. See api/growth/link-intelligence/cron.
  '/api/growth/link-intelligence/cron',
  // Cron entry for scheduled publishing — same rationale; the route
  // self-protects with CRON_SECRET. See api/publishing/cron.
  '/api/publishing/cron',
  // Research cron (registered in vercel.json) — Vercel Cron has no Supabase
  // session, so without this the middleware redirects it to /login and the
  // workflow never runs. The route self-protects with CRON_SECRET (safeEqual).
  '/api/research/run',
  // External-auditor packet — an unauthenticated auditor (e.g. ChatGPT) must
  // reach it without a Supabase session; the route self-protects with
  // AUDIT_ACCESS_TOKEN and returns 404 when that token is unset (fully off
  // by default). See api/audit and /admin/audit-access.
  '/api/audit',
  // SignalRadar webhook — trusted automations (Zapier/Make) POST mentions
  // with no Supabase session; the route self-protects with
  // SIGNALRADAR_WEBHOOK_SECRET (safeEqual) and returns 404 when that secret
  // is unset (fully off by default). See api/signal-radar/webhook.
  '/api/signal-radar/webhook',
];

// A subtree prefix P matches: the index (P), nested children (P/…), and the
// hyphenated sport pillar (P-…, e.g. '/golf' → '/golf-swing-analysis').
// It deliberately does NOT match unrelated routes like '/community/challenges'.
function matchesSubtree(pathname: string, prefix: string): boolean {
  return (
    pathname === prefix ||
    pathname.startsWith(prefix + '/') ||
    pathname.startsWith(prefix + '-')
  );
}

// Strip a leading marketing-locale prefix (e.g. '/es/how-it-works' →
// '/how-it-works', '/es' → '/'). Localized routes only ever mirror public
// marketing pages, so the underlying English path determines publicness.
function stripLocalePrefix(pathname: string): string {
  for (const loc of MARKETING_LOCALE_CODES) {
    if (pathname === `/${loc}`) return '/';
    if (pathname.startsWith(`/${loc}/`)) return pathname.slice(loc.length + 1);
  }
  return pathname;
}

function isPublicPath(pathname: string): boolean {
  // Crawler/SEO files and static assets — any path that ends in a file
  // extension (.xml, .txt, .png, .json, .mp4, …) — are always public. Search
  // engines and social scrapers fetch them WITHOUT a session, so they must
  // never be auth-gated. This covers the generated /sitemap.xml, /robots.txt
  // and /llms.txt routes as well as everything in /public. Defense-in-depth:
  // the matcher below already skips these, but the gate stays correct on its
  // own. (A missing guard here is what made Google see /sitemap.xml as HTML.)
  if (/\.[a-z0-9]+$/i.test(pathname)) return true;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  // Localized marketing URLs (/es, /es/…) are public iff their English path is.
  const p = stripLocalePrefix(pathname);
  if (PUBLIC_PATHS.has(p)) return true;
  return PUBLIC_SUBTREES.some((prefix) => matchesSubtree(p, prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths and Next.js internals through
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // ── Supabase auth check ────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl && !supabaseAnonKey) {
    // Neither var is set. Two cases:
    //   • Local-first by design (dev, or a deliberately account-less deploy):
    //     the app runs device-only with no accounts, so protected app routes
    //     are meant to be usable anonymously.
    //   • Misconfiguration in production (both vars accidentally dropped): a
    //     deploy that SHOULD have accounts silently loses route protection.
    // We cannot tell these apart from the vars alone, so we fail CLOSED in
    // production unless the operator has explicitly opted into anonymous mode
    // with ALLOW_ANONYMOUS_APP=1. Dev always passes through for local iteration.
    const anonymousAllowed =
      process.env.NODE_ENV !== 'production' || process.env.ALLOW_ANONYMOUS_APP === '1';
    if (anonymousAllowed) {
      return NextResponse.next();
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    // Exactly one var is set → a broken / half-configured deploy. Auth can
    // never work correctly in this state. Fail CLOSED in production so a
    // missing env var can't silently disable route protection; allow in dev
    // so local iteration isn't blocked while wiring things up.
    if (process.env.NODE_ENV === 'production') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Supabase is configured — enforce session on protected routes.
  // Middleware uses request.cookies (synchronous), NOT next/headers cookies().
  const response = NextResponse.next();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]),
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
  // ── End Supabase auth check ────────────────────────────────────
}

export const config = {
  // Run middleware on all routes EXCEPT:
  //   • _next/static, _next/image — Next.js build output
  //   • any path containing a "." — these are files, not app routes. This
  //     covers every static asset in /public (og-default.png, the PWA icons,
  //     and the /library + /tutorials videos) AND the generated crawler files
  //     /sitemap.xml, /robots.txt, /llms.txt and /favicon.ico.
  //
  // Crawler/SEO files MUST be excluded: in production the auth check above
  // redirects unauthenticated requests to /login (an HTML page). When that hit
  // /sitemap.xml, Googlebot received HTML and Search Console reported
  // "Sitemap is HTML". Skipping middleware for file paths serves their real
  // content to crawlers.
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
};
