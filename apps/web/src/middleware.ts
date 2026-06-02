/**
 * SwingIQ Route Protection Middleware
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
  // Marketing & product
  '/how-it-works',
  '/methodology',
  '/features',
  '/pricing',
  '/faq',
  '/glossary',
  '/resources',
  '/about',
  '/sports',
  '/updates',
  '/start',
  '/free-swing-analysis',
  '/report/sample',
  // Audience landing pages
  '/parents',
  '/coaches',
  '/teams',
  '/creators',
  '/partners',
  // Trust & legal
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
  '/tools',
  '/challenges',
  '/blog',
  '/benchmarks',
  '/golf',
  '/tennis',
  '/baseball',
  '/softball',
];

// Prefixes that are always public (static assets, Next.js internals, health).
const PUBLIC_PREFIXES = [
  '/_next/',
  '/favicon',
  '/manifest',
  '/icons/',
  '/api/health',
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

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_SUBTREES.some((prefix) => matchesSubtree(pathname, prefix))) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths and Next.js internals through
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // ── Supabase auth check ────────────────────────────────────────
  // If Supabase is not configured (env vars missing), pass through — dev mode.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Dev mode without Supabase — allow all traffic through
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
  // Run on all routes except Next.js static files and image optimisation
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
