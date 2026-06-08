'use client';

// ============================================================
// SwingVantage — Sign-out flow (one reusable, correct path)
// ------------------------------------------------------------
// Previously the sidebar's "Sign Out" button had NO handler at all,
// so clicking it did nothing. This hook is the single, correct
// sign-out path so that bug can't recur and every caller behaves
// the same way:
//
//   1. end the session (Supabase in cloud mode, local store in
//      keyless mode) via the unified useAuth().signOut();
//   2. redirect to /login (a public route — middleware would bounce
//      a signed-out user off any protected page anyway);
//   3. expose `pending` so callers can disable the control.
//
// We deliberately DO NOT wipe the persisted app store on sign-out.
// In cloud mode that data is the user's account data (synced) and is
// restored on next sign-in; clearing it would be silent data loss.
// The "returning user" marker is likewise kept (signing out doesn't
// make you a new person) — see lib/auth/returning.ts.
// ============================================================

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

export interface UseSignOutOptions {
  /** Where to land after signing out. Defaults to the login page. */
  redirectTo?: string;
  /** Optional side-effect to run first (e.g. close the mobile drawer). */
  onBeforeRedirect?: () => void;
}

export function useSignOut(options: UseSignOutOptions = {}) {
  const { redirectTo = '/login', onBeforeRedirect } = options;
  const { signOut } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleSignOut = useCallback(async () => {
    if (pending) return;
    setPending(true);
    try {
      await signOut();
    } catch {
      // Even if the backend call fails, fall through to the redirect:
      // the local session state is cleared by signOut() in keyless mode,
      // and middleware will re-gate protected routes in cloud mode.
    } finally {
      onBeforeRedirect?.();
      router.replace(redirectTo);
      // `pending` intentionally left true — the route is unmounting.
    }
  }, [pending, signOut, onBeforeRedirect, router, redirectTo]);

  return { signOut: handleSignOut, pending };
}
