'use client';

// ============================================================
// /auth/confirm — finishes email confirmations on our OWN domain
//
// Verification runs CLIENT-SIDE (in the browser), on purpose. Email
// security scanners — notably Microsoft Outlook "Safe Links" — pre-fetch
// links with a plain GET at delivery/click time and would consume the
// one-time token before the human ever clicks. Those scanners don't run
// JavaScript, so doing verifyOtp here in the browser keeps the token
// intact until a real person opens the link.
//
// Reachable while logged out (it ESTABLISHES the session) — see the
// '/auth/' allowance in middleware.ts.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export default function ConfirmPage() {
  const router = useRouter();
  const ran = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const sp = new URLSearchParams(window.location.search);
    const tokenHash = sp.get('token_hash');
    const type = sp.get('type') as EmailOtpType | null;
    const requested = sp.get('next') ?? '/start';
    const next =
      requested.startsWith('/') && !requested.startsWith('//') ? requested : '/start';

    (async () => {
      if (!tokenHash || !type || !supabase) {
        setFailed(true);
        return;
      }
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (error) {
        setFailed(true);
        return;
      }
      router.replace(next);
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-golf-dark flex flex-col items-center justify-center p-4 text-center">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-golf-fairway rounded-xl flex items-center justify-center">
          <span className="text-white font-black text-base">SV</span>
        </div>
        <p className="text-white font-bold text-xl">SwingVantage</p>
      </div>

      <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl p-8">
        {failed ? (
          <>
            <h1 className="text-xl font-bold text-foreground mb-2">This link has expired</h1>
            <p className="text-muted-foreground text-sm mb-6">
              For your security these links can only be used once and expire after a short time.
              Request a fresh one and you&apos;ll be right in.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Send me a new link →
              </Link>
              <Link href="/login" className="text-sm text-muted-foreground hover:underline">
                Back to sign in
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <h1 className="text-xl font-bold text-foreground mb-1">Confirming…</h1>
            <p className="text-muted-foreground text-sm">
              One moment while we securely sign you in.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
