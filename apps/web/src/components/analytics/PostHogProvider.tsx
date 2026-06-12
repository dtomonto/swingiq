'use client';

// ============================================================
// PostHog provider — SDK init + identity bridge
// ------------------------------------------------------------
// Rendered ONLY inside the consented branch of ConsentGatedAnalytics, so it
// mounts (and initializes posthog-js) only after the visitor has accepted
// cookies AND a public key is configured. Renders nothing.
//
// Identity bridge: watches the unified auth state and keeps PostHog's identity
// in sync across both auth backends (cloud Supabase + keyless local):
//   • sign-in  → identify(user.id) once per user (back-fills prior anon events)
//   • sign-out → reset() so the next session starts as a fresh anonymous id
// Only the stable user id is sent — never email/name — per the PII-free posture.
// ============================================================

import { useEffect, useRef } from 'react';
import { initPostHog } from '@/lib/posthog/browser';
import { identifyUser, resetUser } from '@/lib/analytics';
import { useAuth } from '@/lib/auth/useAuth';

export function PostHogProvider() {
  const { user, status } = useAuth();
  // Tracks the currently-identified user id (null = anonymous). Lets us call
  // identify once per user and reset only on a real identified → anonymous
  // transition (sign-out) — never on the initial anonymous load.
  const identifiedId = useRef<string | null>(null);

  // Initialize the SDK once on mount (idempotent / no-op without a key).
  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && user) {
      if (identifiedId.current !== user.id) {
        identifyUser(user.id);
        identifiedId.current = user.id;
      }
    } else if (status === 'anonymous' && identifiedId.current !== null) {
      resetUser();
      identifiedId.current = null;
    }
    // status === 'loading' → wait; don't reset a session we haven't resolved.
  }, [status, user]);

  return null;
}
