// ============================================================
// SwingVantage — Email confirmation handler (on-domain)
//
// Finishes Supabase email confirmations on SwingVantage's OWN
// domain, so users never see a third-party URL in their inbox.
// The auth email templates link here, e.g.:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/start
//
// We exchange the one-time token for a real session cookie, then
// forward the user into the app. This route is reachable while
// logged out (it is what ESTABLISHES the session) — see the
// '/auth/' allowance in middleware.ts.
// ============================================================

import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  // Where to land after a successful confirmation. Only same-site
  // relative paths are honored (prevents open-redirect abuse).
  const requested = searchParams.get('next') ?? '/start';
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/start';

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) {
        return NextResponse.redirect(new URL(next, origin));
      }
    }
  }

  // Missing / expired / invalid token, or auth not configured.
  // Send to sign-in with a flag the page can use for a friendly note.
  return NextResponse.redirect(new URL('/login?confirmed=0', origin));
}
