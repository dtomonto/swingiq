'use client';

// ============================================================
// SwingVantage — Returning-user homepage shortcut
//
// Mounted on the marketing HOME page only. A first-time visitor sees the
// full marketing pitch. A returning visitor is taken straight to where
// they actually want to go:
//   • signed in        → /dashboard
//   • returning, logged out → /login
//
// Deliberately client-side (same pattern as MarketingAutoLocale): the
// "returning" signal lives in localStorage, which crawlers don't have, so
// search engines still receive the full server-rendered homepage and SEO
// is untouched. Renders nothing.
// ============================================================

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { isReturningUser } from '@/lib/auth/returning';

export function ReturningUserRedirect() {
  const router = useRouter();
  const { status } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    // Wait for auth to resolve so we can tell "signed in" from "logged out".
    if (status === 'loading') return;

    if (status === 'authenticated') {
      done.current = true;
      router.replace('/dashboard');
      return;
    }

    // Anonymous: only short-circuit for people who've been here before.
    if (isReturningUser()) {
      done.current = true;
      router.replace('/login');
    }
  }, [status, router]);

  return null;
}
