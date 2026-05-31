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

// Routes that do not require authentication
const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/signup',
]);

// Prefixes that are always public (static assets, Next.js internals, public API docs)
const PUBLIC_PREFIXES = [
  '/_next/',
  '/favicon',
  '/manifest',
  '/icons/',
  '/api/health',
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
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
