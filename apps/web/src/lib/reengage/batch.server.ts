// ============================================================
// SwingVantage — Re-engagement: outbound candidate loader (SERVER-ONLY)
// ------------------------------------------------------------
// Loads the users to consider for one scheduled outbound pass. Returns [] today
// BY DESIGN — and that is honest, not a stub-that-pretends:
//
// Re-engagement prefs + send history live in device localStorage
// (lib/reengage/store.ts), and there is no server-side email/prefs model yet, so
// the server genuinely cannot know who opted into email/push or their cooldown
// state. Producing real candidates requires (see docs/OUTBOUND_REMINDERS.md):
//
//   1. Accounts active (Supabase)        — enumerate users + their auth email.
//   2. Server-side reengage prefs/history — a mirror of NudgeState (opt-in +
//      lastShown/dismissed/lastAnyAt) so cooldowns + opt-in survive the device.
//   3. A server signal builder            — derive ActivitySignal from each
//      user's synced data (sessions / training / video_analyses).
//
// Until those land, the cron is wired, gated, tested, and a safe no-op: it can
// be turned on by implementing this one function (the decision engine + delivery
// it feeds are already complete).
// ============================================================

import type { OutboundCandidate } from './outbound';

/** Users to consider this run. Empty until the server-side prefs/email model exists. */
export async function loadOutboundCandidates(): Promise<OutboundCandidate[]> {
  return [];
}
