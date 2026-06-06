// ============================================================
// SwingVantage — Re-engagement OS: selection engine (pure)
// ------------------------------------------------------------
// Picks at most ONE nudge given the user's signal + their nudge state,
// honoring per-trigger cooldowns, a global daily cap, dismissals, and
// quiet hours. Deterministic and unit-testable.
// ============================================================

import { TRIGGERS } from './triggers';
import type { ActivitySignal, NudgeMessage, NudgeState, NudgeChannel } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(iso: string | undefined | null, now: number): number {
  if (!iso) return Infinity;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return Infinity;
  return (now - t) / DAY_MS;
}

/** True when `now` falls inside the user's configured quiet hours. */
export function inQuietHours(state: NudgeState, now: Date = new Date()): boolean {
  const q = state.prefs.quietHours;
  if (!q.enabled) return false;
  const h = now.getHours();
  // Handles overnight windows (e.g. 22 → 7).
  return q.startHour <= q.endHour
    ? h >= q.startHour && h < q.endHour
    : h >= q.startHour || h < q.endHour;
}

export interface SelectOptions {
  /** Channels currently available (e.g. push only if permission granted). */
  availableChannels?: NudgeChannel[];
  now?: number;
  /** Bypass the global once-per-day cap (used for the manual "show me" path). */
  ignoreDailyCap?: boolean;
}

/**
 * Select the single best nudge to deliver right now, or null when nothing
 * is appropriate. Respects cooldowns, dismissals, and the global daily cap.
 */
export function selectNudge(
  signal: ActivitySignal,
  state: NudgeState,
  opts: SelectOptions = {},
): NudgeMessage | null {
  const now = opts.now ?? Date.now();

  // Global daily cap: at most one nudge per 24h.
  if (!opts.ignoreDailyCap && daysSince(state.lastAnyAt, now) < 1) return null;

  for (const t of TRIGGERS) {
    if (!t.applies(signal)) continue;
    // Per-trigger cooldown (last shown).
    if (daysSince(state.lastShown[t.id], now) < t.cooldownDays) continue;
    // Respect an explicit dismissal for the cooldown window.
    if (daysSince(state.dismissed[t.id], now) < t.cooldownDays) continue;

    const msg = t.build(signal);
    // Narrow to channels that are both allowed AND currently available.
    if (opts.availableChannels) {
      const channels = msg.channels.filter((c) => opts.availableChannels!.includes(c));
      if (channels.length === 0) continue;
      return { ...msg, channels };
    }
    return msg;
  }
  return null;
}

/** Build the per-channel payloads for a chosen nudge (draft-first). */
export function buildPayloads(msg: NudgeMessage, origin = '') {
  const url = `${origin.replace(/\/$/, '')}${msg.cta.href}`;
  return {
    in_app: { title: msg.title, body: msg.body, cta: msg.cta },
    push: { title: msg.title, body: msg.body, url },
    email: {
      subject: msg.emailSubject,
      heading: msg.title,
      body: msg.body,
      cta: { label: msg.cta.label, url },
    },
  };
}
