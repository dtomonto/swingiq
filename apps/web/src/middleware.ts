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
  // Activate this block once Supabase is configured.
  // It reads the session cookie set by @supabase/ssr and redirects
  // unauthenticated users to /login.
  //
  // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  //
  // if (supabaseUrl && supabaseAnonKey) {
  //   const { createServerClient } = await import('@supabase/ssr');
  //   const response = NextResponse.next();
  //
  //   const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
  //     cookies: {
  //       getAll() { return request.cookies.getAll(); },
  //       setAll(cookiesToSet) {
  //         cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
  //         cookiesToSet.forEach(({ name, value, options }) =>
  //           response.cookies.set(name, value, options)
  //         );
  //       },
  //     },
  //   });
  //
  //   const { data: { user } } = await supabase.auth.getUser();
  //
  //   if (!user) {
  //     const loginUrl = new URL('/login', request.url);
  //     loginUrl.searchParams.set('next', pathname);
  //     return NextResponse.redirect(loginUrl);
  //   }
  //
  //   return response;
  // }
  // ── End Supabase auth check ────────────────────────────────────

  // TODO: Remove this dev bypass once Supabase is connected.
  // With Supabase configured, every non-public path requires a valid session.
  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js static files and image optimisation
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
